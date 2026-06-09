"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setStatus("error");
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setStatus("error");
      } else {
        router.push("/");
        router.refresh();
      }
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-sm">
        <div className="mb-2 text-5xl">🥬</div>
        <h1 className="mb-1 text-2xl font-bold">Sabzi Expenses</h1>
        <p className="mb-8 text-sm text-neutral-500">Track spending in two taps.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-2xl border border-neutral-300 bg-transparent px-4 py-3 text-center text-lg outline-none focus:border-emerald-500 dark:border-neutral-700"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-neutral-300 bg-transparent px-4 py-3 text-center text-lg outline-none focus:border-emerald-500 dark:border-neutral-700"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-lg font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {status === "loading" ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>

        <button
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
          className="mt-4 text-sm text-neutral-500 underline-offset-2 hover:underline"
        >
          {mode === "signin" ? "No account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
