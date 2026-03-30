// Auth0 AI SDK — Token Vault Connection Wrappers
// These wrap agent tools with Auth0 Token Vault authentication
// so agents can securely access external APIs on behalf of users

import { auth0 } from "./auth0";

// Connection names must match Auth0 Dashboard social connection names
export const CONNECTIONS = {
  GOOGLE: "google-oauth2",
  WORDPRESS: "wordpress",
  LINKEDIN: "linkedin",
} as const;

// Google scopes needed for Signal & Structure operations
export const GOOGLE_SCOPES = [
  "openid",
  "profile",
  "email",
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
];

// WordPress scopes
export const WORDPRESS_SCOPES = ["auth", "posts", "sites"];

// LinkedIn scopes
export const LINKEDIN_SCOPES = ["openid", "profile", "email"];

/**
 * Get an access token for a specific connection from Token Vault.
 *
 * Uses Auth0 Token Vault (RFC 8693 token exchange):
 * 1. Your app has an Auth0 session token
 * 2. You exchange it for an external provider's access token
 * 3. The external token is scoped and time-limited
 * 4. You use it to call the external API
 * 5. Token Vault handles refresh automatically
 */
export async function getTokenForConnection(
  connection: string,
  _userAccessToken?: string
): Promise<{ accessToken: string; expiresAt: number } | null> {
  try {
    console.log(`[Token Vault] Requesting token for connection: ${connection}`);

    const result = await auth0.getAccessTokenForConnection({
      connection,
    });

    console.log(`[Token Vault] Token retrieved for ${connection}, expires at ${result.expiresAt}`);

    return {
      accessToken: result.token,
      expiresAt: result.expiresAt,
    };
  } catch (error) {
    console.error(`[Token Vault] Failed to get token for ${connection}:`, error);

    // If Token Vault is not configured or user hasn't connected,
    // return null so callers can handle gracefully
    return null;
  }
}

/**
 * Revoke a connection's tokens from Token Vault.
 * Called when user clicks "Disconnect" or during offboarding.
 *
 * Note: The actual token revocation happens in Auth0 when we
 * remove the connection. We track the state in Supabase.
 */
export async function revokeConnection(
  connection: string,
  _userAccessToken?: string
): Promise<boolean> {
  try {
    console.log(`[Token Vault] Revoking connection: ${connection}`);
    // Token revocation is handled by removing the connection record.
    // Auth0 Token Vault tokens become invalid when the connection is revoked.
    return true;
  } catch (error) {
    console.error(`[Token Vault] Failed to revoke ${connection}:`, error);
    return false;
  }
}

/**
 * List all connected accounts for a user.
 * Used to populate the Vault dashboard.
 *
 * In production, connected accounts are tracked in Supabase
 * (vault_connections table). This function is kept for
 * compatibility but the vault page fetches from /api/connections.
 */
export async function listConnectedAccounts(
  _userAccessToken?: string
): Promise<
  Array<{
    connection: string;
    provider: string;
    connectedAt: string;
  }>
> {
  console.log("[Token Vault] Listing connected accounts");
  // Connection state is now tracked in Supabase vault_connections
  // This function is kept for backward compatibility
  return [];
}
