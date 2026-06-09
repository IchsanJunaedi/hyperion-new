"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Instagram } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface AboutAlumnus {
  id: string;
  name: string;
  role: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
}

interface AboutClientProps {
  settings: Record<string, string>;
  alumni: AboutAlumnus[];
}

const AboutClient = ({ settings, alumni }: AboutClientProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [wibTime, setWibTime] = useState("");

  // Update WIB clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };
      setWibTime(new Intl.DateTimeFormat("en-GB", options).format(now));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // GSAP Animations
  useGSAP(() => {
    if (!containerRef.current) return;

    // 1. Who We Are: Top header bar text swap animation
    const swapSection = containerRef.current.querySelector(".about-who-we-are");
    if (swapSection) {
      const leftDefault = swapSection.querySelector(".swap-left .swap-default");
      const leftAlt = swapSection.querySelector(".swap-left .swap-alt");
      const rightDefault = swapSection.querySelector(".swap-right .swap-default");
      const rightAlt = swapSection.querySelector(".swap-right .swap-alt");
      const midText = swapSection.querySelector(".swap-mid-text");
      const midImg = swapSection.querySelector(".swap-mid-img");

      if (leftDefault && leftAlt && rightDefault && rightAlt && midText && midImg) {
        const tl = gsap.timeline({
          paused: true,
          defaults: { duration: 0.28, ease: "power2.out" }
        });

        tl.to(leftDefault, { opacity: 0, y: -10 }, 0)
          .to(leftAlt, { opacity: 1, y: 0 }, 0.12)
          .to(rightDefault, { opacity: 0, y: -10 }, 0)
          .to(rightAlt, { opacity: 1, y: 0 }, 0.12)
          .to(midText, { opacity: 0, y: -10 }, 0)
          .to(midImg, { opacity: 1, y: 0 }, 0.14);

        ScrollTrigger.create({
          trigger: swapSection,
          start: "top 35%",
          end: "bottom 35%",
          animation: tl,
          toggleActions: "play none none reverse",
        });
      }
    }

    // 2. Pinned Scrolling Gallery (BUILDING ESPORTS CHAMPIONS)
    const pinHeight = containerRef.current.querySelector(".mwg037-pin-height");
    const stickyContainer = containerRef.current.querySelector(".mwg037-container");
    const medias = containerRef.current.querySelectorAll(".mwg037-hidden");
    const mediasChild = containerRef.current.querySelectorAll(".mwg037-image");

    if (pinHeight && stickyContainer && medias.length && mediasChild.length) {
      ScrollTrigger.create({
        trigger: pinHeight,
        start: "top top",
        end: "bottom bottom",
        pin: stickyContainer,
        pinSpacing: false
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinHeight,
          start: "top top",
          end: "bottom bottom",
          scrub: true
        }
      });

      medias.forEach((media, idx) => {
        if (idx > 0) {
          const prevMedia = medias[idx - 1];
          if (prevMedia && media) {
            tl.to(prevMedia, { opacity: 0, ease: "power2.inOut" }, idx - 0.5)
              .to(media, { opacity: 1, ease: "power2.inOut" }, idx - 0.5);
          }
        }
      });

      gsap.to(mediasChild, {
        y: -30,
        ease: "none",
        scrollTrigger: {
          trigger: pinHeight,
          start: "top top",
          end: "bottom bottom",
          scrub: true
        }
      });
    }

    // 3. Sliding Line Glow Animation
    containerRef.current.querySelectorAll(".section-with-line").forEach((section) => {
      const wrap = section.querySelector(".line-container");
      const glow = wrap?.querySelector(".line-glow");
      if (!wrap || !glow) return;

      gsap.set(glow, { x: -250, opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: () => "+=" + (window.innerHeight + 250),
          scrub: true,
          invalidateOnRefresh: true,
        }
      });

      tl.to(glow, { opacity: 1, duration: 0.15, ease: "none" }, 0)
        .to(glow, {
          x: () => wrap.clientWidth + 250,
          duration: 1,
          ease: "none"
        }, 0)
        .to(glow, { opacity: 0, duration: 0.15, ease: "none" }, 0.85);
    });

    // 4. Stagger Entrance Animations for Headers/Paragraphs
    const textSections = containerRef.current.querySelectorAll(".animate-text-section");
    textSections.forEach((section) => {
      const elements = section.querySelectorAll(".animate-up");
      if (elements.length) {
        gsap.from(elements, {
          y: "25%",
          opacity: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            once: true
          }
        });
      }
    });

    // 5. Grid Images Entrance
    const gridImages = containerRef.current.querySelectorAll(".about-grid-img");
    if (gridImages.length) {
      gsap.from(gridImages, {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".about-img-grid-container",
          start: "top 80%",
          once: true
        }
      });
    }
  }, { scope: containerRef });

  // Fallback copy content if database settings are empty
  const visionTitle = settings.about_vision_title || "Our Vision";
  const visionBody = settings.about_vision_body || "Menjadi organisasi esports terdepan yang melahirkan generasi pemain profesional, membuktikan bahwa talenta muda Indonesia mampu bersaing di panggung nasional dan internasional.";
  const missionBody = settings.about_mission_body || "Mengembangkan bakat muda melalui program pelatihan komprehensif, kompetisi rutin, dan mentoring dari para profesional — membangun fondasi karir esports yang kuat sejak dini.";
  const valuesBody = settings.about_values_body || "Integritas dalam setiap pertandingan, semangat untuk terus berkembang, dan kebersamaan sebagai satu tim yang solid. Kami percaya kemenangan sejati dibangun di luar arena.";

  // Highfulminds inspired background styling: notion-dark background #191919
  return (
    <div ref={containerRef} className="flex-1 bg-[#040D1C] text-[#E5E2E1] overflow-hidden">
      {/* 1. Hero Section */}
      <section className="relative w-full border-b border-white/10 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
          <div className="space-y-4">
            <span className="text-[11px] font-mono tracking-[0.4em] uppercase text-[#F5C400] font-bold block animate-fadeinup">
              Est. 2020 · Palembang, Indonesia
            </span>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-none animate-fadeinup">
              Hyperion <br />
              <span className="text-[#F5C400]">Team</span>
            </h1>
          </div>
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0C1E3C]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.jpg"
              alt="Hyperion Team Hero"
              className="absolute inset-0 w-full h-full object-cover scale-105"
            />
          </div>
        </div>
      </section>

      {/* 2. Who We Are Section */}
      <section className="about-who-we-are border-b border-white/10">
        <div className="w-full border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-3 font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#9B9A97]">
            {/* Left Swap */}
            <div className="swap-left grid grid-cols-1 grid-rows-1 justify-items-start items-center h-6 overflow-hidden">
              <div className="swap-default col-start-1 row-start-1">Hyperion</div>
              <div className="swap-alt col-start-1 row-start-1 opacity-0 translate-y-2 text-white font-bold">Who we are</div>
            </div>
            {/* Middle Swap */}
            <div className="swap-mid grid grid-cols-1 grid-rows-1 justify-items-center items-center h-6 overflow-hidden">
              <div className="swap-mid-text col-start-1 row-start-1">Esports</div>
              <div className="swap-mid-img col-start-1 row-start-1 opacity-0 translate-y-2 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/logo.jpg"
                  alt="Logo"
                  width={20}
                  height={20}
                  className="rounded-full object-cover animate-[spin_16s_linear_infinite]"
                />
              </div>
            </div>
            {/* Right Swap */}
            <div className="swap-right grid grid-cols-1 grid-rows-1 justify-items-end items-center h-6 overflow-hidden">
              <div className="swap-default col-start-1 row-start-1">Team</div>
              <div className="swap-alt col-start-1 row-start-1 opacity-0 translate-y-2 text-[#F5C400] font-bold">(01)</div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-20 md:py-32 animate-text-section space-y-8">
          <h2 className="animate-up text-2xl sm:text-4xl font-light tracking-tight text-white leading-snug">
            Hyperion Team adalah wadah pembinaan talenta muda esports di Indonesia. Kami mendedikasikan diri untuk melahirkan generasi pemain profesional baru yang siap mendominasi kancah kompetitif.
          </h2>
          <p className="animate-up text-sm sm:text-base leading-relaxed text-[#9B9A97] font-light space-y-4">
            Sejak berdiri pada tahun 2020 di Palembang, Indonesia, kami telah berkomitmen penuh untuk mengarahkan hasrat bermain game para remaja ke arah yang produktif dan berprestasi. Melalui ekosistem terpadu kami yang mengintegrasikan latihan disiplin, bimbingan mental, dan manajemen kompetisi, kami memandu para pemain muda melewati transisi dari pemain amatir menjadi profesional.
            <br />
            <br />
            Bagi kami, esports bukan sekadar kompetisi di dalam game. Ini tentang dedikasi, kepemimpinan, kerja keras bersama, dan pencapaian target hidup yang konsisten. Kami percaya setiap talenta muda memiliki potensi terpendam yang menanti untuk dipoles dengan metodologi pembinaan yang tepat.
          </p>
        </div>
      </section>

      {/* 3. Pinned Scrolling Gallery */}
      <section className="relative">
        <div className="mwg037">
          <div className="mwg037-pin-height h-[250vh] relative">
            <div className="mwg037-container sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl px-6 items-center">
                {/* Left Text */}
                <h3 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white text-center md:text-left leading-none">
                  BUILDING
                </h3>

                {/* Sticky Center Images */}
                <div className="flex flex-col items-center justify-center space-y-4">
                  <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#9B9A97]">
                    ESPORTS
                  </span>
                  <div className="mwg037-images relative w-56 h-80 sm:w-64 sm:h-[380px] rounded-2xl overflow-hidden border border-white/10 bg-[#0C1E3C] shadow-2xl">
                    <div className="mwg037-hidden absolute inset-0 w-full h-full">
                      <img
                        src="/brand/landing-hero.jpeg"
                        alt="Esports Moment 1"
                        className="mwg037-image w-full h-full object-cover scale-105"
                      />
                    </div>
                    <div className="mwg037-hidden absolute inset-0 w-full h-full opacity-0">
                      <img
                        src="/brand/ref-hero.jpeg"
                        alt="Esports Moment 2"
                        className="mwg037-image w-full h-full object-cover scale-105"
                      />
                    </div>
                    <div className="mwg037-hidden absolute inset-0 w-full h-full opacity-0">
                      <img
                        src="/brand/ref-games.jpeg"
                        alt="Esports Moment 3"
                        className="mwg037-image w-full h-full object-cover scale-105"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Text */}
                <h3 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white text-center md:text-right leading-none">
                  CHAMPIONS
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. What We Believe (Vision & Mission) */}
      <section className="section-with-line relative py-12">
        {/* Sliding Line Glow */}
        <div className="w-full pt-0 line-container relative h-[1px] bg-white/10 overflow-hidden">
          <div className="line-base absolute inset-0 w-full h-[1px]"></div>
          <div className="line-glow absolute top-0 left-0 w-64 h-[2px] bg-gradient-to-r from-transparent via-[#F5C400] to-transparent blur-[4px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#9B9A97]">
          <div>What we believe</div>
          <div className="text-right">(02)</div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 animate-text-section">
          <h2 className="animate-up text-2xl sm:text-4xl font-light tracking-tight text-white leading-snug">
            {visionBody}
          </h2>
          <div className="space-y-6 animate-up">
            <p className="text-sm sm:text-base leading-relaxed text-[#9B9A97] font-light">
              <span className="text-white font-semibold block mb-2">{visionTitle}</span>
              Visi kami melampaui pencapaian medali. Kami ingin membangun warisan abadi di mana integritas, profesionalisme, dan kesehatan mental menjadi pilar utama para pemain kami di dalam maupun luar arena turnamen.
            </p>
            <p className="text-sm sm:text-base leading-relaxed text-[#9B9A97] font-light">
              <span className="text-white font-semibold block mb-2">Our Mission</span>
              {missionBody}
            </p>
            <p className="text-sm sm:text-base leading-relaxed text-[#9B9A97] font-light">
              <span className="text-white font-semibold block mb-2">Our Values</span>
              {valuesBody}
            </p>
          </div>
        </div>
      </section>

      {/* 5. Alumni / Roster Section */}
      <section className="section-with-line relative py-12 bg-[#040D1C]">
        {/* Sliding Line Glow */}
        <div className="w-full pt-0 line-container relative h-[1px] bg-white/10 overflow-hidden">
          <div className="line-base absolute inset-0 w-full h-[1px]"></div>
          <div className="line-glow absolute top-0 left-0 w-64 h-[2px] bg-gradient-to-r from-transparent via-[#F5C400] to-transparent blur-[4px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#9B9A97]">
          <div>Alumni / Roster</div>
          <div className="text-right">(02.5)</div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12 sm:py-20">
          <div className="mb-12 space-y-2">
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#F5C400]">SUCCESS STORIES</span>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">Meet Our Stars</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {alumni.map((member) => (
              <div
                key={member.id}
                className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 group bg-[#0C1E3C] shadow-lg"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.image_url ?? ""}
                  alt={member.name}
                  className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <p className="text-xl sm:text-2xl font-black tracking-wide text-white">
                    {member.name}
                  </p>
                  <p className="text-xs text-[#9B9A97] tracking-wider uppercase font-mono mt-1">
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Grid of Images Section */}
      <section className="py-16 bg-[#040D1C] about-img-grid-container">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="about-grid-img aspect-[3/4] relative rounded-2xl overflow-hidden border border-white/10 bg-[#0C1E3C]">
            <img
              src="/brand/logo.jpg"
              alt="Moment 1"
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition duration-700 ease-out"
            />
          </div>
          <div className="about-grid-img aspect-[3/4] relative rounded-2xl overflow-hidden border border-white/10 bg-[#0C1E3C]">
            <img
              src="/brand/logo.jpg"
              alt="Moment 2"
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition duration-700 ease-out"
            />
          </div>
          <div className="about-grid-img aspect-[3/4] relative rounded-2xl overflow-hidden border border-white/10 bg-[#0C1E3C]">
            <img
              src="/brand/logo.jpg"
              alt="Moment 3"
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition duration-700 ease-out"
            />
          </div>
          <div className="about-grid-img aspect-[3/4] relative rounded-2xl overflow-hidden border border-white/10 bg-[#0C1E3C]">
            <img
              src="/brand/logo.jpg"
              alt="Moment 4"
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition duration-700 ease-out"
            />
          </div>
        </div>
      </section>

      {/* 7. Are We For You & CTA */}
      <section className="section-with-line relative py-12 bg-[#040D1C]">
        {/* Sliding Line Glow */}
        <div className="w-full pt-0 line-container relative h-[1px] bg-white/10 overflow-hidden">
          <div className="line-base absolute inset-0 w-full h-[1px]"></div>
          <div className="line-glow absolute top-0 left-0 w-64 h-[2px] bg-gradient-to-r from-transparent via-[#F5C400] to-transparent blur-[4px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#9B9A97]">
          <div>Are we for you?</div>
          <div className="text-right">(03)</div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 animate-text-section space-y-12">
          <p className="animate-up text-xl sm:text-3xl font-light tracking-tight text-white leading-snug">
            Apakah kamu memiliki mimpi besar untuk menjadi pemain profesional? Apakah kamu berdedikasi untuk berlatih keras, menjaga kedisiplinan, dan tumbuh bersama di bawah bimbingan para pelatih terbaik?
          </p>

          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0C1E3C] animate-up">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.jpg"
              alt="Bootcamp Team Session"
              className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition duration-700 ease-out"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end animate-up pt-4">
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-[#9B9A97] font-light">
                Jika kamu adalah talenta muda yang siap memberikan segalanya untuk mencapai impian esports-mu, kami ingin bekerja sama dan menuntun langkah pertamamu.
              </p>
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2 text-sm font-mono tracking-widest uppercase text-[#F5C400] hover:text-white transition duration-300 font-bold"
              >
                Kami ingin mendengar darimu
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="text-left md:text-right">
              <span className="font-mono text-xs text-[#9B9A97] block uppercase tracking-widest">
                Owner & GM
              </span>
              <span className="text-lg font-bold text-white block mt-1">
                Ichsan Junaedi
              </span>
              <span className="text-xs text-[#9B9A97] block">
                Hyperion Team
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Rebuilt Premium Footer */}
      <footer className="relative bg-[#030914] border-t border-white/10 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-16">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                We’re always excited to hear from people who believe in their potential.
              </h2>
              <Link
                href="/rekrutmen"
                className="inline-flex items-center gap-3 text-lg sm:text-xl font-bold uppercase tracking-wider text-[#F5C400] hover:text-white transition duration-300 group"
              >
                Mulai Karir Esports-mu
                <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-12 border-t border-white/10">
            {/* Clock timezone */}
            <div className="flex flex-col space-y-1 justify-end">
              <span className="font-mono text-[10px] text-[#9B9A97] tracking-widest uppercase">ID Timezone</span>
              <span className="text-lg font-mono text-white font-bold">{wibTime || "00:00:00"}</span>
              <span className="font-mono text-[10px] text-[#9B9A97] tracking-widest">(WIB)</span>
            </div>

            {/* Link 1 */}
            <div className="flex flex-col space-y-2">
              <span className="font-mono text-[10px] text-[#9B9A97] tracking-widest uppercase mb-1">Company</span>
              <Link href="/about" className="text-xs text-[#9B9A97] hover:text-white transition">About Us</Link>
              <Link href="/divisions" className="text-xs text-[#9B9A97] hover:text-white transition">Divisions</Link>
              <Link href="/gallery" className="text-xs text-[#9B9A97] hover:text-white transition">Achievements</Link>
            </div>

            {/* Link 2 */}
            <div className="flex flex-col space-y-2">
              <span className="font-mono text-[10px] text-[#9B9A97] tracking-widest uppercase mb-1">Socials</span>
              <a href="https://www.instagram.com/hyperionteam.id/" target="_blank" rel="noreferrer" className="text-xs text-[#9B9A97] hover:text-white transition inline-flex items-center gap-1.5">
                Instagram <ArrowUpRight className="h-3 w-3" />
              </a>
              <Link href="/news" className="text-xs text-[#9B9A97] hover:text-white transition">News</Link>
              <Link href="/contact" className="text-xs text-[#9B9A97] hover:text-white transition">Contact</Link>
            </div>

            {/* Link 3 */}
            <div className="flex flex-col space-y-2">
              <span className="font-mono text-[10px] text-[#9B9A97] tracking-widest uppercase mb-1">Legal</span>
              <Link href="/privacy" className="text-xs text-[#9B9A97] hover:text-white transition">Privacy Policy</Link>
              <Link href="/terms" className="text-xs text-[#9B9A97] hover:text-white transition">Terms of Service</Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center pt-12 mt-12 border-t border-[#2D2D2D]/20 text-[10px] font-mono text-[#9B9A97] tracking-widest uppercase space-y-4 sm:space-y-0">
            <span>©{new Date().getFullYear()} Hyperion Team</span>
            <div className="flex items-center gap-2">
              <span>DESIGN STUDY BY HIGHFULMINDS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export { AboutClient };
