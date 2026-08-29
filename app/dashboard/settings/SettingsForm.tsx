"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SenderProfile, TeamMember, Testimonial } from "@/lib/proposal-schema";

const supabase = createClient();

async function uploadAsset(file: File): Promise<string> {
  const path = `${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("proposal-assets").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("proposal-assets").getPublicUrl(path);
  return data.publicUrl;
}

export function SettingsForm({
  senderProfile,
  initialTeamMembers,
  initialTestimonials,
}: {
  senderProfile: SenderProfile | null;
  initialTeamMembers: TeamMember[];
  initialTestimonials: Testimonial[];
}) {
  return (
    <div className="space-y-8">
      <CompanyProfileCard senderProfile={senderProfile} />
      <TeamMembersCard initial={initialTeamMembers} />
      <TestimonialsCard initial={initialTestimonials} />
    </div>
  );
}

function CompanyProfileCard({ senderProfile }: { senderProfile: SenderProfile | null }) {
  const [companyName, setCompanyName] = useState(senderProfile?.company_name ?? "");
  const [bio, setBio] = useState(senderProfile?.bio ?? "");
  const [logoUrl, setLogoUrl] = useState(senderProfile?.logo_url ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function save() {
    setSaving(true);
    const payload = { company_name: companyName, bio, logo_url: logoUrl || null };
    if (senderProfile?.id) {
      await supabase.from("sender_profile").update(payload).eq("id", senderProfile.id);
    } else {
      await supabase.from("sender_profile").insert(payload);
    }
    setSaving(false);
    setSavedAt(Date.now());
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUrl(await uploadAsset(file));
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-neutral-900">Company profile</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Company name</label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent-soft"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent-soft"
          />
        </div>
        <div className="flex items-center gap-4">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded-xl object-cover" />
          )}
          <input type="file" accept="image/*" onChange={handleLogoChange} className="text-sm" />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {savedAt && <span className="text-sm text-neutral-400">Saved</span>}
        </div>
      </div>
    </div>
  );
}

function TeamMembersCard({ initial }: { initial: TeamMember[] }) {
  const [members, setMembers] = useState(initial);

  async function addMember() {
    const { data } = await supabase
      .from("team_members")
      .insert({ name: "New team member", sort_order: members.length })
      .select()
      .single();
    if (data) setMembers((m) => [...m, data]);
  }

  async function updateMember(id: string, patch: Partial<TeamMember>) {
    setMembers((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    await supabase.from("team_members").update(patch).eq("id", id);
  }

  async function removeMember(id: string) {
    setMembers((m) => m.filter((x) => x.id !== id));
    await supabase.from("team_members").delete().eq("id", id);
  }

  async function handlePhotoChange(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadAsset(file);
    await updateMember(id, { photo_url: url });
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">Team members</h2>
        <button
          onClick={addMember}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          + Add
        </button>
      </div>
      <div className="space-y-4">
        {members.map((member) => (
          <div key={member.id} className="flex gap-4 rounded-xl border border-neutral-100 p-4">
            {member.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.photo_url} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xs text-neutral-400">
                Photo
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={member.name}
                  onChange={(e) => updateMember(member.id, { name: e.target.value })}
                  placeholder="Name"
                  className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 outline-none focus:border-accent"
                />
                <input
                  value={member.position ?? ""}
                  onChange={(e) => updateMember(member.id, { position: e.target.value })}
                  placeholder="Position"
                  className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 outline-none focus:border-accent"
                />
              </div>
              <textarea
                value={member.bio ?? ""}
                onChange={(e) => updateMember(member.id, { bio: e.target.value })}
                placeholder="Short bio"
                rows={2}
                className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm outline-none focus:border-accent"
              />
              <div className="flex items-center justify-between">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoChange(member.id, e)}
                  className="text-xs"
                />
                <button
                  onClick={() => removeMember(member.id)}
                  className="text-xs font-medium text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialsCard({ initial }: { initial: Testimonial[] }) {
  const [testimonials, setTestimonials] = useState(initial);

  async function addTestimonial() {
    const { data } = await supabase
      .from("testimonials")
      .insert({ client_name: "New client", quote: "", sort_order: testimonials.length })
      .select()
      .single();
    if (data) setTestimonials((t) => [...t, data]);
  }

  async function updateTestimonial(id: string, patch: Partial<Testimonial>) {
    setTestimonials((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    await supabase.from("testimonials").update(patch).eq("id", id);
  }

  async function removeTestimonial(id: string) {
    setTestimonials((t) => t.filter((x) => x.id !== id));
    await supabase.from("testimonials").delete().eq("id", id);
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">Client testimonials</h2>
        <button
          onClick={addTestimonial}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          + Add
        </button>
      </div>
      <div className="space-y-4">
        {testimonials.map((t) => (
          <div key={t.id} className="space-y-2 rounded-xl border border-neutral-100 p-4">
            <div className="grid grid-cols-3 gap-2">
              <input
                value={t.client_name}
                onChange={(e) => updateTestimonial(t.id, { client_name: e.target.value })}
                placeholder="Client name"
                className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 outline-none focus:border-accent"
              />
              <input
                value={t.client_role ?? ""}
                onChange={(e) => updateTestimonial(t.id, { client_role: e.target.value })}
                placeholder="Role"
                className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 outline-none focus:border-accent"
              />
              <input
                value={t.client_company ?? ""}
                onChange={(e) => updateTestimonial(t.id, { client_company: e.target.value })}
                placeholder="Company"
                className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 outline-none focus:border-accent"
              />
            </div>
            <textarea
              value={t.quote}
              onChange={(e) => updateTestimonial(t.id, { quote: e.target.value })}
              placeholder="Quote"
              rows={2}
              className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={() => removeTestimonial(t.id)}
              className="text-xs font-medium text-red-500 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
