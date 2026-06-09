"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkAddTransactions } from "@/app/actions";
import { currencySymbol } from "@/lib/balance";
import { useTranslation } from "@/lib/i18n/context";
import type { Category, ParsedExpense } from "@/lib/types";

type Row = ParsedExpense & { categoryId: string | null; include: boolean };

export function ImportScreenshot({ categories, currency }: { categories: Category[]; currency: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "parsing" | "review" | "saving">("idle");
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [, startTransition] = useTransition();

  async function onFile(file: File) {
    setStatus("parsing");
    setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/parse-screenshot", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); setStatus("idle"); return; }
      const parsed: ParsedExpense[] = data.rows ?? [];
      if (parsed.length === 0) { setError("No transactions found in that screenshot."); setStatus("idle"); return; }
      setRows(parsed.map((p) => ({ ...p, categoryId: null, include: true })));
      setStatus("review");
    } catch {
      setError("Upload failed. Check your connection.");
      setStatus("idle");
    }
  }

  function update(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function save() {
    const selected = rows.filter((r) => r.include);
    if (selected.length === 0) return;
    setStatus("saving");
    startTransition(async () => {
      const res = await bulkAddTransactions(selected.map((r) => ({ amount: r.amount, categoryId: r.categoryId, note: r.merchant, occurredAt: r.date ? new Date(r.date).toISOString() : null })));
      if (res?.error) { setError(res.error); setStatus("review"); }
      else router.push("/overview");
    });
  }

  const sym = currencySymbol(currency);
  const selectedCount = rows.filter((r) => r.include).length;

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-5">
      <div>
        <h1 className="text-2xl font-bold">{t("import.title")}</h1>
        <p className="text-sm text-muted">{t("import.subtitle")}</p>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />

      {status === "idle" && (
        <>
          <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-border bg-card py-12 text-muted transition active:scale-[0.99]">
            <span className="text-4xl">📸</span>
            <span className="font-semibold text-foreground">{t("import.chooseScreenshot")}</span>
            <span className="text-xs">{t("import.chooseHint")}</span>
          </button>
          {error && <p className="text-center text-sm text-red-500">{error}</p>}
        </>
      )}

      {status === "parsing" && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
          <p className="text-sm">{t("import.reading")}</p>
        </div>
      )}

      {(status === "review" || status === "saving") && (
        <>
          <div className="flex flex-col gap-2">
            {rows.map((r, i) => (
              <div key={i} className={`rounded-2xl bg-card p-3 ring-1 ring-border transition ${r.include ? "" : "opacity-40"}`}>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={r.include} onChange={(e) => update(i, { include: e.target.checked })} className="h-5 w-5 accent-[var(--accent)]" />
                  <input value={r.merchant} onChange={(e) => update(i, { merchant: e.target.value })} className="min-w-0 flex-1 rounded-lg bg-background px-2 py-1.5 text-sm" />
                  <div className="flex items-center rounded-lg bg-background px-2">
                    <span className="text-sm text-muted">{sym}</span>
                    <input type="number" inputMode="decimal" value={r.amount} onChange={(e) => update(i, { amount: Number(e.target.value) })} className="w-20 bg-transparent py-1.5 text-right text-sm tabular-nums outline-none" />
                  </div>
                </div>
                <select value={r.categoryId ?? ""} onChange={(e) => update(i, { categoryId: e.target.value || null })} className="mt-2 w-full rounded-lg bg-background px-2 py-1.5 text-sm">
                  <option value="">{t("import.uncategorised")}</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>
              </div>
            ))}
          </div>
          {error && <p className="text-center text-sm text-red-500">{error}</p>}
          <button
            onClick={save}
            disabled={status === "saving" || rows.every((r) => !r.include)}
            className="mb-3 w-full rounded-2xl bg-accent py-4 text-lg font-bold text-white disabled:opacity-50"
          >
            {status === "saving" ? t("import.saving") : t("import.addCount").replace("{n}", String(selectedCount))}
          </button>
        </>
      )}
    </main>
  );
}
