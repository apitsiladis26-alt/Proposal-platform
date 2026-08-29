import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyOwner, notifyClient } from "@/lib/resend";

// Raw-body signature verification needs the Node runtime, not edge.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const proposalId = session.metadata?.proposal_id;

    if (proposalId) {
      const admin = createAdminClient();

      const { data: proposal } = await admin
        .from("proposals")
        .select("id, client_name, client_company, client_email, price, currency, status")
        .eq("id", proposalId)
        .maybeSingle();

      if (proposal && proposal.status !== "paid") {
        const paymentIntentId =
          typeof session.payment_intent === "string" ? session.payment_intent : null;

        await admin.from("payments").insert({
          proposal_id: proposalId,
          stripe_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId,
          amount: (session.amount_total ?? 0) / 100,
          currency: session.currency,
          status: "paid",
          paid_at: new Date().toISOString(),
        });

        await admin
          .from("proposals")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", proposalId);

        const amount = ((session.amount_total ?? 0) / 100).toFixed(2);
        const currencyLabel = (session.currency ?? proposal.currency).toUpperCase();

        void notifyOwner(
          `Proposal paid — ${amount} ${currencyLabel}`,
          `<p><strong>${proposal.client_name}</strong> paid their proposal.</p>`,
        );

        // The signer's own confirmed email (typed at sign time), not the
        // possibly-stale client_email the owner entered when creating this.
        const { data: signature } = await admin
          .from("signatures")
          .select("signer_name, signer_email")
          .eq("proposal_id", proposalId)
          .order("signed_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const recipient = signature?.signer_email || proposal.client_email;
        const recipientName = signature?.signer_name || proposal.client_name;
        const receiptId = paymentIntentId ?? session.id;
        const paidDate = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        if (recipient) {
          void notifyClient(
            recipient,
            "Your payment receipt",
            `<div style="font-family: -apple-system, sans-serif; max-width: 480px;">
               <p>Hi ${recipientName},</p>
               <p>Thanks for signing and paying — here's your receipt. You'll hear from us shortly with next steps to get started.</p>
               <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                 <tr>
                   <td style="padding: 8px 0; color: #666;">Receipt #</td>
                   <td style="padding: 8px 0; text-align: right;">${receiptId}</td>
                 </tr>
                 <tr>
                   <td style="padding: 8px 0; color: #666;">Date</td>
                   <td style="padding: 8px 0; text-align: right;">${paidDate}</td>
                 </tr>
                 <tr>
                   <td style="padding: 8px 0; color: #666;">Description</td>
                   <td style="padding: 8px 0; text-align: right;">Proposal for ${proposal.client_company || proposal.client_name}</td>
                 </tr>
                 <tr style="border-top: 1px solid #eee;">
                   <td style="padding: 12px 0 0; font-weight: 600;">Total paid</td>
                   <td style="padding: 12px 0 0; text-align: right; font-weight: 600;">${amount} ${currencyLabel}</td>
                 </tr>
               </table>
             </div>`,
          );
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
