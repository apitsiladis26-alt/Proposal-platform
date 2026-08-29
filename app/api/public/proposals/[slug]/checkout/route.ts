import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: proposal } = await admin
    .from("proposals")
    .select("id, slug, status, client_name, price, currency")
    .eq("slug", slug)
    .maybeSingle();

  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (proposal.status === "paid") {
    return NextResponse.json({ error: "This proposal has already been paid." }, { status: 409 });
  }

  if (proposal.status !== "signed") {
    return NextResponse.json(
      { error: "Sign the proposal before paying." },
      { status: 409 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: proposal.currency,
            unit_amount: Math.round(proposal.price * 100),
            product_data: {
              name: `Proposal for ${proposal.client_name}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { proposal_id: proposal.id },
      success_url: `${siteUrl}/p/${proposal.slug}?payment=success`,
      cancel_url: `${siteUrl}/p/${proposal.slug}?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err);
    const message =
      err instanceof Stripe.errors.StripeError && err.code === "amount_too_small"
        ? "This proposal's price is below Stripe's minimum chargeable amount (usually $0.50)."
        : "Could not start checkout. Please try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
