# Signal Vault — DevPost Submission (v2)

> **Hackathon:** Authorized to Act: Auth0 for AI Agents
> **Deadline:** April 6, 2026

---

## GENERAL INFO

### Project Name
```
Signal Vault
```

### Elevator Pitch (200 characters max)
```
AI agents that touch client accounts need more than a token — they need trust. Signal Vault gives agents scoped access through a 7-step verification pipeline, with full audit trails and instant revocation.
```
*(198 characters)*

---

## ABOUT THE PROJECT

## Inspiration

Every AI agency faces the same ugly moment: asking a client to hand over their Google password in an email.

At Signal & Structure AI, we manage Google Business Profiles, WordPress sites, and analytics dashboards for local businesses. Every one of those requires access to a client's account. The industry standard? A shared Google Sheet with plaintext passwords. Or a forwarded email with login credentials. It's insecure, unauditable, and when something goes wrong, there's no way to prove what happened — or didn't happen.

But the deeper problem isn't just security for the client. **It's liability for the agency.** If our systems were ever compromised, we'd be sitting on a database of client credentials. That's a breach waiting to happen — and it puts both sides at risk.

An estimated 5,000+ AI agencies currently manage client accounts this way. At 50 clients per agency, that's 250,000+ insecure credential exchanges per year — each one a potential breach vector with no audit trail and no way to revoke access without changing a password.

We needed a system where our AI agents could do real work on client accounts without us ever holding their credentials. Where the client could see every action, approve every change individually, and pull the plug instantly — even mid-operation. And where we could prove, with an auditable record, that we never overstepped.

Auth0 Token Vault made that possible. Signal Vault is how we built it.

## What it does

Signal Vault is a secure credential management layer for AI agents. Here's what happens from the client's perspective:

1. **One-click connect.** The client clicks "Connect Google" and sees a standard Google consent screen. No passwords shared, no API keys exchanged. Auth0 Token Vault handles the entire OAuth flow — the token is encrypted, auto-refreshing, and never visible to the client or the agency.

2. **7-step verification pipeline.** Every agent action passes through a rigorous pipeline before anything touches the client's account:
   - **Pre-Check** — validates the token is fresh, scoped correctly, and not expired
   - **Content Generation** — AI proposes changes using our proprietary methodology
   - **Human Review** — the client sees exactly what will change and approves or rejects **each change individually**, with the option to add comments and instructions
   - **Permission Validation** — re-checks the token immediately before execution (because a client could revoke between approval and execution)
   - **Execution** — the agent acts on **only the approved changes** using the Token Vault token
   - **Post-Check** — verifies changes were applied correctly with no scope violations
   - **Audit** — generates a trust report documenting every step, every approval, and every rejection

3. **Granular approval — not just yes or no.** The approval step isn't a binary "approve all" button. Clients see each proposed change side-by-side (current value vs. proposed value), approve or reject each one individually, and can add instructions like "Don't change my hours." The agent only executes what was explicitly approved. This is the level of control that makes AI agents trustworthy.

4. **Activity Log.** Every connection, disconnection, and agent action is logged with timestamps. The client sees exactly when their account was accessed, what was requested, and what was done. Full transparency — nothing hidden.

5. **Trust Reports.** Each pipeline run generates a detailed trust report: which steps passed, which failed, how many changes were proposed vs. approved vs. executed, and whether any scope violations or data leaks were detected. This is auditable AI — and it's the kind of documentation that GDPR Article 15 (Right of Access) and CCPA audit requirements demand.

6. **Instant revocation.** The client can disconnect at any time — even while the agent is mid-operation. The agent stops cold. No partial writes. No unauthorized changes. The revocation is logged in the audit trail as proof that nothing happened after the client pulled access.

7. **Mutual protection.** Signal & Structure AI never stores client credentials. Auth0 does. If our systems were breached tomorrow, attackers would find audit logs and trust reports — not passwords, not tokens, not access keys. The architecture protects both the client and the agency.

