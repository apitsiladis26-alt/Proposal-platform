import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: proposal } = await admin
    .from("proposals")
    .select("id, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Never regress status — only published -> viewed.
  if (proposal.status === "published") {
    await admin
      .from("proposals")
      .update({ status: "viewed", updated_at: new Date().toISOString() })
      .eq("id", proposal.id);
  }

  return NextResponse.json({ ok: true });
}
