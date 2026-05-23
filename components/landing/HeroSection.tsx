import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Trophy, Users } from "lucide-react";

const STATS = [
  { value: "5+", label: "Championships" },
  { value: "4+", label: "Years Active" },
  { value: "100+", label: "Players Groomed" },
];

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-[#070707]">
      {/* Dot grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(245,196,0,0.18) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.22,
        }}
      />

      {/* Right radial glow */}
      <div
        className="pointer-events-none absolute right-0 top-1/2 h-[700px] w-[700px] -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(245,196,0,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Diagonal stripe */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(112deg, transparent 56%, rgba(245,196,0,0.03) 56.1%, rgba(245,196,0,0.035) 100%)",
        }}
      />

      {/* Corner brackets */}
      <div className="absolute left-6 top-24 h-12 w-12 border-l-2 border-t-2 border-[#F5C400]/25 sm:left-10 sm:h-16 sm:w-16" />
      <div className="absolute bottom-12 right-6 h-12 w-12 border-b-2 border-r-2 border-[#F5C400]/25 sm:right-10 sm:h-16 sm:w-16" />

      {/* Main content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-28 sm:px-10 lg:px-16">
        {/* Label bar */}
        <div className="mb-7 flex items-center gap-3">
          <div className="h-px w-10 bg-[#F5C400]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
            Est. 2020 · Palembang, Indonesia
          </span>
        </div>

        {/* Heading */}
        <p className="mb-1 text-base font-bold uppercase tracking-[0.5em] text-white/20 sm:text-lg">
          WE ARE
        </p>
        <h1
          className="text-[clamp(3.2rem,9vw,7rem)] font-black uppercase leading-[0.88] tracking-tight text-[#F5C400]"
          style={{
            textShadow:
              "0 0 60px rgba(245,196,0,0.22), 0 0 120px rgba(245,196,0,0.08)",
          }}
        >
          HYPERION
          <br />
          TEAM
        </h1>

        {/* Tagline */}
        <p className="mt-7 max-w-md text-sm leading-relaxed text-white/45 sm:text-base">
          Empowering Young Talents to Rise and Rule.
          <br className="hidden sm:block" />
          Focused on Growth. Driven to Win.
        </p>

        {/* Stats */}
        <div className="mt-10 flex flex-wrap items-center gap-2 sm:gap-0">
          {STATS.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              {i > 0 && (
                <div className="mx-6 hidden h-10 w-px bg-white/10 sm:block" />
              )}
              <div className={i > 0 ? "ml-4 sm:ml-0" : ""}>
                <p className="text-3xl font-black text-[#F5C400] sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-widest text-white/30">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="#achievements"
            className="inline-flex h-12 items-center gap-2.5 bg-[#F5C400] px-7 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-yellow-300"
          >
            <Trophy className="h-4 w-4" />
            Our Achievements
          </Link>
          <Link
            href="/register"
            className="inline-flex h-12 items-center gap-2.5 border border-[#F5C400]/35 px-7 text-sm font-bold uppercase tracking-wide text-[#F5C400] transition hover:border-[#F5C400] hover:bg-[#F5C400]/8"
          >
            <Users className="h-4 w-4" />
            Join Team
          </Link>
        </div>
      </div>

      {/* Faded logo decoration (right, desktop only) */}
      <div className="pointer-events-none absolute right-0 top-0 hidden h-full items-center pr-14 lg:flex xl:pr-24">
        <Image
          src="/brand/logo.jpg"
          alt=""
          aria-hidden
          width={420}
          height={420}
          className="h-[340px] w-[340px] rounded-2xl object-cover xl:h-[400px] xl:w-[400px]"
          style={{ opacity: 0.07, filter: "saturate(0.2)" }}
        />
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
        <span className="text-[9px] uppercase tracking-[0.35em] text-white/20">
          Scroll
        </span>
        <ChevronDown className="h-4 w-4 animate-bounce text-[#F5C400]/40" />
      </div>
    </section>
  );
}