**How this compares to alternatives:**
- *Shared passwords:* No audit trail, no revocation, no scope limits. A single breach exposes everything.
- *API keys:* Can't be revoked mid-operation, no human-in-the-loop approval, no visibility into what the agent does.
- *Standard OAuth without verification:* Gets a token but has no pre-execution checks, no granular approval, no post-execution verification. Token misuse goes undetected.
- *Signal Vault:* OAuth + multi-checkpoint validation + granular human approval + instant revocation + immutable audit trail. The only approach that combines all five.

## How we built it

**Frontend & Framework:** Next.js 14 with React 18 and TypeScript. TailwindCSS for styling. Eight pages: Landing, Vault (connection management), Agent Workspace, Review Changes (granular approval), Activity Log, Trust Reports, Report Detail, and Settings.

**Authentication & Token Management:** Auth0 (`@auth0/nextjs-auth0` v4) handles login, session management, and the Token Vault integration. The Auth0 client is configured with `enableConnectAccountEndpoint` for the OAuth connect flow. Token exchange uses `getAccessTokenForConnection()` to retrieve scoped Google tokens at runtime — tokens are never stored in our database.

**Agent Pipeline:** LangGraph (from LangChain) orchestrates the 7-node verification pipeline as a directed state graph. Each node receives the pipeline state (including the vault token) and either advances to the next step or routes to the audit node on failure. OpenAI (`gpt-4o-mini`) powers the content generation node using Signal & Structure's service methodology.

**Granular Approval UI:** The Review Changes page displays each proposed change as an individual card with current vs. proposed values, per-change approve/reject controls, and a comment field for client instructions. The approval is also embedded inline in the Agent Workspace chat during pipeline execution — the pipeline pauses at the Human Review step and waits for the client to make their decisions before proceeding.

**Database:** Supabase (PostgreSQL) stores connection metadata, audit logs, and trust reports. Row-Level Security policies ensure data isolation. The Supabase service role key is used server-side only.

**External APIs:** Google Business Profile API for real account operations (list accounts, audit locations, update descriptions). Google OAuth with custom credentials through Google Cloud Console.

**Architecture pattern:** Token lives in Auth0 Token Vault → retrieved at request time in the API route → passed through LangGraph state → validated at permission checkpoint → used by execution node (only for approved changes) → never persisted. If the token is missing or revoked at any point in the pipeline, execution halts.

## Challenges we ran into

**Auth0's depth is both its superpower and its learning curve.** Token Vault doesn't just work out of the box — it requires a precise combination of settings across multiple layers of the platform. The Google social connection needs its Purpose set to include "Connected Accounts for Token Vault" *and* "Authentication." Offline Access must be enabled on the connection. The Token Vault grant type must be enabled on the application. Multi-Resource Refresh Token must have the My Account API toggled on. And critically, Refresh Token Rotation must be *disabled* — which feels counterintuitive for a security feature, but Token Vault's exchange mechanism conflicts with rotation.

These are settings within settings that have their own settings. We spent significant time discovering that each layer exists and understanding why it matters. But that depth is exactly what makes the platform so powerful — the level of customization means you can build truly precise security models.

**The `connectAccount()` MRRT bug.** Auth0's SDK method `auth0.connectAccount()` threw a `ConnectAccountError` due to a Multi-Resource Refresh Token incompatibility. The fix was to redirect to the SDK's built-in `/auth/connect` endpoint instead — a workaround that required reading the SDK source code to discover.

**Token context isolation.** `getAccessTokenForConnection()` only works in a request context (where cookies are available), but our LangGraph pipeline nodes run asynchronously without direct access to the incoming request. The solution: fetch the token in the API route handler and pass it through the pipeline state as `vaultToken`, so every node has access without needing its own cookie context.

**Seconds vs. milliseconds.** Auth0 returns `expiresAt` in seconds. JavaScript's `Date.now()` returns milliseconds. Our token freshness check was rejecting valid tokens until we caught the unit mismatch — a subtle bug that passed all logic tests but failed every real token.

