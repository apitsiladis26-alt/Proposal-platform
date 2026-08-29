import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProposalDocument } from "@/components/proposal/ProposalDocument";
import { SignAndPay } from "@/components/proposal/SignAndPay";
import type { Proposal, SenderProfile, TeamMember, Testimonial } from "@/lib/proposal-schema";

export const dynamic = "force-dynamic";

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: proposal } = await admin
    .from("proposals")
    .select()
    .eq("slug", slug)
    .maybeSingle<Proposal>();

  if (!proposal || !proposal.ai_content) {
    notFound();
  }

  // First public view — flip published -> viewed. "draft" only lingers on
  // proposals created before publish was removed as a manual step; every
  // new proposal is live immediately. Never regresses a later status.
  if (proposal.status === "draft" || proposal.status === "published") {
    await admin
      .from("proposals")
      .update({ status: "viewed", updated_at: new Date().toISOString() })
      .eq("id", proposal.id);
    proposal.status = "viewed";
  }

  const [{ data: senderProfile }, { data: teamMembers }, { data: testimonials }] =
    await Promise.all([
      admin.from("sender_profile").select().limit(1).maybeSingle<SenderProfile>(),
      admin
        .from("team_members")
        .select()
        .order("sort_order")
        .returns<TeamMember[]>(),
      admin
        .from("testimonials")
        .select()
        .order("sort_order")
        .returns<Testimonial[]>(),
    ]);

  return (
    <ProposalDocument
      companyName={senderProfile?.company_name ?? ""}
      logoUrl={senderProfile?.logo_url}
      clientName={proposal.client_name}
      clientCompany={proposal.client_company}
      content={proposal.ai_content}
      teamMembers={teamMembers ?? []}
      testimonials={testimonials ?? []}
      price={proposal.price}
      currency={proposal.currency}
      agreementSlot={
        <SignAndPay
          slug={slug}
          initialStatus={proposal.status}
          price={proposal.price}
          currency={proposal.currency}
        />
      }
    />
  );
}
