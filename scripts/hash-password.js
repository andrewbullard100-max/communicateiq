#!/usr/bin/env node
// Usage: node scripts/hash-password.js "the-password"
//
// Generates a standalone bcrypt hash — useful for manually resetting a
// single user's password_hash directly in Supabase without recreating the
// whole user via invite-user.js. Run locally — never send plaintext
// passwords over email or Slack.

const bcrypt = require('bcryptjs')

const password = process.argv[2]

if (!password) {
  console.error('Usage: node scripts/hash-password.js "the-password"')
  process.exit(1)
}

const hash = bcrypt.hashSync(password, 12)

console.log('\nBcrypt hash (paste into the users.password_hash column):\n')
console.log(hash)
console.log('')
