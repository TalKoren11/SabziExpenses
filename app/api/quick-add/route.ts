import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TxType } from "@/lib/types";

/**
 * Token-authenticated endpoint for the iOS Siri Shortcut.
 * Auth via `x-siri-token` header (preferred) or a `token` field in the JSON body.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const token = request.headers.get("x-siri-token") ?? (body.token as string | undefined);
  if (!token) {
    return NextResponse.json({ ok: false, message: "Missing token." }, { status: 401 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { ok: false, message: "Amount must be a positive number." },
      { status: 400 }
    );
  }

  const type: TxType = body.type === "income" ? "income" : "expense";
  const note = typeof body.note === "string" ? body.note.trim() || null : null;

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("siri_token", token)
    .single();

  if (!profile) {
    return NextResponse.json({ ok: false, message: "Invalid token." }, { status: 401 });
  }

  // Best-effort category match by name.
  let categoryId: string | null = null;
  if (typeof body.category === "string" && body.category.trim()) {
    const { data: cat } = await admin
      .from("categories")
      .select("id")
      .eq("user_id", profile.id)
      .eq("type", type)
      .ilike("name", body.category.trim())
      .limit(1)
      .maybeSingle();
    categoryId = cat?.id ?? null;
  }

  const { error } = await admin.from("transactions").insert({
    user_id: profile.id,
    amount: Math.round(amount * 100) / 100,
    type,
    category_id: categoryId,
    note,
    source: "siri",
  });

  if (error) {
    return NextResponse.json({ ok: false, message: "Could not save." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: `Added ${type} of ${amount.toFixed(2)}${note ? ` for ${note}` : ""}.`,
  });
}
