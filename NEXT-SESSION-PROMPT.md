# Signal Vault — Next Session Prompt

**Updated:** 2026-04-02 (end of Session 5)
**Hackathon Deadline:** April 6, 2026 @ 11:45pm PDT (4 days remaining)
**Status:** App fully working on localhost, deployment blocked, demo script ready

---

## Copy this into your next Claude Code session:

```
I'm continuing work on Signal Vault — my Auth0 hackathon entry. Read SESSION_LOG.md for full context.

SHORT VERSION: Signal Vault is WORKING ON LOCALHOST. Everything functions end-to-end: OAuth connect via Token Vault, 7-step verification pipeline with real Google tokens, mid-session revocation, audit trails. Deployment to Netlify and Vercel both have issues that need debugging.

WHAT'S WORKING (localhost):
- Auth0 login/logout/session
- OAuth connect flow via Token Vault (/auth/connect endpoint)
- Real Google access token from Token Vault
- 7-step pipeline: pre-check → content-gen → human-review → permission-validate → execute → post-check → audit
- OpenAI content generation with S&S methodology
- Mid-session revocation detection (agent stops cold)
- Audit trail + trust reports saved to Supabase
- All 7 UI pages styled and functional

WHAT'S NOT WORKING:
- Netlify deployment: builds succeed but runtime 500 (clientModules TypeError)
- Vercel deployment: build fails (page_client-reference-manifest.js ENOENT in (dashboard) route group)
- GBP API: returns 429 quota error (restricted API, needs access request — not an app issue)

WHAT NEEDS TO BE DONE:

1. FIX DEPLOYMENT (pick one):
   Option A — Netlify: debug clientModules runtime error. Env vars are set. Build succeeds. The SSR function crashes.
   Option B — Vercel: debug route group manifest error. Might be Next.js 14.2.35 specific. Try updating Next.js version.
   Option C — Skip deployment, demo from localhost (valid for hackathon)

2. RECORD 3-MINUTE DEMO VIDEO — script in DEMO_SCRIPT.md, record from localhost

3. SUBMIT TO DEVPOST — public repo, demo video, README with architecture

4. UPDATE AUTH0 DASHBOARD — Add production URLs once deployment works

AUTH0 DASHBOARD CONFIGURATION (working config):
- Google connection Purpose: "Connected Accounts for Token Vault" + "Authentication"
- Offline Access: enabled on Google connection
- Token Vault grant type: enabled on app
- Multi-Resource Refresh Token: My Account API toggled on
- Refresh Token Rotation: DISABLED (conflicts with Token Vault)
- My Account API: activated
- Google Cloud Console: custom OAuth Client ID/Secret
- Google Cloud Console: redirect URI includes Auth0 callback
- Google Cloud Console: test user added (Ltkenney13@gmail.com)
- Google Cloud Console: GBP APIs enabled (Business Information + Account Management)

KEY LESSONS FROM SESSION 5 (save debugging time):
- auth0.connectAccount() has MRRT bug — use /auth/connect SDK endpoint instead
- Token must be fetched in API route (request context) and passed through pipeline state
- Auth0 expiresAt is in seconds, Date.now() is milliseconds — must convert
- Refresh Token Rotation must be OFF for Token Vault to work
- Google social connection needs custom OAuth credentials (not Auth0 dev keys)
- GBP API has zero default quota — requires Google access request
- @netlify/plugin-nextjs was removed from package.json (caused Vercel issues)
- output: "standalone" was removed from next.config.mjs (caused Vercel issues)

REPO: https://github.com/TKHatton/signal-vault.git (12 commits on main)
```

---

## Files That Matter Most

| File | What It Does |
|------|-------------|
| `src/lib/auth0.ts` | Auth0Client with `enableConnectAccountEndpoint` + `offline_access` |
| `src/lib/auth0-ai.ts` | `getTokenForConnection()` with seconds-to-ms fix |
| `src/app/api/connections/connect/route.ts` | Redirects to `/auth/connect` (SDK built-in) |
| `src/app/api/chat/route.ts` | Gets Token Vault token, passes to pipeline |
| `src/lib/agent/state.ts` | LangGraph state with `vaultToken` field |
| `src/lib/agent/graph.ts` | 7-node pipeline, accepts `vaultToken` parameter |
| `src/lib/agent/nodes/execute.ts` | Real GBP API calls using `state.vaultToken` |
| `src/lib/agent/nodes/pre-check.ts` | Validates token from state |
| `src/lib/agent/nodes/permission-validate.ts` | Re-validates token before execution |
| `src/lib/tools/gbp.ts` | Google Business Profile API tools |
| `netlify.toml` | Netlify deployment config |
| `DEMO_SCRIPT.md` | 3-minute demo video script |

---

## Deployment Debug Notes

### Netlify Issue
- Error: `TypeError: Cannot read properties of undefined (reading 'clientModules')` in `app-page.runtime.prod.js`
- Happens at runtime (SSR function), not build time
- Build succeeds, deploy is "green", but every page request 500s
- Env vars were imported via CLI and confirmed present
- Tried: standalone output, node_bundler esbuild, building locally vs server-side — all same error

### Vercel Issue
- Error: `ENOENT: no such file or directory, lstat '/vercel/path0/.next/server/app/(dashboard)/page_client-reference-manifest.js'`
- Happens during build/deploy step
- Related to `(dashboard)` route group
- Tried: removing @netlify/plugin-nextjs, removing standalone output — still fails
- Possible fix: update Next.js to newer version, or restructure route groups

### Potential Fixes to Try Next Session
1. Update Next.js from 14.2.35 to latest 14.x or 15.x
2. Remove `(dashboard)` route group (move pages to top-level routes)
3. Try `output: "export"` for static export (but loses SSR/API routes)
4. Debug Vercel build more carefully — check if it's a Windows line ending issue
