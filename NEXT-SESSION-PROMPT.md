# Signal Vault — Next Session Prompt

**Created:** 2026-03-31 (end of Session 3)
**Hackathon Deadline:** April 6, 2026 @ 11:45pm PDT (6 days remaining)
**Target Completion:** April 2, 2026 (2 days from now)

---

## Copy this into your next Claude Code session:

```
I'm continuing work on Signal Vault — my Auth0 hackathon entry. Read SESSION_LOG.md for full context.

SHORT VERSION: Signal Vault lets clients connect their Google/WordPress accounts via OAuth (Auth0 Token Vault). AI agents then use those tokens to do real work on the client's behalf — audit their Google Business Profile, add schema markup to their WordPress site, update business hours, etc. Every action is logged. Clients can revoke access mid-session and the agent stops immediately. This is for the "Authorized to Act: Auth0 for AI Agents" hackathon, deadline April 6.

WHAT'S ALREADY BUILT (3 commits on main):
- Full Next.js app with 7 pages (Vault, Agent, Activity Log, Reports, Settings)
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

WHAT NEEDS TO BE DONE NOW (in priority order):

1. ENABLE GOOGLE APIS IN GOOGLE CLOUD CONSOLE (I need to do this manually):
   - Go to console.cloud.google.com
   - APIs & Services > Library
   - Enable: "My Business Business Information API"
   - Enable: "My Business Account Management API"
   - Enable: "Google My Business API"
   Note: This is a ONE-TIME developer setup. Clients never do this.

2. TEST THE CONNECT FLOW LOCALLY:
   - npm run dev
   - Login via Auth0
   - Click "Connect Google" on Vault page
   - Should redirect: browser → Auth0 → Google "Allow" screen → back to /vault
   - Debug any errors that come up

3. TEST FULL AGENT PIPELINE WITH REAL TOKEN:
   - Go to Agent Workspace
   - Type "Audit my Google Business Profile and suggest improvements"
   - Should: pre-check (gets token) → content-gen (OpenAI) → human-review → permission-validate → execute (real GBP API) → post-check → audit (saved to Supabase)
   - Check Activity Log for entries
   - Check Trust Reports for the report

4. TEST MID-SESSION REVOCATION:
   - With Google connected, start an agent task
   - While it's running, click "Disconnect" on the Google card
   - Pipeline should fail at next token check with "ACCESS REVOKED" message
   - Check audit log shows the revocation

5. DEPLOY TO NETLIFY:
   - Connect GitHub repo to Netlify
   - Add ALL env vars from .env.local to Netlify environment settings
   - Update Auth0 callback URLs to include the Netlify domain
   - Test deployed URL end-to-end

6. WORDPRESS TOOLS (stretch goal — makes demo much stronger):
   - Add WordPress social connection in Auth0 Dashboard
   - Build WordPress API tools (add schema, update robots.txt, submit sitemap)
   - Wire into execute node alongside GBP tools
   - Demo: client connects WordPress, agent adds LocalBusiness schema to homepage

7. RECORD 3-MINUTE DEMO VIDEO:
   Script:
   0:00-0:20 — Problem: "Clients share passwords in emails. That's insecure."
   0:20-0:50 — Client logs in, clicks "Connect Google", one-click OAuth
   0:50-1:20 — Agent audits GBP, finds issues, generates fixes using S&S methodology
   1:20-1:50 — Client reviews proposed changes, approves them
   1:50-2:20 — Agent executes real GBP updates via Token Vault, all logged
   2:20-2:40 — Client revokes access mid-session, agent stops COLD
   2:40-3:00 — Trust report shows full audit trail. "This is how agents should work."

KEY CONTEXT:
- Auth0 does NOT need M2M application. Token Vault works through user sessions.
- Client experience is ONE CLICK: "Connect Google" → Google popup → "Allow" → done.
- Clients do NOT set up Google Cloud, APIs, or anything technical.
- The Google Cloud setup (Step 1) is developer-only, done once.
- Deploy target is Netlify (not Vercel). netlify.toml already exists.
- Signal & Structure AI methodology covers: structured data, GBP optimization, NAP consistency, content optimization, technical infrastructure, AI presence building.
- Post-hackathon, Signal Vault embeds into ss-client-portal (client side) and ss-platform-dashboard (team side).
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
