# Debugging Vercel Auth Issues

## 1. Browser console (client-side)

Add `?debug=auth` to your Vercel URL, e.g.:
```
https://your-app.vercel.app/?debug=auth
```

Then open DevTools → Console. You'll see `[Auth]` logs for:
- getSession result
- fetchUserProfile / getUserPermissions calls
- loginStatus
- Errors (always logged, even without ?debug=auth)

## 2. Vercel function logs (server-side)

1. Go to [vercel.com](https://vercel.com) → your project
2. **Logs** (top nav) or **Deployments** → select deployment → **Functions**
3. Reproduce the issue while watching logs
4. Look for `[API can-user-login]` and `[API get-user-permissions]` entries

## 3. Network tab

1. DevTools → **Network**
2. Reproduce the issue
3. Check for failed (red) requests to `/api/permissions/...`
4. Click a request → **Response** tab to see error details

## 4. Remove debug logs

After debugging, remove the `?debug=auth` logs from:
- `app/components/AuthProvider.tsx` (DEBUG_AUTH and related console.logs)
- `app/api/permissions/can-user-login/route.ts`
- `app/api/permissions/get-user-permissions/route.ts`
