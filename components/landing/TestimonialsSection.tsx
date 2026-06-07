"use client";

import { useState, useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Testimonial } from "@/features/admin/queries";

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

interface PolaroidCardProps {
  image: string | null;
  name?: string;
  rotationClass: string;
  className?: string;
  isStack?: boolean;
  disableTransition?: boolean;
}

function avatarHue(name: string | undefined) {
  if (!name) return 220;
  return (name.charCodeAt(0) * 47) % 360;
}

const PolaroidCard = ({
  image,
  name,
  rotationClass,
  className = "",
  isStack = false,
  disableTransition = false,
}: PolaroidCardProps) => {
  const [imgFailed, setImgFailed] = useState(false);
  const hue = avatarHue(name);
  const initial = name?.[0]?.toUpperCase() ?? "?";
  const showPlaceholder = !image || imgFailed;

  return (
    <div
      className={`relative shrink-0 bg-white p-3 pb-8 shadow-[0_15px_35px_rgba(0,0,0,0.6)] border border-neutral-200/80 ${
        disableTransition ? "" : "transition-all duration-700"
      } ${rotationClass} ${className}`}
      style={{
        width: isStack ? "245px" : "190px",
        height: isStack ? "305px" : "240px",
      }}
    >
      {/* Photo area */}
      <div className="w-full h-[80%] overflow-hidden bg-neutral-100 relative">
        {showPlaceholder ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `hsl(${hue},45%,28%)` }}
          >
            <span className="font-black text-white/80 select-none" style={{ fontSize: isStack ? "72px" : "56px" }}>
              {initial}
            </span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image!}
            alt={name || "Testimonial"}
            className="w-full h-full object-cover filter saturate-[0.9] contrast-[1.05]"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>
      {/* Handwritten name at the bottom */}
      {name && (
        <div className="mt-3 text-center">
          <span className="font-serif italic font-semibold text-lg text-neutral-800 tracking-wide block leading-none">
            {name}
          </span>
        </div>
      )}
    </div>
  );
};

