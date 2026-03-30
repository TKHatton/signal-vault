import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { upsertConnection, createAuditEntry } from "@/lib/supabase/queries";
import { AVAILABLE_SERVICES } from "@/lib/connections";
import type { ConnectionType } from "@/lib/types";

/**
 * POST /api/connections/connect
 *
 * Records a new connection in Supabase after OAuth flow completes.
 * The actual OAuth redirect is handled by Auth0 middleware —
 * this endpoint saves the connection state.
 *
 * Body: { connection: "google-oauth2" | "wordpress" | "linkedin" }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const connectionType = body.connection as ConnectionType;

    if (!connectionType) {
      return NextResponse.json(
        { error: "connection is required" },
        { status: 400 }
      );
    }

    // Find the service definition
    const service = AVAILABLE_SERVICES.find(
      (s) => s.connection === connectionType
    );
    if (!service) {
      return NextResponse.json(
        { error: `Unknown connection type: ${connectionType}` },
        { status: 400 }
      );
    }

    // Collect all scopes from all sub-services
    const allScopes = service.services.flatMap((s) =>
      s.scopes.map((scope) => ({ ...scope, granted: true }))
    );

    // Upsert the connection in Supabase
    const conn = await upsertConnection({
      tenant_id: user.tenantId,
      user_auth0_id: user.userId,
      connection: connectionType,
      display_name: service.displayName,
      description: service.description,
      scopes: allScopes,
      status: "active",
    });

    // Log the connection event
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
    console.error("[API /connections/connect] Error:", error);
    return NextResponse.json(
      { error: "Failed to create connection" },
      { status: 500 }
    );
  }
}
