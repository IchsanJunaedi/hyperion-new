"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";

const PARTNERS = [
  {
    name: "Partner 1",
    imageUrl:
      "https://hyperionteam.id/storage/partners/01JZPD66GVYZ3V64K59DENV86X.png",
  },
  {
    name: "Partner 2",
    imageUrl:
      "https://hyperionteam.id/storage/partners/01JZPD6FE6CJ4STMBZ92BG6905.png",
  },
  {
    name: "Partner 3",
    imageUrl:
      "https://hyperionteam.id/storage/partners/01JZPD6QMPNEBTFH83S9DR2WRP.png",
  },
  {
    name: "Partner 4",
    imageUrl:
      "https://hyperionteam.id/storage/partners/01JZPD9BMKXCYRFWJMS4JSSC4S.png",
  },
  {
    name: "Partner 5",
    imageUrl:
      "https://hyperionteam.id/storage/partners/01JZPD7F8KJ673VNKC4Y1TMJRY.png",
  },
  {
    name: "Partner 6",
    imageUrl:
      "https://hyperionteam.id/storage/partners/01JZPD7TAM6H93H9XG56ST7H9Q.png",
  },
  {
    name: "Partner 7",
    imageUrl:
      "https://hyperionteam.id/storage/partners/01JZPD89RJXEARGPW11RNCHTDV.png",
  },
  {
    name: "Partner 8",
    imageUrl:
      "https://hyperionteam.id/storage/partners/01JZPD8PBS7TAJ9AWVKCHQKT75.png",
  },
];

const PartnersSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#060606] px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12 flex items-center gap-4"
        >
          <div className="h-px w-8 bg-[#F5C400]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
            Partners &amp; Sponsors
          </span>
          <div className="h-px flex-1 bg-white/5" />
        </motion.div>

        {/* Logo grid */}
        <div className="grid grid-cols-2 gap-px bg-white/[0.04] sm:grid-cols-4">
          {PARTNERS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: i * 0.045 }}
              className="group flex items-center justify-center bg-[#060606] p-8 transition-colors duration-300 hover:bg-[#0C0C0C]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl}
                alt={p.name}
                loading="lazy"
                className="max-h-10 w-auto object-contain opacity-30 grayscale transition-all duration-500 group-hover:opacity-88 group-hover:grayscale-0"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
export { PartnersSection };
