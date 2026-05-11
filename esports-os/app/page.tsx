import Link from "next/link";

/**
 * Marketing landing page placeholder. The full 1:1 rebuild of
 * hyperionteam.id lives in Step 4.
 */
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
        Phase 1 · Project Setup
      </span>
      <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Hyperion Team
      </h1>
      <p className="mt-4 max-w-xl text-base text-muted-foreground">
        OS untuk tim esports — kelola scrim, roster, jadwal, dan komunikasi
        dalam satu workspace.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90"
        >
          Masuk
        </Link>
        <Link
          href="/register"
          className="inline-flex h-11 items-center justify-center rounded-full border border-foreground/15 px-6 text-sm font-medium transition hover:bg-foreground/5"
        >
          Daftar tim
        </Link>
      </div>
      <p className="mt-12 text-xs text-muted-foreground/80">
        Migrasi tech stack — landing page final menyusul di Step 4.
      </p>
    </main>
  );
}
