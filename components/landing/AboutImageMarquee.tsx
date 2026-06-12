"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface AboutImageMarqueeProps {
  images: string[];
}

const AboutImageMarquee = ({ images }: AboutImageMarqueeProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [errored, setErrored] = useState<Set<string>>(new Set());

  useGSAP(
    () => {
      if (!fadeRef.current || !trackRef.current) return;
      gsap.fromTo(
        fadeRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.6,
          scrollTrigger: {
            trigger: fadeRef.current,
            start: "top bottom-=80",
            once: true,
          },
        }
      );
      gsap.fromTo(
        trackRef.current,
        { xPercent: -50 },
        { xPercent: 0, duration: 22, repeat: -1, ease: "none" }
      );
    },
    { scope: sectionRef }
  );

  if (images.length === 0) return null;

  const doubled = [...images, ...images];

  return (
    <section ref={sectionRef} className="overflow-hidden py-8 md:py-12">
      <div ref={fadeRef} className="relative" style={{ opacity: 0 }}>
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#040D1C] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#040D1C] to-transparent" />

        {/* Marquee track */}
        <div ref={trackRef} className="flex gap-4" style={{ willChange: "transform" }}>
          {doubled.map((src, i) =>
            errored.has(src) ? (
              <div
                key={i}
                className="h-44 w-72 shrink-0 rounded-xl bg-[#0d1b2e] sm:h-52 sm:w-80"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                loading="lazy"
                onError={() => setErrored((prev) => new Set(prev).add(src))}
                className="h-44 w-72 shrink-0 rounded-xl object-cover shadow-md sm:h-52 sm:w-80"
              />
            )
          )}
        </div>
      </div>
    </section>
  );
};

export { AboutImageMarquee };