**Google Cloud Console requirements.** Token Vault with Google requires custom OAuth credentials — Auth0's built-in development keys don't support the Token Vault flow. This meant setting up a Google Cloud project, configuring the OAuth consent screen, adding the Auth0 callback URI, and manually adding test users since the app runs in testing mode with sensitive scopes.

**Deployment required understanding framework internals.** Both Netlify and Vercel failed to deploy our app — Netlify's SSR function crashed with a `clientModules` TypeError, and Vercel's build failed on missing manifest files. The builds succeeded but the app 500'd on every request. After investigating, we found two root causes: first, a configuration mismatch where Netlify's Next.js plugin was referenced in our config but not installed (Netlify now handles Next.js natively and the plugin was doing more harm than good). Second — and this was the real discovery — Next.js 14.2.x has a known bug where parenthesized route groups (our `(dashboard)` folder) fail to generate client reference manifest files. This bug was fixed in Next.js 15 but never backported to 14.x. The fix was architectural: we restructured the app to eliminate the route group entirely, moving pages to the app root with individual layouts. We also had to force the Auth0 middleware to Node.js runtime because the SDK uses `crypto`, which isn't available in Edge Runtime. Three bugs, three different layers of the stack, all discovered under hackathon deadline pressure.

## Accomplishments that we're proud of

**This is not a mock.** Signal Vault uses real OAuth tokens from Auth0 Token Vault to make real API calls to Google. The 7-step pipeline runs with actual token validation, actual AI-generated content, and actual audit persistence. When we demo revocation, it's a real token being revoked and a real agent being stopped.

**Granular human-in-the-loop approval.** Most AI agent tools treat human approval as a binary gate: approve or cancel. Signal Vault lets clients review each proposed change individually — see the current value, see what the agent wants to change, approve some, reject others, and add instructions. The agent only executes what was explicitly approved. This is the difference between "human in the loop" as a checkbox and "human in the loop" as real user control.

**The 7-step pipeline is production architecture.** Most hackathon entries demonstrate that Token Vault can issue a token. Signal Vault demonstrates what responsible token *usage* looks like — verification before action, human approval, re-validation before execution, post-execution checks, and immutable audit trails. This is the pattern we're building into our real client platform.

**Mid-session revocation actually works.** Disconnect mid-pipeline and the agent halts immediately — no partial writes, no orphaned operations. The revocation is logged with a timestamp, and the trust report documents that execution was blocked. This is the feature that proves the system works under adversarial conditions, not just happy paths.

**Mutual protection by design.** We never hold client credentials. Auth0 does. If Signal & Structure AI were breached tomorrow, attackers would find audit logs and trust reports — not passwords, not tokens, not access keys. The architecture protects both the client and the agency.

**Trust Reports give clients something they've never had.** In our industry, clients hand over access and hope for the best. Signal Vault gives them a signed receipt for every interaction — what was proposed, what was approved, what was rejected, what was executed, and what was verified. That's not just security; it's a new standard of professional accountability.

**Deployed and live.** Signal Vault is running in production at https://signal-vault.netlify.app. Getting there required debugging two framework-level issues under hackathon deadline pressure — a Netlify plugin mismatch and a Next.js 14 route group bug that was only fixed in Next.js 15. The fix was architectural, not a config tweak.

## What we learned

**Auth0 is an incredibly deep platform.** The layers of configuration — connection-level settings, application-level grant types, tenant-level API toggles, Google Cloud Console integration — create a system where the permutations of security models are nearly limitless. That complexity was challenging during development, but it's exactly what makes Auth0 the right foundation for production agentic AI. You can define precisely who gets access to what, under what conditions, with what scope, and for how long. No other auth platform we evaluated comes close to that level of control.

