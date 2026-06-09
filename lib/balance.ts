import type { TransactionWithCategory, TxType } from "./types";

export type Period = "month" | "all";

/** Sum amounts in integer cents to avoid floating-point drift, return major units. */
function sumAmount(items: { amount: number }[]): number {
  const cents = items.reduce((acc, t) => acc + Math.round(t.amount * 100), 0);
  return cents / 100;
}

export function computeBalance(transactions: { amount: number; type: TxType }[]): {
  income: number;
  expense: number;
  balance: number;
} {
  const income = sumAmount(transactions.filter((t) => t.type === "income"));
  const expense = sumAmount(transactions.filter((t) => t.type === "expense"));
  return { income, expense, balance: Math.round((income - expense) * 100) / 100 };
}

/** Keep only transactions inside the requested period (current calendar month, or all). */
export function filterByPeriod<T extends { occurred_at: string }>(
  transactions: T[],
  period: Period,
  now: Date = new Date()
): T[] {
  if (period === "all") return transactions;
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  return transactions.filter((t) => {
    const ts = new Date(t.occurred_at).getTime();
    return ts >= start && ts < end;
  });
}

export interface CategoryTotal {
  id: string | null;
  name: string;
  emoji: string;
  total: number;
}

/** Total expense spending grouped by category, highest first. Income is ignored. */
export function breakdownByCategory(transactions: TransactionWithCategory[]): CategoryTotal[] {
  const groups = new Map<string, CategoryTotal>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const id = t.category?.id ?? null;
    const key = id ?? "__none__";
    const existing = groups.get(key);
    const cents = Math.round(t.amount * 100);
    if (existing) {
      existing.total = Math.round(existing.total * 100 + cents) / 100;
    } else {
      groups.set(key, {
        id,
        name: t.category?.name ?? "Uncategorised",
        emoji: t.category?.emoji ?? "❓",
        total: cents / 100,
      });
    }
  }
  return [...groups.values()].sort((a, b) => b.total - a.total);
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  ILS: "₪",
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
};

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency + " ";
}

/** Deterministic currency formatting: <sign><symbol><grouped>.<00>. */
export function formatCurrency(amount: number, currency: string): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  const fixed = abs.toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${currencySymbol(currency)}${grouped}.${decPart}`;
}
