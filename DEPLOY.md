# CommunicateIQ Executive Communication Training Platform
## Deployment Guide

---

## PREREQUISITES
- Node.js installed (nodejs.org — download LTS version)
- Anthropic API key (console.anthropic.com → API Keys)
- GitHub account (github.com — free)
- Vercel account (vercel.com — free, sign in with GitHub)

---

## STEP 1 — Set Up the Project

Open Terminal (Mac) or Command Prompt (Windows) and run:

```bash
# Navigate to where you want the project
cd Desktop

# Copy the project folder here, then install dependencies
cd communicateiq-training
npm install
```

---

## STEP 2 — Add Your API Keys, Access Control & Storage

Create a file called `.env.local` in the project root folder.
Add these lines (replace with your actual values):

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-openai-key-here

NEXTAUTH_SECRET=generate-a-random-string-here
NEXTAUTH_URL=http://localhost:3000

AUTH_USERS=[{"email":"you@client.com","passwordHash":"$2b$12$...","name":"Your Name","role":"admin"}]

UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

**Generate `NEXTAUTH_SECRET`** (any long random string works):
```bash
openssl rand -base64 32
```

**Generate a password hash for each user** who needs access:
```bash
node scripts/hash-password.js "their-chosen-password"
```
Paste the resulting hash into an entry in `AUTH_USERS`. `AUTH_USERS` is a single-line JSON array — add one object per authorized person, with `"role": "admin"` for anyone who should see the Team Dashboard (GM's manager, DM, L&D) or `"role": "trainee"` for everyone else. See `SECURITY.md` for the full access control model.

**Set up Redis storage** (powers the Team Dashboard's progress tracking and coaching flags — skip this and the app still works, it just won't remember completed simulation scores):
1. In your Vercel project → **Storage** tab → **Create Database** → choose a Redis option (Upstash)
2. Click **Connect Project** — Vercel automatically adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to your project's environment variables
3. For local dev, copy those two values from Vercel → Settings → Environment Variables into your `.env.local`

⚠️ IMPORTANT: Never share the `.env.local` file or commit it to GitHub.
The .gitignore file already excludes it. Never send plaintext passwords over email or Slack — only share the generated hash, or better, have each person set their own password by running the hash script themselves and sending you only the hash.

---

## STEP 3 — Test Locally

```bash
npm run dev
```

Open your browser to: http://localhost:3000

You'll land on the sign-in page first — log in with one of the accounts you added to `AUTH_USERS`. Test all five modules work before deploying.

---

## STEP 4 — Deploy to Vercel (for shareable URL)

### 4a. Push to GitHub

```bash
# Initialize git (first time only)
git init
git add .
git commit -m "Initial deploy"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR-USERNAME/communicateiq-training.git
git push -u origin main
```

### 4b. Connect to Vercel

1. Go to vercel.com and sign in with GitHub
2. Click "Add New Project"
3. Import your communicateiq-training repository
4. In the "Environment Variables" section, add all the variables from Step 2:
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` — set this to your production URL (e.g. `https://communicateiq-training.vercel.app`) once you know it; you can redeploy after the first deploy to update it
   - `AUTH_USERS`
   - `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — auto-added if you connected Redis storage in Step 2
5. Click "Deploy"

Vercel gives you a URL like: `communicateiq-training.vercel.app`

That URL is now behind a login screen — only people you've added to `AUTH_USERS` can get in.

---

## STEP 5 — Custom Domain (Optional)

In Vercel dashboard → Settings → Domains
Add any domain you own, or use the free `.vercel.app` URL.

---

## FOR THE DEMO MEETING

Recommended demo flow (8-10 minutes):

1. **Home page** — show the full platform structure (1 min)
2. **Diagnostic** — fill in a few ratings, hit submit, show AI analysis (2 min)
3. **Stakeholder Map** — show the informal influencer section, explain the requirement (1 min)
4. **Simulation** — run D2-S1 (CFO Labor Challenge), type a weak first response to show pushback, then a strong response, hit End & Score (3 min)
5. **QBR** — show the builder structure, then the boardroom delivery concept (1 min)
6. **Dashboard** — show the 45-day certification tracker and DM validation tab (1 min)

---

## TROUBLESHOOTING

**"Module not found" error:** Run `npm install` again

**API errors in browser:** Check that .env.local exists with correct key format

**Blank page:** Check browser console for errors (F12)

**Vercel deploy fails:** Confirm ANTHROPIC_API_KEY, OPENAI_API_KEY, NEXTAUTH_SECRET, NEXTAUTH_URL, and AUTH_USERS are all set in Vercel environment variables

**Stuck redirecting to /login even with correct password:** Confirm `NEXTAUTH_URL` matches the URL you're actually visiting (http vs https, correct domain) — a mismatch breaks the session cookie

**"Incorrect email or password" for a valid user:** Confirm `AUTH_USERS` is valid JSON (no trailing commas, hash copied in full) and the email matches exactly (case-insensitive)

---

## COST ESTIMATE

Anthropic API usage for a demo session (10-15 AI calls):
~$0.05-0.15 per session using claude-opus-4-5

For enterprise deployment pricing, see: console.anthropic.com/settings/billing
