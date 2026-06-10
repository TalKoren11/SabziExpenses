import "server-only";
import { toDateInputValue } from "./date";
import { createClient } from "./supabase/server";
import type { Account, Category, Profile, TransactionWithCategory } from "./types";

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

/** Non-archived accounts for the current user, ordered for display. */
export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as Account[];
}

/** Date (YYYY-MM-DD) of the most recent transaction, or null if there are none. */
export async function getLastTransactionDate(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? toDateInputValue(data.occurred_at) : null;
}

/** Recent transactions joined with their category. */
export async function getTransactions(limit = 500): Promise<TransactionWithCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*, category:categories(id, name, emoji), account:accounts(id, name, emoji)")
    .order("occurred_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as TransactionWithCategory[];
}
