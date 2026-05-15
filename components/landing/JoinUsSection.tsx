import Link from "next/link";

export function JoinUsSection() {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:py-32">
      {/* Subtle yellow accent lines (decorative) — mirrors the live page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(120deg, transparent 35%, rgba(222,179,4,0.45) 36%, rgba(222,179,4,0.45) 36.4%, transparent 36.5%), linear-gradient(120deg, transparent 60%, rgba(222,179,4,0.45) 61%, rgba(222,179,4,0.45) 61.3%, transparent 61.5%)",
        }}
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <h2 className="text-4xl font-bold text-white/55 sm:text-5xl">
          Join Us
        </h2>
        <p className="mt-6 max-w-xl text-base text-white/70 sm:text-lg">
          Unleash Young Potential Power. Focus of Develop Young Player
        </p>
        <p className="mt-2 text-sm text-white/60">#HypeWin</p>
        <Link
          href="/register"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-[10px] bg-white px-6 text-sm font-medium text-black shadow-md transition hover:bg-white/90"
        >
          Join Now
        </Link>
      </div>
    </section>
  );
}
