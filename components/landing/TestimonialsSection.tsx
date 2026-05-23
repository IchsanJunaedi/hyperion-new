"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Testimonial {
  name: string;
  position: string;
  description: string;
  image: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "RRQ Kaeya",
    position: "Player of Team RRQ",
    description:
      "Awalnya gue kira bakal biasa aja kayak komunitas lain, tapi ternyata banyak ilmu yang gue dapet dari awal trial sampai akhir. Di Hyperion, gue ketemu banyak orang yang semangat kompetisinya sama, jadi lebih enak buat berkembang. Sering scrim dan ada evaluasi via Discord yang bikin gameplay makin bagus.",
    image:
      "https://hyperionteam.id/storage/testimonials/01K2SMTH386QV9Q3R8PTF7913YR.png",
  },
  {
    name: "Evos Rendyy",
    position: "Team of Evos Esports",
    description:
      "Gue mulai bareng Hyperion BLCK di awal 2023 dan berhasil juara di banyak turnamen nasional pelajar. Setelah itu gue lanjut bareng Hyperion Palembang di DGWIB 2024 bersama Fenzu. Buat gue, Hyperion adalah titik awal perjalanan gue di scene profesional.",
    image:
      "https://hyperionteam.id/storage/testimonials/01K2RYQS6A36J458VGK7DE8AS9.png",
  },
  {
    name: "Pajajaran Firlyboy",
    position: "Player of Team Pajajaran",
    description:
      "Hyperion jadi titik awal penting buat perjalanan gue di esports. Di sini gue nggak cuma belajar mekanik, tapi juga disiplin, mindset, dan cara bersaing sehat. Semua itu ngebantu banget waktu gue masuk ke Seleknas Pajajaran 2024.",
    image:
      "https://hyperionteam.id/storage/testimonials/01K2RYVPWSFF8GGREVCD4VKRRH.png",
  },
];

function randomRotate() {
  return Math.floor(Math.random() * 21) - 10;
}

export function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const total = TESTIMONIALS.length;

  const handleNext = () => setActive((p) => (p + 1) % total);
  const handlePrev = () => setActive((p) => (p - 1 + total) % total);

  // Autoplay every 5s
  useEffect(() => {
    const id = setInterval(handleNext, 5000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="bg-[#070707] px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-12">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px w-8 bg-[#F5C400]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
              Alumni
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
            TESTIMONIALS
          </h2>
        </div>

        <div className="relative grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-20">
          {/* Left: stacked image cards */}
          <div>
            <div className="relative h-72 w-full sm:h-80 md:h-96">
              <AnimatePresence>
                {TESTIMONIALS.map((t, index) => (
                  <motion.div
                    key={index}
                    initial={{
                      opacity: 0,
                      scale: 0.9,
                      z: -100,
                      rotate: randomRotate(),
                    }}
                    animate={{
                      opacity: index === active ? 1 : 0.7,
                      scale: index === active ? 1 : 0.95,
                      z: index === active ? 0 : -100,
                      rotate: index === active ? 0 : randomRotate(),
                      zIndex:
                        index === active
                          ? 40
                          : TESTIMONIALS.length + 2 - index,
                      y: index === active ? [0, -60, 0] : 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      z: 100,
                      rotate: randomRotate(),
                    }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="absolute inset-0 origin-bottom"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.image}
                      alt={t.name}
                      draggable={false}
                      loading="lazy"
                      className="h-full w-full rounded-2xl object-cover object-top"
                      style={{ filter: "saturate(0.9)" }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: name + word-by-word quote */}
          <div className="flex flex-col justify-between py-4">
            <motion.div
              key={active}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                {TESTIMONIALS[active]!.name}
              </h3>
              <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-[#F5C400]/60">
                {TESTIMONIALS[active]!.position}
              </p>

              <motion.p className="mt-6 text-sm leading-relaxed text-white/60 sm:text-base">
                {TESTIMONIALS[active]!.description.split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ filter: "blur(8px)", opacity: 0, y: 5 }}
                    animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      ease: "easeInOut",
                      delay: 0.02 * i,
                    }}
                    className="inline-block"
                  >
                    {word}&nbsp;
                  </motion.span>
                ))}
              </motion.p>
            </motion.div>

            {/* Prev / Next */}
            <div className="mt-10 flex items-center gap-3 md:mt-0">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous"
                className="group flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/10 text-white/40 transition hover:border-[#F5C400]/50 hover:text-[#F5C400]"
              >
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next"
                className="group flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/10 text-white/40 transition hover:border-[#F5C400]/50 hover:text-[#F5C400]"
              >
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" />
              </button>
              <span className="ml-2 text-xs tabular-nums text-white/25">
                {String(active + 1).padStart(2, "0")} /{" "}
                {String(total).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
