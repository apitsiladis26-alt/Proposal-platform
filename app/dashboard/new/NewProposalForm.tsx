"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewProposalForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    setProgress(4);

    // Claude's response time isn't predictable, so this isn't real progress —
    // it's a smoothed ease-toward-92% so the bar keeps moving and never lies
    // by hitting 100 before the request actually completes.
    const interval = setInterval(() => {
      setProgress((p) => (p >= 92 ? p : p + (92 - p) * 0.05 + 0.3));
    }, 250);

    const formData = new FormData(e.currentTarget);
    const payload = {
      client_name: String(formData.get("client_name") ?? ""),
      client_company: String(formData.get("client_company") ?? ""),
      client_email: String(formData.get("client_email") ?? ""),
      client_phone: String(formData.get("client_phone") ?? ""),
      price: String(formData.get("price") ?? ""),
      brief: String(formData.get("brief") ?? ""),
    };

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      clearInterval(interval);

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setPending(false);
        setProgress(0);
        return;
      }

      setProgress(100);
      router.push(`/dashboard/${data.proposal.id}`);
    } catch {
      clearInterval(interval);
      setError("Network error — please try again");
      setPending(false);
      setProgress(0);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm"
    >
      <fieldset disabled={pending} className="space-y-6 disabled:opacity-60">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Client name" name="client_name" required />
          <Field label="Client company" name="client_company" />
          <Field label="Client email" name="client_email" type="email" />
          <Field label="Client phone" name="client_phone" type="tel" />
        </div>

        <Field label="Total price (USD)" name="price" type="number" required min="0" step="0.01" />

        <div>
          <label htmlFor="brief" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Project brief
          </label>
          <textarea
            id="brief"
            name="brief"
            required
            rows={5}
            placeholder="What's the project? Who's it for, what are you delivering, and why does it matter to them? A paragraph or two is plenty — Claude will draft the full proposal from this."
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent-soft"
          />
        </div>
      </fieldset>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {pending && (
        <div className="rounded-xl border border-accent/20 bg-accent-soft px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-sm font-medium text-accent-hover">
            <span>Claude is drafting your proposal…</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-accent-hover/70">
            Usually takes 15–30 seconds — you&rsquo;ll be moved to the proposal automatically when it&rsquo;s ready.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Generating…" : "Generate Draft"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent-soft"
        {...rest}
      />
    </div>
  );
}
