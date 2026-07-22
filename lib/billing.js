import { getSupabaseAdmin } from './supabase'
import { getStripe } from './stripe'

// NOTE ON RLS: this file deliberately stays on the admin (service-role)
// client throughout, unlike admin.js/reviews.js/transcripts.js. Two reasons:
//   1. syncSubscriptionToOrg / markOrgSubscriptionCanceled run inside the
//      Stripe webhook handler, which has no user session or org context at
//      all until it parses one out of the event payload — there's no
//      request to attach an org header to.
//   2. Even where an orgId IS available (createCheckoutSession,
//      createPortalSession, called from an authenticated admin route),
//      subscription_status/plan_id/stripe_* columns on `organizations`
//      should only ever be written by the verified webhook, never by a
//      request-scoped client — that's a financial control, not just a
//      tenant boundary. No RLS write policy exists for those columns on
//      purpose; add one deliberately if that ever needs to change, don't
//      default into it by switching this file's client.

// ─── Billing data layer ─────────────────────────────────────────────────────
// This is deliberately flat-tier billing (Pilot / Growth / Enterprise), not
// classic per-seat metered SaaS pricing — matches how this product is
// actually being sold ($5K-$250K engagements, not $X/seat/month). A plan
// has a seat *cap*, not a per-seat price. Enterprise has no stripe_price_id
// on purpose: those deals are negotiated and invoiced manually in Stripe,
// not self-served through Checkout.
//
// Orgs bootstrapped via scripts/create-org.js (Phase 1) or anyone without a
// Stripe subscription default to subscription_status = 'no_subscription'
// with a null plan/seat_limit, which reads as "unlimited, unmetered" —
// this is intentional so existing customers and your own dev/test orgs are
// never accidentally locked out by this migration. Nothing in the app
// currently blocks training access based on subscription_status; see
// SECURITY.md for why that's a deliberate, separate decision rather than an
// oversight.

export async function listPlans() {
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('plans').select('*').order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function getOrgBilling(orgId) {
  const db = getSupabaseAdmin()
  const { data: org, error } = await db
    .from('organizations')
    .select('id, name, stripe_customer_id, stripe_subscription_id, plan_id, subscription_status, current_period_end, trial_ends_at')
    .eq('id', orgId)
    .single()
  if (error) throw new Error(error.message)

  const { count: seatsUsed, error: countErr } = await db
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .neq('status', 'terminated')
  if (countErr) throw new Error(countErr.message)

  let plan = null
  if (org.plan_id) {
    const { data, error: planErr } = await db.from('plans').select('*').eq('id', org.plan_id).maybeSingle()
    if (planErr) throw new Error(planErr.message)
    plan = data
  }

  return { org, plan, seatsUsed: seatsUsed || 0 }
}

// The one enforcement point that actually matters day-to-day: don't let an
// org provision more active users than their plan allows. seat_limit=null
// (no plan, or an unlimited plan) always allows.
export async function assertSeatAvailable(orgId) {
  const { org, plan, seatsUsed } = await getOrgBilling(orgId)
  if (!plan?.seat_limit) return // no plan or unlimited plan
  if (seatsUsed >= plan.seat_limit) {
    throw new Error(
      `Seat limit reached (${seatsUsed}/${plan.seat_limit} on the ${plan.name} plan). Upgrade the plan or deactivate an unused account before adding another user.`
    )
  }
}

async function ensureStripeCustomer(orgId) {
  const db = getSupabaseAdmin()
  const { data: org, error } = await db
    .from('organizations')
    .select('id, name, stripe_customer_id')
    .eq('id', orgId)
    .single()
  if (error) throw new Error(error.message)
  if (org.stripe_customer_id) return org.stripe_customer_id

  const stripe = getStripe()
  const customer = await stripe.customers.create({
    name: org.name,
    metadata: { orgId: org.id },
  })

  const { error: updErr } = await db.from('organizations').update({ stripe_customer_id: customer.id }).eq('id', orgId)
  if (updErr) throw new Error(updErr.message)

  return customer.id
}

export async function createCheckoutSession({ orgId, planId, successUrl, cancelUrl }) {
  const db = getSupabaseAdmin()
  const { data: plan, error } = await db.from('plans').select('*').eq('id', planId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!plan) throw new Error(`Unknown plan "${planId}"`)
  if (!plan.stripe_price_id) {
    throw new Error(`The ${plan.name} plan isn't self-serve — this is a contact-sales tier.`)
  }

  const customerId = await ensureStripeCustomer(orgId)
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: orgId,
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { orgId, planId },
    subscription_data: { metadata: { orgId, planId } },
  })

  return session.url
}

export async function createPortalSession({ orgId, returnUrl }) {
  const customerId = await ensureStripeCustomer(orgId)
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session.url
}

// Called from the webhook handler — maps a Stripe subscription back to an
// org (via metadata.orgId, set at Checkout time) and a plan (via the
// subscription's price ID matching plans.stripe_price_id), then syncs
// status/period/plan onto the organizations row. This is the only path that
// writes subscription state — the app itself never assumes a plan changed
// without Stripe telling it so via a verified webhook event.
export async function syncSubscriptionToOrg(subscription) {
  const db = getSupabaseAdmin()
  const orgId = subscription.metadata?.orgId
  if (!orgId) {
    console.error('Stripe subscription has no orgId metadata — cannot sync:', subscription.id)
    return
  }

  const priceId = subscription.items?.data?.[0]?.price?.id || null
  let planId = subscription.metadata?.planId || null
  if (priceId && !planId) {
    const { data: plan } = await db.from('plans').select('id').eq('stripe_price_id', priceId).maybeSingle()
    planId = plan?.id || null
  }

  const statusMap = {
    trialing: 'trialing',
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    incomplete: 'no_subscription',
    incomplete_expired: 'no_subscription',
  }

  const { error } = await db
    .from('organizations')
    .update({
      stripe_subscription_id: subscription.id,
      plan_id: planId,
      subscription_status: statusMap[subscription.status] || 'no_subscription',
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    })
    .eq('id', orgId)

  if (error) throw new Error(error.message)
}

export async function markOrgSubscriptionCanceled(subscriptionId) {
  const db = getSupabaseAdmin()
  const { error } = await db
    .from('organizations')
    .update({ subscription_status: 'canceled' })
    .eq('stripe_subscription_id', subscriptionId)
  if (error) throw new Error(error.message)
}
