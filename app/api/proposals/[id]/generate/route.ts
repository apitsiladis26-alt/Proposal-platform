import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateProposalSections } from "@/lib/anthropic";

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

  let aiContent;
  try {
    aiContent = await generateProposalSections({
      companyName: profile?.company_name ?? "",
      clientName: proposal.client_name,
      clientCompany: proposal.client_company ?? undefined,
      brief,
    });
  } catch (err) {
    console.error("Claude regeneration failed:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
  }

  const { data: updated, error } = await admin
    .from("proposals")
    .update({ brief, ai_content: aiContent, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: "Failed to save regenerated content" }, { status: 500 });
  }

  return NextResponse.json({ proposal: updated });
}
