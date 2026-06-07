"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Testimonial } from "@/features/admin/queries";

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

const TestimonialCard = ({ testimonial, index }: { testimonial: Testimonial; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(cardRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.7,
      delay: index * 0.1,
      ease: "power2.out",
      scrollTrigger: { trigger: cardRef.current, start: "top 88%", once: true },
    });
  }, { scope: cardRef });

  return (
    <div ref={cardRef} className="border-b border-white/[0.08] py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[420px_1fr]">
        {/* Photo — left, clip-path frame */}
        <div className="relative hidden lg:block">
          <div
            className="relative overflow-hidden"
            style={{
              clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
            }}
          >
            {testimonial.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={testimonial.avatar_url}
                alt={testimonial.author_name}
                loading="lazy"
                className="h-[400px] w-full object-cover object-top"
                style={{ filter: "brightness(0.85) contrast(1.05)" }}
              />
            ) : (
              <div className="h-[400px] w-full bg-[#111111] flex items-center justify-center">
                <span className="text-6xl font-black uppercase text-[#F5C400]/20">
                  {testimonial.author_name.slice(0, 1)}
                </span>
              </div>
            )}
            {/* Gold corner accent */}
            <div className="absolute left-0 top-0 h-1 w-16 bg-[#F5C400]" />
            <div className="absolute bottom-0 right-0 h-1 w-16 bg-[#F5C400]" />
          </div>
        </div>

        {/* Quote — right */}
        <div className="flex flex-col justify-between">
          <div>
            <p className="mb-6 text-[3.5rem] font-black leading-none text-[#F5C400] lg:text-[5rem]" aria-hidden="true">&ldquo;</p>
            <p className="text-xl font-black uppercase leading-tight tracking-tight text-white lg:text-2xl xl:text-3xl">
              {testimonial.content}
            </p>
          </div>
          <div className="mt-10 flex items-center gap-4 border-t border-white/[0.08] pt-6">
            {testimonial.avatar_url && (
              <div className="h-10 w-10 shrink-0 overflow-hidden clip-tr">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={testimonial.avatar_url} alt={testimonial.author_name} loading="lazy" className="h-full w-full object-cover" />
              </div>
            )}
            <div>
              <p className="font-black uppercase tracking-wider text-white">{testimonial.author_name}</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]/70">{testimonial.author_role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TestimonialsSection = ({ testimonials }: TestimonialsSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".testi-header", {
      y: 20, opacity: 0, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 85%", once: true },
    });
  }, { scope: sectionRef });

  if (testimonials.length === 0) return null;

  return (
    <section ref={sectionRef} className="bg-black px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="testi-header mb-4">
          <div className="mb-2 flex items-center gap-3">
            <div className="h-4 w-0.5 bg-[#F5C400]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">Alumni &amp; Players</p>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
            Testimonials
          </h2>
        </div>
        <div>
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.id} testimonial={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
export { TestimonialsSection };
