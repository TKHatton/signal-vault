import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  getConnections,
  deleteConnectionByType,
  createAuditEntry,
} from "@/lib/supabase/queries";
import { AVAILABLE_SERVICES } from "@/lib/connections";

/**
 * GET /api/connections
 *
 * Lists all connected accounts for the current user.
 * Merges Supabase connection state with available service definitions.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connections = await getConnections(user.tenantId, user.userId);

    // Merge with available services to show all services (connected or not)
    const merged = AVAILABLE_SERVICES.map((service) => {
      const conn = connections.find(
        (c) => c.connection === service.connection
      );
      return {
        connection: service.connection,
        displayName: service.displayName,
        description: service.description,
        status: conn?.status || "not_connected",
        connectedAt: conn?.connected_at || null,
        lastUsedAt: conn?.last_used_at || null,
        scopes: conn?.scopes || [],
        id: conn?.id || null,
      };
    });

    return NextResponse.json({ connections: merged });
  } catch (error) {
    console.error("[API /connections] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/connections
 *
 * Disconnects ALL connections (offboarding).
 */
export async function DELETE() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connections = await getConnections(user.tenantId, user.userId);

    for (const conn of connections) {
      await deleteConnectionByType(user.userId, conn.connection);
      await createAuditEntry({
        tenant_id: user.tenantId,
        user_auth0_id: user.userId,
        connection: conn.connection,
        action: "connection_revoked",
        details: { reason: "bulk_offboarding" },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Revoked ${connections.length} connections`,
    });
  } catch (error) {
    console.error("[API /connections DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to revoke connections" },
      { status: 500 }
    );
  }
}
