# Qsite Site Documentation

This documentation set is auto-generated from the codebase and organized to make the app easy to audit by route, feature, and supporting module.

Generated: 2026-03-27T13:47:20.477Z

## Navigation

- [Architecture](./ARCHITECTURE.md)
- [Workflows](./WORKFLOWS.md)
- [Pages and layouts](./PAGES_AND_LAYOUTS.md)
- [API reference](./API_REFERENCE.md)
- [Components and hooks](./COMPONENTS_AND_HOOKS.md)
- [Libraries and services](./LIBRARIES_AND_SERVICES.md)
- [Data model](./DATA_MODEL.md)

## Snapshot

- Stack: Next.js App Router, React, TypeScript, Tailwind, Supabase, Twilio, Resend.
- Product areas: Q&A, statuses, profiles, chat, notifications, moderation, and admin policy tooling.
- UI direction: Hebrew + RTL.
- Important note: the repo still contains Supabase starter-kit remnants alongside the custom product.

## Coverage counts

| Area | Count |
| --- | ---: |
| Layout files | 2 |
| Page files | 24 |
| Non-API route handlers | 1 |
| API route files | 78 |
| App components | 25 |
| Hooks | 4 |
| Shared or starter components | 24 |
| Library files | 21 |
| Script files | 4 |
| Migrations | 53 |
| Tables discovered in migrations | 42 |
| SQL functions discovered in migrations | 40 |

## Maintenance

- Refresh the generated handbook with `npm run docs:generate` from `my-app`.
- Use the trigger word `docUpdate` (or `updatedoc`) in code-change requests when the handbook should be refreshed with the task.
