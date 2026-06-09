"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { addTransaction } from "@/app/actions";
import { currencySymbol } from "@/lib/balance";
import { useAutoSave } from "@/lib/client-hooks";
import type { Category, TxType } from "@/lib/types";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

export function QuickAdd({
  categories,
  currency,
}: {
  categories: Category[];
  currency: string;
}) {
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("0");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [autoSave] = useAutoSave();
  const [isPending, startTransition] = useTransition();

  const visible = useMemo(
    () => categories.filter((c) => c.type === type && !c.archived),
    [categories, type]
  );

  const numericAmount = Number(amount);
  const canSave = Number.isFinite(numericAmount) && numericAmount > 0;

  function press(key: string) {
    setAmount((cur) => {
      if (key === "⌫") return cur.length <= 1 ? "0" : cur.slice(0, -1);
      if (key === ".") return cur.includes(".") ? cur : cur + ".";
      // block more than 2 decimals
      if (cur.includes(".") && cur.split(".")[1].length >= 2) return cur;
      if (cur === "0") return key === "." ? "0." : key;
      return cur + key;
    });
  }

  function reset() {
    setAmount("0");
    setCategoryId(null);
    setNote("");
  }

  function save(catId: string | null) {
    if (!canSave) {
      setToast("Enter an amount first");
      return;
    }
    startTransition(async () => {
      const res = await addTransaction({
        amount: numericAmount,
        type,
        categoryId: catId,
        note,
      });
      if (res?.error) {
        setToast(res.error);
      } else {
        setToast(`Saved ${currencySymbol(currency)}${numericAmount.toFixed(2)} ✓`);
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
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <main className="flex flex-1 flex-col px-4 pt-4">
      {/* Type toggle */}
      <div className="mx-auto mb-3 flex w-full max-w-xs rounded-full bg-card p-1 ring-1 ring-border">
        {(["expense", "income"] as TxType[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t);
              setCategoryId(null);
            }}
            className={`flex-1 rounded-full py-2 text-sm font-semibold capitalize transition ${
              type === t
                ? t === "expense"
                  ? "bg-red-500 text-white"
                  : "bg-emerald-500 text-white"
                : "text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Amount display */}
      <div className="flex items-baseline justify-center gap-1 py-3">
        <span className="text-3xl font-medium text-muted">{currencySymbol(currency)}</span>
        <span className="text-6xl font-bold tabular-nums tracking-tight">{amount}</span>
      </div>

      {/* Category quick-buttons */}
      <div className="grid grid-cols-4 gap-2 py-2">
        {visible.map((c) => (
          <button
            key={c.id}
            onClick={() => onCategory(c.id)}
            className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl text-center transition active:scale-95 ${
              categoryId === c.id
                ? "bg-accent text-white"
                : "bg-card ring-1 ring-border"
            }`}
          >
            <span className="text-2xl leading-none">{c.emoji}</span>
            <span className="px-1 text-[10px] leading-tight">{c.name}</span>
          </button>
        ))}
      </div>

      {/* Note */}
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        className="my-2 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
      />

      {/* Number pad */}
      <div className="mt-auto grid grid-cols-3 gap-2 pb-2">
        {KEYS.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className="rounded-2xl bg-card py-4 text-2xl font-medium ring-1 ring-border transition active:scale-95"
          >
            {k}
          </button>
        ))}
      </div>

      {/* Save */}
      <button
        onClick={() => save(categoryId)}
        disabled={!canSave || isPending}
        className="mb-3 w-full rounded-2xl bg-accent py-4 text-lg font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save ✓"}
      </button>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 mx-auto w-fit rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
