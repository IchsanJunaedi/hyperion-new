import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:py-32">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <Image
          src="/brand/logo.jpg"
          alt="Hyperion Team"
          width={120}
          height={120}
          priority
          className="h-24 w-24 rounded-md object-cover sm:h-28 sm:w-28"
        />
        <h1 className="mt-8 text-3xl font-bold tracking-tight text-white/55 sm:text-4xl">
          WE ARE
        </h1>
        <h1
          className="mt-2 text-5xl font-bold tracking-tight sm:text-7xl"
          style={{ color: "rgb(222, 179, 4)" }}
        >
          HYPERION TEAM
        </h1>
        <p className="mt-8 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
          Empowering Young Talents to Rise and Rule.
          <br className="hidden sm:block" /> Focused on Growth. Driven to Win.
        </p>
        <Link
          href="#achievements"
          className="mt-10 inline-flex h-11 items-center justify-center rounded-[10px] bg-white px-6 text-sm font-medium text-black shadow-md transition hover:bg-white/90"
        >
          Explore Now
        </Link>
      </div>
    </section>
  );
}
