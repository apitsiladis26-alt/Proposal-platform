"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ProposalStatus } from "@/lib/proposal-schema";
import { SuccessConfetti } from "@/components/SuccessConfetti";
import { SignaturePad, type SignaturePadHandle } from "@/components/proposal/SignaturePad";

export function SignAndPay({
  slug,
  initialStatus,
  price,
  currency,
}: {
  slug: string;
  initialStatus: ProposalStatus;
  price: number;
  currency: string;
}) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ProposalStatus>(initialStatus);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const padRef = useRef<SignaturePadHandle>(null);

  const paymentIntent = searchParams.get("payment");
  const [confirming, setConfirming] = useState(
    () => paymentIntent === "success" && initialStatus !== "paid",
  );

  // Redirect-before-webhook race: if we're back from Stripe but the DB
  // hasn't caught up yet, poll briefly instead of trusting the redirect.
  useEffect(() => {
    if (!confirming) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      const res = await fetch(`/api/public/proposals/${slug}/status`);
      const data = await res.json();
      if (data.status === "paid") {
        setStatus("paid");
        setConfirming(false);
        clearInterval(interval);
      } else if (attempts >= 10) {
        setConfirming(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [confirming, slug]);

  async function startCheckout() {
    const res = await fetch(`/api/public/proposals/${slug}/checkout`, {
      method: "POST",
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.url) {
      setError(data?.error ?? "Could not start checkout. Please try again.");
      setPending(false);
      return;
    }

    window.location.assign(data.url);
  }

  async function handleSignAndPay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!signerName.trim() || !signerEmail.trim()) return;
    const signatureImage = padRef.current?.getDataUrl();
    if (!signatureImage) {
      setError("Please draw your signature in the box below.");
      return;
    }

    setPending(true);

    const res = await fetch(`/api/public/proposals/${slug}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signerName, signerEmail, signatureImage }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setPending(false);
      return;
    }

    setStatus("signed");
    // Signing is acknowledgment of the terms — go straight to payment.
    await startCheckout();
  }

  if (status === "archived") {
    return (
      <p className="rounded-xl bg-neutral-100 px-5 py-4 text-neutral-600">
        This proposal is no longer available.
      </p>
    );
  }

  if (status === "paid") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-6">
        <SuccessConfetti />
        <div className="max-w-md text-center">
          <p className="text-4xl font-black tracking-tight text-[#171717]">
            Payment received — thank you! 🎉
          </p>
          <p className="mt-4 text-lg text-neutral-600">
            You&rsquo;re all signed and paid up. You should receive a
            follow-up email shortly, and we&rsquo;ll be in touch soon to get
            started.
          </p>
        </div>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-6">
        <p className="text-lg text-neutral-500">Confirming your payment…</p>
      </div>
    );
  }

  if (status === "signed") {
    return (
      <div className="max-w-sm">
        <p className="mb-4 text-neutral-600">
          Already signed — finish your payment of{" "}
          <strong>
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: currency.toUpperCase(),
            }).format(price)}
          </strong>{" "}
          to complete the engagement.
        </p>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button
          onClick={() => {
            setError(null);
            setPending(true);
            void startCheckout();
          }}
          disabled={pending}
          className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Redirecting to payment…" : "Pay now"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignAndPay} className="max-w-sm">
      <label htmlFor="signerName" className="mb-1.5 block text-sm font-medium text-neutral-700">
        Full name
      </label>
      <input
        id="signerName"
        value={signerName}
        onChange={(e) => setSignerName(e.target.value)}
        placeholder="Jane Doe"
        required
        className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
      />

      <label htmlFor="signerEmail" className="mb-1.5 mt-4 block text-sm font-medium text-neutral-700">
        Confirm your email
      </label>
      <input
        id="signerEmail"
        type="email"
        value={signerEmail}
        onChange={(e) => setSignerEmail(e.target.value)}
        placeholder="jane@company.com"
        required
        className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
      />

      <label className="mb-1.5 mt-4 block text-sm font-medium text-neutral-700">
        Draw your signature
      </label>
      <SignaturePad ref={padRef} />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Signing…" : "Sign & Pay"}
      </button>
    </form>
  );
}
