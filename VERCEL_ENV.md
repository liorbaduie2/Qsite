# Vercel Environment Variables

Add these in your Vercel project: **Settings → Environment Variables**

Enable for **Production**, **Preview**, and **Development**.

## Required (build will fail without these)

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ffhfmvpjifgbhcwssmzo.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaGZtdnBqaWZnYmhjd3NzbXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTc5ODYsImV4cCI6MjA4NzA5Mzk4Nn0.JEXoaG4jm6FB2rGuQiCcDHTl_AXTEBLe0rPvMKdLMDs` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaGZtdnBqaWZnYmhjd3NzbXpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUxNzk4NiwiZXhwIjoyMDg3MDkzOTg2fQ.dB5iKX6bDvctXPXioDVUuTZbHE73bzvHYmY4E94HW8w` |

## Optional (for full functionality)

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SITE_URL` | Your production URL (e.g. `https://yoursite.vercel.app`) |
| `TWILIO_ACCOUNT_SID` | For phone verification |
| `TWILIO_AUTH_TOKEN` | For phone verification |
| `TWILIO_PHONE_NUMBER` | For phone verification |
| `RESEND_API_KEY` | For approval/rejection emails |
| `FROM_EMAIL` | Sender email (e.g. `noreply@qsite.lol`) |
| `CRON_SECRET` | For weekly maintenance cron (if using Vercel Cron) |
| `SETUP_SECRET_KEY` | For first-owner setup endpoint |

After adding, **redeploy** the project.
