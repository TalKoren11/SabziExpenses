"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TxType } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export interface AddTransactionInput {
  amount: number;
  type: TxType;
  categoryId: string | null;
  note?: string | null;
  occurredAt?: string;
}

export async function addTransaction(input: AddTransactionInput) {
  const { supabase, user } = await requireUser();
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { error: "Amount must be greater than zero." };
  }
  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    amount: input.amount,
    type: input.type,
    category_id: input.categoryId,
    note: input.note?.trim() || null,
    occurred_at: input.occurredAt ?? new Date().toISOString(),
    source: "manual",
  });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/overview");
  return { ok: true };
}

export async function bulkAddTransactions(
  rows: { amount: number; categoryId: string | null; note: string | null; occurredAt: string | null }[]
) {
  const { supabase, user } = await requireUser();
  const valid = rows.filter((r) => Number.isFinite(r.amount) && r.amount > 0);
  if (valid.length === 0) return { error: "Nothing to add." };
  const { error } = await supabase.from("transactions").insert(
    valid.map((r) => ({
      user_id: user.id,
      amount: r.amount,
      type: "expense" as const,
      category_id: r.categoryId,
      note: r.note?.trim() || null,
      occurred_at: r.occurredAt ?? new Date().toISOString(),
      source: "screenshot" as const,
    }))
  );
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/overview");
  return { ok: true, count: valid.length };
}

export async function deleteTransaction(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/overview");
  revalidatePath("/");
  return { ok: true };
}

export async function addCategory(input: { name: string; emoji: string; type: TxType }) {
  const { supabase, user } = await requireUser();
  const name = input.name.trim();
  if (!name) return { error: "Name is required." };
  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name,
    emoji: input.emoji.trim() || "🏷️",
    type: input.type,
    sort_order: 100,
  });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/");
  return { ok: true };
}

export async function updateCategory(id: string, input: { name: string; emoji: string }) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("categories")
    .update({ name: input.name.trim(), emoji: input.emoji.trim() || "🏷️" })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/");
  return { ok: true };
}

export async function archiveCategory(id: string, archived: boolean) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("categories").update({ archived }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/");
  return { ok: true };
}

export async function updateCurrency(currency: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("profiles").update({ currency }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateLanguage(language: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("profiles").update({ language }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  redirect("/login");
}
