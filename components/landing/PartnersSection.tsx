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
    <section className="bg-black px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-0 border-b border-white/8 pb-8"
        >
          <div className="flex items-end gap-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/28">
              04 — Partners &amp; Sponsors
            </p>
            <div className="mb-0.5 h-px flex-1 bg-white/5" />
          </div>
        </motion.div>

        {/* Logo grid — separated by borders, no background fill */}
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {PARTNERS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className={`group flex items-center justify-center p-8 ${
                i % 2 === 0 ? "border-r border-white/6" : ""
              } ${i < PARTNERS.length - 2 ? "border-b border-white/6" : ""} sm:${
                i % 4 !== 3 ? "border-r border-white/6" : "border-r-0"
              } sm:${i < PARTNERS.length - 4 ? "border-b border-white/6" : "border-b-0"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl}
                alt={p.name}
                loading="lazy"
                className="max-h-9 w-auto object-contain opacity-25 grayscale transition-all duration-500 group-hover:opacity-80 group-hover:grayscale-0"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
export { PartnersSection };
