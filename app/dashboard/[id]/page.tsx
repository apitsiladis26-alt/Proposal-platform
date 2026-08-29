import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProposalEditor } from "./ProposalEditor";
import type { Proposal, SenderProfile, TeamMember, Testimonial } from "@/lib/proposal-schema";

export default async function ProposalEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: proposal }, { data: senderProfile }, { data: teamMembers }, { data: testimonials }] =
    await Promise.all([
      supabase.from("proposals").select().eq("id", id).maybeSingle<Proposal>(),
      supabase.from("sender_profile").select().limit(1).maybeSingle<SenderProfile>(),
      supabase.from("team_members").select().order("sort_order").returns<TeamMember[]>(),
      supabase.from("testimonials").select().order("sort_order").returns<Testimonial[]>(),
    ]);

  if (!proposal) {
    notFound();
  }

  return (
    <div>
      <Link href="/dashboard" className="mb-4 inline-block text-sm text-neutral-500 hover:text-neutral-700">
        ← Back to proposals
      </Link>
      <ProposalEditor
        proposal={proposal}
        senderProfile={senderProfile}
        teamMembers={teamMembers ?? []}
        testimonials={testimonials ?? []}
      />
    </div>
  );
}
