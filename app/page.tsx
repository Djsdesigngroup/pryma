import Link from "next/link";
import { PrymaLogo } from "@/components/PrymaLogo";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center text-center gap-10 max-w-profile w-full">
        {/* Logo */}
        <PrymaLogo size={32} />

        {/* Copy */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-medium text-2xl tracking-[-0.02em] text-primary leading-snug">
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
          <Link
            href="/auth"
            className="w-[280px] border border-primary/20 text-primary font-medium text-sm tracking-wide uppercase py-3 px-6 rounded-sm text-center transition-all duration-200 ease-out hover:border-primary/50 hover:bg-white/5"
          >
            Create your Pryma
          </Link>
          <Link
            href="/u/dom"
            className="w-[280px] text-secondary font-medium text-sm tracking-wide uppercase py-3 px-6 rounded-sm text-center transition-all duration-200 ease-out hover:text-primary"
          >
            View demo profile
          </Link>
        </div>
      </div>
    </main>
  );
}
