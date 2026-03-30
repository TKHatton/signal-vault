import { NextRequest, NextResponse } from "next/server";
import { getTrustReport } from "@/lib/supabase/queries";

/**
 * GET /api/reports/[id]
 *
 * Returns a single trust report by ID from Supabase.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await getTrustReport(id);

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("[API /reports/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}
