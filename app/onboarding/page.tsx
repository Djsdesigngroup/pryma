"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizeUrl } from "@/lib/profile";
import { PrymaLogo } from "@/components/PrymaLogo";
import { HandleInput } from "@/components/HandleInput";

interface OnboardingForm {
  handle: string;
  full_name: string;
  role_title: string;
  organization: string;
  phone: string;
  email: string;
  public_bio: string;
  public_website: string;
  public_location: string;
  professional_bio: string;
  professional_website: string;
  professional_location: string;
}

const EMPTY: OnboardingForm = {
  handle: "",
  full_name: "",
  role_title: "",
  organization: "",
  phone: "",
  email: "",
  public_bio: "",
  public_website: "",
  public_location: "",
  professional_bio: "",
  professional_website: "",
  professional_location: "",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState<OnboardingForm>(EMPTY);
  const [userId, setUserId] = useState<string | null>(null);
  const [handleValid, setHandleValid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth");
        return;
      }
      // Already has a profile → skip onboarding
      const { data: existing } = await supabase
        .from("profiles")
        .select("handle")
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing) {
        router.replace("/edit");
        return;
      }
      setUserId(user.id);
    }
    init();
  }, [router]);

  function set(key: keyof OnboardingForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !handleValid || !form.full_name || !form.handle) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("profiles").insert({
      user_id: userId,
      handle: form.handle,
      full_name: form.full_name,
      role_title: form.role_title || null,
      organization: form.organization || null,
      phone: form.phone || null,
      email: form.email || null,
      public_bio: form.public_bio || null,
      public_website: normalizeUrl(form.public_website) || null,
      public_location: form.public_location || null,
      professional_bio: form.professional_bio || null,
      professional_website: normalizeUrl(form.professional_website) || null,
      professional_location: form.professional_location || null,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
    } else {
      setComplete(true);
    }
  }

  if (!userId) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="text-muted text-sm font-light">Loading…</span>
      </main>
    );
  }

  if (complete) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center text-center gap-8 max-w-profile w-full">
          <PrymaLogo size={48} />
          <div className="flex flex-col items-center gap-2">
            <p className="font-light text-[10px] text-muted tracking-widest uppercase">
              @{form.handle}
            </p>
            <h1 className="font-medium text-[26px] tracking-[-0.02em] text-primary">
              Your Pryma is ready.
            </h1>
            <p className="font-light text-sm text-secondary mt-1">
              {form.full_name}
              {form.role_title && (
                <>
                  {" "}
                  <span className="text-muted">·</span> {form.role_title}
                </>
              )}
            </p>
          </div>
          <button
            onClick={() => router.push(`/u/${form.handle}`)}
            className="w-[280px] border border-primary/20 text-primary font-medium text-sm tracking-wide uppercase py-3 px-6 rounded-sm text-center transition-all duration-200 ease-out hover:border-primary/50 hover:bg-white/5"
          >
            See your profile →
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-profile flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-4">
          <PrymaLogo size={24} />
          <p className="font-light text-sm text-muted tracking-wide uppercase">
            Create your profile
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Identity */}
          <div className="flex flex-col gap-5">
            <HandleInput
              value={form.handle}
              onChange={(v) => set("handle", v)}
              onValidChange={setHandleValid}
            />
            {(
              [
                { key: "full_name", label: "Full name", required: true, type: "text" },
                { key: "role_title", label: "Role / title", type: "text" },
                { key: "organization", label: "Organization", type: "text" },
                { key: "phone", label: "Phone", type: "tel" },
                { key: "email", label: "Email", type: "email" },
              ] as const
            ).map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <label
                  htmlFor={field.key}
                  className="font-light text-xs text-muted tracking-wide uppercase"
                >
                  {field.label}
                  {"required" in field && field.required && (
                    <span className="ml-1">*</span>
                  )}
                </label>
                <input
                  id={field.key}
                  type={field.type}
                  value={form[field.key]}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={`${field.label}…`}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-light text-primary placeholder:text-muted outline-none focus:border-primary/30 transition-colors duration-200 ease-out"
                />
              </div>
            ))}
          </div>

          <div className="border-t border-border opacity-20" />

          {/* Public context */}
          <div className="flex flex-col gap-5">
            <p className="font-light text-[10px] text-muted tracking-widest uppercase">
              Public context
            </p>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="public_bio"
                className="font-light text-xs text-muted tracking-wide uppercase"
              >
                Bio
              </label>
              <textarea
                id="public_bio"
                value={form.public_bio}
                onChange={(e) => set("public_bio", e.target.value)}
                rows={4}
                placeholder="Bio…"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-light text-primary placeholder:text-muted outline-none focus:border-primary/30 transition-colors duration-200 ease-out resize-none leading-relaxed"
              />
            </div>
            {(
              [
                { key: "public_website", label: "Website", type: "url" },
                { key: "public_location", label: "Location", type: "text" },
              ] as const
            ).map(({ key, label, type }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label
                  htmlFor={key}
                  className="font-light text-xs text-muted tracking-wide uppercase"
                >
                  {label}
                </label>
                <input
                  id={key}
                  type={type}
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={`${label}…`}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-light text-primary placeholder:text-muted outline-none focus:border-primary/30 transition-colors duration-200 ease-out"
                />
              </div>
            ))}
          </div>

          <div className="border-t border-border opacity-20" />

          {/* Professional context */}
          <div className="flex flex-col gap-5">
            <p className="font-light text-[10px] text-muted tracking-widest uppercase">
              Professional context
            </p>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="professional_bio"
                className="font-light text-xs text-muted tracking-wide uppercase"
              >
                Bio
              </label>
              <textarea
                id="professional_bio"
                value={form.professional_bio}
                onChange={(e) => set("professional_bio", e.target.value)}
                rows={4}
                placeholder="Bio…"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-light text-primary placeholder:text-muted outline-none focus:border-primary/30 transition-colors duration-200 ease-out resize-none leading-relaxed"
              />
            </div>
            {(
              [
                {
                  key: "professional_website",
                  label: "Website",
                  type: "url",
                },
                {
                  key: "professional_location",
                  label: "Location",
                  type: "text",
                },
              ] as const
            ).map(({ key, label, type }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label
                  htmlFor={key}
                  className="font-light text-xs text-muted tracking-wide uppercase"
                >
                  {label}
                </label>
                <input
                  id={key}
                  type={type}
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={`${label}…`}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-light text-primary placeholder:text-muted outline-none focus:border-primary/30 transition-colors duration-200 ease-out"
                />
              </div>
            ))}
          </div>

          {error && (
            <p className="text-[11px] text-[#f87171]/70 font-light text-center">
              {error}
            </p>
          )}

          <div className="flex flex-col items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !handleValid || !form.full_name || !form.handle}
              className="w-[280px] border border-primary/20 text-primary font-medium text-sm tracking-wide uppercase py-3 px-6 rounded-sm text-center transition-all duration-200 ease-out hover:border-primary/50 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {saving ? "Creating…" : "Create profile →"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
