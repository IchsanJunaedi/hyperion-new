"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { JoinModal } from "./JoinModal";

const JoinUsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-black px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl" ref={ref}>
        <div className="border-b border-t border-white/8 py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            {/* Left: headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55 }}
            >
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-white/28">
                #HypeWin
              </p>
              <h2 className="text-4xl font-black uppercase leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Ready To
                <br />
                <span className="text-[#F5C400]">Join The Team?</span>
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/35 sm:text-[15px]">
                Unleash your potential. Kembangkan skill, bangun karir esports, dan jadilah bagian dari keluarga Hyperion Team.
              </p>
            </motion.div>

            {/* Right: CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="flex flex-col items-start gap-3 lg:items-end"
            >
              <JoinModal />
              <p className="text-xs text-white/22">
                Gratis · Tanpa syarat umur minimum
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
export { JoinUsSection };
