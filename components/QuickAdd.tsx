"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { addTransaction } from "@/app/actions";
import { currencySymbol } from "@/lib/balance";
import { useAutoSave } from "@/lib/client-hooks";
import { formatDateDDMMYYYY, todayDateInputValue } from "@/lib/date";
import { useTranslation } from "@/lib/i18n/context";
import type { Account, Category, TxType } from "@/lib/types";

export function QuickAdd({
  categories,
  accounts,
  currency,
  defaultDate,
}: {
  categories: Category[];
  accounts: Account[];
  currency: string;
  defaultDate: string | null;
}) {
  const { t } = useTranslation();
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(defaultDate ?? todayDateInputValue());
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const visibleAccounts = useMemo(() => accounts.filter((a) => !a.archived), [accounts]);
  const defaultAccount = visibleAccounts.find((a) => a.is_default) ?? visibleAccounts[0] ?? null;
  const [accountId, setAccountId] = useState<string | null>(defaultAccount?.id ?? null);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [autoSave] = useAutoSave();
  const [isPending, startTransition] = useTransition();

  const visible = useMemo(
    () => categories.filter((c) => c.type === type && !c.archived),
    [categories, type]
  );

  const numericAmount = Number(amount);
  const canSave = Number.isFinite(numericAmount) && numericAmount > 0 && date !== "";

  function onAmountChange(value: string) {
    const cleaned = value.replace(",", ".").replace(/[^0-9.]/g, "");
    if (!/^\d*\.?\d{0,2}$/.test(cleaned)) return;
    setAmount(cleaned);
  }

  function reset() {
    setAmount("");
    setCategoryId(null);
    setNote("");
  }

  function save(catId: string | null) {
    if (date === "") { setToast(t("home.selectDate")); return; }
    if (!canSave) { setToast(t("home.enterAmount")); return; }
    startTransition(async () => {
      const res = await addTransaction({
        amount: numericAmount,
        type,
        categoryId: catId,
        accountId,
        note,
        occurredAt: new Date(date).toISOString(),
      });
      if (res?.error) {
        setToast(res.error);
      } else {
        setToast(`${t("home.saved")} ${currencySymbol(currency)}${numericAmount.toFixed(2)} ✓`);
        reset();
      }
    });
  }

  function onCategory(id: string) {
    setCategoryId(id);
    if (autoSave) save(id);
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <main className="flex flex-1 flex-col px-4 pt-4">
      <div className="mx-auto mb-3 flex w-full max-w-xs rounded-full bg-card p-1 ring-1 ring-border">
        {(["expense", "income"] as TxType[]).map((txType) => (
          <button
            key={txType}
            onClick={() => { setType(txType); setCategoryId(null); }}
            className={`flex-1 rounded-full py-2 text-sm font-semibold capitalize transition ${
              type === txType
                ? txType === "expense" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                : "text-muted"
            }`}
          >
            {txType === "expense" ? t("home.expense") : t("home.income")}
          </button>
        ))}
      </div>

      {visibleAccounts.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label={t("home.account")}>
          {visibleAccounts.map((a) => (
            <button
              key={a.id}
              role="radio"
              aria-checked={accountId === a.id}
              onClick={() => setAccountId(a.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition active:scale-95 ${
                accountId === a.id ? "bg-accent text-white" : "bg-card text-muted ring-1 ring-border"
              }`}
            >
              <span className="text-base leading-none">{a.emoji}</span>
              <span>{a.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-baseline justify-center gap-1 py-3">
        <span className="text-3xl font-medium text-muted">{currencySymbol(currency)}</span>
        <input
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          inputMode="decimal"
          placeholder="0"
          className="w-40 bg-transparent text-center text-6xl font-bold tabular-nums tracking-tight outline-none placeholder:text-foreground"
        />
      </div>

      <div className="grid grid-cols-4 gap-2 py-2">
        {visible.map((c) => (
          <button
            key={c.id}
            onClick={() => onCategory(c.id)}
            className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl text-center transition active:scale-95 ${
              categoryId === c.id ? "bg-accent text-white" : "bg-card ring-1 ring-border"
            }`}
          >
            <span className="text-2xl leading-none">{c.emoji}</span>
            <span className="px-1 text-[10px] leading-tight">{c.name}</span>
          </button>
        ))}
      </div>

      <div className="relative mt-2">
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
          <span className="text-muted">{t("home.date")}</span>
          <span className="flex items-center gap-2 font-semibold tabular-nums">
            {formatDateDDMMYYYY(date)}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </span>
        </div>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label={t("home.date")}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("home.notePlaceholder")}
        className="my-2 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
      />

      <button
        onClick={() => save(categoryId)}
        disabled={!canSave || isPending}
        className="mt-auto mb-3 w-full rounded-2xl bg-accent py-4 text-lg font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? t("home.saving") : t("home.save")}
      </button>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 mx-auto w-fit rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
