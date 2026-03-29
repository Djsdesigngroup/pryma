"use client";

import { useRef, useState } from "react";
import { SegmentedControl } from "@/components/SegmentedControl";

type ContextMode = "public" | "professional";

export default function EditPage() {
  const [activeContext, setActiveContext] = useState<ContextMode>("public");

  const [form, setForm] = useState({
    full_name: "Dominic Santalucia",
    role_title: "Founder",
    organization: "Pryma",
    avatar_url: "",
    public_bio: "Focused on identity, trust, and how we interact online.",
    professional_bio: "",
    public_website: "https://djsdesigngroup.com/",
    professional_website: "",
    public_location: "PA",
    professional_location: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading] = useState(false);

  const activeBio =
    activeContext === "professional"
      ? form.professional_bio
      : form.public_bio;

  const activeWebsite =
    activeContext === "professional"
      ? form.professional_website
      : form.public_website;

  const activeLocation =
    activeContext === "professional"
      ? form.professional_location
      : form.public_location;

  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col gap-6 py-10">

      {/* HEADER */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs tracking-widest text-muted/50 uppercase">
          Edit Profile
        </p>
      </div>

      {/* CONTEXT TOGGLE */}
      <div className="flex flex-col items-center gap-2">
        <SegmentedControl value={activeContext} onChange={setActiveContext} />
        <p className="font-light text-[10px] text-muted/50 tracking-widest uppercase">
          Editing: {activeContext}
        </p>
      </div>

      {/* PREVIEW LABEL */}
      <p className="font-light text-[10px] text-muted/50 tracking-widest uppercase text-center">
        Preview
      </p>

      {/* PREVIEW CARD */}
      <div className="w-full rounded-[28px] border border-border/40 bg-surface/60 px-5 py-6 flex flex-col items-center text-center gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">

        {/* AVATAR */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={avatarLoading}
          className="w-20 h-20 rounded-full overflow-hidden border border-border/30 flex items-center justify-center transition-all duration-200 ease-out hover:border-primary/30 group"
        >
          {form.avatar_url ? (
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

        {/* NAME + ROLE */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-[18px] font-medium tracking-[-0.01em] text-primary">
            {form.full_name || "Your name"}
          </p>

          {(form.role_title || form.organization) && (
            <p className="text-[13px] font-light text-secondary/80">
              {[form.role_title, form.organization]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>

        {/* BIO + META */}
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

      {/* FORM (SIMPLIFIED FOR SAFETY — KEEP YOUR ORIGINAL BELOW IF NEEDED) */}
      <div className="flex flex-col gap-4">

        <input
          type="text"
          placeholder="Full name"
          value={form.full_name}
          onChange={(e) =>
            setForm({ ...form, full_name: e.target.value })
          }
          className="w-full px-4 py-3 rounded-xl bg-surface border border-border/30 text-sm outline-none"
        />

        <textarea
          placeholder="Bio"
          value={activeContext === "professional" ? form.professional_bio : form.public_bio}
          onChange={(e) =>
            setForm({
              ...form,
              [activeContext === "professional" ? "professional_bio" : "public_bio"]: e.target.value,
            })
          }
          className="w-full px-4 py-3 rounded-xl bg-surface border border-border/30 text-sm outline-none resize-none"
        />

      </div>

      {/* ACTIONS */}
      <button className="w-full py-3 border border-border/40 rounded-xl text-sm tracking-wide hover:bg-white/5 transition">
        Save changes
      </button>

    </div>
  );
}