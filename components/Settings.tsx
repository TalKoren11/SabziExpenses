"use client";

import { useState, useTransition } from "react";
import { addCategory, archiveCategory, signOut, updateCategory, updateCurrency, updateLanguage } from "@/app/actions";
import { useAutoSave, useOrigin } from "@/lib/client-hooks";
import { useTranslation } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/types";
import type { Category, TxType } from "@/lib/types";

const CURRENCIES = ["ILS", "USD", "EUR", "GBP", "INR"];

export function Settings({ categories, currency, siriToken }: { categories: Category[]; currency: string; siriToken: string }) {
  const { t, locale, setLocale } = useTranslation();
  const [, startTransition] = useTransition();
  const [autoSave, setAutoSave] = useAutoSave();
  const origin = useOrigin();
  const [copied, setCopied] = useState(false);

  const endpoint = origin ? `${origin}/api/quick-add` : "/api/quick-add";
  const curl = `${endpoint}\nHeader: x-siri-token: ${siriToken}\nJSON body: {"amount": 12.5, "note": "Lunch"}`;

  function handleLanguageChange(lang: Locale) {
    setLocale(lang);
    startTransition(() => updateLanguage(lang).then(() => {}));
  }

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-5 pb-8">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>

      <Section title={t("settings.language")}>
        <div className="flex gap-2">
          {(["he", "en"] as Locale[]).map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                locale === lang ? "bg-accent text-white" : "bg-background ring-1 ring-border"
              }`}
            >
              {lang === "he" ? t("settings.hebrew") : t("settings.english")}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t("settings.currency")}>
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              onClick={() => startTransition(() => updateCurrency(c).then(() => {}))}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                currency === c ? "bg-accent text-white" : "bg-background ring-1 ring-border"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t("settings.fastAdd")}>
        <label className="flex items-center justify-between">
          <span className="text-sm">{t("settings.fastAddDesc")}</span>
          <input type="checkbox" checked={autoSave} onChange={() => setAutoSave(!autoSave)} className="h-6 w-6 accent-[var(--accent)]" />
        </label>
      </Section>

      <Section title={t("settings.categories")}>
        <CategoryManager categories={categories} />
      </Section>

      <Section title={t("settings.siri")}>
        <p className="mb-2 text-sm text-muted">{t("settings.siriDesc")}</p>
        <pre className="mb-2 overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-background p-3 text-xs ring-1 ring-border">{curl}</pre>
        <button
          onClick={() => { navigator.clipboard.writeText(endpoint); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="rounded-full bg-background px-4 py-1.5 text-sm font-semibold ring-1 ring-border"
        >
          {copied ? t("settings.copied") : t("settings.copyEndpoint")}
        </button>
        <p className="mt-2 text-xs text-muted">{t("settings.siriSecret")}</p>
      </Section>

      <button
        onClick={() => startTransition(() => signOut())}
        className="mt-2 rounded-2xl bg-red-500/10 py-3 text-sm font-semibold text-red-500"
      >
        {t("settings.signOut")}
      </button>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-card p-4 ring-1 ring-border">
      <h2 className="mb-3 text-sm font-semibold text-muted">{title}</h2>
      {children}
    </section>
  );
}

function CategoryManager({ categories }: { categories: Category[] }) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🏷️");
  const [newType, setNewType] = useState<TxType>("expense");
  const active = categories.filter((c) => !c.archived);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {active.map((c) => <CategoryRow key={c.id} category={c} />)}
      </div>
      <div className="flex items-center gap-2 border-t border-border pt-3">
        <input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} className="w-12 rounded-lg border border-border bg-background py-1.5 text-center" maxLength={2} />
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("settings.newCategory")} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
        <select value={newType} onChange={(e) => setNewType(e.target.value as TxType)} className="rounded-lg border border-border bg-background px-1 py-1.5 text-xs">
          <option value="expense">{t("settings.expense")}</option>
          <option value="income">{t("settings.income")}</option>
        </select>
        <button
          disabled={isPending || !newName.trim()}
          onClick={() => startTransition(async () => { await addCategory({ name: newName, emoji: newEmoji, type: newType }); setNewName(""); setNewEmoji("🏷️"); })}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {t("settings.add")}
        </button>
      </div>
    </div>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [emoji, setEmoji] = useState(category.emoji);

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-12 rounded-lg border border-border bg-background py-1.5 text-center" maxLength={2} />
        <input value={name} onChange={(e) => setName(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
        <button
          disabled={isPending}
          onClick={() => startTransition(async () => { await updateCategory(category.id, { name, emoji }); setEditing(false); })}
          className="text-sm font-semibold text-accent"
        >
          {t("settings.save")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-xl">{category.emoji}</span>
      <span className="flex-1">{category.name}</span>
      <span className="text-[10px] uppercase text-muted">{category.type}</span>
      <button onClick={() => setEditing(true)} className="px-1 text-muted">✎</button>
      <button disabled={isPending} onClick={() => startTransition(() => archiveCategory(category.id, true).then(() => {}))} className="px-1 text-muted" aria-label="Archive">🗑</button>
    </div>
  );
}
