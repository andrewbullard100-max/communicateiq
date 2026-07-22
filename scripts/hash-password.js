#!/usr/bin/env node
// Usage: node scripts/hash-password.js "the-password"
//
// Generates a bcrypt hash to paste into the AUTH_USERS environment variable.
// Run this locally — never send plaintext passwords over email or Slack.

const bcrypt = require('bcryptjs')

const password = process.argv[2]

if (!password) {
  console.error('Usage: node scripts/hash-password.js "the-password"')
  process.exit(1)
}

const hash = bcrypt.hashSync(password, 12)

console.log('\nPaste this hash into the AUTH_USERS entry for this user:\n')
console.log(hash)
console.log('\nExample AUTH_USERS entry:\n')
console.log(JSON.stringify({ email: 'user@client.com', passwordHash: hash, name: 'Full Name', role: 'trainee' }, null, 2))
console.log('')