**Token Vault + LangGraph is a production-ready pattern.** The combination of Auth0's token management with LangGraph's state machine orchestration creates a natural architecture for secure agentic workflows. Tokens flow through pipeline state. Validation happens at multiple checkpoints. Failures route to audit. This isn't hackathon scaffolding — it's how we're building our real platform.

**Agentic AI needs trust infrastructure, not just auth infrastructure.** Authentication tells you *who* someone is. Authorization tells you *what* they can do. But trust infrastructure tells the client *what happened* — and gives them the power to stop it at any moment. That's the gap Signal Vault fills.

**Granular approval changes the conversation.** When we showed the per-change approval UI to test users, the reaction wasn't "oh that's nice" — it was "I would actually use this." Binary approve/reject treats clients as rubber stamps. Individual change review treats them as decision-makers. That distinction matters for adoption.

## What's next

Signal Vault is the credential layer for Signal & Structure AI's production platform. Post-hackathon:

- **Read-only vs. read-write permissions:** Let clients choose their access level per connection — read-only audits vs. write access for changes. Granular scope control at the connection level, not just the platform level.
- **Client notification system:** Toggle-based alerts when an agent accesses their account. Clients choose what they want to know: every access, only write operations, or just daily summaries.
- **Multi-connection support:** WordPress, LinkedIn, Google Analytics, and Search Console — each through Token Vault with the same 7-step pipeline
- **Exportable trust reports:** Download audit trails as PDF or CSV for compliance teams. Trust Reports enable GDPR Article 15 (Right of Access) compliance — clients can prove exactly what data was accessed and what actions were taken.
- **Rate-of-change limits:** Block agents from making more than N changes per hour. Configurable per client, per connection.
- **Client portal integration:** Signal Vault embeds into our client-facing portal where businesses manage their AI-powered marketing services
- **Production Google API access:** Apply for GBP API quota to enable live business profile updates at scale

---

## BONUS BLOG POST

### Building Trust Infrastructure for AI Agents: What Auth0 Taught Me About Settings Within Settings

When I started building Signal Vault, I thought the hardest part would be the AI pipeline. Seven verification steps, real-time token validation, mid-session revocation detection — that's the kind of engineering challenge you expect at a hackathon.

I was wrong. The hardest part was Auth0's dashboard.

That's not a criticism — it's the most important thing I learned. Auth0's platform has a depth of configurability that I haven't seen in any other authentication service. And that depth is exactly what makes it possible to build something like Signal Vault.

Here's what I mean. To get Token Vault working with a Google social connection, I needed to configure settings at four different layers: the Google connection itself (Purpose, Offline Access), the Auth0 application (Token Vault grant type, MRRT settings), the tenant-level API (My Account API activation), and Google Cloud Console (custom OAuth credentials, redirect URIs, test users). Each layer has its own configuration panel with its own options that interact with the others.

I spent hours discovering that Refresh Token Rotation — a security best practice in nearly every other context — must be disabled for Token Vault to function. That's a setting within the application settings that affects a feature configured at the connection level, which depends on a grant type that's toggled in yet another panel. Settings within settings within settings.

But here's the realization that changed my perspective: that complexity is the point. Every one of those configuration layers represents a decision point where you can fine-tune your security model. Want offline access for one connection but not another? You can do that. Want Token Vault on one application but standard OAuth on another? Done. Want to scope refresh tokens to specific APIs? That's a toggle.

The result is that you can build security models that are precisely tailored to your use case. For Signal Vault, that meant: scoped Google tokens, managed by Auth0, accessible only through authenticated sessions, validated at multiple pipeline checkpoints, and revocable at any moment. No other platform I evaluated could offer that level of control.

**One pattern worth sharing** — here's how the `permission_validate` checkpoint catches a revoked token mid-pipeline:

