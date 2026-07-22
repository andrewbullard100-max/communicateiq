import Stripe from 'stripe'

// Server-only — never import into a client component. STRIPE_SECRET_KEY
// must be a secret (sk_...) key, never the publishable key, and must never
// reach the browser.
let client = null

export function getStripe() {
  if (client) return client
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured. See DEPLOY.md.')
  }
  client = new Stripe(key, { apiVersion: '2024-06-20' })
  return client
}
