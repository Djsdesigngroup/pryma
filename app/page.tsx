import Link from "next/link";
import { PrymaLogo } from "@/components/PrymaLogo";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center text-center gap-10 max-w-profile w-full">
        {/* Logo — size matches profile page for system consistency */}
        <PrymaLogo size={35} />

        {/* Copy */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-medium text-2xl tracking-[-0.01em] text-primary leading-snug">
            Pryma is the internet-first contact card.
          </h1>
          <p className="font-light text-sm text-secondary leading-relaxed">
            A cleaner way to share who you are online — without oversharing.
          </p>
          <p className="font-light text-xs text-muted/70 leading-relaxed mt-1">
            Send your Pryma instead of your number.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3">
          {/* Primary */}
          <Link
            href="/auth"
            className="w-[280px] border border-primary/25 text-secondary font-medium text-sm tracking-wide uppercase py-3 px-6 rounded-sm text-center transition-all duration-[120ms] ease-out hover:border-primary/50 hover:text-primary hover:bg-white/[0.05] active:scale-[0.98] active:brightness-90"
          >
            Create your Pryma
          </Link>
          {/* Secondary */}
          <Link
            href="/u/dom"
            className="w-[280px] border border-primary/15 text-secondary/70 font-medium text-sm tracking-wide uppercase py-3 px-6 rounded-sm text-center transition-all duration-[120ms] ease-out hover:border-primary/30 hover:text-secondary hover:bg-white/[0.05] active:scale-[0.98] active:brightness-90"
          >
            View demo profile
          </Link>
        </div>
      </div>
    </main>
  );
}
