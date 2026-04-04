# Signal Vault — 3-Minute Demo Script (v3)

**Hackathon:** Authorized to Act: Auth0 for AI Agents
**Product:** Signal Vault by Signal & Structure AI
**Core Message:** "Every other entry shows you can use Token Vault. Ours shows you can use it responsibly."

---

## 0:00–0:15 — The Problem (Talking Head or Voiceover)

> "When an AI agency needs access to a client's Google Business Profile, the industry standard is asking for a password in an email. That's insecure, unauditable, and irrevocable. Signal Vault fixes this with Auth0 Token Vault."

---

## 0:15–0:40 — One-Click Connect (Screen Recording)

**Show:** Signal Vault landing page → Click Login → Auth0 Universal Login

> "The client logs in — Auth0 handles authentication. No separate account."

**Show:** Vault page → Click "Connect Google"

> "One click. No passwords, no API keys. Auth0 Token Vault handles the OAuth flow — the token is encrypted, auto-refreshing, and never visible to anyone."

**Show:** Google consent screen → Allow → Vault shows "CONNECTED"

> "Done. Their Google Business Profile is now accessible to our agents — securely, through Token Vault."

---

## 0:40–1:30 — The 7-Step Pipeline with Client Approval (Screen Recording — The Centerpiece)

**Show:** Click "Agent Workspace" → Click "Try Demo: Client Reviews Changes"

> "Here's where Signal Vault is different. Every action goes through a 7-step verification pipeline. Watch the right side — every step lights up in real time."

**Show:** Pre-Check passes → Content Generation runs

> "Step 1 validates the token. Step 2 — AI generates proposed changes using our methodology."

**Show:** Pipeline pauses at Human Approval — inline review card appears in chat

> "Now here's the key. The pipeline stops. The client sees exactly what the agent wants to change — each change individually, with the current value and the proposed value. Nothing happens without explicit consent."

**Show:** Client approves 2 changes, rejects 1 (Business Hours), adds comment: "Don't change my hours"

> "The client approves two changes, rejects one, and leaves a note: 'Don't change my hours.' The agent respects this — only approved changes move forward."

**Show:** Click Submit Review → Pipeline resumes → Permission Validation → Execution → Post-Check → Audit

> "Step 4 re-validates the token before execution — because access could be revoked between approval and execution. Then only the 2 approved changes are applied. Post-check verifies. Audit generates a trust report."

---

## 1:30–1:50 — The Audit Trail (Screen Recording)

**Show:** Click "Activity Log" → Show events with timestamps

> "Every action is logged. The client sees exactly when their account was accessed, what was done, and by which agent."

**Show:** Click "Trust Reports" → Open a report

> "Each pipeline run generates a trust report. Zero scope violations. Zero data leaks. This is auditable AI."

---

## 1:50–2:30 — Mid-Session Revocation (Screen Recording — The Money Shot)

> "But here's the real test. What happens when a client revokes access while the agent is working?"

**Show:** Go to Agent Workspace → Click "Try Demo: Mid-Session Revocation"

> "Watch: the pipeline runs, the client approves changes..."

**Show:** Pipeline reaches Permission Validation → RED — "TOKEN REVOKED"

> "The client revoked access. The agent stopped immediately. No changes were applied. The revocation is logged. This is how agentic AI should handle credentials."

---

## 2:30–3:00 — The Pitch (Talking Head or Voiceover)

> "Signal Vault isn't a demo. It's the credential layer we're building into our real platform at Signal & Structure AI. We manage Google Business Profiles, WordPress sites, and analytics for local businesses."

> "With Auth0 Token Vault, clients never share a password. They click Allow. Our agents do the work. They review every change. They revoke anytime — and the agent stops cold."

> "What's next? Granular read-only versus read-write permissions per connection. Client notification toggles — so they get alerted when an agent accesses their account. Exportable trust reports for compliance audits. And multi-platform support — WordPress, LinkedIn, Analytics — all through Token Vault."

**Show:** Signal Vault dashboard

> "Signal Vault. Built on Auth0 Token Vault. Because 'Authorized to Act' means the client is always in control."

---

## Recording Tips

- **Screen resolution:** 1920x1080 or 1280x720
- **Browser:** Clean Chrome profile, no extensions visible
- **Pre-load:** Have Signal Vault open, logged in, Google connected
- **Key moment:** The Client Reviews Changes demo — practice approving 2, rejecting 1 with a comment
- **Voiceover:** Record separately and overlay, or use a screen recorder with mic
- **Tools:** OBS Studio (free), Loom, or QuickTime (Mac)
