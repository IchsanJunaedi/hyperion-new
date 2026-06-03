"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";

const IMAGES = [
  "https://hyperionteam.id/storage/timelines/01JZN7JDHN76Z29F9R2NW4VX8K.jpeg",
  "https://hyperionteam.id/storage/timelines/01JZPD3B2P75DVSJT6N1609AM3.jpeg",
  "https://hyperionteam.id/storage/timelines/01JZPD3RM26KW2BNB68WFYTT6X.jpeg",
  "https://hyperionteam.id/storage/timelines/01JZN7JDHN76Z29F9R2NW4VX8K.jpeg",
  "https://hyperionteam.id/storage/timelines/01JZPD3B2P75DVSJT6N1609AM3.jpeg",
];

// Duplicate for seamless right-scroll loop
const DOUBLED = [...IMAGES, ...IMAGES];

const AboutImageMarquee = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="overflow-hidden py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#070707] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#070707] to-transparent" />

        {/* Marquee track — starts at -50%, animates to 0% = moves right */}
        <motion.div
          className="flex gap-4"
          animate={{ x: ["-50%", "0%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          whileHover={{ animationPlayState: "paused" }}
          style={{ willChange: "transform" }}
        >
          {DOUBLED.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`Hyperion moment ${(i % IMAGES.length) + 1}`}
              loading="lazy"
              className="h-44 w-72 shrink-0 rounded-xl object-cover shadow-md sm:h-52 sm:w-80"
            />
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};
export { AboutImageMarquee };
