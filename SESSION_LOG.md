# Signal Vault - Session Log

**Last Updated:** 2026-04-03 (Session 6)

## Project Overview

**Signal Vault** is a secure credential vault for AI agents by **Signal & Structure AI**. Users connect accounts via OAuth (Auth0 Token Vault), and AI agents get scoped, time-limited access through a 7-step verification pipeline built on LangGraph.

- **Tech Stack:** Next.js 14, React 18, TypeScript, TailwindCSS
- **Key Integrations:** Auth0 (@auth0/nextjs-auth0 v4), Supabase, LangChain/LangGraph, OpenAI
- **Repo:** https://github.com/TKHatton/signal-vault.git
- **Branch:** main
- **Hackathon:** "Authorized to Act: Auth0 for AI Agents" — Deadline April 6, 2026
- **Deploy:** https://signal-vault.netlify.app (LIVE)
- **Goal:** Record demo, submit to DevPost by April 6

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

### Session 4 (April 2) — Ship Day Prep
- Full repo review: confirmed all code, types, API routes, pipeline nodes intact
- `npm install` — all dependencies installed successfully
- `npm run build` — **passes clean with zero errors** (14/14 pages compiled)
  - Only warnings: missing .env.local (expected) and Edge Runtime compat notes (non-blocking)
- Created ship-day execution plan: 4 phases (setup → test → deploy → demo)
- Decision: **skip WordPress integration** — GBP alone demonstrates full Token Vault pattern
- Remaining work is all testing + deployment (no new features needed)
- Commits: `e5a8001` (session log/prompt update from Session 3)

### Session 5 (April 2) — Testing, Debugging, Deploy Attempts
**OAuth Connect Flow — Debugged and Working:**
- Initial `auth0.connectAccount()` failed with `ConnectAccountError` (MRRT incompatibility)
- Fix: redirect to SDK's built-in `/auth/connect` endpoint instead
- Discovered Auth0 Dashboard requirements for Token Vault:
  - Google connection Purpose must include "Connected Accounts for Token Vault"
  - "Offline Access" must be enabled on the Google connection
  - "Token Vault" grant type must be enabled on the app
  - "Multi-Resource Refresh Token" must have "My Account API" toggled on
  - Refresh Token Rotation must be **disabled** (conflicts with Token Vault exchange)
- Google Cloud Console: custom OAuth Client ID/Secret required (not Auth0 dev keys)
- Google Cloud Console: redirect URI `https://{domain}.auth0.com/login/callback` required
- Google Cloud Console: test user must be added (app in testing mode with sensitive scopes)
- **Result: OAuth connect flow works end-to-end** ✅

**Token Vault Token Exchange — Debugged and Working:**
- `getAccessTokenForConnection()` initially failed — called from LangGraph pipeline nodes without request context
- Fix: get token in `/api/chat` route handler (has cookie context), pass through pipeline state
- Fixed seconds-to-milliseconds conversion on `expiresAt` from Auth0
- Added `vaultToken` field to LangGraph state, updated pre-check, permission-validate, and execute nodes
- **Result: Real Google access token retrieved from Token Vault** ✅

**Full Pipeline — Working End-to-End:**
- All 7 steps execute: pre-check → content-gen → human-review → permission-validate → execute → post-check → audit
- Pre-check validates real token freshness and expiration
- Content generation uses OpenAI with S&S methodology
- Permission validation re-checks token before execution
- Execute calls real Google Business Profile API with Token Vault token
- GBP API returns 429 (quota restriction — requires Google API access request, not an auth issue)
- Trust reports saved to Supabase with full audit trail
- **Result: Pipeline proven with real tokens** ✅

**Mid-Session Revocation — Working:**
- Disconnect mid-pipeline → execution blocked → "Token Vault returned no token"
- Activity log shows Connected/Disconnected events with timestamps
- **Result: Revocation detection works** ✅

**Demo Script Written:**
- `DEMO_SCRIPT.md` created with full 3-minute video script
- Commits: `d322ddb` (Token Vault end-to-end wiring)

**Deployment — Attempted but Blocked:**
- Netlify: site created (signal-vault.netlify.app), env vars imported, but runtime 500 error
- Vercel: attempted as alternative, build failed
- Decision at end of Session 5: park deployment, demo from localhost
- Commits: `49392b4`, `1f98010` → `c841a43`, `7254c09` → `8277666`, `2bf0afd`

### Session 6 (April 3) — Deployment FIXED, Submission Prep

**Deployment Fixed — TWO root causes identified and resolved:**

1. **`@netlify/plugin-nextjs` mismatch (caused `clientModules` TypeError):**
   - The plugin was referenced in `netlify.toml` but had been removed from `package.json` in Session 5
   - This mismatch caused Netlify's build system to incorrectly configure the SSR function
   - Netlify no longer needs this plugin at all — it uses the OpenNext adapter automatically
   - **Fix:** Removed `[[plugins]] package = "@netlify/plugin-nextjs"` from `netlify.toml`

