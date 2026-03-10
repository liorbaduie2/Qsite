# Qsite

Qsite is a Hebrew RTL community application built with Next.js and Supabase. The product combines questions and answers, short status updates, profiles, chat, notifications, moderation workflows, and a sizable admin policy layer.

## Documentation

The main codebase handbook lives in `docs/site/`:

- `docs/site/README.md`
- `docs/site/ARCHITECTURE.md`
- `docs/site/WORKFLOWS.md`
- `docs/site/PAGES_AND_LAYOUTS.md`
- `docs/site/API_REFERENCE.md`
- `docs/site/COMPONENTS_AND_HOOKS.md`
- `docs/site/LIBRARIES_AND_SERVICES.md`
- `docs/site/DATA_MODEL.md`

Regenerate the auto-generated documentation with:

```bash
npm run docs:generate
```

## Core stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, RLS, and SQL RPCs
- Twilio for phone verification
- Resend for approval and rejection emails

## Local development

1. Create `my-app/.env.local` from the documented environment variables.
2. Make sure Supabase credentials are configured.
3. Start the app with `npm run dev`.

For database setup details, see `../SUPABASE_SETUP.md`.
