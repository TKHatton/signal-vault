import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getAuditLog, createAuditEntry } from "@/lib/supabase/queries";

/**
 * GET /api/audit
 *
 * Returns the audit log for the current user from Supabase.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auditLog = await getAuditLog(user.tenantId, user.userId);

    return NextResponse.json({ auditLog });
  } catch (error) {
    console.error("[API /audit] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit log" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/audit
 *
 * Creates a new audit log entry.
 * Called internally by the agent pipeline.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const user = await getSessionUser();
    const tenantId = body.tenant_id || user?.tenantId;
    const userId = body.user_auth0_id || user?.userId;

    if (!tenantId || !userId) {
      return NextResponse.json(
        { error: "Missing tenant_id or user_auth0_id" },
        { status: 400 }
      );
    }

    const entry = await createAuditEntry({
      tenant_id: tenantId,
      user_auth0_id: userId,
      connection: body.connection,
      action: body.action,
      agent_name: body.agent_name,
      details: body.details,
      status: body.status,
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("[API /audit POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create audit entry" },
      { status: 500 }
    );
  }
}
