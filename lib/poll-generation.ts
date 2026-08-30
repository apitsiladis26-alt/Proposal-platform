import type { Proposal } from "@/lib/proposal-schema";

/**
 * Generation runs in the background (see lib/trigger-generation.ts) and
 * finishes well outside the request that kicked it off, so callers poll
 * this proposal's row until generation_status leaves "pending".
 */
export async function pollUntilGenerated(proposalId: string): Promise<Proposal> {
  while (true) {
    const res = await fetch(`/api/proposals/${proposalId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to check generation status");

    const proposal = data.proposal as Proposal;
    if (proposal.generation_status !== "pending") return proposal;

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}
