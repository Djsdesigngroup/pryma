"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ContextMode } from "@/types/profile";
import { normalizeUrl } from "@/lib/profile";
import { PrymaLogo } from "@/components/PrymaLogo";
import { SegmentedControl } from "@/components/SegmentedControl";
import { HandleInput } from "@/components/HandleInput";

interface EditForm {
  handle: string;
  full_name: string;
  role_title: string;
  organization: string;
  avatar_url: string;
  phone: string;
  email: string;
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
  phone: "",
  email: "",
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
  const [activeContext, setActiveContext] = useState<ContextMode>("public");
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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("[edit] profile load error:", profileError.message);
      }

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
        phone: profile.phone ?? "",
        email: profile.email ?? "",
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
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    // Timestamp in path ensures each upload is a unique object — prevents
    // browsers and CDN from serving a stale cached version of the old photo.
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    console.log("[edit] avatar upload →", { path, size: file.size, type: file.type });

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      console.error("[edit] avatar upload failed:", uploadError.message);
      setError(`Photo upload failed: ${uploadError.message}`);
      setAvatarLoading(false);
      return;
    }

    // getPublicUrl is synchronous — it constructs the URL without a network
    // request. The URL is only accessible if the "avatars" bucket has Public
    // access enabled in Supabase Storage settings.
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const newUrl = urlData.publicUrl;
    console.log("[edit] avatar public URL:", newUrl);

    // Update React state immediately so the avatar preview reflects the new photo.
    setForm((prev) => ({ ...prev, avatar_url: newUrl }));
    setSaved(false);

    // Persist avatar_url to the DB right away — don't require the user to
    // manually click Save. A photo upload should be an atomic, immediate action.
    const { error: dbError } = await supabase
      .from("profiles")
      .update({ avatar_url: newUrl, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (dbError) {
      console.error("[edit] avatar_url DB save failed:", dbError.message);
      // Non-fatal — photo is in storage, but the row doesn't reference it yet.
      // Surface a warning but don't block the user.
      setError(`Photo uploaded but not saved: ${dbError.message}`);
    } else {
      console.log("[edit] avatar_url saved to DB ✓");
    }

    setAvatarLoading(false);
  }

  async function handleSave() {
    if (!userId || !handleValid) return;
    setSaving(true);
    setError(null);

    // Normalize website URLs before persisting — bare domains get https://
    const normalizedPublicWebsite = normalizeUrl(form.public_website);
    const normalizedProfWebsite = normalizeUrl(form.professional_website);

    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("profiles")
      .update({
        handle: form.handle,
        full_name: form.full_name,
        role_title: form.role_title || null,
        organization: form.organization || null,
        avatar_url: form.avatar_url || null,
        phone: form.phone || null,
        email: form.email || null,
        public_bio: form.public_bio || null,
        public_website: normalizedPublicWebsite || null,
        public_location: form.public_location || null,
        professional_bio: form.professional_bio || null,
        professional_website: normalizedProfWebsite || null,
        professional_location: form.professional_location || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    setSaving(false);
    if (saveError) {
      console.error("[edit] save error:", saveError.message);
      setError(saveError.message);
    } else {
      // Reflect normalized URLs back into form state so inputs show canonical
      // values (e.g. "pryma.id" → "https://pryma.id")
      setForm((prev) => ({
        ...prev,
        public_website: normalizedPublicWebsite,
        professional_website: normalizedProfWebsite,
      }));
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

  // Bio preview tracks whichever context is active
  const activeBioPreview =
    activeContext === "professional" ? form.professional_bio : form.public_bio;

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
            {avatarLoading ? "Uploading…" : form.avatar_url ? "Change photo" : "Add photo"}
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

        {/* Identity — handle, name, role, org, phone, email */}
        <div className="flex flex-col gap-5">
          <HandleInput
            value={form.handle}
            onChange={(v) => set("handle", v)}
            currentHandle={originalHandle}
            onValidChange={setHandleValid}
          />
          {(
            [
              { key: "full_name",    label: "Full name",     required: true, type: "text"  },
              { key: "role_title",   label: "Role / title",                  type: "text"  },
              { key: "organization", label: "Organization",                  type: "text"  },
              { key: "phone",        label: "Phone",                         type: "tel"   },
              { key: "email",        label: "Email",                         type: "email" },
            ] as const
          ).map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label
                htmlFor={field.key}
                className="font-light text-xs text-muted tracking-wide uppercase"
              >
                {field.label}
                {"required" in field && field.required && <span className="ml-1">*</span>}
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

        {/* ── Context section ────────────────────────────────────────────────
            Toggle at the top controls which fields are visible.
            Switching tabs preserves unsaved edits for both contexts in memory.
            Preview box at the bottom reflects the active context live.
        ─────────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* Toggle — self-explanatory, no separate label needed */}
          <div className="flex justify-center">
            <SegmentedControl value={activeContext} onChange={setActiveContext} />
          </div>

          {/* Active context fields only — the inactive context's values are
              preserved in form state and restored when you switch back. */}
          {activeContext === "public" ? (
            <div className="flex flex-col gap-5">
              <ContextFields ctx="public" form={form} set={set} />
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <ContextFields ctx="professional" form={form} set={set} />
            </div>
          )}

          {/* Live preview — inline end-cap of the context section.
              Reflects the first paragraph of the active bio as it's typed. */}
          <div className="w-full rounded-xl border border-border/30 bg-surface/30 px-4 py-3 min-h-[56px]">
            {activeBioPreview ? (
              <p className="text-sm font-light text-muted/70 leading-[1.55]">
                {activeBioPreview.split("\n\n")[0]}
              </p>
            ) : (
              <p className="text-sm font-light text-muted/30 italic">
                Bio preview…
              </p>
            )}
          </div>

        </div>

        <div className="border-t border-border opacity-20" />

        {error && (
          <p className="text-[11px] text-[#f87171]/70 font-light text-center -mt-4">
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
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save profile"}
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

// ── ContextFields ─────────────────────────────────────────────────────────────
// Extracted so the two conditional branches above stay readable.
// Renders bio textarea + website + location for a single context.
// ─────────────────────────────────────────────────────────────────────────────

interface ContextFieldsProps {
  ctx: "public" | "professional";
  form: EditForm;
  set: (key: keyof EditForm, value: string) => void;
}

function ContextFields({ ctx, form, set }: ContextFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="font-light text-xs text-muted tracking-wide uppercase">
          Bio
        </label>
        <textarea
          value={form[`${ctx}_bio` as keyof EditForm]}
          onChange={(e) => set(`${ctx}_bio` as keyof EditForm, e.target.value)}
          rows={4}
          placeholder="Bio…"
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-light text-primary placeholder:text-muted outline-none focus:border-primary/30 transition-colors duration-200 ease-out resize-none leading-relaxed"
        />
      </div>
      {(
        [
          { suffix: "website",  label: "Website",  type: "url"  },
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
    </>
  );
}
