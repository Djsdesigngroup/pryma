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

  public_full_name: string;
  professional_full_name: string;

  public_role_title: string;
  professional_role_title: string;

  public_organization: string;
  professional_organization: string;

  public_avatar_url: string;
  professional_avatar_url: string;

  public_phone: string;
  professional_phone: string;

  public_email: string;
  professional_email: string;

  public_bio: string;
  professional_bio: string;

  public_website: string;
  professional_website: string;

  public_location: string;
  professional_location: string;
}

const EMPTY: EditForm = {
  handle: "",

  public_full_name: "",
  professional_full_name: "",

  public_role_title: "",
  professional_role_title: "",

  public_organization: "",
  professional_organization: "",

  public_avatar_url: "",
  professional_avatar_url: "",

  public_phone: "",
  professional_phone: "",

  public_email: "",
  professional_email: "",

  public_bio: "",
  professional_bio: "",

  public_website: "",
  professional_website: "",

  public_location: "",
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

        public_full_name: profile.public_full_name ?? "",
        professional_full_name: profile.professional_full_name ?? "",

        public_role_title: profile.public_role_title ?? "",
        professional_role_title: profile.professional_role_title ?? "",

        public_organization: profile.public_organization ?? "",
        professional_organization: profile.professional_organization ?? "",

        public_avatar_url: profile.public_avatar_url ?? "",
        professional_avatar_url: profile.professional_avatar_url ?? "",

        public_phone: profile.public_phone ?? "",
        professional_phone: profile.professional_phone ?? "",

        public_email: profile.public_email ?? "",
        professional_email: profile.professional_email ?? "",

        public_bio: profile.public_bio ?? "",
        professional_bio: profile.professional_bio ?? "",

        public_website: profile.public_website ?? "",
        professional_website: profile.professional_website ?? "",

        public_location: profile.public_location ?? "",
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

  const fullNameKey = `${activeContext}_full_name` as keyof EditForm;
  const roleTitleKey = `${activeContext}_role_title` as keyof EditForm;
  const organizationKey = `${activeContext}_organization` as keyof EditForm;
  const avatarKey = `${activeContext}_avatar_url` as keyof EditForm;
  const phoneKey = `${activeContext}_phone` as keyof EditForm;
  const emailKey = `${activeContext}_email` as keyof EditForm;
  const bioKey = `${activeContext}_bio` as keyof EditForm;
  const websiteKey = `${activeContext}_website` as keyof EditForm;
  const locationKey = `${activeContext}_location` as keyof EditForm;

  const activeName = form[fullNameKey];
  const activeRole = form[roleTitleKey];
  const activeOrganization = form[organizationKey];
  const activeAvatar = form[avatarKey];
  const activePhone = form[phoneKey];
  const activeEmail = form[emailKey];
  const activeBio = form[bioKey];
  const activeWebsite = form[websiteKey];
  const activeLocation = form[locationKey];

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setAvatarLoading(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/${activeContext}-avatar-${Date.now()}.${ext}`;

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
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(confirmedPath);

    const newUrl = urlData.publicUrl;

    setForm((prev) => ({ ...prev, [avatarKey]: newUrl }));
    setSaved(false);

    const { error: dbError } = await supabase
      .from("profiles")
      .update({ [avatarKey]: newUrl, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (dbError) {
      console.error("[edit] avatar DB save failed:", dbError.message);
      setError(`Photo uploaded but not saved: ${dbError.message}`);
    }

    setAvatarLoading(false);
  }

  async function handleSave() {
    if (!userId || !handleValid) return;

    setSaving(true);
    setError(null);

    const normalizedPublicWebsite = normalizeUrl(form.public_website);
    const normalizedProfessionalWebsite = normalizeUrl(form.professional_website);

    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("profiles")
      .update({
        handle: form.handle,

        public_full_name: form.public_full_name || null,
        professional_full_name: form.professional_full_name || null,

        public_role_title: form.public_role_title || null,
        professional_role_title: form.professional_role_title || null,

        public_organization: form.public_organization || null,
        professional_organization: form.professional_organization || null,

        public_avatar_url: form.public_avatar_url || null,
        professional_avatar_url: form.professional_avatar_url || null,

        public_phone: form.public_phone || null,
        professional_phone: form.professional_phone || null,

        public_email: form.public_email || null,
        professional_email: form.professional_email || null,

        public_bio: form.public_bio || null,
        professional_bio: form.professional_bio || null,

        public_website: normalizedPublicWebsite || null,
        professional_website: normalizedProfessionalWebsite || null,

        public_location: form.public_location || null,
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
        professional_website: normalizedProfessionalWebsite,
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
          <HandleInput
            value={form.handle}
            onChange={(v) => set("handle", v)}
            currentHandle={originalHandle}
            onValidChange={setHandleValid}
          />

          <div className="flex flex-col items-center gap-2">
            <SegmentedControl value={activeContext} onChange={setActiveContext} />
            <p className="font-light text-[10px] text-muted/50 tracking-widest uppercase">
              Editing: {activeContext}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-light text-[10px] text-muted/50 tracking-widest uppercase">
              Profile photo
            </p>

            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="w-20 h-20 rounded-full overflow-hidden border border-border/30 flex items-center justify-center transition-all duration-200 ease-out hover:border-primary/30 group"
                aria-label="Change profile photo"
              >
                {activeAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeAvatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-muted text-2xl font-light group-hover:text-secondary transition-colors duration-200 select-none">
                    {activeName?.charAt(0)?.toUpperCase() || "+"}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="font-light text-[11px] text-muted hover:text-secondary transition-colors duration-200 ease-out tracking-wide uppercase disabled:opacity-50"
              >
                {avatarLoading ? "Uploading…" : activeAvatar ? "Change photo" : "Add photo"}
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
            <EditableField
              label="Full name"
              value={activeName}
              onChange={(value) => set(fullNameKey, value)}
              placeholder="Full name…"
              required
            />

            <EditableField
              label="Role / title"
              value={activeRole}
              onChange={(value) => set(roleTitleKey, value)}
              placeholder="Role / title…"
            />

            <EditableField
              label="Organization"
              value={activeOrganization}
              onChange={(value) => set(organizationKey, value)}
              placeholder="Organization…"
            />

            <EditableField
              label="Phone"
              value={activePhone}
              onChange={(value) => set(phoneKey, value)}
              placeholder="Phone…"
              type="tel"
            />

            <EditableField
              label="Email"
              value={activeEmail}
              onChange={(value) => set(emailKey, value)}
              placeholder="Email…"
              type="email"
            />

            <div className="flex flex-col gap-1.5">
              <label className="font-light text-xs text-muted tracking-wide uppercase">
                Bio
              </label>
              <textarea
                value={activeBio}
                onChange={(e) => set(bioKey, e.target.value)}
                rows={4}
                placeholder="Bio…"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-light text-primary placeholder:text-muted outline-none focus:border-primary/30 transition-colors duration-200 ease-out resize-none leading-relaxed"
              />
            </div>

            <EditableField
              label="Website"
              value={activeWebsite}
              onChange={(value) => set(websiteKey, value)}
              placeholder="Website…"
              type="url"
            />

            <EditableField
              label="Location"
              value={activeLocation}
              onChange={(value) => set(locationKey, value)}
              placeholder="Location…"
            />
          </div>

          <div className="border-t border-border opacity-20" />

          <div className="flex flex-col gap-2">
            <p className="font-light text-[10px] text-muted/50 tracking-widest uppercase text-center">
              Preview
            </p>

            <div className="w-full rounded-[28px] border border-border/40 bg-surface/60 px-5 py-6 flex flex-col items-center text-center gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              <div className="w-20 h-20 rounded-full overflow-hidden border border-border/30 flex items-center justify-center">
                {activeAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeAvatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-muted text-2xl font-light select-none">
                    {activeName?.charAt(0)?.toUpperCase() || "+"}
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center gap-1">
                <p className="text-[18px] font-medium tracking-[-0.01em] text-primary">
                  {activeName || "Your name"}
                </p>

                {(activeRole || activeOrganization) && (
                  <p className="text-[13px] font-light text-secondary/80">
                    {[activeRole, activeOrganization].filter(Boolean).join(" · ")}
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

interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
  required?: boolean;
}

function EditableField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: EditableFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-light text-xs text-muted tracking-wide uppercase">
        {label}
        {required && <span className="ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-light text-primary placeholder:text-muted outline-none focus:border-primary/30 transition-colors duration-200 ease-out"
      />
    </div>
  );
}