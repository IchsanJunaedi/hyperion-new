import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#040D1C]">
      <header className="border-b border-white/5 bg-[#040D1C]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex flex-col items-start leading-none gap-0.5" aria-label="Hyperion Team">
            <span className="font-orbitron text-[7px] font-extrabold uppercase tracking-[0.25em] text-[#F5C400] opacity-80">
              GAMING ON
            </span>
            <span className="font-bebas text-xl font-black uppercase tracking-wider text-white">
              HYPERION<span className="text-[#F5C400]">.</span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/40 transition-colors duration-200 hover:text-white"
          >
            <ArrowLeft className="h-3 w-3" />
            Beranda
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
      <footer className="border-t border-white/5 py-4 text-center text-[11px] text-white/25">
        © {new Date().getFullYear()} Hyperion Team
      </footer>
    </div>
  );
}
