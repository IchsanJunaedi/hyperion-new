"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { JoinModal } from "./JoinModal";

const JoinUsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative overflow-hidden bg-[#060606] px-6 py-28 sm:px-10 lg:px-16">
      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(245,196,0,0.22) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Centered gold glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[450px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(245,196,0,0.048) 0%, transparent 70%)",
        }}
      />
      {/* Corner brackets */}
      <div className="absolute left-6 top-8 h-10 w-10 border-l-2 border-t-2 border-[#F5C400]/18 sm:left-10" />
      <div className="absolute bottom-8 right-6 h-10 w-10 border-b-2 border-r-2 border-[#F5C400]/18 sm:right-10" />

      <div className="relative z-10 mx-auto max-w-7xl" ref={ref}>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto]">
          {/* Left: headline */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[#F5C400]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
                #HypeWin
              </span>
            </div>
            <h2 className="text-4xl font-black uppercase leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Ready To
              <br />
              <span className="text-[#F5C400]">Join The Team?</span>
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/38 sm:text-[15px]">
              Unleash your potential. Kembangkan skill, bangun karir esports, dan jadilah bagian dari keluarga Hyperion Team.
            </p>
          </motion.div>

          {/* Right: CTA */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col items-start gap-3 lg:items-end"
          >
            <JoinModal />
            <p className="text-xs text-white/22">
              Gratis · Tanpa syarat umur minimum
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
export { JoinUsSection };
