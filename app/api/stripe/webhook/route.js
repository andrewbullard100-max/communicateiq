import { getStripe } from '../../../../lib/stripe'
import { syncSubscriptionToOrg, markOrgSubscriptionCanceled } from '../../../../lib/billing'

// ─── Stripe webhook ──────────────────────────────────────────────────────
// This route is intentionally excluded from the NextAuth session check in
// middleware.js (Stripe calls it directly — it has no session cookie and
// never will). The security boundary here is signature verification via
// STRIPE_WEBHOOK_SECRET, not a login check. Do not add a session check to
// this route; that would just break Stripe's callbacks. Do not remove the
// signature check; that would let anyone POST fake subscription events.
//
// Configure this URL (https://your-domain/api/stripe/webhook) in the
// Stripe Dashboard → Developers → Webhooks, subscribed to at least:
// checkout.session.completed, customer.subscription.updated,
// customer.subscription.deleted, invoice.payment_failed.

export async function POST(req) {
  const stripe = getStripe()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured — refusing to process unverifiable webhook.')
    return Response.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const rawBody = await req.text() // must read as raw text — signature verification needs the exact bytes Stripe sent, not a re-serialized JSON.parse() round trip

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription)
          await syncSubscriptionToOrg(subscription)
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        await syncSubscriptionToOrg(event.data.object)
        break
      }
      case 'customer.subscription.deleted': {
        await markOrgSubscriptionCanceled(event.data.object.id)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
          await syncSubscriptionToOrg(subscription) // picks up Stripe's own past_due status
        }
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
          await syncSubscriptionToOrg(subscription) // clears past_due back to active, if that's what happened
        }
        break
      }
      default:
        // Unhandled event types are expected and fine — we only act on the
        // ones listed above.
        break
    }
  } catch (err) {
    // Return 500 so Stripe retries — a transient DB error shouldn't
    // silently drop a billing state change.
    console.error(`Stripe webhook handler error for ${event.type}:`, err)
    return Response.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return Response.json({ received: true })
}
