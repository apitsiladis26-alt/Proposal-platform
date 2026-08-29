import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { aiContentSchema } from "@/lib/proposal-schema";
import { z } from "zod";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data: proposal, error } = await admin
    .from("proposals")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error || !proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ proposal });
}

const patchSchema = z.object({
  client_name: z.string().min(1).optional(),
  client_company: z.string().nullable().optional(),
  client_email: z.string().email().nullable().optional().or(z.literal("")),
  client_phone: z.string().nullable().optional(),
  price: z.coerce.number().positive().optional(),
  ai_content: aiContentSchema.optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: proposal, error } = await admin
    .from("proposals")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !proposal) {
    return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 });
  }

  return NextResponse.json({ proposal });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("proposals").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete proposal" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
