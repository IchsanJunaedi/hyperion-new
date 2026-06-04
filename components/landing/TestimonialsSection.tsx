"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Testimonial } from "@/features/admin/queries";

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

const TestimonialsSection = ({ testimonials }: TestimonialsSectionProps) => {
  const [active, setActive] = useState(0);
  const total = testimonials.length;
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  const handleNext = () => setActive((p) => (p + 1) % total);
  const handlePrev = () => setActive((p) => (p - 1 + total) % total);

  useEffect(() => {
    if (total === 0) return;
    const id = setInterval(handleNext, 5500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  if (testimonials.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="bg-[#040D1C] px-5 py-20 sm:px-8 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-0 border-b border-white/12 pb-8"
        >
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
            03 — Alumni
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
            Testimonials
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
          {/* Left: stacked photo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="border-b border-white/12 py-10 lg:border-b-0 lg:border-r lg:py-14 lg:pr-16"
          >
            <div className="relative h-64 w-full sm:h-80">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute inset-0 overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={testimonials[active]?.avatar_url ?? ""}
                    alt={testimonials[active]?.author_name ?? ""}
                    draggable={false}
                    loading="lazy"
                    className="h-full w-full object-cover object-top"
                    style={{ filter: "saturate(0.75) brightness(0.9)" }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right: quote */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-col justify-center py-10 lg:py-14 lg:pl-16"
          >
            {/* Large faint quotation mark */}
            <p className="mb-4 text-8xl font-black leading-none text-white/10 sm:text-9xl">
              &ldquo;
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <p className="text-sm leading-relaxed text-white/65 sm:text-base">
                  {testimonials[active]?.content ?? ""}
                </p>
                <div className="mt-6 border-l-2 border-[#F5C400] pl-4">
                  <p className="font-black uppercase tracking-tight text-white">
                    {testimonials[active]?.author_name ?? ""}
                  </p>
                  <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-white/35">
                    {testimonials[active]?.author_role ?? ""}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="mt-10 flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous"
                className="flex h-9 w-9 cursor-pointer items-center justify-center border border-white/20 text-white/50 transition hover:border-white/50 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next"
                className="flex h-9 w-9 cursor-pointer items-center justify-center border border-white/20 text-white/50 transition hover:border-white/50 hover:text-white"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <div className="ml-2 flex items-center gap-2">
                {testimonials.map((_, i) => (
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
                      className="h-px rounded-full"
                    />
                  </button>
                ))}
              </div>
              <span className="ml-auto text-[10px] tabular-nums text-white/20">
                {String(active + 1).padStart(2, "0")} /{" "}
                {String(total).padStart(2, "0")}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
export { TestimonialsSection };
