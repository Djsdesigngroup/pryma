"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ContextMode } from "@/types/profile";
import { PrymaLogo } from "@/components/PrymaLogo";
import { SegmentedControl } from "@/components/SegmentedControl";
import { HandleInput } from "@/components/HandleInput";

interface EditForm {
  handle: string;
  full_name: string;
  role_title: string;
  organization: string;
  avatar_url: string;
  public_bio: string;
  public_website: string;
  public_location: string;
  professional_bio: string;
  professional_website: string;
  professional_location: string;
}

const EMPTY: EditForm = {
  handle: "",
  full_name: "",
  role_title: "",
  organization: "",
  avatar_url: "",
  public_bio: "",
  public_website: "",
  public_location: "",
  professional_bio: "",
  professional_website: "",
  professional_location: "",
};

export default function EditPage() {
  const router = useRouter();
  const [form, setForm] = useState<EditForm>(EMPTY);
  const [originalHandle, setOriginalHandle] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [handleValid, setHandleValid] = useState(true);
  const [previewMode, setPreviewMode] = useState<ContextMode>("public");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) {
        router.replace("/onboarding");
        return;
      }

      setUserId(user.id);
      setOriginalHandle(profile.handle);
      setHandleValid(true);
      setForm({
        handle: profile.handle,
        full_name: profile.full_name,
        role_title: profile.role_title ?? "",
        organization: profile.organization ?? "",
        avatar_url: profile.avatar_url ?? "",
        public_bio: profile.public_bio ?? "",
        public_website: profile.public_website ?? "",
        public_location: profile.public_location ?? "",
        professional_bio: profile.professional_bio ?? "",
        professional_website: profile.professional_website ?? "",
        professional_location: profile.professional_location ?? "",
      });
    }
    load();
  }, [router]);

  function set(key: keyof EditForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setError(null);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setAvatarLoading(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (!uploadError) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      set("avatar_url", data.publicUrl);
    }
    setAvatarLoading(false);
  }

  async function handleSave() {
    if (!userId || !handleValid) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("profiles")
      .update({
        handle: form.handle,
        full_name: form.full_name,
        role_title: form.role_title || null,
        organization: form.organization || null,
        avatar_url: form.avatar_url || null,
        public_bio: form.public_bio || null,
        public_website: form.public_website || null,
        public_location: form.public_location || null,
        professional_bio: form.professional_bio || null,
        professional_website: form.professional_website || null,
        professional_location: form.professional_location || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
    } else {
      setSaved(true);
      setOriginalHandle(form.handle);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const activeBioPreview =
    previewMode === "professional" ? form.professional_bio : form.public_bio;

  if (!userId) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="text-muted text-sm font-light">Loading…</span>
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
            Edit profile
          </p>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarLoading}
            className="w-20 h-20 rounded-full overflow-hidden border border-border/30 flex items-center justify-center transition-all duration-200 ease-out hover:border-primary/30 group"
            aria-label="Change profile photo"
          >
            {form.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-muted text-2xl font-light group-hover:text-secondary transition-colors duration-200 select-none">
                {form.full_name?.charAt(0)?.toUpperCase() || "+"}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarLoading}
            className="font-light text-xs text-muted hover:text-secondary transition-colors duration-200 ease-out tracking-wide uppercase disabled:opacity-50"
          >
            {avatarLoading
              ? "Uploading…"
              : form.avatar_url
              ? "Change photo"
              : "Add photo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="border-t border-border opacity-20" />

        {/* Identity */}
        <div className="flex flex-col gap-5">
          <HandleInput
            value={form.handle}
            onChange={(v) => set("handle", v)}
            currentHandle={originalHandle}
            onValidChange={setHandleValid}
          />
          {(
            [
              { key: "full_name", label: "Full name", required: true },
              { key: "role_title", label: "Role / title" },
              { key: "organization", label: "Organization" },
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
                type="text"
                value={form[field.key]}
                onChange={(e) => set(field.key, e.target.value)}
                placeholder={`${field.label}…`}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-light text-primary placeholder:text-muted outline-none focus:border-primary/30 transition-colors duration-200 ease-out"
              />
            </div>
          ))}
        </div>

        <div className="border-t border-border opacity-20" />

        {/* Context sections */}
        {(["public", "professional"] as ContextMode[]).map((ctx) => (
          <div key={ctx} className="flex flex-col gap-5">
            <p className="font-light text-[10px] text-muted tracking-widest uppercase">
              {ctx} context
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="font-light text-xs text-muted tracking-wide uppercase">
                Bio
              </label>
              <textarea
                value={form[`${ctx}_bio` as keyof EditForm]}
                onChange={(e) =>
                  set(`${ctx}_bio` as keyof EditForm, e.target.value)
                }
                rows={4}
                placeholder="Bio…"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-light text-primary placeholder:text-muted outline-none focus:border-primary/30 transition-colors duration-200 ease-out resize-none leading-relaxed"
              />
            </div>
            {(
              [
                { suffix: "website", label: "Website", type: "url" },
                { suffix: "location", label: "Location", type: "text" },
              ] as const
            ).map(({ suffix, label, type }) => {
              const key = `${ctx}_${suffix}` as keyof EditForm;
              return (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="font-light text-xs text-muted tracking-wide uppercase">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={`${label}…`}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-light text-primary placeholder:text-muted outline-none focus:border-primary/30 transition-colors duration-200 ease-out"
                  />
                </div>
              );
            })}
          </div>
        ))}

        <div className="border-t border-border opacity-20" />

        {/* Preview mode */}
        <div className="flex flex-col items-center gap-3">
          <p className="font-light text-[10px] text-muted tracking-widest uppercase">
            Preview as
          </p>
          <SegmentedControl value={previewMode} onChange={setPreviewMode} />
          <div className="w-full rounded-xl border border-border/40 px-4 py-3 min-h-[60px]">
            {activeBioPreview ? (
              <p className="text-sm font-light text-secondary leading-[1.55]">
                {activeBioPreview.split("\n\n")[0]}
              </p>
            ) : (
              <p className="text-sm font-light text-muted/50 italic">
                No bio set for {previewMode} context
              </p>
            )}
          </div>
        </div>

        {error && (
          <p className="text-[11px] text-[#f87171]/70 font-light text-center">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !handleValid}
            className="w-[280px] border border-primary/20 text-primary font-medium text-sm tracking-wide uppercase py-3 px-6 rounded-sm text-center transition-all duration-200 ease-out hover:border-primary/50 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : saved ? "Saved" : "Save profile"}
          </button>
          <button
            type="button"
            onClick={() => window.open(`/u/${form.handle}`, "_blank")}
            className="w-[280px] text-secondary font-medium text-sm tracking-wide uppercase py-3 px-6 rounded-sm text-center transition-all duration-200 ease-out hover:text-primary"
          >
            View profile →
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="font-light text-xs text-muted hover:text-secondary transition-colors duration-200 ease-out tracking-wide uppercase mt-4"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
