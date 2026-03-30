import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { deleteConnection, createAuditEntry } from "@/lib/supabase/queries";

/**
 * DELETE /api/connections/[id]
 *
 * Disconnects a specific connection by its Supabase row ID.
 * Sets status to 'revoked' and logs an audit entry.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: connectionId } = await params;

    await deleteConnection(connectionId);

    await createAuditEntry({
      tenant_id: user.tenantId,
      user_auth0_id: user.userId,
      connection: connectionId,
      action: "connection_revoked",
      details: { connectionId },
    });

    return NextResponse.json({
      success: true,
      message: `Connection ${connectionId} revoked`,
    });
  } catch (error) {
    console.error("[API /connections/[id] DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to revoke connection" },
      { status: 500 }
    );
  }
}
