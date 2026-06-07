"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Partner } from "@/features/admin/queries";
import { GridTexture } from "@/components/landing/LandingTextures";

interface PartnersSectionProps {
  partners: Partner[];
}

const PartnersSection = ({ partners }: PartnersSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".partners-header", {
      y: 16, opacity: 0, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 85%", once: true },
    });
    gsap.from(".partners-track", {
      opacity: 0, duration: 0.7, delay: 0.2, ease: "power1.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true },
    });
  }, { scope: sectionRef });

  if (partners.length === 0) return null;

  const row1 = [...partners, ...partners];
  const row2 = [...partners].reverse().concat([...partners].reverse());

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#0A0A0A] py-20">
      <GridTexture opacity={0.025} />
      <div className="relative">
        <div className="partners-header mb-10 px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-2 flex items-center gap-3">
              <div className="h-4 w-0.5 bg-[#F5C400]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">
                Partners &amp; Sponsors
              </p>
            </div>
          </div>
        </div>
        <div className="partners-track flex flex-col gap-8">
          {/* Row 1: scroll left */}
          <div className="overflow-hidden">
            <div className="flex animate-scroll-left items-center gap-16 whitespace-nowrap">
              {row1.map((p, i) => (
                <div key={`r1-${p.id}-${i}`} className="inline-flex shrink-0 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.logo_url ?? ""}
                    alt={p.name}
                    loading="lazy"
                    className="h-9 w-auto max-w-[140px] object-contain grayscale opacity-25 transition-all duration-500 hover:opacity-75 hover:grayscale-0"
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Row 2: scroll right */}
          <div className="overflow-hidden">
            <div className="flex animate-scroll-right items-center gap-16 whitespace-nowrap">
              {row2.map((p, i) => (
                <div key={`r2-${p.id}-${i}`} className="inline-flex shrink-0 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.logo_url ?? ""}
                    alt={p.name}
                    loading="lazy"
                    className="h-9 w-auto max-w-[140px] object-contain grayscale opacity-25 transition-all duration-500 hover:opacity-75 hover:grayscale-0"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export { PartnersSection };
