"use client";

import { useState, useTransition } from "react";
import {
  addCategory,
  archiveCategory,
  signOut,
  updateCategory,
  updateCurrency,
} from "@/app/actions";
import { useAutoSave, useOrigin } from "@/lib/client-hooks";
import type { Category, TxType } from "@/lib/types";

const CURRENCIES = ["ILS", "USD", "EUR", "GBP", "INR"];

export function Settings({
  categories,
  currency,
  siriToken,
}: {
  categories: Category[];
  currency: string;
  siriToken: string;
}) {
  const [, startTransition] = useTransition();
  const [autoSave, setAutoSave] = useAutoSave();
  const origin = useOrigin();
  const [copied, setCopied] = useState(false);

  const endpoint = origin ? `${origin}/api/quick-add` : "/api/quick-add";

  function toggleAutoSave() {
    setAutoSave(!autoSave);
  }

  const curl = `${endpoint}\nHeader: x-siri-token: ${siriToken}\nJSON body: {"amount": 12.5, "note": "Lunch"}`;

  return (
    <main className="flex flex-1 flex-col gap-5 px-4 py-5 pb-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Currency */}
      <Section title="Currency">
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

      {/* Fast add behaviour */}
      <Section title="Fast add">
        <label className="flex items-center justify-between">
          <span className="text-sm">Save instantly when I tap a category</span>
          <input
            type="checkbox"
            checked={autoSave}
            onChange={toggleAutoSave}
            className="h-6 w-6 accent-[var(--accent)]"
          />
        </label>
      </Section>

      {/* Categories */}
      <Section title="Categories">
        <CategoryManager categories={categories} />
      </Section>

      {/* Siri */}
      <Section title="Hey Siri, add expense">
        <p className="mb-2 text-sm text-muted">
          Create a Shortcut that asks for the amount, then sends a{" "}
          <strong>Get Contents of URL</strong> request:
        </p>
        <pre className="mb-2 overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-background p-3 text-xs ring-1 ring-border">
          {curl}
        </pre>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${endpoint}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-full bg-background px-4 py-1.5 text-sm font-semibold ring-1 ring-border"
        >
          {copied ? "Copied ✓" : "Copy endpoint URL"}
        </button>
        <p className="mt-2 text-xs text-muted">
          Keep your token secret — anyone with it can add expenses to your account.
        </p>
      </Section>

      <button
        onClick={() => startTransition(() => signOut())}
        className="mt-2 rounded-2xl bg-red-500/10 py-3 text-sm font-semibold text-red-500"
      >
        Sign out
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
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🏷️");
  const [newType, setNewType] = useState<TxType>("expense");
  const active = categories.filter((c) => !c.archived);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {active.map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-border pt-3">
        <input
          value={newEmoji}
          onChange={(e) => setNewEmoji(e.target.value)}
          className="w-12 rounded-lg border border-border bg-background py-1.5 text-center"
          maxLength={2}
        />
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category"
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as TxType)}
          className="rounded-lg border border-border bg-background px-1 py-1.5 text-xs"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <button
          disabled={isPending || !newName.trim()}
          onClick={() =>
            startTransition(async () => {
              await addCategory({ name: newName, emoji: newEmoji, type: newType });
              setNewName("");
              setNewEmoji("🏷️");
            })
          }
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [emoji, setEmoji] = useState(category.emoji);

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          className="w-12 rounded-lg border border-border bg-background py-1.5 text-center"
          maxLength={2}
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        />
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await updateCategory(category.id, { name, emoji });
              setEditing(false);
            })
          }
          className="text-sm font-semibold text-accent"
        >
          Save
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-xl">{category.emoji}</span>
      <span className="flex-1">{category.name}</span>
      <span className="text-[10px] uppercase text-muted">{category.type}</span>
      <button onClick={() => setEditing(true)} className="px-1 text-muted">
        ✎
      </button>
      <button
        disabled={isPending}
        onClick={() => startTransition(() => archiveCategory(category.id, true).then(() => {}))}
        className="px-1 text-muted"
        aria-label="Archive"
      >
        🗑
      </button>
    </div>
  );
}
