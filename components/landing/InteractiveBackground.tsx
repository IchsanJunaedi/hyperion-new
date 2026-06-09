"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const InteractiveBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);
  const scanlineRef = useRef<HTMLDivElement>(null);

  // 1. Slow, continuous floating animations using GSAP
  useGSAP(() => {
    // Orb 1: Brand Yellow floating
    gsap.to(orb1Ref.current, {
      x: "random(-100, 100)",
      y: "random(-100, 100)",
      scale: "random(0.8, 1.3)",
      duration: "random(8, 14)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Orb 2: Cyber Blue floating
    gsap.to(orb2Ref.current, {
      x: "random(-120, 120)",
      y: "random(-120, 120)",
      scale: "random(0.9, 1.4)",
      duration: "random(10, 18)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Orb 3: Tech Cyan floating
    gsap.to(orb3Ref.current, {
      x: "random(-80, 80)",
      y: "random(-80, 80)",
      scale: "random(0.7, 1.2)",
      duration: "random(7, 12)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Sweep scanline down periodically
    gsap.to(scanlineRef.current, {
      y: "100vh",
      duration: 8,
      repeat: -1,
      ease: "none",
      delay: 2,
    });

    // Animate glowing tech spark intersections
    gsap.to(".bg-spark", {
      opacity: "random(0.1, 0.7)",
      scale: "random(0.5, 1.5)",
      duration: "random(2, 4)",
      stagger: {
        amount: 2,
        grid: "auto",
        repeat: -1,
        yoyo: true,
      },
      ease: "power1.inOut",
    });
  }, { scope: containerRef });

  // 2. Interactive mouse movement parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseMoveEvent) => {
      if (!containerRef.current) return;
      
      const { clientX, clientY } = e;
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Calculate normalized offset from center (-0.5 to 0.5)
      const xPercent = (clientX / width) - 0.5;
      const yPercent = (clientY / height) - 0.5;

      // Parallax move container/orbs slightly in opposite/different speeds
      gsap.to(orb1Ref.current, {
        xPercent: xPercent * -15,
        yPercent: yPercent * -15,
        duration: 2,
        ease: "power2.out",
        overwrite: "auto",
      });

      gsap.to(orb2Ref.current, {
        xPercent: xPercent * 25,
        yPercent: yPercent * 25,
        duration: 2.5,
        ease: "power2.out",
        overwrite: "auto",
      });

      gsap.to(orb3Ref.current, {
        xPercent: xPercent * -8,
        yPercent: yPercent * -8,
        duration: 1.8,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    type MouseMoveEvent = { clientX: number; clientY: number };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden z-0"
    >
      {/* ── Background Glow Orbs ─────────────────────────────────────── */}
      {/* Yellow/Gold Orb */}
      <div
        ref={orb1Ref}
        className="absolute top-[15%] left-[20%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-[#F5C400]/8 blur-[130px]"
      />

      {/* Cyber Blue Orb */}
      <div
        ref={orb2Ref}
        className="absolute top-[45%] right-[15%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full bg-[#0066FF]/6 blur-[140px]"
      />

      {/* Tech Cyan/Teal Orb */}
      <div
        ref={orb3Ref}
        className="absolute bottom-[10%] left-[25%] w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] rounded-full bg-[#00F5D4]/5 blur-[120px]"
      />

      {/* ── Subtle Sweep Scanline ─────────────────────────────────────── */}
      <div
        ref={scanlineRef}
        className="absolute left-0 top-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#F5C400]/8 to-transparent opacity-40 pointer-events-none"
        style={{ transform: "translateY(-100px)" }}
      />

      {/* ── Tech Sparks (Grid Intersections) ─────────────────────────── */}
      <div className="absolute inset-0 opacity-15">
        {/* We place a few glowing intersections around the grid area */}
        <div className="bg-spark absolute top-[25%] left-[33%] w-2 h-2 rounded-full bg-[#F5C400] blur-[1px] shadow-[0_0_8px_#F5C400]" />
        <div className="bg-spark absolute top-[40%] left-[70%] w-2.5 h-2.5 rounded-full bg-[#00F5D4] blur-[1px] shadow-[0_0_10px_#00F5D4]" />
        <div className="bg-spark absolute top-[65%] left-[20%] w-2 h-2 rounded-full bg-[#F5C400] blur-[1px] shadow-[0_0_8px_#F5C400]" />
        <div className="bg-spark absolute top-[80%] left-[60%] w-2 h-2 rounded-full bg-[#0066FF] blur-[1px] shadow-[0_0_8px_#0066FF]" />
        <div className="bg-spark absolute top-[12%] left-[85%] w-2.5 h-2.5 rounded-full bg-[#F5C400] blur-[1px] shadow-[0_0_10px_#F5C400]" />
      </div>
    </div>
  );
};

export { InteractiveBackground };
