#!/usr/bin/env node
/**
 * One-off script to create a user via Supabase Admin API.
 * Usage: node scripts/create-user.js
 * Requires .env.local with SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL
 */
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

async function createUser() {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
    body: JSON.stringify({
      email: 'lior@gmail.com',
      password: 'lior@gmail.com',
      email_confirm: true,
      user_metadata: { username: 'lior' },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Error:', data);
    process.exit(1);
  }
  const user = data.user || data;
  console.log('User created:', user.email, 'id:', user.id);
  if (user.id) {
    console.log('You can now log in with lior@gmail.com / lior@gmail.com');
  }
}

createUser();