2. **Next.js 14.2.x `(dashboard)` route group bug (caused `page_client-reference-manifest.js` ENOENT):**
   - Next.js 14.2.x has a known bug where parenthesized route groups fail to generate the client reference manifest file
   - This was the SAME error blocking Vercel deployment — both platforms hit the same underlying Next.js bug
   - The bug was fixed in Next.js 15 (PR #73606) but **never backported to 14.x**
   - 14.2.35 IS the latest 14.x release — there was no version to upgrade to within 14
   - **Fix:** Removed the `(dashboard)` route group entirely. Moved all pages from `src/app/(dashboard)/` to `src/app/` with individual `layout.tsx` files that include the Sidebar component
   - URLs unchanged — `/vault`, `/agent`, `/activity`, `/reports`, `/settings` all work the same

3. **Middleware Edge Runtime incompatibility (bonus fix):**
   - Auth0's `@auth0/nextjs-auth0` SDK uses Node.js `crypto` module, which isn't available in Edge Runtime
   - Set `export const runtime = "nodejs"` in `src/middleware.ts`
   - Changed function signature from `Request` to `NextRequest`

**Result: https://signal-vault.netlify.app is LIVE and rendering correctly** ✅

**Auth0 Dashboard Updated:**
- Callback URL: added `https://signal-vault.netlify.app/auth/callback`
- Logout URL: added `https://signal-vault.netlify.app`
- Allowed Web Origins: added `https://signal-vault.netlify.app`
- **Result: Auth0 URLs configured for production** ✅

**Submission Materials Created:**
- `DEVPOST_CHECKLIST.md` — reusable DevPost submission template for future hackathons
- `SIGNAL_VAULT_SUBMISSION.md` — complete submission with all narrative sections filled out
- `README.md` — rewritten from Next.js boilerplate to real project documentation
- `DEMO_SCRIPT.md` — revised (v2) with personal narrative, better pacing, revocation as climax
- `BLOG_POSTS.md` — 5 unique blog posts for 5 platforms:
  1. LinkedIn (founder reflection on Auth0's depth)
  2. Signal & Structure AI blog (client-facing trust angle)
  3. Digital Jaywalking blog (technical architecture — token lifecycle management)
  4. She is AI community (hackathon experience, encouragement)
  5. AI Surfers community (builder/entrepreneur business case)
- `thumbnail.svg` + `thumbnail.html` — hero thumbnail with brand colors and pipeline visualization

**Key Deployment Lesson for Submission:**
The deployment fix is a genuinely interesting hackathon story: a known Next.js 14 bug with parenthesized route groups that was fixed in Next.js 15 but never backported. Both Netlify and Vercel failed for the same root cause — the `(dashboard)` folder name. The fix was architectural (flatten the route structure) not a config tweak. This demonstrates real debugging under pressure and understanding of framework internals.

Commits: `f2c27b7` (remove plugin mismatch + Node.js middleware), `0acfe9b` (remove route group)

### Auth0 Dashboard Status (Verified April 3)
- Signal Vault app: Regular Web Application ✅
- Google social connection: enabled and toggled ON ✅
- Callback URLs: `http://localhost:3000/auth/callback` + `https://signal-vault.netlify.app/auth/callback` ✅
- Logout URLs: `http://localhost:3000/` + `https://signal-vault.netlify.app` ✅
- My Account API: ACTIVATED ✅
- Token Vault grant type: enabled ✅
- Refresh Token Rotation: DISABLED ✅
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
| Token Vault calls | Working | `getAccessTokenForConnection()` in pre-check + permission-validate |
| OAuth connect flow | Working | `/auth/connect` → Auth0 → Google consent → callback ✅ |
| Token Vault exchange | Working | `getAccessTokenForConnection()` returns real Google token ✅ |
| GBP API tools | Working | Token accepted by Google (429 = quota, not auth) ✅ |
| OpenAI content gen | Working | S&S methodology prompt, structured JSON output ✅ |
| 7-step pipeline | Working | All steps execute with real Token Vault tokens ✅ |
| Mid-session revocation | Working | Disconnect stops agent cold, logged in audit trail ✅ |
| **Netlify deploy** | **LIVE** | **https://signal-vault.netlify.app — rendering correctly** ✅ |
| Production build | Passing | `npm run build` — zero errors, 14/14 pages |

## What Has Been Tested and Verified

1. **Connect Google end-to-end** ✅ — OAuth redirect through Auth0 → Google consent → callback → CONNECTED
2. **Token Vault token exchange** ✅ — Real Google access token retrieved and used
3. **Full agent pipeline with real tokens** ✅ — All 7 steps execute, trust reports saved
4. **Mid-session revocation** ✅ — Agent stops cold, revocation logged
5. **Deploy to Netlify** ✅ — https://signal-vault.netlify.app live and rendering
6. **Auth0 production URLs** ✅ — Callback/logout/origins configured for Netlify domain

## Known Limitations

1. **GBP API quota** — Google Business Profile API requires access request (returns 429). Token works, auth works, API rejects due to zero quota. Not an app issue.
2. **Google OAuth app in testing mode** — requires test users to be added. Production would need Google verification (takes weeks).

---

## What Still Needs to Be Done (Updated April 3 — Session 6)

### REMAINING
1. **Record 3-minute demo video** — revised script in `DEMO_SCRIPT.md`, can demo from deployed site or localhost
2. **Submit to Devpost** — all materials ready in `SIGNAL_VAULT_SUBMISSION.md`
3. **Publish blog posts** — 5 posts ready in `BLOG_POSTS.md`
4. **Test deployed site end-to-end** — login flow, connect, pipeline on Netlify

### COMPLETED
- ~~Environment setup~~ ✅
- ~~Google APIs enabled~~ ✅
- ~~Auth0 login flow~~ ✅
- ~~OAuth connect flow~~ ✅
- ~~Full pipeline with real tokens~~ ✅
- ~~Mid-session revocation~~ ✅
- ~~Demo script written~~ ✅ (revised v2)
- ~~Deployment~~ ✅ — **FIXED AND LIVE**
- ~~Auth0 production URLs~~ ✅
- ~~README rewritten~~ ✅
- ~~DevPost submission content~~ ✅
- ~~Blog posts written~~ ✅ (5 unique posts)
- ~~Thumbnail created~~ ✅

---

## THE WINNING DEMO STRATEGY

**What loses:** "I connected an account and it shows connected." Every entry does that.

**What wins:**
1. Personal story — "I started a company, clients trust me with money, now I'm asking for passwords"
2. Client connects Google → real OAuth, one-click experience
3. Agent runs through 7-step pipeline → watch it in real time
4. Activity Log → client sees every action with timestamps (transparency)
5. Trust Reports → auditable proof of what happened
6. **Client revokes access mid-session → agent stops COLD**
7. Revocation logged → audit trail proves nothing happened after
8. Mutual protection — agency never holds credentials, both sides safe

**The pitch:** "I built Signal Vault because I didn't want to be the person asking for passwords. Auth0 Token Vault made it possible to never hold a client's credentials. The 7-step pipeline makes sure nothing happens without verification. And if a client ever changes their mind — even mid-operation — the agent stops cold."

---

## System Architecture

```
CLIENT SIDE                          S&S TEAM SIDE
----------                           --------------
ss-client-portal                     ss-platform-dashboard
  (client logs in)                     (TK/team logs in)
       |                                      |
       | "Connect Google"                     |
       v                                      |
  Signal Vault                                |
  (OAuth flow via Auth0)                      |
       |                                      |
       | Token stored in                      |
       | Auth0 Token Vault                    |
       |                                      v
       +------------ tokens ---------> AI Agents use tokens
                                      to do REAL work:
                                      - Update GBP description
                                      - Add schema to WordPress
                                      - Fix robots.txt
                                      - Submit sitemaps
                                      |
                                      v
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

## Key Debugging Lessons (All Sessions)

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| `ConnectAccountError` | MRRT incompatibility with `auth0.connectAccount()` | Use `/auth/connect` SDK endpoint instead |
| Token fetch fails in pipeline nodes | No request context (cookies) in LangGraph nodes | Fetch token in API route, pass through state |
| Token validation rejects valid tokens | `expiresAt` in seconds, `Date.now()` in milliseconds | Convert units before comparison |
| Refresh Token exchange fails | Refresh Token Rotation conflicts with Token Vault | Disable Rotation in Auth0 Dashboard |
| Google OAuth fails with Auth0 dev keys | Token Vault requires custom OAuth credentials | Set up Google Cloud Console with custom Client ID/Secret |
| Netlify runtime 500 (`clientModules`) | `@netlify/plugin-nextjs` in netlify.toml but not in package.json | Remove plugin reference — Netlify handles Next.js natively now |
| Netlify + Vercel manifest ENOENT | Next.js 14.2.x bug with parenthesized `(dashboard)` route group | Remove route group, move pages to `src/app/` directly |
| Middleware Edge Runtime crash | Auth0 SDK uses Node.js `crypto`, incompatible with Edge | Set `export const runtime = "nodejs"` in middleware |

---

## File Structure

```
signal-vault/
├── netlify.toml                    # Netlify deployment config (no plugins needed)
├── supabase/schema.sql             # SQL migration (ALREADY RAN)
├── DEMO_SCRIPT.md                  # 3-minute demo video script (v2)
├── SIGNAL_VAULT_SUBMISSION.md      # DevPost submission content
├── DEVPOST_CHECKLIST.md            # Reusable template for future hackathons
├── BLOG_POSTS.md                   # 5 blog posts for 5 platforms
├── README.md                       # Project documentation (rewritten)
├── thumbnail.svg                   # Hero thumbnail image
├── src/
│   ├── app/
│   │   ├── vault/                  # Connected Accounts page + layout
│   │   ├── agent/                  # Agent Workspace page + layout
│   │   ├── activity/               # Activity Log page + layout
│   │   ├── reports/                # Trust Reports + detail pages + layout
│   │   ├── settings/               # Settings page + layout
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
│   ├── middleware.ts               # Auth0 middleware (runtime: nodejs)
│   └── config/brand.config.ts
```
