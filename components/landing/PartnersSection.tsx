"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Partner } from "@/features/admin/queries";

interface PartnersSectionProps {
  partners: Partner[];
}

const DEFAULT_PARTNERS = [
  { id: "default-1",  name: "PlayStation",   logo_url: null },
  { id: "default-2",  name: "Xbox",          logo_url: null },
  { id: "default-3",  name: "Nintendo",      logo_url: null },
  { id: "default-4",  name: "Ubisoft",       logo_url: null },
  { id: "default-5",  name: "Steam",         logo_url: null },
  { id: "default-6",  name: "Epic Games",    logo_url: null },
  { id: "default-7",  name: "NVIDIA",        logo_url: null },
  { id: "default-8",  name: "Intel",         logo_url: null },
  { id: "default-9",  name: "AMD",           logo_url: null },
  { id: "default-10", name: "Razer",         logo_url: null },
  { id: "default-11", name: "Logitech G",    logo_url: null },
  { id: "default-12", name: "Corsair",       logo_url: null },
  { id: "default-13", name: "Unity",         logo_url: null },
  { id: "default-14", name: "Unreal Engine", logo_url: null },
  { id: "default-15", name: "Twitch",        logo_url: null },
  { id: "default-16", name: "Discord",       logo_url: null },
];

type PartnerItem = { id: string; name: string; logo_url: string | null };

function PartnerLogo({ partner }: { partner: PartnerItem }) {
  const [failed, setFailed] = useState(false);
  if (!partner.logo_url || failed) {
    return (
      <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-white/40">
        {partner.name}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={partner.logo_url}
      alt={partner.name}
      loading="lazy"
      className="h-8 md:h-10 w-auto max-w-[130px] object-contain opacity-40 hover:opacity-100 transition-opacity duration-300 brightness-0 invert"
      onError={() => setFailed(true)}
    />
  );
}

const PartnersSection = ({ partners }: PartnersSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);

  // Combine database partners with default partners to get a full 4x4 grid of 16 partners
  const dbPartnerNames = new Set(partners.map((p) => p.name.toLowerCase()));
  const mergedPartners = [
    ...partners,
    ...DEFAULT_PARTNERS.filter((p) => !dbPartnerNames.has(p.name.toLowerCase())),
  ].slice(0, 16);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 85%",
        once: true,
      }
    });

    tl.from(".partner-title", {
      y: 20,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
    });

    tl.from(".partner-logo-item", {
      scale: 0.9,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      stagger: 0.04,
    }, "-=0.3");

    tl.from(".partner-footer", {
      y: 15,
      opacity: 0,
      duration: 0.5,
      ease: "power2.out",
    }, "-=0.2");
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#020202] py-24 sm:py-32 px-5 border-t border-white/5"
    >
      {/* Decorative subtle background mesh */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl">
        {/* Title */}
        <div className="partner-title text-center mb-16">
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
            We partner with industry leaders
          </h2>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 items-center justify-items-center max-w-5xl mx-auto">
          {mergedPartners.map((p) => (
            <div
              key={p.id}
              className="partner-logo-item flex items-center justify-center w-full h-16 hover:scale-105 transition-transform duration-300"
            >
              <PartnerLogo partner={p} />
            </div>
          ))}
        </div>

        {/* Footer caption */}
        <div className="partner-footer text-center mt-16">
          <p className="text-xs sm:text-sm text-neutral-500 font-medium tracking-wide">
            Their trust in our capabilities makes us super proud.
          </p>
        </div>
      </div>
    </section>
  );
};

export { PartnersSection };
