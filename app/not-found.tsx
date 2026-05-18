"use client";

import Link from "next/link";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#121212] px-6 text-[#E5E2E1]">
      {/* Grid overlay for that ultimate gaming arena/cyber vibe */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Ambient background glows */}
      <div className="absolute -left-1/4 -top-1/4 h-[500px] w-[500px] rounded-full bg-yellow-500/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute -right-1/4 -bottom-1/4 h-[500px] w-[500px] rounded-full bg-yellow-500/[0.03] blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        {/* Animated Floating Alert Box */}
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-yellow-400/20 bg-zinc-900/60 shadow-[0_0_50px_-12px_rgba(234,179,8,0.2)] animate-bounce duration-1000">
          <AlertCircle className="h-10 w-10 text-yellow-400 animate-pulse" />
          <div className="absolute inset-0 rounded-2xl border border-yellow-400/10 animate-ping opacity-25" />
        </div>

        {/* 404 Title */}
        <div className="relative">
          <h1 className="relative font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 text-7xl sm:text-8xl drop-shadow-[0_0_30px_rgba(255,255,255,0.08)] select-none">
            404
          </h1>
          <span className="absolute -top-2 -right-4 rounded bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 animate-pulse">
            Error
          </span>
        </div>
        
        {/* Formal Premium Context */}
        <h2 className="mt-5 text-base font-bold text-yellow-400 uppercase tracking-widest sm:text-lg">
          Halaman Tidak Ditemukan
        </h2>
        <p className="mt-2 text-xs text-white/50 leading-relaxed">
          Mohon maaf, halaman yang Anda cari tidak dapat ditemukan. Mungkin tautan tersebut telah kedaluwarsa, dipindahkan, atau terjadi kesalahan pada penulisan alamat.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col items-center gap-3 w-full sm:flex-row sm:justify-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex h-9 w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-white/10 bg-zinc-900/80 px-5 text-xs font-semibold text-white/80 hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
          
          <Link
            href="/"
            className="inline-flex h-9 w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-yellow-400 px-6 text-xs font-bold text-black shadow-lg shadow-yellow-400/10 hover:bg-yellow-300 hover:shadow-yellow-400/25 transition-all active:scale-95"
          >
            <Home className="h-4 w-4" />
            Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}
