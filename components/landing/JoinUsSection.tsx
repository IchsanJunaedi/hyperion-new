import { JoinModal } from "./JoinModal";

export function JoinUsSection() {
  return (
    <section className="relative overflow-hidden bg-[#070707] px-6 py-28 sm:px-10 lg:px-16">
      {/* Background dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(245,196,0,0.25) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Yellow glow center */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(245,196,0,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Corner brackets */}
      <div className="absolute left-6 top-8 h-10 w-10 border-l-2 border-t-2 border-[#F5C400]/25 sm:left-10" />
      <div className="absolute bottom-8 right-6 h-10 w-10 border-b-2 border-r-2 border-[#F5C400]/25 sm:right-10" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          {/* Left: text */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[#F5C400]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
                #HypeWin
              </span>
            </div>
            <h2 className="text-4xl font-black uppercase leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              READY TO
              <br />
              <span className="text-[#F5C400]">JOIN THE TEAM?</span>
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/45 sm:text-base">
              Unleash your potential. Kembangkan skill, bangun karir esports, dan jadilah bagian dari keluarga Hyperion Team.
            </p>
          </div>

          {/* Right: CTA modal */}
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <JoinModal />
            <p className="text-xs text-white/25">
              Gratis · Tanpa syarat umur minimum
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
