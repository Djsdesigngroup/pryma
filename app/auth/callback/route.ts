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

  const supabase = createClient();
  let sessionError = false;

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (error) sessionError = true;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) sessionError = true;
  } else {
    sessionError = true;
  }

  if (!sessionError) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("handle")
        .eq("user_id", user.id)
        .maybeSingle();

      const redirectTo = profile ? "/edit" : "/onboarding";
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth`);
}
