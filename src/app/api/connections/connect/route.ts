import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { upsertConnection, createAuditEntry } from "@/lib/supabase/queries";
import { AVAILABLE_SERVICES } from "@/lib/connections";
import type { ConnectionType } from "@/lib/types";

/**
 * GET /api/connections/connect?connection=google-oauth2
 *
 * Initiates the Auth0 Connected Accounts flow.
 * Redirects the user to Auth0 → Google/WordPress/LinkedIn OAuth.
 * After approval, token is stored in Auth0 Token Vault automatically.
 */
export async function GET(request: NextRequest) {
  const connectionType = request.nextUrl.searchParams.get("connection");

  if (!connectionType) {
    return NextResponse.json(
      { error: "connection parameter is required" },
      { status: 400 }
    );
  }

  // Validate connection type
  const validConnections = ["google-oauth2", "wordpress", "linkedin"];
  if (!validConnections.includes(connectionType)) {
    return NextResponse.json(
      { error: `Unknown connection: ${connectionType}` },
      { status: 400 }
    );
  }

  // Redirect to the SDK's built-in /auth/connect endpoint.
  // This handles the full Connected Accounts flow correctly, including
  // MRRT token exchange for Token Vault. Scopes are configured on the
  // connection in the Auth0 Dashboard, not passed in the URL.
  const connectUrl = new URL("/auth/connect", request.nextUrl.origin);
  connectUrl.searchParams.set("connection", connectionType);
  connectUrl.searchParams.set("returnTo", `/vault?connected=${connectionType}`);

  // Don't pass scopes to the URL — let Auth0 use the scopes configured
  // on the connection in the Dashboard. Custom scopes can cause 400 errors
  // if they're not pre-configured on the connection.

  console.log("[Connect] Redirecting to SDK endpoint:", connectUrl.toString());

  return NextResponse.redirect(connectUrl);
}

/**
 * POST /api/connections/connect
 *
 * Called after OAuth callback to save the connection state to Supabase.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const connectionType = body.connection as ConnectionType;

    const service = AVAILABLE_SERVICES.find(
      (s) => s.connection === connectionType
    );
    if (!service) {
      return NextResponse.json(
        { error: `Unknown connection: ${connectionType}` },
        { status: 400 }
      );
    }

    const allScopes = service.services.flatMap((s) =>
      s.scopes.map((scope) => ({ ...scope, granted: true }))
    );

    const conn = await upsertConnection({
      tenant_id: user.tenantId,
      user_auth0_id: user.userId,
      connection: connectionType,
      display_name: service.displayName,
      description: service.description,
      scopes: allScopes,
      status: "active",
    });

    await createAuditEntry({
      tenant_id: user.tenantId,
      user_auth0_id: user.userId,
      connection: connectionType,
      action: "connection_created",
      details: {
        service: service.displayName,
        scopes: allScopes.map((s) => s.id),
      },
    });

    return NextResponse.json({ success: true, connection: conn });
  } catch (error) {
    console.error("[Connect POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to save connection" },
      { status: 500 }
    );
  }
}