function AuthorAvatar({ testimonial }: { testimonial: Testimonial }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hue = avatarHue(testimonial.author_name);
  const initial = testimonial.author_name?.[0]?.toUpperCase() ?? "?";
  const showPlaceholder = !testimonial.avatar_url || imgFailed;

  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-neutral-800 flex items-center justify-center">
        {showPlaceholder ? (
          <span
            className="font-black text-white/80 text-lg leading-none select-none"
            style={{ background: `hsl(${hue},45%,28%)`, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {initial}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={testimonial.avatar_url!}
            alt={testimonial.author_name}
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider text-white">
          {testimonial.author_name}
        </span>
        {testimonial.author_role && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#F5C400]/70 mt-0.5">
            {testimonial.author_role}
          </span>
        )}
      </div>
    </div>
  );
}

const TestimonialsSection = ({ testimonials }: TestimonialsSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  // GSAP Entrance animations
  useGSAP(() => {
    gsap.from(".testi-header", {
      y: 20, opacity: 0, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 85%", once: true },
    });
    gsap.from(".testi-content", {
      y: 30, opacity: 0, duration: 0.6, ease: "power2.out",
      scrollTrigger: { trigger: ".testi-content", start: "top 88%", once: true },
    });
  }, { scope: sectionRef });

  // GSAP active testimonial change animations
  useGSAP(() => {
    // Determine throw direction offset and rotation angle
    const flyFromX = direction === "next" ? 280 : -280;
    const rotateStart = direction === "next" ? 22 : -22;

    const tl = gsap.timeline();

    if (length > 1) {
      if (direction === "next") {
        // --- NEXT DIRECTION (Toss top card to bottom of stack) ---
        // 1. The old active card is now stack-bg-1 (left2).
        // It starts at the active card's position (x:0, y:0, rotation:2, scale:1.05, opacity:1),
        // throws out to the side, then slides back behind at stack-bg-1 position.
        tl.fromTo(
          ".stack-bg-1",
          {
            x: 0,
            y: 0,
            rotation: 2,
            scale: 1.05,
            opacity: 1,
            zIndex: 40,
          },
          {
            keyframes: [
              {
                x: flyFromX,
                y: -15,
                rotation: rotateStart,
                scale: 1.02,
                opacity: 0.9,
                duration: 0.45,
                ease: "power2.out",
              },
              {
                x: 8,
                y: 8,
                rotation: -8,
                scale: 0.95,
                opacity: 0.3,
                duration: 0.65,
                ease: "power3.out",
              },
            ],
            onStart: () => {
              gsap.set(".stack-bg-1", { zIndex: 40 });
            },
            onComplete: () => {
              gsap.set(".stack-bg-1", { zIndex: "" });
            },
          },
          0
        );

        // 2. The new active card (.middle-active-card) starts from its previous background position
        // and scales/rotates into the active spot in the front.
        const activeStartPos = length > 2
          ? { x: -8, y: -8, rotation: 10, scale: 0.95, opacity: 0.45 }
          : { x: 8, y: 8, rotation: -8, scale: 0.95, opacity: 0.3 };

        tl.fromTo(
          ".middle-active-card",
          activeStartPos,
          {
            x: 0,
            y: 0,
            rotation: 2,
            scale: 1.05,
            opacity: 1,
            duration: 0.95,
            ease: "power3.out",
          },
          0.18 // Starts shortly after the throw begins
        );

        // 3. The new stack-bg-2 (which was stack-bg-1) transitions its position
        if (length > 2) {
          tl.fromTo(
            ".stack-bg-2",
            {
              x: 8,
              y: 8,
              rotation: -8,
              scale: 0.95,
              opacity: 0.3,
            },
            {
              x: -8,
              y: -8,
              rotation: 10,
              scale: 0.95,
              opacity: 0.45,
              duration: 0.95,
              ease: "power3.out",
            },
            0
          );
        }
      } else {
        // --- PREV DIRECTION ---
        if (length > 2) {
          // 1. The old active card is now stack-bg-2.
          // It starts at the active position, throws out, and settles at stack-bg-2 position.
          tl.fromTo(
            ".stack-bg-2",
            {
              x: 0,
              y: 0,
              rotation: 2,
              scale: 1.05,
              opacity: 1,
              zIndex: 40,
            },
            {
              keyframes: [
                {
                  x: flyFromX,
                  y: -15,
                  rotation: rotateStart,
                  scale: 1.02,
                  opacity: 0.9,
                  duration: 0.45,
                  ease: "power2.out",
                },
                {
                  x: -8,
                  y: -8,
                  rotation: 10,
                  scale: 0.95,
                  opacity: 0.45,
                  duration: 0.65,
                  ease: "power3.out",
                },
              ],
              onStart: () => {
                gsap.set(".stack-bg-2", { zIndex: 40 });
              },
              onComplete: () => {
                gsap.set(".stack-bg-2", { zIndex: "" });
              },
            },
            0
          );

          // 2. The new active card starts from stack-bg-1 position.
          tl.fromTo(
            ".middle-active-card",
            {
              x: 8,
              y: 8,
              rotation: -8,
              scale: 0.95,
              opacity: 0.3,
            },
            {
              x: 0,
              y: 0,
              rotation: 2,
              scale: 1.05,
              opacity: 1,
              duration: 0.95,
              ease: "power3.out",
            },
            0.18
          );

          // 3. The new stack-bg-1 transitions its position from stack-bg-2
          tl.fromTo(
            ".stack-bg-1",
            {
              x: -8,
              y: -8,
              rotation: 10,
              scale: 0.95,
              opacity: 0.45,
            },
            {
              x: 8,
              y: 8,
              rotation: -8,
              scale: 0.95,
              opacity: 0.3,
              duration: 0.95,
              ease: "power3.out",
            },
            0
          );
        } else {
          // Special case: length === 2 and direction === "prev"
          tl.fromTo(
            ".stack-bg-1",
            {
              x: 0,
              y: 0,
              rotation: 2,
              scale: 1.05,
              opacity: 1,
              zIndex: 40,
            },
            {
              keyframes: [
                {
                  x: flyFromX,
                  y: -15,
                  rotation: rotateStart,
                  scale: 1.02,
                  opacity: 0.9,
                  duration: 0.45,
                  ease: "power2.out",
                },
                {
                  x: 8,
                  y: 8,
                  rotation: -8,
                  scale: 0.95,
                  opacity: 0.3,
                  duration: 0.65,
                  ease: "power3.out",
                },
              ],
              onStart: () => {
                gsap.set(".stack-bg-1", { zIndex: 40 });
              },
              onComplete: () => {
                gsap.set(".stack-bg-1", { zIndex: "" });
              },
            },
            0
          );

          tl.fromTo(
            ".middle-active-card",
            {
              x: 8,
              y: 8,
              rotation: -8,
              scale: 0.95,
              opacity: 0.3,
            },
            {
              x: 0,
              y: 0,
              rotation: 2,
              scale: 1.05,
              opacity: 1,
              duration: 0.95,
              ease: "power3.out",
            },
            0.18
          );
        }
      }
    } else {
      // Simple fade & scale in for single item on mount
      tl.fromTo(
        ".middle-active-card",
        { scale: 0.95, opacity: 0 },
        { scale: 1.05, opacity: 1, duration: 0.95, ease: "power3.out" }
      );
    }

    // Animate text slide & fade
    tl.fromTo(
      ".quote-text-animate",
      {
        opacity: 0,
        y: 12,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.85, // slightly slower text fade-in
        ease: "power3.out",
        stagger: 0.08,
      },
      "-=0.75" // overlap earlier
    );
  }, { dependencies: [currentIndex], scope: sectionRef });

  if (!testimonials || testimonials.length === 0) return null;

  const length = testimonials.length;
  const active = testimonials[currentIndex];

  if (!active) return null;

  // Neighbors calculation for the sliding center stack
  const left2 = testimonials[(currentIndex - 1 + length) % length] || active;
  const right1 = testimonials[(currentIndex + 1) % length] || active;

  // Static framing cards (do not change when sliding to keep background stable)
  const staticTopLeft = testimonials[1 % length] || active;
  const staticBottomLeft = testimonials[2 % length] || active;
  const staticTopRight = testimonials[3 % length] || active;
  const staticBottomRight = testimonials[4 % length] || active;

  const handlePrev = () => {
    setDirection("prev");
    setCurrentIndex((prev) => (prev - 1 + length) % length);
  };

  const handleNext = () => {
    setDirection("next");
    setCurrentIndex((prev) => (prev + 1) % length);
  };

  // Helper to extract first name for polaroid handwriting
  const getFirstName = (fullName: string) => {
    if (!fullName) return "";
    return fullName.split(" ")[0] || "";
  };

  // Parse tagline into separate keyword tags (split by dots, commas, or multiple delimiters)
  const tags = active.tagline
    ? active.tagline.split(/[,\.]+/).map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#020202] px-5 py-32 sm:px-8 lg:px-10 border-t border-white/5"
    >
      {/* Decorative subtle background mesh */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />

      {/* LEFT STATIC FRAMING CARDS (Separated vertically to prevent congestion) */}
      {length > 2 && (
        <>
          {/* Top Left Card */}
          <div className="absolute left-[-100px] xl:left-[-50px] top-[10%] scale-[0.8] xl:scale-[0.85] opacity-40 hover:opacity-100 transition-all duration-500 z-10 hidden md:block select-none">
            <PolaroidCard
              image={staticTopLeft.avatar_url}
              name={getFirstName(staticTopLeft.author_name)}
              rotationClass="rotate-[-12deg]"
            />
          </div>
          {/* Bottom Left Card */}
          <div className="absolute left-[-110px] xl:left-[-60px] bottom-[10%] scale-[0.8] xl:scale-[0.85] opacity-40 hover:opacity-100 transition-all duration-500 z-10 hidden md:block select-none">
            <PolaroidCard
              image={staticBottomLeft.avatar_url}
              name={getFirstName(staticBottomLeft.author_name)}
              rotationClass="rotate-[15deg]"
            />
          </div>
        </>
      )}

      {/* RIGHT STATIC FRAMING CARDS (Separated vertically to prevent congestion) */}
      {length > 2 && (
        <>
          {/* Top Right Card */}
          <div className="absolute right-[-100px] xl:right-[-50px] top-[10%] scale-[0.8] xl:scale-[0.85] opacity-40 hover:opacity-100 transition-all duration-500 z-10 hidden md:block select-none">
            <PolaroidCard
              image={staticTopRight.avatar_url}
              name={getFirstName(staticTopRight.author_name)}
              rotationClass="rotate-[12deg]"
            />
          </div>
          {/* Bottom Right Card */}
          <div className="absolute right-[-110px] xl:right-[-60px] bottom-[10%] scale-[0.8] xl:scale-[0.85] opacity-40 hover:opacity-100 transition-all duration-500 z-10 hidden md:block select-none">
            <PolaroidCard
              image={staticBottomRight.avatar_url}
              name={getFirstName(staticBottomRight.author_name)}
              rotationClass="rotate-[-10deg]"
              />
          </div>
        </>
      )}

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="testi-header mb-16">
          <div className="mb-2 flex items-center gap-3">
            <div className="h-4 w-0.5 bg-[#F5C400]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">
              Alumni &amp; Players
            </p>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
            Testimonials
          </h2>
        </div>

        {/* Content Layout */}
        <div className="testi-content grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-center min-h-[500px]">
          
          {/* Polaroid spread center stack */}
          <div className="relative flex items-center justify-center h-[480px] w-full select-none overflow-visible">
            
            {/* Middle Active Stack */}
            <div className="relative z-30 flex items-center justify-center scale-[1.05] md:scale-[1.1]">
              {/* Stack Background 1 (rotated left) */}
              {length > 1 && (
                <div className="stack-bg-1 absolute opacity-30 pointer-events-none z-10">
                  <PolaroidCard
                    image={left2.avatar_url}
                    rotationClass="rotate-[-8deg] translate-x-2 translate-y-2"
                    isStack
                    disableTransition
                  />
                </div>
              )}
              {/* Stack Background 2 (rotated right) */}
              {length > 2 && (
                <div className="stack-bg-2 absolute opacity-45 pointer-events-none z-0">
                  <PolaroidCard
                    image={right1.avatar_url}
                    rotationClass="rotate-[10deg] -translate-x-2 -translate-y-2"
                    isStack
                    disableTransition
                  />
                </div>
              )}
              {/* Stack Front Active Card (GSAP target) */}
              <div className="middle-active-card relative z-20">
                <div className="transition-transform duration-500 ease-out hover:scale-105 hover:rotate-[5deg]">
                  <PolaroidCard
                    image={active.avatar_url}
                    name={getFirstName(active.author_name)}
                    rotationClass="rotate-[2deg]"
                    isStack
                    disableTransition
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Testimonial details (Right) */}
          <div className="flex flex-col justify-center bg-black/40 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/5 z-20 shadow-2xl">
            
            {/* quote icon */}
            <span className="quote-text-animate font-serif text-[#F5C400] text-7xl leading-none font-bold block mb-2 select-none" aria-hidden="true">
              “
            </span>

            {/* Tagline highlighted keywords */}
            {tags.length > 0 && (
              <div className="quote-text-animate flex flex-wrap gap-2 mb-6">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-block bg-[#F5C400] text-black font-black uppercase text-[9px] tracking-widest px-3 py-1.5 rounded-sm shadow-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Main content quote */}
            <p className="quote-text-animate text-white/95 text-base md:text-lg leading-relaxed font-medium tracking-wide mb-8">
              {active.content}
            </p>

            {/* Author info & circular slide controls */}
            <div className="quote-text-animate flex items-center justify-between border-t border-white/10 pt-6 mt-4">
              
              {/* Author profile */}
              <AuthorAvatar testimonial={active} />

              {/* Slider control buttons */}
              {length > 1 && (
                <div className="flex gap-2">
                  <button
                    onClick={handlePrev}
                    aria-label="Previous testimonial"
                    className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-[#F5C400] hover:text-black hover:border-transparent active:scale-95 shadow-md"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Next testimonial"
                    className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-[#F5C400] hover:text-black hover:border-transparent active:scale-95 shadow-md"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export { TestimonialsSection };
