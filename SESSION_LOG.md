# Signal Vault - Session Log

**Last Updated:** 2026-03-31 (Session 3)

## Project Overview

**Signal Vault** is a secure credential vault for AI agents by **Signal & Structure AI**. Users connect accounts via OAuth (Auth0 Token Vault), and AI agents get scoped, time-limited access through a 7-step verification pipeline built on LangGraph.

- **Tech Stack:** Next.js 14, React 18, TypeScript, TailwindCSS
- **Key Integrations:** Auth0 (@auth0/nextjs-auth0 v4), Supabase, LangChain/LangGraph, OpenAI
- **Repo:** https://github.com/TKHatton/signal-vault.git
- **Branch:** main (3 commits)
- **Hackathon:** "Authorized to Act: Auth0 for AI Agents" — Deadline April 6, 2026
- **Deploy Target:** Netlify (NOT Vercel)
- **Goal:** Done in 2 days (by April 2)

---

## Session History

### Session 1 (March 27) — UI Shell
- All 7 pages: Landing, Vault, Agent Workspace, Activity Log, Trust Reports, Report Detail, Settings
- Auth0 middleware (login/logout/callback)
- LangGraph 7-node pipeline structure (all mocked with setTimeout)
- Brand theming (Navy #1B2B4B, Copper #C17A3A, Stone #F5F0EB)
- TypeScript types and interfaces for all data models
- All API routes scaffolded but returning demo data

### Session 2 (March 30) — Backend Wiring
- Created `supabase/schema.sql` — 3 tables with RLS policies and indexes
- **Ran SQL in Supabase Dashboard — tables created and confirmed working**
- Created `src/lib/supabase.ts` (server client) + `src/lib/supabase/queries.ts` (CRUD)
- Created `src/lib/session.ts` (Auth0 session helper)
- Wired ALL 7 API routes to Supabase (connections, audit, reports, chat)
- Wired ALL frontend pages to fetch from real API (no more demo data)
- Wired Auth0 Token Vault (`auth0.getAccessTokenForConnection()`)
- Pipeline pre-check and permission-validate nodes use real Token Vault calls
- Pipeline audit node persists trust reports to Supabase
- Created `src/app/api/reports/route.ts` and `[id]/route.ts` (new endpoints)
- Created `src/app/api/connections/connect/route.ts` (connection creation)
- Commit: `f628606 Initial commit: Signal Vault with Supabase + Auth0 Token Vault backend`

### Session 3 (March 31) — Real OAuth, Real GBP Tools, S&S Methodology
- **Real OAuth connect flow:** `auth0.connectAccount()` wired into vault page
  - Auth0Client configured with `enableConnectAccountEndpoint: true`
  - Connect route does GET (redirect to Auth0 OAuth) + POST (save to Supabase after callback)
  - Vault page handles `?connected=google-oauth2` callback param
- **Google Business Profile API tools created:** `src/lib/tools/gbp.ts`
  - `listAccounts()` — lists GBP accounts
  - `listLocations()` — lists locations under an account
  - `auditLocation()` — reads location data, scores completeness, identifies issues
  - `updateDescription()` — updates GBP description via PATCH
- **Audit logger created:** `src/lib/tools/audit-logger.ts`
  - `logPipelineEvent()` — helper to write audit entries from pipeline nodes
- **Content-gen node rewritten:** uses OpenAI (gpt-4o-mini) with S&S methodology prompt
  - Prompt includes all 6 S&S service domains
  - Generates real proposed changes in structured JSON format
  - Graceful fallback if OpenAI is unavailable
- **Execute node rewritten:** calls real GBP API with Token Vault tokens
  - Lists accounts → lists locations → audits first location → applies changes
  - **Mid-session revocation detection:** if token is null or returns 401/403, agent stops cold
  - Detailed logging of every API call for audit trail
- **Netlify config added:** `netlify.toml` with `@netlify/plugin-nextjs`
- Auth0 Dashboard verified: My Account API activated, Google social connection enabled
- Supabase tables confirmed working (SQL ran successfully)
- Commits: `b401915` and `aef2590`

### Auth0 Dashboard Status (Verified March 31)
- Signal Vault app: Regular Web Application ✅
- Google social connection: enabled and toggled ON ✅
- Callback URL: `http://localhost:3000/auth/callback` ✅
- Logout URL: `http://localhost:3000/` ✅
- My Account API: ACTIVATED ✅
- Login flow tested end-to-end ✅
- `enableConnectAccountEndpoint: true` set in code ✅

---

## What's Functional Right Now

| Feature | Status | Detail |
|---------|--------|--------|
| Auth0 login/logout | Working | Universal Login, redirects, session management |
| All 7 UI pages | Working | Styled, responsive, brand-themed |
| Supabase tables | Working | 3 tables created, RLS enabled |
| All API routes | Working | Wired to Supabase, return real data |
| Frontend fetches | Working | All pages call real API endpoints |
| Token Vault calls | Wired | `getAccessTokenForConnection()` in pre-check + permission-validate |
| OAuth connect flow | Wired | `auth0.connectAccount()` redirect, untested end-to-end |
| GBP API tools | Built | listAccounts, listLocations, auditLocation, updateDescription |
| OpenAI content gen | Built | S&S methodology prompt, structured JSON output |
| Mid-session revocation | Built | Execute node detects revoked tokens, stops immediately |
| Netlify config | Built | `netlify.toml` ready |

## What Has NOT Been Tested Yet

1. **Clicking "Connect Google" end-to-end** — the OAuth redirect flow through Auth0 to Google and back
2. **GBP API calls with a real token** — depends on Google Cloud APIs being enabled
3. **Full agent pipeline with real data** — Pre-check through Audit with real tokens
4. **Deploy to Netlify** — config exists but hasn't been deployed

---

## What Still Needs to Be Done (Hackathon Priority)

### CRITICAL PATH (Must Have for Demo)

1. **Enable Google APIs in Google Cloud Console** (TK does this once):
   - My Business Business Information API
   - My Business Account Management API
   - Google My Business API (legacy)

2. **Test the connect flow locally:**
   - `npm run dev` → login → click "Connect Google" → approve OAuth → verify token works

3. **Test full agent pipeline with real token:**
   - Submit agent task → pre-check gets token → content-gen uses OpenAI → execute calls GBP API

4. **Test mid-session revocation:**
   - Connect → start agent task → disconnect mid-run → verify agent stops

5. **Deploy to Netlify:**
   - Push to main → connect repo to Netlify → add env vars → test deployed URL
   - Update Auth0 callback URLs to include Netlify URL

6. **WordPress tools** (stretch — significantly strengthens demo):
   - Connect WordPress via Auth0
   - Add schema markup to pages
   - Submit sitemap
   - Fix robots.txt

7. **Record 3-minute demo video**

### NICE TO HAVE (If Time)
- LangGraph human-in-the-loop with real interrupt/resume
- Email notification on revocation
- WordPress integration (schema markup, robots.txt, sitemap)
- LinkedIn integration
- Platform dashboard view (S&S team perspective)

---

## THE WINNING DEMO STRATEGY

**What loses:** "I connected an account and it shows connected." Every entry does that.

**What wins:**
1. Client connects Google → real OAuth, one-click experience
2. Agent audits their GBP → reads real listing data, scores completeness
3. Agent proposes fixes → AI-generated using S&S methodology
4. Client approves → human-in-the-loop
5. Agent executes → updates GBP description, hours, categories using Token Vault token
6. Client sees everything in Activity Log → full transparency
7. **Client revokes access mid-session → agent stops COLD**
8. Revocation logged → audit trail proves nothing happened after revocation
9. Everything visible in Trust Report → 7-step verification proof

**The pitch:** "Your client never shares a password. They click 'Allow.' Your AI agent does the work. They see every action. They revoke anytime — even mid-session — and the agent stops immediately. This is how agentic AI should handle credentials."

---

## System Architecture

```
CLIENT SIDE                          S&S TEAM SIDE
──────────                           ──────────────
ss-client-portal                     ss-platform-dashboard
  (client logs in)                     (TK/team logs in)
       │                                      │
       │ "Connect Google"                     │
       ▼                                      │
  Signal Vault                                │
  (OAuth flow via Auth0)                      │
       │                                      │
       │ Token stored in                      │
       │ Auth0 Token Vault                    │
       │                                      ▼
       └──────────── tokens ────────► AI Agents use tokens
                                      to do REAL work:
                                      - Update GBP description
                                      - Add schema to WordPress
                                      - Fix robots.txt
                                      - Submit sitemaps
                                      │
                                      ▼
                                   Activity Log
                                   (visible to BOTH client
                                    and S&S team)
```

**For hackathon:** Signal Vault is standalone. Client = demo user.
**Post-hackathon:** Embeds into ss-client-portal + ss-platform-dashboard.

---

## Auth0 Key Facts

- Regular Web Application (NOT M2M — M2M is not needed)
- Token Vault works through user sessions via `@auth0/nextjs-auth0` v4
- `AUTH0_CUSTOM_API_CLIENT_ID` and `AUTH0_CUSTOM_API_CLIENT_SECRET` are NOT needed
- My Account API must be activated (done)
- `enableConnectAccountEndpoint: true` must be set in Auth0Client (done)
- Social connections must be configured and enabled for the app (done for Google)
- **Client experience:** Click "Connect Google" → Google popup → click "Allow" → done
- **Client does NOT:** set up Google Cloud, configure APIs, deal with tokens, or anything technical

---

## File Structure

```
signal-vault/
├── netlify.toml                    # Netlify deployment config
├── supabase/schema.sql             # SQL migration (ALREADY RAN)
├── src/
│   ├── app/
│   │   ├── (dashboard)/            # vault, agent, activity, reports, settings pages
│   │   └── api/
│   │       ├── connections/
│   │       │   ├── route.ts        # GET/DELETE connections (Supabase)
│   │       │   ├── [id]/route.ts   # DELETE specific connection
│   │       │   └── connect/route.ts # GET (Auth0 OAuth redirect) + POST (save to Supabase)
│   │       ├── audit/route.ts      # GET/POST audit log (Supabase)
│   │       ├── reports/
│   │       │   ├── route.ts        # GET reports list
│   │       │   └── [id]/route.ts   # GET report detail
│   │       └── chat/route.ts       # POST — runs LangGraph pipeline
│   ├── lib/
│   │   ├── auth0.ts                # Auth0Client with enableConnectAccountEndpoint
│   │   ├── auth0-ai.ts             # Token Vault: getTokenForConnection()
│   │   ├── session.ts              # getSessionUser() helper
│   │   ├── supabase.ts             # Server client (service_role key)
│   │   ├── supabase/queries.ts     # CRUD for 3 vault_ tables
│   │   ├── connections.ts          # Service definitions (Google, WordPress, LinkedIn)
│   │   ├── types.ts                # TypeScript interfaces
│   │   ├── tools/
│   │   │   ├── gbp.ts             # Google Business Profile API tools
│   │   │   └── audit-logger.ts     # Pipeline audit logging helper
│   │   └── agent/
│   │       ├── graph.ts            # LangGraph 7-node graph
│   │       ├── state.ts            # Agent state definition
│   │       └── nodes/              # 7 pipeline nodes
│   │           ├── pre-check.ts        # Real Token Vault validation
│   │           ├── content-gen.ts      # OpenAI + S&S methodology
│   │           ├── human-review.ts     # Auto-approve (needs interrupt)
│   │           ├── permission-validate.ts # Real Token Vault re-validation
│   │           ├── execute.ts          # Real GBP API calls + revocation detection
│   │           ├── post-check.ts       # Verification
│   │           └── audit.ts            # Persist to Supabase
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   └── vault/ConnectionCard.tsx
│   └── config/brand.config.ts
```
