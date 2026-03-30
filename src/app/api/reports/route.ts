import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getTrustReports } from "@/lib/supabase/queries";

/**
 * GET /api/reports
 *
 * Returns all trust reports for the current user from Supabase.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await getTrustReports(user.tenantId, user.userId);

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("[API /reports] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
