"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Testimonial } from "@/features/admin/queries";
import { GridTexture } from "@/components/landing/LandingTextures";

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

const TestimonialCard = ({ testimonial, index }: { testimonial: Testimonial; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(cardRef.current, {
      y: 24,
      opacity: 0,
      duration: 0.6,
      delay: index * 0.08,
      ease: "power2.out",
      scrollTrigger: { trigger: cardRef.current, start: "top 88%", once: true },
    });
  }, { scope: cardRef });

  return (
    <div
      ref={cardRef}
      className="group relative min-h-[300px] overflow-hidden border border-white/[0.07] transition-all duration-300 hover:border-[#F5C400]/20"
    >
      {testimonial.avatar_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={testimonial.avatar_url}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 h-full w-full scale-110 object-cover"
          style={{ filter: "blur(10px) brightness(0.22) saturate(0.4)" }}
        />
      )}
      <div className="absolute inset-0 bg-black/75" />
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(245,196,0,0.05) 0%, transparent 70%)" }}
      />
      <div className="relative z-10 flex min-h-[300px] flex-col justify-between p-8 sm:p-10">
        <div>
          <p className="mb-5 text-5xl font-black leading-none text-[#F5C400]" aria-hidden="true">&ldquo;</p>
          <p className="max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            {testimonial.content}
          </p>
        </div>
        <div className="mt-8 flex items-center gap-4 border-t border-white/[0.08] pt-6">
          {testimonial.avatar_url && (
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#F5C400]/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={testimonial.avatar_url} alt={testimonial.author_name} loading="lazy" className="h-full w-full object-cover" />
            </div>
          )}
          <div>
            <p className="font-black uppercase tracking-tight text-white">{testimonial.author_name}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#F5C400]/60">
              {testimonial.author_role}
            </p>
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
      y: 16, opacity: 0, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 85%", once: true },
    });
  }, { scope: sectionRef });

  if (testimonials.length === 0) return null;

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#0A0A0A] px-5 py-20 sm:px-8 lg:px-10">
      <GridTexture opacity={0.03} />
      <div className="relative mx-auto max-w-7xl">
        <div className="testi-header mb-10 pb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="h-4 w-0.5 bg-[#F5C400]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">Alumni</p>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
            Testimonials
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.id} testimonial={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
export { TestimonialsSection };
