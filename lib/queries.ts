import "server-only";
import { createClient } from "./supabase/server";
import type { Category, Profile, TransactionWithCategory } from "./types";

/** The authenticated user's profile, or null when unauthenticated. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data as Profile | null;
}

/** Non-archived categories for the current user, ordered for display. */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("type", { ascending: true })
    .order("sort_order", { ascending: true });
  return (data ?? []) as Category[];
}

/** Recent transactions joined with their category. */
export async function getTransactions(limit = 500): Promise<TransactionWithCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*, category:categories(id, name, emoji)")
    .order("occurred_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as TransactionWithCategory[];
}
