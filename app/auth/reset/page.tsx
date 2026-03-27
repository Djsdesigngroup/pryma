"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PrymaLogo } from "@/components/PrymaLogo";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback`,
    });

    setLoading(false);

    if (error) {
      setErrorMsg("Something went wrong. Please try again.");
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center text-center gap-8 max-w-profile w-full">
          <PrymaLogo size={32} />
          <div className="flex flex-col gap-2">
            <p className="font-medium text-sm text-primary">Check your email</p>
            <p className="font-light text-sm text-secondary">
              We sent a password reset link to{" "}
              <span className="text-primary">{email}</span>
            </p>
          </div>
          <a
            href="/auth"
            className="font-light text-xs text-muted hover:text-secondary transition-colors duration-200 ease-out tracking-wide uppercase"
          >
            Back to sign in
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-10 max-w-profile w-full">

        <PrymaLogo size={32} />

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-medium text-[22px] tracking-[-0.02em] text-primary">
            Reset your password
          </h1>
          <p className="font-light text-sm text-secondary">
            Enter your email and we&apos;ll send you a reset link.
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
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrorMsg(null); }}
            placeholder="your@email.com"
            required
            autoFocus
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-light text-primary placeholder:text-muted outline-none focus:border-primary/30 transition-colors duration-200 ease-out text-center"
          />
          <button
            type="submit"
            disabled={loading || !email}
            className="w-[280px] border border-primary/20 text-primary font-medium text-sm tracking-wide uppercase py-3 px-6 rounded-sm text-center transition-all duration-200 ease-out hover:border-primary/50 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <a
          href="/auth"
          className="font-light text-xs text-muted hover:text-secondary transition-colors duration-200 ease-out tracking-wide uppercase -mt-6"
        >
          Back to sign in
        </a>

      </div>
    </main>
  );
}
