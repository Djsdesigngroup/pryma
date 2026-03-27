"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PrymaLogo } from "@/components/PrymaLogo";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Guard: requires an active recovery session.
  // The callback route verifies the reset token before landing here.
  useEffect(() => {
    async function guard() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth");
      } else {
        setReady(true);
      }
    }
    guard();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || loading) return;

    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setLoading(false);
      setErrorMsg("Something went wrong. Please try again.");
    } else {
      router.push("/edit");
      // loading stays true — navigation is in flight
    }
  }

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="text-muted text-sm font-light">Loading…</span>
      </main>
    );
  }

  const inputClass =
    "w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-light text-primary placeholder:text-muted outline-none focus:border-primary/30 transition-colors duration-200 ease-out text-center";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-10 max-w-profile w-full">

        <PrymaLogo size={32} />

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-medium text-[22px] tracking-[-0.02em] text-primary">
            Set your password
          </h1>
          <p className="font-light text-sm text-secondary">
            Choose a password for your Pryma account.
          </p>
        </div>

        {errorMsg && (
          <p className="text-[11px] text-[#f87171]/70 font-light text-center -mt-4">
            {errorMsg}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-4 w-full"
        >
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); }}
            placeholder="New password"
            required
            autoFocus
            className={inputClass}
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setErrorMsg(null); }}
            placeholder="Confirm password"
            required
            className={inputClass}
          />
          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-[280px] border border-primary/20 text-primary font-medium text-sm tracking-wide uppercase py-3 px-6 rounded-sm text-center transition-all duration-200 ease-out hover:border-primary/50 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? "Saving…" : "Set password"}
          </button>
        </form>

      </div>
    </main>
  );
}
