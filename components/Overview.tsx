"use client";

import { useMemo, useState, useTransition } from "react";
import { deleteTransaction } from "@/app/actions";
import {
  breakdownByCategory,
  computeBalance,
  filterByPeriod,
  formatCurrency,
  type Period,
} from "@/lib/balance";
import type { TransactionWithCategory } from "@/lib/types";

export function Overview({
  transactions,
  currency,
}: {
  transactions: TransactionWithCategory[];
  currency: string;
}) {
  const [period, setPeriod] = useState<Period>("month");
  const [isPending, startTransition] = useTransition();

  const inPeriod = useMemo(() => filterByPeriod(transactions, period), [transactions, period]);
  const { income, expense, balance } = useMemo(() => computeBalance(inPeriod), [inPeriod]);
  const breakdown = useMemo(() => breakdownByCategory(inPeriod), [inPeriod]);
  const maxCat = breakdown[0]?.total ?? 0;

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pt-5">
      {/* Balance card */}
      <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-muted">Balance</span>
          <div className="flex rounded-full bg-background p-0.5 ring-1 ring-border">
            {(["month", "all"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                  period === p ? "bg-accent text-white" : "text-muted"
                }`}
              >
                {p === "month" ? "This month" : "All time"}
              </button>
            ))}
          </div>
        </div>
        <p
          className={`text-4xl font-bold tabular-nums ${
            balance < 0 ? "text-red-500" : "text-foreground"
          }`}
        >
          {formatCurrency(balance, currency)}
        </p>
        <div className="mt-3 flex gap-4 text-sm">
          <span className="text-emerald-600">▲ {formatCurrency(income, currency)}</span>
          <span className="text-red-500">▼ {formatCurrency(expense, currency)}</span>
        </div>
      </div>

      {/* Category breakdown */}
      {breakdown.length > 0 && (
        <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <h2 className="mb-3 text-sm font-semibold text-muted">Where it went</h2>
          <div className="flex flex-col gap-3">
            {breakdown.map((c) => (
              <div key={c.id ?? "none"}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>
                    {c.emoji} {c.name}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(c.total, currency)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${maxCat ? (c.total / maxCat) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="flex flex-col gap-2 pb-4">
        <h2 className="px-1 text-sm font-semibold text-muted">Recent</h2>
        {inPeriod.length === 0 && (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted ring-1 ring-border">
            No transactions yet. Add one from the ➕ tab.
          </p>
        )}
        {inPeriod.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-2xl bg-card px-3 py-2.5 ring-1 ring-border"
          >
            <span className="text-2xl">{t.category?.emoji ?? "❓"}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {t.category?.name ?? "Uncategorised"}
              </p>
              <p className="truncate text-xs text-muted">
                {t.note || new Date(t.occurred_at).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`tabular-nums text-sm font-semibold ${
                t.type === "income" ? "text-emerald-600" : "text-foreground"
              }`}
            >
              {t.type === "income" ? "+" : "−"}
              {formatCurrency(t.amount, currency).replace("-", "")}
            </span>
            <button
              onClick={() =>
                startTransition(async () => {
                  await deleteTransaction(t.id);
                })
              }
              disabled={isPending}
              aria-label="Delete"
              className="ml-1 text-muted transition active:scale-90"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
