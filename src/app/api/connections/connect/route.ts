import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import {
  GOOGLE_SCOPES,
  WORDPRESS_SCOPES,
  LINKEDIN_SCOPES,
} from "@/lib/auth0-ai";
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

  const scopeMap: Record<string, string[]> = {
    "google-oauth2": GOOGLE_SCOPES,
    wordpress: WORDPRESS_SCOPES,
    linkedin: LINKEDIN_SCOPES,
  };

  const scopes = scopeMap[connectionType];
  if (!scopes) {
    return NextResponse.json(
      { error: `Unknown connection: ${connectionType}` },
      { status: 400 }
    );
  }

  try {
    return await auth0.connectAccount({
      connection: connectionType,
      scopes,
      returnTo: `/vault?connected=${connectionType}`,
    });
  } catch (error) {
    console.error("[Connect] Error initiating connection:", error);
    return NextResponse.json(
      { error: "Failed to initiate connection flow" },
      { status: 500 }
    );
  }
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
