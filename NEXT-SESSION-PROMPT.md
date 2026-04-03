# Signal Vault — Next Session Prompt

**Updated:** 2026-04-03 (end of Session 6)
**Hackathon Deadline:** April 6, 2026 @ 11:45pm PDT (3 days remaining)
**Status:** App DEPLOYED and LIVE. Submission materials written. Need to record video and submit.

---

## Copy this into your next Claude Code session:

```
I'm continuing work on Signal Vault — my Auth0 hackathon entry. Read SESSION_LOG.md for full context.

SHORT VERSION: Signal Vault is DEPLOYED AND LIVE at https://signal-vault.netlify.app. Deployment was fixed in Session 6. All submission materials are written. What's left: record demo video, submit to DevPost, publish blog posts.

WHAT'S WORKING:
- Auth0 login/logout/session (localhost + production)
- OAuth connect flow via Token Vault (/auth/connect endpoint)
- Real Google access token from Token Vault
- 7-step pipeline: pre-check → content-gen → human-review → permission-validate → execute → post-check → audit
- OpenAI content generation with S&S methodology
- Mid-session revocation detection (agent stops cold)
- Audit trail + trust reports saved to Supabase
- All 7 UI pages styled and functional
- DEPLOYED: https://signal-vault.netlify.app (live, rendering correctly)
- Auth0 Dashboard configured with Netlify callback/logout/origins URLs

KNOWN LIMITATIONS:
- GBP API: returns 429 quota error (restricted API, needs access request — not an app issue)
- Demo strategy: trigger revocation (disconnect) BEFORE pipeline reaches Execute step to avoid showing the unrelated 429 error

WHAT NEEDS TO BE DONE:
1. TEST deployed site end-to-end (login, connect Google, run pipeline, check Activity Log)
2. RECORD 3-MINUTE DEMO VIDEO — revised script in DEMO_SCRIPT.md
3. SUBMIT TO DEVPOST — content ready in SIGNAL_VAULT_SUBMISSION.md
4. PUBLISH BLOG POSTS — 5 posts ready in BLOG_POSTS.md
5. REVISE DEMO SCRIPT if needed — current v2 needs Activity Log and Trust Reports emphasized more

SUBMISSION FILES READY:
- SIGNAL_VAULT_SUBMISSION.md — full DevPost submission with all narrative sections
- DEVPOST_CHECKLIST.md — reusable template for future hackathons
- DEMO_SCRIPT.md — 3-minute video script (v2, personal narrative approach)
- BLOG_POSTS.md — 5 unique posts (LinkedIn, S&S blog, Digital Jaywalking, She is AI, AI Surfers)
- README.md — rewritten with architecture, setup, design decisions
- thumbnail.svg + thumbnail.html — hero thumbnail with brand colors and pipeline viz

HOW DEPLOYMENT WAS FIXED (Session 6):
Two root causes, both in Next.js 14 / Netlify interaction:
1. @netlify/plugin-nextjs was in netlify.toml but NOT in package.json — mismatch caused clientModules runtime crash. Fix: remove the plugin reference entirely (Netlify handles Next.js natively via OpenNext adapter).
2. Next.js 14.2.x has a known bug with parenthesized route groups — (dashboard) folder caused page_client-reference-manifest.js to not be generated. This was the SAME bug blocking both Netlify and Vercel. Fixed in Next.js 15 (PR #73606) but never backported to 14.x. Fix: removed (dashboard) route group, moved pages to src/app/ directly with individual layout.tsx files.
3. Bonus: set middleware to runtime: "nodejs" because Auth0 SDK uses crypto (incompatible with Edge Runtime).

AUTH0 DASHBOARD CONFIGURATION (working config):
- Google connection Purpose: "Connected Accounts for Token Vault" + "Authentication"
- Offline Access: enabled on Google connection
- Token Vault grant type: enabled on app
- Multi-Resource Refresh Token: My Account API toggled on
- Refresh Token Rotation: DISABLED (conflicts with Token Vault)
- My Account API: activated
- Callback URLs: localhost:3000 + signal-vault.netlify.app
- Google Cloud Console: custom OAuth Client ID/Secret
- Google Cloud Console: redirect URI includes Auth0 callback
- Google Cloud Console: test user added (Ltkenney13@gmail.com)
- Google Cloud Console: GBP APIs enabled (Business Information + Account Management)

KEY LESSONS (save debugging time):
- auth0.connectAccount() has MRRT bug — use /auth/connect SDK endpoint instead
- Token must be fetched in API route (request context) and passed through pipeline state
- Auth0 expiresAt is in seconds, Date.now() is milliseconds — must convert
- Refresh Token Rotation must be OFF for Token Vault to work
- Google social connection needs custom OAuth credentials (not Auth0 dev keys)
- GBP API has zero default quota — requires Google access request
- @netlify/plugin-nextjs must NOT be in netlify.toml (Netlify auto-detects Next.js)
- Parenthesized route groups like (dashboard) break Next.js 14.2.x manifest generation
- Middleware must have runtime: "nodejs" for Auth0 SDK compatibility

REPO: https://github.com/TKHatton/signal-vault.git
LIVE: https://signal-vault.netlify.app
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
| `src/middleware.ts` | Auth0 middleware (runtime: nodejs) |
| `netlify.toml` | Netlify config (NO plugins — auto-detected) |
| `DEMO_SCRIPT.md` | 3-minute demo video script (v2) |
| `SIGNAL_VAULT_SUBMISSION.md` | DevPost submission content |
| `BLOG_POSTS.md` | 5 blog posts for 5 platforms |
