import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateProposalSections } from "@/lib/anthropic";
import { newProposalInputSchema } from "@/lib/proposal-schema";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = newProposalInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("sender_profile")
    .select("company_name")
    .limit(1)
    .maybeSingle();

  let aiContent;
  try {
    aiContent = await generateProposalSections({
      companyName: profile?.company_name ?? "",
      clientName: input.client_name,
      clientCompany: input.client_company,
      brief: input.brief,
    });
  } catch (err) {
    console.error("Claude generation failed:", err);
    return NextResponse.json(
      { error: "AI generation failed. You can try again from the editor." },
      { status: 502 },
    );
  }

  const { data: proposal, error } = await admin
    .from("proposals")
    .insert({
      client_name: input.client_name,
      client_company: input.client_company || null,
      client_email: input.client_email || null,
      client_phone: input.client_phone || null,
      brief: input.brief,
      price: input.price,
      ai_content: aiContent,
      status: "published",
      published_at: new Date().toISOString(),
      slug: nanoid(21),
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to insert proposal:", error);
    return NextResponse.json(
      { error: "Failed to save proposal" },
      { status: 500 },
    );
  }

  return NextResponse.json({ proposal });
}