```typescript
// permission-validate node — runs AFTER human approval, BEFORE execution
const token = state.vaultToken;
if (!token || !token.accessToken) {
  // Token Vault returned nothing — client revoked access
  return {
    currentStep: "audit",
    permissionValidate: {
      passed: false,
      details: "Token revoked. Client disconnected during pipeline.",
      timestamp: new Date().toISOString(),
    },
  };
}
// Token exists — verify it hasn't expired since pre-check
if (token.expiresAt * 1000 < Date.now()) {
  return { currentStep: "audit", permissionValidate: { passed: false, ... } };
}
// All clear — proceed to execution with only approved changes
```

This is the checkpoint that makes mid-session revocation work. The token was valid at pre-check. The client approved changes. But between approval and execution, they disconnected. This node catches that. The pipeline routes to audit. Zero changes applied.

Auth0 isn't simple. But for agentic AI — where tokens are being used by autonomous systems to act on behalf of real people — simple isn't what you want. You want depth. You want layers. You want settings within settings, because each one of those settings is a security boundary you can enforce.

That's what I built Signal Vault on. And that's what I'd tell any developer building agentic AI to look at first.

---

## BUILT WITH

```
Next.js, React, TypeScript, TailwindCSS, Auth0, Auth0 Token Vault, LangGraph, LangChain, Supabase, PostgreSQL, OpenAI, Google Business Profile API, Google OAuth 2.0, Node.js
```

---

## TRY IT OUT LINKS

| Link | URL |
|------|-----|
| GitHub Repo | https://github.com/TKHatton/signal-vault |
| Live Demo | https://signal-vault.netlify.app |

---

## PROJECT MEDIA

### Video Demo
```
<INSERT YOUTUBE/VIMEO URL AFTER RECORDING>
```

### Images
1. Hero thumbnail (Signal Vault branding)
2. Architecture diagram (7-step pipeline)
3. Screenshots (Vault page, Agent Workspace with approval UI, Activity Log, Trust Report)

---

## ADDITIONAL INFO (JUDGES ONLY)

### Auth0 Tenant Name
```
<YOUR-TENANT>.auth0.com
```

### Public Code Repository
```
https://github.com/TKHatton/signal-vault
```

### Project Status
**New** — built entirely during the hackathon period.

### Published Project Link
```
https://signal-vault.netlify.app
```

### Startup Affiliation
**Yes** — Signal & Structure AI (signalstructure.ai). Signal Vault is being built into our production platform for managing client account access.

### Testing Instructions

```
Prerequisites:
  - Node.js 18+
  - npm

Setup:
  1. Clone the repo: git clone https://github.com/TKHatton/signal-vault.git
  2. Install dependencies: npm install
  3. Copy .env.example to .env.local and fill in:
     - Auth0 credentials (Regular Web Application)
     - Supabase project URL and keys
     - OpenAI API key
  4. Run: npm run dev
  5. Open http://localhost:3000

To test the full flow:
  1. Click "Login" — authenticates via Auth0 Universal Login
  2. Go to "Connected Accounts" — click "Connect Google"
  3. Authorize on Google consent screen
  4. Go to "Agent Workspace" — click "Try Demo: Client Reviews Changes"
  5. Review each proposed change — approve some, reject others, add a comment
  6. Watch the pipeline resume and execute only approved changes
  7. Check "Activity Log" for timestamped events
  8. Check "Trust Reports" for the generated audit report

To test mid-session revocation:
  1. Click "Try Demo: Mid-Session Revocation" in Agent Workspace
  2. Observe the pipeline halt at Permission Validation — execution blocked, revocation logged

To test the standalone approval page:
  1. Click "Review Changes" in the sidebar
  2. Review proposed changes, toggle approvals, add comments
  3. Submit your review

Notes:
  - Google Business Profile API may return 429 (quota restriction).
    This is a Google API access issue, not an auth issue — the token
    is valid and accepted by Google.
  - Demo buttons allow judges to experience all features without
    needing Auth0 or Google OAuth configuration.
  - The app requires Auth0 Token Vault configuration for real flows.
    See SESSION_LOG.md for exact Auth0 Dashboard settings.
```

### Bonus Prize Blog Confirmation
**Yes** — blog post included above.
