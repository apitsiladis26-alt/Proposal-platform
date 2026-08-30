import { generateProposalSections } from "../../lib/anthropic";
import { createAdminClient } from "../../lib/supabase/admin";

// Runs Claude generation outside the request/response cycle — a full
// structured proposal with adaptive thinking routinely takes longer than
// Netlify's ~30s synchronous function limit. `background: true` below makes
// Netlify return a 202 to the caller immediately and keep this running (up
// to 15 min) rather than waiting for it to finish.
export default async (req: Request) => {
  const { proposalId } = (await req.json()) as { proposalId: string };
  const admin = createAdminClient();

  const { data: proposal } = await admin
    .from("proposals")
    .select("id, brief, client_name, client_company")
    .eq("id", proposalId)
    .maybeSingle();

  if (!proposal) {
    return new Response("Proposal not found", { status: 404 });
  }

  const { data: profile } = await admin
    .from("sender_profile")
    .select("company_name")
    .limit(1)
    .maybeSingle();

  try {
    const aiContent = await generateProposalSections({
      companyName: profile?.company_name ?? "",
      clientName: proposal.client_name,
      clientCompany: proposal.client_company ?? undefined,
      brief: proposal.brief,
    });

    await admin
      .from("proposals")
      .update({
        ai_content: aiContent,
        generation_status: "ready",
        generation_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);
  } catch (err) {
    console.error("Background proposal generation failed:", err);
    await admin
      .from("proposals")
      .update({
        generation_status: "failed",
        generation_error: err instanceof Error ? err.message : "Unknown error",
      })
      .eq("id", proposalId);
  }

  return new Response("done");
};

export const config = {
  background: true,
};
