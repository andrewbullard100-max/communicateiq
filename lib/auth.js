import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

// ─── User store ─────────────────────────────────────────────────────────────
// Single-tenant deployment: the customer's IT admin manages authorized users
// via the AUTH_USERS environment variable (set in Vercel → Project → Settings
// → Environment Variables). No database required.
//
// AUTH_USERS format (JSON array, set as ONE env var value):
// [
//   { "email": "gm@client.com",  "passwordHash": "$2a$...", "name": "Jane GM",  "role": "trainee" },
//   { "email": "dm@client.com",  "passwordHash": "$2a$...", "name": "Sam DM",   "role": "admin" }
// ]
//
// Generate a passwordHash with: node scripts/hash-password.js "the-password"
function loadUsers() {
  try {
    const raw = process.env.AUTH_USERS || '[]'
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('AUTH_USERS environment variable is not valid JSON:', err.message)
    return []
  }
}

export const authOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 8, // 8 hour session — re-authenticate daily
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const users = loadUsers()
        const email = credentials.email.trim().toLowerCase()
        const user = users.find(u => (u.email || '').toLowerCase() === email)
        if (!user || !user.passwordHash) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        return {
          id: email,
          email: user.email,
          name: user.name || user.email,
          role: user.role || 'trainee',
        }
      },
    }),

    // ── SSO upgrade path (disabled by default) ─────────────────────────────
    // When a customer wants Okta / Azure AD / Google Workspace SSO, add the
    // matching NextAuth provider here — no other code in this app needs to
    // change. Middleware, session handling, and role checks all work against
    // any NextAuth provider automatically. Example:
    //
    // import AzureADProvider from 'next-auth/providers/azure-ad'
    // AzureADProvider({
    //   clientId: process.env.AZURE_AD_CLIENT_ID,
    //   clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
    //   tenantId: process.env.AZURE_AD_TENANT_ID,
    // }),
    //
    // import OktaProvider from 'next-auth/providers/okta'
    // OktaProvider({
    //   clientId: process.env.OKTA_CLIENT_ID,
    //   clientSecret: process.env.OKTA_CLIENT_SECRET,
    //   issuer: process.env.OKTA_ISSUER,
    // }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
        session.user.email = token.email
        session.user.name = token.name
      }
      return session
    },
  },
}
