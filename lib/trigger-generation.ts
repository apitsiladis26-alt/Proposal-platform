import "server-only";
import { generateProposalSections } from "@/lib/anthropic";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Kicks off proposal generation without blocking the response. On Netlify,
 * hands off to the background function (real async — survives past the
 * request/response cycle). In local dev there's no Netlify Functions
 * runtime, so it runs inline against the long-lived `next dev` process
 * instead, which has no request timeout to worry about.
 */
export function triggerGeneration(params: {
  requestUrl: string;
  proposalId: string;
  companyName: string;
  clientName: string;
  clientCompany?: string;
  brief: string;
}) {
  if (process.env.NETLIFY) {
    const target = new URL("/.netlify/functions/generate-proposal-background", params.requestUrl);
    fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId: params.proposalId }),
    }).catch((err) => console.error("Failed to trigger background generation:", err));
    return;
  }

  const admin = createAdminClient();
  generateProposalSections({
    companyName: params.companyName,
    clientName: params.clientName,
    clientCompany: params.clientCompany,
    brief: params.brief,
  })
    .then((aiContent) =>
      admin
        .from("proposals")
        .update({
          ai_content: aiContent,
          generation_status: "ready",
          generation_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.proposalId),
    )
    .catch((err) => {
      console.error("Local proposal generation failed:", err);
      return admin
        .from("proposals")
        .update({
          generation_status: "failed",
          generation_error: err instanceof Error ? err.message : "Unknown error",
        })
        .eq("id", params.proposalId);
    });
}
