# Signal Vault — Next Session Prompt

**Updated:** 2026-04-02 (end of Session 4)
**Hackathon Deadline:** April 6, 2026 @ 11:45pm PDT (4 days remaining)
**Status:** All code built, build passes clean, ready for testing + deployment

---

## Copy this into your next Claude Code session:

```
I'm continuing work on Signal Vault — my Auth0 hackathon entry. Read SESSION_LOG.md for full context.

SHORT VERSION: Signal Vault lets clients connect their Google account via OAuth (Auth0 Token Vault). AI agents then use those tokens to do real work — audit their Google Business Profile, generate fixes using S&S methodology, update descriptions. Every action goes through a 7-step verification pipeline (pre-check → content-gen → human-review → permission-validate → execute → post-check → audit). Clients can revoke access mid-session and the agent stops immediately. This is for the "Authorized to Act: Auth0 for AI Agents" hackathon, deadline April 6.

WHAT'S ALREADY BUILT (4 commits on main, build passes clean):
- Full Next.js 14 app with 7 pages (Vault, Agent, Activity Log, Reports, Settings)
- Auth0 login/logout/session working
- Supabase tables created and working (vault_connections, vault_audit_log, vault_trust_reports)
- All API routes wired to Supabase
- All frontend pages fetch from real APIs
- Auth0 Token Vault wired (getAccessTokenForConnection)
- Real OAuth connect flow (auth0.connectAccount)
- Google Business Profile API tools (listAccounts, listLocations, auditLocation, updateDescription)
- Content generation uses OpenAI with Signal & Structure methodology
- Execute node calls real GBP API with Token Vault tokens
- Mid-session revocation detection (agent stops if token revoked)
- Netlify config ready
- npm run build passes with zero errors (14/14 pages)

WHAT NEEDS TO BE DONE NOW:

1. CREATE .env.local (if not already done):
   - Copy .env.example and fill in Auth0, Supabase, OpenAI, Tenant ID credentials

2. ENABLE GOOGLE APIS IN GOOGLE CLOUD CONSOLE (if not already done):
   - Enable: "My Business Business Information API"
   - Enable: "My Business Account Management API"
   - Enable: "Google My Business API"

3. TEST LOCALLY (run npm run dev, work through each flow):
   - Auth0 login → verify dashboard loads
   - "Connect Google" → OAuth redirect → Google consent → callback to /vault
   - Agent pipeline → submit task → verify all 7 steps execute with real tokens
   - Mid-session revocation → disconnect mid-run → verify agent stops cold

4. DEPLOY TO NETLIFY:
   - Push to main, connect repo, add env vars
   - Update Auth0 callback/logout/origins URLs for Netlify domain
   - Test deployed URL end-to-end

5. RECORD 3-MINUTE DEMO VIDEO:
   0:00-0:20 — Problem: clients share passwords insecurely
   0:20-0:50 — Client logs in, one-click "Connect Google" OAuth
   0:50-1:20 — Agent audits GBP, finds issues, proposes fixes
   1:20-1:50 — Client approves, agent executes real updates via Token Vault
   1:50-2:20 — All actions logged, full transparency
   2:20-2:40 — Client revokes mid-session, agent stops COLD
   2:40-3:00 — Trust report shows full audit trail

KEY CONTEXT:
- Auth0 does NOT need M2M application. Token Vault works through user sessions.
- Client experience is ONE CLICK: "Connect Google" → Google popup → "Allow" → done.
- WordPress integration was intentionally skipped — not worth the risk for hackathon.
- Deploy target is Netlify (not Vercel). netlify.toml already exists.
- Post-hackathon, Signal Vault embeds into ss-client-portal + ss-platform-dashboard.
```

---

## Architecture Quick Reference

```
Client clicks "Connect Google"
       │
       ▼
Auth0 connectAccount() → redirects to Google OAuth
       │
       ▼
Google shows "Allow Signal & Structure AI to access your Business Profile?"
       │
       ▼
Client clicks "Allow" → Google sends token to Auth0
       │
       ▼
Auth0 Token Vault stores the token (encrypted, auto-refreshing)
       │
       ▼
Agent calls auth0.getAccessTokenForConnection("google-oauth2")
       │
       ▼
Token Vault returns a fresh Google access token
       │
       ▼
Agent uses token to call Google Business Profile API
       │
       ▼
Every API call logged to Supabase vault_audit_log
       │
       ▼
Trust report generated in vault_trust_reports
```

**If client revokes at any point:** `getAccessTokenForConnection()` returns null or 401 → agent stops → revocation logged → no more access.

---

## Files That Matter Most

| File | What It Does |
|------|-------------|
| `src/lib/auth0.ts` | Auth0Client with `enableConnectAccountEndpoint: true` |
| `src/lib/auth0-ai.ts` | `getTokenForConnection()` — calls Token Vault |
| `src/app/api/connections/connect/route.ts` | GET = OAuth redirect, POST = save to Supabase |
| `src/lib/tools/gbp.ts` | Google Business Profile API tools |
| `src/lib/tools/audit-logger.ts` | Pipeline audit logging |
| `src/lib/agent/nodes/execute.ts` | Real GBP API calls + revocation detection |
| `src/lib/agent/nodes/content-gen.ts` | OpenAI + S&S methodology |
| `src/lib/agent/graph.ts` | LangGraph 7-node pipeline |
| `netlify.toml` | Netlify deployment config |
| `supabase/schema.sql` | Database schema (already ran) |

---

## Env Vars Needed (for Netlify deployment)

These are all in `.env.local` locally. Copy them to Netlify:

```
AUTH0_SECRET
AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET
AUTH0_DOMAIN
APP_BASE_URL               # Change to Netlify URL for production
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
TENANT_ID
```

**Also update in Auth0 Dashboard:**
- Callback URL: add `https://your-netlify-site.netlify.app/auth/callback`
- Logout URL: add `https://your-netlify-site.netlify.app/`
- Allowed Web Origins: add `https://your-netlify-site.netlify.app`
