"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";

interface AboutImageMarqueeProps {
  images: string[];
}

const AboutImageMarquee = ({ images }: AboutImageMarqueeProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [errored, setErrored] = useState<Set<string>>(new Set());

  if (images.length === 0) return null;

  const doubled = [...images, ...images];

  return (
    <section ref={ref} className="overflow-hidden py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#040D1C] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#040D1C] to-transparent" />

        {/* Marquee track */}
        <motion.div
          className="flex gap-4"
          animate={{ x: ["-50%", "0%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          style={{ willChange: "transform" }}
        >
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
        </motion.div>
      </motion.div>
    </section>
  );
};

export { AboutImageMarquee };
