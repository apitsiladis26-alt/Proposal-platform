import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { triggerGeneration } from "@/lib/trigger-generation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const admin = createAdminClient();

  const { data: proposal } = await admin
    .from("proposals")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const brief = typeof body.brief === "string" && body.brief.trim() ? body.brief : proposal.brief;

  const { data: profile } = await admin
    .from("sender_profile")
    .select("company_name")
    .limit(1)
    .maybeSingle();

  const { data: updated, error } = await admin
    .from("proposals")
    .update({ brief, generation_status: "pending", generation_error: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: "Failed to start regeneration" }, { status: 500 });
  }

  await triggerGeneration({
    requestUrl: request.url,
    proposalId: id,
    companyName: profile?.company_name ?? "",
    clientName: proposal.client_name,
    clientCompany: proposal.client_company ?? undefined,
    brief,
  });

  return NextResponse.json({ proposal: updated });
}
