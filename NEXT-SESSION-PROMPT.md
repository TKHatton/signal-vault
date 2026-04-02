# Signal Vault — Next Session Prompt

**Updated:** 2026-04-02 (end of Session 5)
**Hackathon Deadline:** April 6, 2026 @ 11:45pm PDT (4 days remaining)
**Status:** App working end-to-end, deployed to Netlify, demo script written

---

## Copy this into your next Claude Code session:

```
I'm continuing work on Signal Vault — my Auth0 hackathon entry. Read SESSION_LOG.md for full context.

SHORT VERSION: Signal Vault is WORKING. Clients connect Google via OAuth (Auth0 Token Vault), AI agents use those tokens through a 7-step verification pipeline, clients can revoke mid-session, everything is audited. Deployed to Netlify.

WHAT'S DONE (6 commits on main, deployed):
- Full Next.js 14 app with 7 pages — all working
- Auth0 login/logout/session — working
- OAuth connect flow via Token Vault — working (Auth0 /auth/connect endpoint)
- Real Google access token from Token Vault — working
- 7-step pipeline with real tokens — working (all steps execute)
- OpenAI content generation with S&S methodology — working
- Mid-session revocation detection — working
- Audit trail + trust reports saved to Supabase — working
- Deployed to https://signal-vault.netlify.app
- Demo script written (DEMO_SCRIPT.md)

WHAT'S LEFT:
1. UPDATE AUTH0 DASHBOARD — Add Netlify URLs:
   - Callback: https://signal-vault.netlify.app/auth/callback
   - Logout: https://signal-vault.netlify.app/
   - Web Origins: https://signal-vault.netlify.app

2. TEST NETLIFY DEPLOYMENT — verify login + pipeline on production URL

3. RECORD 3-MINUTE DEMO VIDEO — script in DEMO_SCRIPT.md

4. SUBMIT TO DEVPOST — public repo, demo video, README

KNOWN LIMITATIONS:
- GBP API returns 429 (zero quota — restricted API, needs access request). Token works, auth works. Not an app issue.
- Google OAuth app in "testing" mode — test users must be added. Production needs Google verification.

AUTH0 DASHBOARD CONFIGURATION (for reference):
- Google connection Purpose: "Connected Accounts for Token Vault" + "Authentication"
- Offline Access: enabled on Google connection
- Token Vault grant type: enabled on app
- Multi-Resource Refresh Token: My Account API toggled on
- Refresh Token Rotation: DISABLED (conflicts with Token Vault)
- My Account API: activated
- Google Cloud Console: custom OAuth Client ID/Secret (not Auth0 dev keys)
- Google Cloud Console: redirect URI includes Auth0 callback

KEY CONTEXT:
- Deploy target is Netlify. Site is live at https://signal-vault.netlify.app
- Demo should run on localhost (more reliable for video recording)
- The 429 GBP quota error is GOOD for the demo — proves real API integration
- Post-hackathon: Signal Vault embeds into ss-client-portal + ss-platform-dashboard
```

---

## Architecture Quick Reference

```
Client clicks "Connect Google"
       |
       v
App redirects to /auth/connect?connection=google-oauth2
       |
       v
Auth0 SDK handles MRRT token exchange + My Account API
       |
       v
Google shows "Allow Signal & Structure AI to access your Business Profile?"
       |
       v
Client clicks "Allow" -> Token stored in Auth0 Token Vault
       |
       v
/api/chat route calls auth0.getAccessTokenForConnection("google-oauth2")
       |
       v
Token Vault returns fresh Google access token (converted to ms)
       |
       v
Token passed through LangGraph pipeline state (vaultToken field)
       |
       v
Execute node uses token to call Google Business Profile API
       |
       v
Every step logged to Supabase vault_audit_log + trust report generated
```

**If client revokes:** `getAccessTokenForConnection()` returns null -> pipeline stops -> "EXECUTION BLOCKED" -> revocation logged

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

## Env Vars (already on Netlify)

```
AUTH0_SECRET
AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET
AUTH0_DOMAIN
APP_BASE_URL=https://signal-vault.netlify.app
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
TENANT_ID
```
