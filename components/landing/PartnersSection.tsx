"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Partner } from "@/features/admin/queries";

interface PartnersSectionProps {
  partners: Partner[];
}

const PartnersSection = ({ partners }: PartnersSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(sectionRef.current, {
      opacity: 0, duration: 0.6, ease: "power1.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 88%", once: true },
    });
  }, { scope: sectionRef });

  if (partners.length === 0) return null;

  const doubled = [...partners, ...partners];

  return (
    <section ref={sectionRef} className="border-y border-white/[0.07] bg-black py-6">
      <div className="ticker-track overflow-hidden">
        <div className="flex animate-ticker items-center gap-16">
          {doubled.map((p, i) => (
            <div key={`${p.id}-${i}`} className="inline-flex shrink-0 items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.logo_url ?? ""}
                alt={p.name}
                loading="lazy"
                className="h-8 w-auto max-w-[120px] object-contain grayscale opacity-30 transition-all duration-500 hover:opacity-70 hover:grayscale-0"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export { PartnersSection };
