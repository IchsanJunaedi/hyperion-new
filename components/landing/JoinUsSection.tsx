"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { JoinModal } from "./JoinModal";

interface JoinSettings {
  join_eyebrow: string;
  join_title_line1: string;
  join_title_line2: string;
  join_description: string;
  join_fine_print: string;
}

interface JoinUsSectionProps {
  settings: JoinSettings;
}

const JoinUsSection = ({ settings }: JoinUsSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    // Entrance animations
    gsap.from(".join-left", {
      y: 20, opacity: 0, duration: 0.55, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true },
    });
    gsap.from(".join-right", {
      y: 20, opacity: 0, duration: 0.55, delay: 0.12, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true },
    });

    // Subtle breathing/pulsing animation for the background glowing orb
    gsap.to(".join-glow-orb", {
      scale: 1.15,
      opacity: 0.22,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-transparent px-5 py-24 sm:px-8 lg:px-10">
      {/* Glowing Background Orb (Yellow/Gold aura matching request) */}
      <div className="join-glow-orb absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-15 bg-[#F5C400] blur-[130px] mix-blend-screen z-0" />

      <div className="absolute top-0 left-0 right-0 h-px bg-white/5 z-10" />
      <div className="relative mx-auto max-w-7xl z-10">
        <div className="border-b border-t border-[#F5C400]/15 py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="join-left">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-4 w-0.5 bg-[#F5C400]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">
                  {settings.join_eyebrow}
                </p>
              </div>
              <h2 className="text-5xl font-black uppercase leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
                {settings.join_title_line1}
                <br />
                <span className="text-white">
                  {settings.join_title_line2}
                </span>
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/55 sm:text-[15px]">
                {settings.join_description}
              </p>
            </div>
            <div className="join-right flex flex-col items-start gap-3 lg:items-end">
              <JoinModal />
              <Link
                href="/divisions"
                className="inline-flex h-10 items-center border border-white/20 px-6 text-[11px] font-bold uppercase tracking-widest text-white/50 transition duration-200 hover:border-white/40 hover:text-white"
              >
                Lihat Divisi
              </Link>
              <p className="text-xs text-white/22">{settings.join_fine_print}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export { JoinUsSection };
