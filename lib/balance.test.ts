import { describe, it, expect } from "vitest";
import {
  computeBalance,
  filterByPeriod,
  breakdownByCategory,
  formatCurrency,
} from "./balance";
import type { TransactionWithCategory } from "./types";

function tx(
  partial: Partial<TransactionWithCategory> & Pick<TransactionWithCategory, "amount" | "type">
): TransactionWithCategory {
  return {
    id: Math.random().toString(36).slice(2),
    user_id: "u1",
    category_id: partial.category?.id ?? null,
    note: null,
    occurred_at: partial.occurred_at ?? "2026-06-08T10:00:00.000Z",
    source: "manual",
    created_at: partial.occurred_at ?? "2026-06-08T10:00:00.000Z",
    category: partial.category ?? null,
    ...partial,
  };
}

describe("computeBalance", () => {
  it("returns zeros for no transactions", () => {
    expect(computeBalance([])).toEqual({ income: 0, expense: 0, balance: 0 });
  });

  it("subtracts expenses from income", () => {
    const result = computeBalance([
      tx({ amount: 1000, type: "income" }),
      tx({ amount: 300, type: "expense" }),
      tx({ amount: 50.5, type: "expense" }),
    ]);
    expect(result).toEqual({ income: 1000, expense: 350.5, balance: 649.5 });
  });

  it("handles a negative balance", () => {
    const result = computeBalance([
      tx({ amount: 100, type: "income" }),
      tx({ amount: 250, type: "expense" }),
    ]);
    expect(result.balance).toBe(-150);
  });

  it("avoids floating point drift", () => {
    const result = computeBalance([
      tx({ amount: 0.1, type: "expense" }),
      tx({ amount: 0.2, type: "expense" }),
    ]);
    expect(result.expense).toBe(0.3);
  });
});

describe("filterByPeriod", () => {
  const now = new Date("2026-06-08T12:00:00.000Z");
  const items = [
    tx({ amount: 1, type: "expense", occurred_at: "2026-06-01T00:00:00.000Z" }),
    tx({ amount: 2, type: "expense", occurred_at: "2026-05-31T23:59:59.000Z" }),
    tx({ amount: 3, type: "expense", occurred_at: "2026-06-08T11:00:00.000Z" }),
  ];

  it("returns everything for 'all'", () => {
    expect(filterByPeriod(items, "all", now)).toHaveLength(3);
  });

  it("returns only the current calendar month for 'month'", () => {
    const result = filterByPeriod(items, "month", now);
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.occurred_at >= "2026-06-01")).toBe(true);
  });
});

describe("breakdownByCategory", () => {
  it("groups expense totals by category, descending", () => {
    const food = { id: "c1", name: "Food", emoji: "🍔" };
    const transport = { id: "c2", name: "Transport", emoji: "🚗" };
    const result = breakdownByCategory([
      tx({ amount: 30, type: "expense", category: food }),
      tx({ amount: 20, type: "expense", category: transport }),
      tx({ amount: 70, type: "expense", category: food }),
      tx({ amount: 999, type: "income", category: food }),
    ]);
    expect(result).toEqual([
      { id: "c1", name: "Food", emoji: "🍔", total: 100 },
      { id: "c2", name: "Transport", emoji: "🚗", total: 20 },
    ]);
  });

  it("buckets uncategorised expenses under 'Uncategorised'", () => {
    const result = breakdownByCategory([tx({ amount: 15, type: "expense" })]);
    expect(result[0]).toMatchObject({ id: null, name: "Uncategorised", total: 15 });
  });
});

describe("formatCurrency", () => {
  it("formats ILS with the shekel symbol", () => {
    expect(formatCurrency(1234.5, "ILS")).toBe("₪1,234.50");
  });

  it("formats USD", () => {
    expect(formatCurrency(42, "USD")).toBe("$42.00");
  });

  it("formats negative amounts with a leading minus", () => {
    expect(formatCurrency(-150, "ILS")).toBe("-₪150.00");
  });
});
