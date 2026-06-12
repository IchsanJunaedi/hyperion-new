"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
}

const Reveal = ({ children, delay = 0, y = 24 }: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ref.current,
          { autoAlpha: 0, y },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            delay,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ref.current,
              start: "top bottom-=80",
              once: true,
            },
          }
        );
      });
    },
    { scope: ref }
  );

  return <div ref={ref}>{children}</div>;
};

export { Reveal };
