# Signal Vault — 3-Minute Demo Script

**Hackathon:** Authorized to Act: Auth0 for AI Agents
**Product:** Signal Vault by Signal & Structure AI
**Core Message:** "Every other entry shows you can use Token Vault. Ours shows you can use it responsibly."

---

## 0:00–0:20 — The Problem (Talking Head or Voiceover)

> "Right now, when an AI agency needs access to a client's Google Business Profile or WordPress site, they ask for a password in an email. That's insecure, unauditable, and irrevocable. Signal Vault fixes this with Auth0 Token Vault."

---

## 0:20–0:50 — One-Click Connect (Screen Recording)

**Show:** Signal Vault landing page → Click Login → Auth0 Universal Login

> "The client logs into Signal Vault. No separate account to create — Auth0 handles authentication."

**Show:** Vault page with three connection cards → Click "Connect Google"

> "One click. That's it. No passwords, no API keys, no client credentials shared over email. Auth0 Token Vault handles the entire OAuth flow — the token is encrypted, auto-refreshing, and the client never sees it."

**Show:** Google consent screen → Click Allow → Redirected back to Vault showing "CONNECTED"

> "The client clicked Allow. Their Google Business Profile is now accessible to our AI agents — securely, through Token Vault."

---

## 0:50–1:30 — The 7-Step Verification Pipeline (Screen Recording)

**Show:** Click "Agent Workspace" in sidebar

> "Here's where Signal Vault is different from every other Token Vault integration. We don't just get a token and fire. Every action goes through a 7-step verification pipeline."

**Show:** Type "Audit my Google Business Profile and suggest improvements" → Submit

> "Watch the right side — every step lights up in real time."

**Show:** Pipeline running — Pre-Check (green) → Content Generation (green) → Human Approval (green)

> "Step 1: Pre-check validates the token is fresh and scoped correctly. Step 2: AI generates proposed changes using our methodology. Step 3: The client sees exactly what will change and approves it. Nothing happens without explicit consent."

**Show:** Permission Validation (green) → Execution → Audit (green)

> "Step 4: We re-validate the token right before execution — because a client could revoke access between approval and execution. Step 5: The agent executes using the Token Vault token. Step 6 and 7: Post-check and audit. A full trust report is generated and saved."

---

## 1:30–2:00 — The Audit Trail (Screen Recording)

**Show:** Click "Activity Log" → Show Connected/Disconnected events with timestamps

> "Every action is logged. The client sees exactly when their account was accessed, what was done, and by which agent. Full transparency."

**Show:** Click "Trust Reports" → Open a report

> "Each pipeline run generates a trust report. Zero scope violations. Zero data leaks. Zero unauthorized access. This is auditable AI."

---

## 2:00–2:30 — Mid-Session Revocation (Screen Recording — The Money Shot)

> "But here's the real test. What happens when a client revokes access while the agent is working?"

**Show:** Go to Agent Workspace → Submit a new task → While pipeline runs, quickly switch to Connected Accounts → Click "Disconnect"

> "The client just revoked access mid-session."

**Show:** Pipeline shows Execution step as RED — "Token Vault returned no token. The client may have revoked access. No changes were made."

> "The agent stopped immediately. No changes were applied. The revocation was logged. This is how agentic AI should handle credentials — the client is always in control."

---

## 2:30–3:00 — The Pitch (Talking Head or Voiceover)

> "Signal Vault isn't a demo. It's the credential layer we're building into our real platform at Signal & Structure AI. We manage Google Business Profiles, WordPress sites, and analytics for local businesses. Every one of those requires access to client accounts."

> "With Auth0 Token Vault, our clients never share a password again. They click Allow. Our AI agents do the work. They see every action. They revoke anytime — and the agent stops cold. That's what 'Authorized to Act' means."

**Show:** Signal Vault dashboard one final time

> "Signal Vault. Secure credential management for AI agents. Built on Auth0 Token Vault."

---

## Recording Tips

- **Screen resolution:** 1920x1080 or 1280x720
- **Browser:** Clean Chrome profile, no extensions visible
- **Pre-load:** Have Signal Vault open, logged in, Google connected
- **Practice the disconnect timing:** You have ~10 seconds while the pipeline runs to switch tabs and click Disconnect
- **Voiceover:** Record separately and overlay, or use a screen recorder with mic
- **Tools:** OBS Studio (free), Loom, or QuickTime (Mac)
