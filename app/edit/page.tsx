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
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    console.log("[edit] avatar upload →", {
      intendedPath: path,
      size: file.size,
      type: file.type,
    });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      console.error("[edit] avatar upload failed:", {
        message: uploadError.message,
        status: (uploadError as { status?: number }).status,
        statusCode: (uploadError as { statusCode?: string }).statusCode,
      });
      setError(`Photo upload failed: ${uploadError.message}`);
      setAvatarLoading(false);
      return;
    }

    const confirmedPath = uploadData.path;
    console.log("[edit] avatar upload ✓", {
      confirmedPath,
      fullPath: uploadData.fullPath,
    });

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(confirmedPath);

    const newUrl = urlData.publicUrl;
    console.log("[edit] avatar public URL:", newUrl);

    setForm((prev) => ({ ...prev, avatar_url: newUrl }));
    setSaved(false);

    const { error: dbError } = await supabase
      .from("profiles")
      .update({ avatar_url: newUrl, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (dbError) {
      console.error("[edit] avatar_url DB save failed:", dbError.message);
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
    router.push("/auth");
  }

  const activeBio =
    activeContext === "professional" ? form.professional_bio : form.public_bio;

  const activeWebsite =
    activeContext === "professional"
      ? form.professional_website
      : form.public_website;

  const activeLocation =
    activeContext === "professional"
      ? form.professional_location
      : form.public_location;

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
        <div className="flex flex-col items-center gap-4">
          <PrymaLogo size={24} />
          <p className="font-light text-sm text-muted tracking-wide uppercase">
            Edit profile
          </p>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-5">
            <HandleInput
              value={form.handle}
              onChange={(v) => set("handle", v)}
              currentHandle={originalHandle}
              onValidChange={setHandleValid}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <SegmentedControl value={activeContext} onChange={setActiveContext} />
            <p className="font-light text-[10px] text-muted/50 tracking-widest uppercase">
              Editing: {activeContext}
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="font-light text-[10px] text-muted/50 tracking-widest uppercase">
                Profile photo
              </p>
            </div>

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
                className="font-light text-[11px] text-muted hover:text-secondary transition-colors duration-200 ease-out tracking-wide uppercase disabled:opacity-50"
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
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="font-light text-[10px] text-muted/50 tracking-widest uppercase">
                Profile details
              </p>
            </div>

            {(
              [
                { key: "full_name", label: "Full name", required: true, type: "text" },
                { key: "role_title", label: "Role / title", type: "text" },
                { key: "organization", label: "Organization", type: "text" },
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

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="font-light text-[10px] text-muted/50 tracking-widest uppercase">
                Contact
              </p>
            </div>

            {(
              [
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

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p className="font-light text-[10px] text-muted/50 tracking-widest uppercase">
                {activeContext} view
              </p>
            </div>

            {activeContext === "public" ? (
              <ContextFields key="public" ctx="public" form={form} set={set} />
            ) : (
              <ContextFields
                key="professional"
                ctx="professional"
                form={form}
                set={set}
              />
            )}
          </div>

          <div className="border-t border-border opacity-20" />

          <div className="flex flex-col gap-2">
            <p className="font-light text-[10px] text-muted/50 tracking-widest uppercase text-center">
              Preview
            </p>

            <div className="w-full rounded-[28px] border border-border/40 bg-surface/60 px-5 py-6 flex flex-col items-center text-center gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              <div className="w-20 h-20 rounded-full overflow-hidden border border-border/30 flex items-center justify-center">
                {form.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-muted text-2xl font-light select-none">
                    {form.full_name?.charAt(0)?.toUpperCase() || "+"}
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center gap-1">
                <p className="text-[18px] font-medium tracking-[-0.01em] text-primary">
                  {form.full_name || "Your name"}
                </p>

                {(form.role_title || form.organization) && (
                  <p className="text-[13px] font-light text-secondary/80">
                    {[form.role_title, form.organization].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>

              <div className="w-full max-w-[320px] flex flex-col items-center gap-2">
                {activeBio ? (
                  <p className="text-sm font-light text-muted/80 leading-[1.6] whitespace-pre-wrap">
                    {activeBio}
                  </p>
                ) : (
                  <p className="text-sm font-light text-muted/30 italic">
                    Add a bio to shape how you appear.
                  </p>
                )}

                {activeWebsite && (
                  <p className="text-xs font-light text-secondary break-all">
                    {activeWebsite}
                  </p>
                )}

                {activeLocation && (
                  <p className="text-xs font-light text-muted/70">
                    {activeLocation}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border opacity-20" />

        {error && (
          <p className="text-[11px] text-[#f87171]/70 font-light text-center -mt-4">
            {error}
          </p>
        )}

        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !handleValid}
            className="w-[280px] border border-primary/20 text-primary font-medium text-sm tracking-wide uppercase py-3 px-6 rounded-sm text-center transition-all duration-200 ease-out hover:border-primary/50 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
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

interface ContextFieldsProps {
  ctx: "public" | "professional";
  form: EditForm;
  set: (key: keyof EditForm, value: string) => void;
}

function ContextFields({ ctx, form, set }: ContextFieldsProps) {
  const bioKey = `${ctx}_bio` as keyof EditForm;
  const webKey = `${ctx}_website` as keyof EditForm;
  const locKey = `${ctx}_location` as keyof EditForm;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="font-light text-xs text-muted tracking-wide uppercase">
          Bio
        </label>
        <textarea
          value={form[bioKey]}
          onChange={(e) => set(bioKey, e.target.value)}
          rows={4}
          placeholder="Bio…"
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-light text-primary placeholder:text-muted outline-none focus:border-primary/30 transition-colors duration-200 ease-out resize-none leading-relaxed"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-light text-xs text-muted tracking-wide uppercase">
          Website
        </label>
        <input
          type="url"
          value={form[webKey]}
          onChange={(e) => set(webKey, e.target.value)}
          placeholder="Website…"
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-light text-primary placeholder:text-muted outline-none focus:border-primary/30 transition-colors duration-200 ease-out"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-light text-xs text-muted tracking-wide uppercase">
          Location
        </label>
        <input
          type="text"
          value={form[locKey]}
          onChange={(e) => set(locKey, e.target.value)}
          placeholder="Location…"
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-light text-primary placeholder:text-muted outline-none focus:border-primary/30 transition-colors duration-200 ease-out"
        />
      </div>
    </>
  );
}