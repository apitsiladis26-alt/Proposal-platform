import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyOwner } from "@/lib/resend";

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const signerName = typeof body.signerName === "string" ? body.signerName.trim() : "";
  const signerEmail = typeof body.signerEmail === "string" ? body.signerEmail.trim() : "";
  const signatureImage =
    typeof body.signatureImage === "string" ? body.signatureImage : "";

  if (!signerName) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (!signatureImage.startsWith("data:image/png;base64,") || signatureImage.length > 500_000) {
    return NextResponse.json({ error: "A drawn signature is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: proposal } = await admin
    .from("proposals")
    .select("id, status, client_name, price, currency")
    .eq("slug", slug)
    .maybeSingle();

  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // "draft" only lingers on proposals created before publish was removed
  // as a manual step — every new proposal is live (published) immediately.
  if (!["draft", "published", "viewed"].includes(proposal.status)) {
    return NextResponse.json(
      { error: "This proposal can no longer be signed." },
      { status: 409 },
    );
  }

  const { error: sigError } = await admin.from("signatures").insert({
    proposal_id: proposal.id,
    signer_name: signerName,
    signer_email: signerEmail,
    signature_image: signatureImage,
    ip_address: getClientIp(request),
  });

  if (sigError) {
    console.error("Failed to record signature:", sigError);
    return NextResponse.json({ error: "Failed to record signature" }, { status: 500 });
  }

  const { data: updated, error: updateError } = await admin
    .from("proposals")
    .update({ status: "signed", updated_at: new Date().toISOString() })
    .eq("id", proposal.id)
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 });
  }

  void notifyOwner(
    `Proposal signed by ${signerName}`,
    `<p><strong>${signerName}</strong> (${signerEmail}) signed the proposal for ${proposal.client_name}.</p>
     <p>Price: ${proposal.price} ${proposal.currency.toUpperCase()}</p>`,
  );

  return NextResponse.json({ proposal: updated });
}
