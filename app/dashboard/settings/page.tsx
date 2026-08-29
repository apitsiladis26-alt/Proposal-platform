import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";
import type { SenderProfile, TeamMember, Testimonial } from "@/lib/proposal-schema";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [{ data: senderProfile }, { data: teamMembers }, { data: testimonials }] =
    await Promise.all([
      supabase.from("sender_profile").select().limit(1).maybeSingle<SenderProfile>(),
      supabase.from("team_members").select().order("sort_order").returns<TeamMember[]>(),
      supabase.from("testimonials").select().order("sort_order").returns<Testimonial[]>(),
    ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-neutral-900">Settings</h1>
      <p className="mb-8 text-sm text-neutral-500">
        This content is reused on every proposal — team bios and testimonials are set once here,
        not regenerated per proposal.
      </p>
      <SettingsForm
        senderProfile={senderProfile}
        initialTeamMembers={teamMembers ?? []}
        initialTestimonials={testimonials ?? []}
      />
    </div>
  );
}
