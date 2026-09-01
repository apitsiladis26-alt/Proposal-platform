import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyClient } from "@/lib/resend";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: proposal } = await admin
    .from("proposals")
    .select("slug, client_name, client_email, price, currency, ai_content")
    .eq("id", id)
    .maybeSingle();

  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!proposal.client_email) {
    return NextResponse.json({ error: "This proposal has no client email on file" }, { status: 400 });
  }
  if (!proposal.slug) {
    return NextResponse.json({ error: "Proposal has no public link yet" }, { status: 400 });
  }

  const { data: profile } = await admin
    .from("sender_profile")
    .select("company_name")
    .limit(1)
    .maybeSingle();

  const companyName = profile?.company_name || "us";
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/p/${proposal.slug}`;
  const greeting = proposal.ai_content?.greeting;
  const amount = Number(proposal.price).toLocaleString(undefined, {
    style: "currency",
    currency: proposal.currency || "USD",
  });

  const sent = await notifyClient(
    proposal.client_email,
    `Your proposal from ${companyName}`,
    `<div style="font-family: -apple-system, sans-serif; max-width: 480px; color: #1a1a1a;">
       ${greeting ? `<p>${greeting}</p>` : `<p>Hi ${proposal.client_name},</p><p>Here's your proposal from ${companyName}.</p>`}
       <p style="color: #666;">Total: <strong style="color: #1a1a1a;">${amount}</strong></p>
       <p style="margin: 28px 0;">
         <a href="${url}" style="display: inline-block; background: #0f766e; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
           View proposal &amp; sign
         </a>
       </p>
       <p style="color: #999; font-size: 13px;">You can review everything, sign, and pay directly from that page.</p>
     </div>`,
  );

  if (!sent) {
    return NextResponse.json({ error: "Failed to send email — check Resend configuration" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
