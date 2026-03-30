# Signal Vault - Session Log

**Last Updated:** 2026-03-30

## Project Overview

**Signal Vault** is a secure credential vault for AI agents by **Signal & Structure AI**. Users connect accounts via OAuth (Auth0 Token Vault), and AI agents get scoped, time-limited access through a 7-step verification pipeline built on LangGraph.

- **Tech Stack:** Next.js 14, React 18, TypeScript, TailwindCSS
- **Key Integrations:** Auth0 (@auth0/nextjs-auth0 v4), Supabase, LangChain/LangGraph, OpenAI
- **Repo:** https://github.com/TKHatton/signal-vault.git
- **Branch:** main
- **Hackathon:** "Authorized to Act: Auth0 for AI Agents" — Deadline April 6, 2026
- **Deploy Target:** Netlify (NOT Vercel)

---

## What's Been Built (Session 1 + Session 2)

### Session 1 (March 27) — UI Shell
- All 7 pages: Landing, Vault, Agent Workspace, Activity Log, Trust Reports, Report Detail, Settings
- Auth0 middleware (login/logout/callback)
- LangGraph 7-node pipeline structure
- Brand theming (Navy, Copper, Stone palette)
- TypeScript types and interfaces
- All mocked/demo data

### Session 2 (March 30) — Backend Wiring
- Created `supabase/schema.sql` — 3 tables (vault_connections, vault_audit_log, vault_trust_reports) with RLS
- **Ran SQL in Supabase Dashboard — tables created and confirmed working**
- Created Supabase server client + query helpers
- Wired ALL API routes to Supabase (connections, audit, reports)
- Wired ALL frontend pages to fetch from real API
- Wired Auth0 Token Vault (`auth0.getAccessTokenForConnection()`)
- Pipeline audit node persists trust reports to Supabase
- Pre-check and permission-validate nodes use real Token Vault calls
- Created session helper, connect route, reports API routes

### Auth0 Dashboard Verified
- Signal Vault app: Regular Web Application ✅
- Google social connection: enabled and toggled ON for Signal Vault ✅
- Callback URL: `http://localhost:3000/auth/callback` ✅
- Logout URL: `http://localhost:3000/` ✅
- **My Account API: ACTIVATED** (required for Token Vault) ✅
- Login flow tested end-to-end ✅

### Current Status — App Runs, Data Flows
- Login works → Auth0 Universal Login → redirects to /vault
- Vault page shows real data from Supabase (0 connected, 3 available)
- Activity Log shows real data (empty = correct for fresh install)
- Trust Reports shows real data
- Build compiles clean (zero TypeScript errors)

---

## What Still Needs to Be Built (Hackathon Priority)

### THE WINNING DEMO (Critical Path)
The differentiator is NOT "I connected an account." Every entry will do that.

**The winning demo is:**
1. Client connects Google/WordPress → real OAuth via Auth0
2. **TK (or AI agent) uses that token to actually DO something on the client's site:**
   - Add a sitemap to WordPress
   - Fix robots.txt
   - Add schema markup to blog posts
   - Update Google Business Profile hours
3. Client sees every action in their Activity Log in real-time
4. **Client revokes access MID-SESSION → agent stops cold, can't do anything**
5. Revocation is logged, client gets notification
6. Activity log shows exactly what was accessed and what was done

This demonstrates: real token usage → real actions → real revocation → full audit trail.

### Remaining Build Items

1. **Real OAuth connect flow** — "Connect Google" button redirects through Auth0 OAuth, not just saves to Supabase
2. **Real WordPress/Google API tools** — Execute node actually calls APIs with Token Vault tokens:
   - WordPress: add schema, update robots, submit sitemap
   - Google: read/update Business Profile
3. **Revocation mid-session** — When client revokes, token becomes invalid immediately, agent pipeline fails gracefully at permission-validate step
4. **LangGraph human-in-the-loop** — Real interrupt/resume for approve/reject
5. **Content generation with OpenAI** — Real LLM analysis of client sites
6. **Deploy to Netlify** — With serverless functions for API routes
7. **Demo video** (3 min) — Show the full flow including mid-session revocation

### Post-Hackathon Integration
- Embed Signal Vault into ss-client-portal (client-facing)
- Embed Signal Vault into ss-platform-dashboard (team-facing)
- Client portal: clients connect accounts, see what's connected, revoke
- Platform dashboard: team sees which clients have active connections, runs agents
- Virtual assistant page: also gets access to run with client credentials

---

## System Architecture (How It All Connects)

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
                                      - Add schema to WordPress
                                      - Fix robots.txt
                                      - Submit sitemaps
                                      - Update GBP hours
                                      │
                                      ▼
                                   Activity Log
                                   (visible to BOTH client
                                    and S&S team)
```

**For hackathon:** Signal Vault is standalone. Client = demo user.
**Post-hackathon:** Signal Vault embeds into both portals.

---

## Auth0 Clarification

- Regular Web Application (NOT M2M)
- Token Vault works through user sessions via `@auth0/nextjs-auth0` v4
- `AUTH0_CUSTOM_API_CLIENT_ID` and `AUTH0_CUSTOM_API_CLIENT_SECRET` are NOT needed
- My Account API must be activated (done ✅)
- Social connections must be configured and enabled for the app (done for Google ✅)

---

## File Structure

```
src/
├── app/
│   ├── (dashboard)/ — vault, agent, activity, reports, settings pages
│   └── api/ — connections, audit, reports, chat endpoints (all wired to Supabase)
├── lib/
│   ├── auth0.ts / auth0-ai.ts — Auth0 client + Token Vault
│   ├── session.ts — Auth0 session helper
│   ├── supabase.ts — Server client
│   ├── supabase/queries.ts — CRUD for all 3 tables
│   ├── agent/ — LangGraph pipeline (graph.ts, state.ts, 7 node files)
│   ├── connections.ts — Service definitions
│   └── types.ts — TypeScript interfaces
├── components/ — Sidebar, ConnectionCard
└── config/ — Brand config

supabase/schema.sql — Run in Supabase SQL Editor (DONE)
```
