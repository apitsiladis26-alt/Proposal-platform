"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pollUntilGenerated } from "@/lib/poll-generation";
import type {
  AiContent,
  Proposal,
  SenderProfile,
  TeamMember,
  Testimonial,
} from "@/lib/proposal-schema";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ProposalDocument } from "@/components/proposal/ProposalDocument";
import { SignAndPay } from "@/components/proposal/SignAndPay";

export function ProposalEditor({
  proposal: initialProposal,
  senderProfile,
  teamMembers,
  testimonials,
}: {
  proposal: Proposal;
  senderProfile: SenderProfile | null;
  teamMembers: TeamMember[];
  testimonials: Testimonial[];
}) {
  const router = useRouter();
  const [proposal, setProposal] = useState(initialProposal);
  const [content, setContent] = useState<AiContent>(
    initialProposal.ai_content ?? {
      greeting: "",
      valueProposition: "",
      processOverview: [],
      timingTable: [],
      scopeOfWork: "",
    },
  );
  const [brief, setBrief] = useState(initialProposal.brief);
  const [generationStatus, setGenerationStatus] = useState(initialProposal.generation_status);
  // Land on the styled preview first — that's "the proposal," not a form.
  const [view, setView] = useState<"edit" | "preview">("preview");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Defensive: normally generation finishes (or is left "failed") before the
  // create flow navigates here, but if someone lands mid-generation (refresh,
  // second tab), pick the poll back up.
  useEffect(() => {
    if (generationStatus !== "pending") return;
    let cancelled = false;
    pollUntilGenerated(initialProposal.id).then((updated) => {
      if (cancelled) return;
      setProposal(updated);
      if (updated.ai_content) setContent(updated.ai_content);
      setGenerationStatus(updated.generation_status);
    });
    return () => {
      cancelled = true;
    };
  }, [generationStatus, initialProposal.id]);

  async function copyPublicLink(path: string) {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API can be unavailable/denied — fall back to a hidden
      // textarea + the legacy copy command so the button still works.
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(textarea);
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Relative path only — deterministic on server and client, so it can't
  // cause a hydration mismatch. The absolute URL is built at click time
  // instead (always client-side, so window is safely available there).
  const publicPath = proposal.slug ? `/p/${proposal.slug}` : null;

  async function save() {
    setBusy("save");
    setError(null);
    const res = await fetch(`/api/proposals/${proposal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: proposal.client_name,
        client_company: proposal.client_company,
        client_email: proposal.client_email,
        client_phone: proposal.client_phone,
        price: proposal.price,
        ai_content: content,
      }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Failed to save");
      return;
    }
    setProposal(data.proposal);
    setSavedAt(Date.now());
  }

  async function regenerate() {
    setBusy("regenerate");
    setError(null);
    const res = await fetch(`/api/proposals/${proposal.id}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBusy(null);
      setError(data.error ?? "Regeneration failed");
      return;
    }
    setProposal(data.proposal);
    setGenerationStatus("pending");

    const updated = await pollUntilGenerated(proposal.id);
    setBusy(null);
    setProposal(updated);
    setGenerationStatus(updated.generation_status);
    if (updated.generation_status === "failed") {
      setError(updated.generation_error ?? "Regeneration failed");
      return;
    }
    if (updated.ai_content) setContent(updated.ai_content);
  }

  async function archive() {
    if (!confirm("Archive this proposal? The public link will stop accepting signatures/payment.")) return;
    setBusy("archive");
    const res = await fetch(`/api/proposals/${proposal.id}/archive`, { method: "POST" });
    const data = await res.json();
    setBusy(null);
    if (res.ok) {
      setProposal(data.proposal);
      router.refresh();
    }
  }

  async function restore() {
    setBusy("restore");
    const res = await fetch(`/api/proposals/${proposal.id}/restore`, { method: "POST" });
    const data = await res.json();
    setBusy(null);
    if (res.ok) {
      setProposal(data.proposal);
      router.refresh();
    }
  }

  function updateProcessPhase(i: number, field: "phase" | "description", value: string) {
    setContent((c) => ({
      ...c,
      processOverview: c.processOverview.map((p, idx) =>
        idx === i ? { ...p, [field]: value } : p,
      ),
    }));
  }

  function updateTimingRow(i: number, field: "phase" | "duration", value: string) {
    setContent((c) => ({
      ...c,
      timingTable: c.timingTable.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)),
    }));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {proposal.client_name}
          </h1>
          <StatusBadge status={proposal.status} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(view === "edit" ? "preview" : "edit")}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            {view === "edit" ? "Preview" : "Back to editor"}
          </button>
          {proposal.status === "archived" ? (
            <button
              onClick={restore}
              disabled={busy === "restore"}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
            >
              {busy === "restore" ? "Restoring…" : "Restore"}
            </button>
          ) : (
            <button
              onClick={archive}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50"
            >
              Archive
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {generationStatus === "pending" && (
        <p className="mb-4 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-hover">
          Claude is drafting the proposal — this page will update automatically.
        </p>
      )}
      {generationStatus === "failed" && !error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          AI generation failed{proposal.generation_error ? `: ${proposal.generation_error}` : ""}. Use
          &ldquo;Regenerate with AI&rdquo; below to try again.
        </p>
      )}

      {publicPath && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-hover">
          <span className="truncate font-medium">{publicPath}</span>
          <button
            onClick={() => copyPublicLink(publicPath)}
            className="shrink-0 rounded-lg bg-white px-3 py-1.5 font-medium shadow-sm"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      )}

      {view === "preview" ? (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">
          <ProposalDocument
            companyName={senderProfile?.company_name ?? ""}
            logoUrl={senderProfile?.logo_url}
            clientName={proposal.client_name}
            clientCompany={proposal.client_company}
            content={content}
            teamMembers={teamMembers}
            testimonials={testimonials}
            price={proposal.price}
            currency={proposal.currency}
            agreementSlot={
              proposal.slug && (
                <SignAndPay
                  slug={proposal.slug}
                  initialStatus={proposal.status}
                  price={proposal.price}
                  currency={proposal.currency}
                />
              )
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Client & price</h2>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Client name"
                value={proposal.client_name}
                onChange={(v) => setProposal((p) => ({ ...p, client_name: v }))}
              />
              <TextField
                label="Client company"
                value={proposal.client_company ?? ""}
                onChange={(v) => setProposal((p) => ({ ...p, client_company: v }))}
              />
              <TextField
                label="Client email"
                value={proposal.client_email ?? ""}
                onChange={(v) => setProposal((p) => ({ ...p, client_email: v }))}
              />
              <TextField
                label="Price (USD)"
                type="number"
                value={String(proposal.price)}
                onChange={(v) => setProposal((p) => ({ ...p, price: Number(v) || 0 }))}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Brief</h2>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent-soft"
            />
            <button
              onClick={regenerate}
              disabled={busy === "regenerate"}
              className="mt-3 rounded-xl border border-accent px-4 py-2 text-sm font-medium text-accent-hover transition hover:bg-accent-soft disabled:opacity-50"
            >
              {busy === "regenerate" ? "Regenerating…" : "Regenerate with AI"}
            </button>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Greeting</h2>
            <textarea
              value={content.greeting}
              onChange={(e) => setContent((c) => ({ ...c, greeting: e.target.value }))}
              rows={4}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent-soft"
            />
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Value proposition</h2>
            <textarea
              value={content.valueProposition}
              onChange={(e) => setContent((c) => ({ ...c, valueProposition: e.target.value }))}
              rows={5}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent-soft"
            />
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Process overview</h2>
            <div className="space-y-3">
              {content.processOverview.map((phase, i) => (
                <div key={i} className="grid grid-cols-[200px_1fr] gap-3">
                  <input
                    value={phase.phase}
                    onChange={(e) => updateProcessPhase(i, "phase", e.target.value)}
                    className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent focus:bg-white"
                  />
                  <input
                    value={phase.description}
                    onChange={(e) => updateProcessPhase(i, "description", e.target.value)}
                    className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent focus:bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Timing</h2>
            <div className="space-y-3">
              {content.timingTable.map((row, i) => (
                <div key={i} className="grid grid-cols-[200px_1fr] gap-3">
                  <input
                    value={row.phase}
                    onChange={(e) => updateTimingRow(i, "phase", e.target.value)}
                    className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent focus:bg-white"
                  />
                  <input
                    value={row.duration}
                    onChange={(e) => updateTimingRow(i, "duration", e.target.value)}
                    className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-accent focus:bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Scope of work</h2>
            <textarea
              value={content.scopeOfWork}
              onChange={(e) => setContent((c) => ({ ...c, scopeOfWork: e.target.value }))}
              rows={5}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent-soft"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-neutral-400">
              {savedAt && `Saved ${new Date(savedAt).toLocaleTimeString()}`}
            </div>
            <div className="flex gap-3">
              <button
                onClick={save}
                disabled={busy === "save"}
                className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
              >
                {busy === "save" ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent-soft"
      />
    </div>
  );
}
