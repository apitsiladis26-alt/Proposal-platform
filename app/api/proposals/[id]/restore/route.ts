import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: proposal } = await admin
    .from("proposals")
    .select("published_at")
    .eq("id", id)
    .maybeSingle();

  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: updated, error } = await admin
    .from("proposals")
    .update({
      status: proposal.published_at ? "published" : "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: "Failed to restore" }, { status: 500 });
  }

  return NextResponse.json({ proposal: updated });
}
