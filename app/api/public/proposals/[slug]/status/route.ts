import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: proposal } = await admin
    .from("proposals")
    .select("status")
    .eq("slug", slug)
    .maybeSingle();

  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ status: proposal.status });
}
