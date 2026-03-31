"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PrymaLogo } from "@/components/PrymaLogo";

const isDev = process.env.NODE_ENV === "development";

type AuthMode = "password" | "magic";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasCallbackError = searchParams.get("error");

  const [mode, setMode] = useState<AuthMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  function switchMode(next: AuthMode) {
    setMode(next);
    setErrorMsg(null);
  }

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || loading) return;

    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      setErrorMsg("We couldn’t sign you in. Check your details and try again.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("handle")
        .eq("user_id", user.id)
        .maybeSingle();

      router.push(profile ? "/edit" : "/onboarding");
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    const siteUrl =
      (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, "");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });

    setLoading(false);

    if (error) {
      const msg = isDev
        ? `${error.message}${error.status ? ` (${error.status})` : ""}`
        : "Something went wrong. Please try again.";
      setErrorMsg(msg);
    } else {
      setMagicSent(true);
    }
  }

  if (magicSent) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center text-center gap-8 max-w-profile w-full">
          <PrymaLogo size={32} />

          <div className="flex flex-col gap-2">
            <p className="font-medium text-sm text-primary">Check your email</p>
            <p className="font-light text-sm text-secondary">
              We sent a sign-in link to <span className="text-primary">{email}</span>
            </p>
          </div>

          <button
            onClick={() => {
              setMagicSent(false);
              setErrorMsg(null);
            }}
            className="font-light text-xs text-muted hover:text-secondary transition-colors duration-200 ease-out tracking-wide uppercase"
          >
            Use a different email
          </button>
        </div>
      </main>
    );
  }

  const inputClass =
    "w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-light text-primary placeholder:text-muted outline-none focus:border-primary/30 transition-colors duration-200 ease-out text-center";

  const primaryBtn =
    "w-[280px] border border-primary/20 text-primary font-medium text-sm tracking-wide uppercase py-3 px-6 rounded-sm text-center transition-all duration-200 ease-out hover:border-primary/50 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-10 max-w-profile w-full">
        <PrymaLogo size={32} />

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-medium text-[22px] tracking-[-0.02em] text-primary">
            Sign in to Pryma
          </h1>
          <p className="font-light text-sm text-secondary">
            New here? We&apos;ll create your profile automatically.
          </p>
        </div>

        {(hasCallbackError || errorMsg) && (
          <p className="text-[11px] text-[#f87171]/70 font-light text-center -mt-4">
            {errorMsg ?? "Something went wrong. Please try again."}
          </p>
        )}

        {mode === "password" && (
          <form
            onSubmit={handlePasswordSignIn}
            className="flex flex-col items-center gap-4 w-full"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="your@email.com"
              required
              autoFocus
              className={inputClass}
            />

            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Password"
              required
              className={inputClass}
            />

            <button
              type="submit"
              disabled={loading || !email || !password}
              className={primaryBtn}
            >
              {loading ? "Signing in…" : "Continue"}
            </button>

            <p className="font-light text-xs text-muted/60 text-center max-w-[280px]">
              New here or don&apos;t have a password yet? Use a magic link below.
            </p>
          </form>
        )}

        {mode === "magic" && (
          <form
            onSubmit={handleMagicLink}
            className="flex flex-col items-center gap-4 w-full"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="your@email.com"
              required
              autoFocus
              className={inputClass}
            />

            <button
              type="submit"
              disabled={loading || !email}
              className={primaryBtn}
            >
              {loading ? "Sending…" : "Continue with magic link"}
            </button>

            <p className="font-light text-xs text-muted/60 text-center max-w-[280px]">
              We&apos;ll sign you in or help you set up your profile next.
            </p>
          </form>
        )}

        <div className="flex flex-col items-center gap-3 -mt-4">
          {mode === "password" && (
            <a
              href="/auth/reset"
              className="font-light text-xs text-muted/60 hover:text-muted transition-colors duration-200 ease-out tracking-wide"
            >
              Forgot password?
            </a>
          )}

          <button
            type="button"
            onClick={() => switchMode(mode === "password" ? "magic" : "password")}
            className="font-light text-xs text-muted hover:text-secondary transition-colors duration-200 ease-out tracking-wide uppercase"
          >
            {mode === "password"
              ? "New here? Email me a magic link instead"
              : "I already have a password"}
          </button>
        </div>

        <a
          href="/u/dom"
          className="font-light text-xs text-muted hover:text-secondary transition-colors duration-200 ease-out tracking-wide uppercase"
        >
          View demo profile
        </a>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}