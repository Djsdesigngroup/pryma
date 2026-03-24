import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // Magic-link / OTP flow — Supabase sends token_hash + type
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // OAuth / PKCE flow — Supabase sends code
  const code = searchParams.get("code");

  console.log("[callback] received →", {
    token_hash: token_hash ? `${token_hash.slice(0, 8)}…` : null,
    type,
    code: code ? `${code.slice(0, 8)}…` : null,
    origin,
  });

  const supabase = createClient();
  let sessionError = false;

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (error) {
      console.error("[callback] verifyOtp failed:", error.message, error.status);
      sessionError = true;
    } else {
      console.log("[callback] verifyOtp OK");
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[callback] exchangeCodeForSession failed:", error.message, error.status);
      sessionError = true;
    } else {
      console.log("[callback] exchangeCodeForSession OK");
    }
  } else {
    console.error("[callback] no token_hash or code in request — cannot establish session");
    sessionError = true;
  }

  if (!sessionError) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("handle")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("[callback] profile lookup failed:", profileError.message);
      }

      const redirectTo = profile ? "/edit" : "/onboarding";
      console.log("[callback] user", user.id, "→ profile:", profile?.handle ?? "none", "→ redirect:", redirectTo);
      return NextResponse.redirect(`${origin}${redirectTo}`);
    } else {
      console.error("[callback] session established but getUser() returned null");
    }
  }

  console.error("[callback] auth failed — redirecting to /auth?error=auth");
  return NextResponse.redirect(`${origin}/auth?error=auth`);
}
