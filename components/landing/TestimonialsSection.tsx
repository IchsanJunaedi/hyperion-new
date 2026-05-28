"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";

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
  return Math.floor(Math.random() * 16) - 8;
}

const TestimonialsSection = () => {
  const [active, setActive] = useState(0);
  const total = TESTIMONIALS.length;
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  const handleNext = () => setActive((p) => (p + 1) % total);
  const handlePrev = () => setActive((p) => (p - 1 + total) % total);

  useEffect(() => {
    const id = setInterval(handleNext, 5500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-[#060606] px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="mb-14"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px w-8 bg-[#F5C400]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
              Alumni
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
            Testimonials
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: stacked photo cards */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
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
                      opacity: index === active ? 1 : 0.5,
                      scale: index === active ? 1 : 0.93,
                      z: index === active ? 0 : -100,
                      rotate: index === active ? 0 : randomRotate(),
                      zIndex:
                        index === active
                          ? 40
                          : TESTIMONIALS.length + 2 - index,
                      y: index === active ? [0, -48, 0] : 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      z: 100,
                      rotate: randomRotate(),
                    }}
                    transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="absolute inset-0 origin-bottom overflow-hidden rounded-3xl"
                    style={{
                      boxShadow:
                        index === active
                          ? "0 40px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)"
                          : "0 20px 40px rgba(0,0,0,0.4)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.image}
                      alt={t.name}
                      draggable={false}
                      loading="lazy"
                      className="h-full w-full object-cover object-top"
                      style={{ filter: "saturate(0.82)" }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right: glass quote card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="flex flex-col justify-center"
          >
            <div
              className="rounded-3xl border border-white/6 p-8"
              style={{
                background: "rgba(255,255,255,0.02)",
                backdropFilter: "blur(20px)",
                boxShadow:
                  "0 25px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <Quote className="mb-5 h-8 w-8 text-[#F5C400]/22" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">
                    {TESTIMONIALS[active]!.name}
                  </h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#F5C400]/48">
                    {TESTIMONIALS[active]!.position}
                  </p>
                  <p className="mt-5 text-sm leading-relaxed text-white/50 sm:text-[15px]">
                    &ldquo;{TESTIMONIALS[active]!.description}&rdquo;
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Nav controls */}
              <div className="mt-8 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/10 text-white/35 transition hover:border-[#F5C400]/38 hover:text-[#F5C400]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/10 text-white/35 transition hover:border-[#F5C400]/38 hover:text-[#F5C400]"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
                {/* Pill dot indicators */}
                <div className="ml-2 flex items-center gap-2">
                  {TESTIMONIALS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActive(i)}
                      aria-label={`Go to testimonial ${i + 1}`}
                      className="cursor-pointer py-1"
                    >
                      <motion.div
                        animate={{
                          width: i === active ? 18 : 6,
                          background:
                            i === active
                              ? "rgb(245,196,0)"
                              : "rgba(255,255,255,0.18)",
                        }}
                        transition={{ duration: 0.3 }}
                        className="h-1.5 rounded-full"
                      />
                    </button>
                  ))}
                </div>
                <span className="ml-auto text-[10px] tabular-nums text-white/20">
                  {String(active + 1).padStart(2, "0")} /{" "}
                  {String(total).padStart(2, "0")}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
export { TestimonialsSection };
