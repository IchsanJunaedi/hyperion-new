import { Instagram, Mail, Phone } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { getSiteSettings } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.seo_contact_title || "Kontak — Hyperion Team",
    description: settings.seo_contact_description || "Hubungi Hyperion Team untuk pertanyaan, kerjasama, atau bergabung bersama kami.",
  };
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const igUrl = settings.contact_instagram_url || "https://www.instagram.com/hyperionteam.id/";
  const igHandle = settings.contact_instagram_handle || "@hyperionteam.id";
  const email = settings.contact_email || "hyperionteam.id@gmail.com";
  const whatsapp = settings.contact_whatsapp || "";
  const location = settings.contact_location || "Palembang, Sumatera Selatan";
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#070707]">
        <section className="relative overflow-hidden border-b border-white/5 px-6 py-20 sm:px-10 lg:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(245,196,0,0.2) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[#F5C400]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
                Hubungi Kami
              </span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              CONTACT US
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/40">
              Ada pertanyaan, ingin bergabung, atau ingin berkolaborasi? Jangan
              ragu untuk menghubungi kami.
            </p>
          </div>
        </section>

        <section className="px-6 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Left: contact info */}
              <div>
                <h2 className="mb-8 text-xl font-black uppercase tracking-tight text-white">
                  Reach Out
                </h2>

                <div className="space-y-6">
                  {/* Instagram */}
                  <div className="flex items-start gap-4 border border-white/5 bg-[#0D0D0D] p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#F5C400]/10">
                      <Instagram className="h-5 w-5 text-[#F5C400]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                        Instagram
                      </p>
                      <Link
                        href={igUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 text-sm font-semibold text-white transition hover:text-[#F5C400]"
                      >
                        {igHandle}
                      </Link>
                      <p className="mt-1 text-xs text-white/30">
                        DM kami untuk pertanyaan dan kerjasama
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4 border border-white/5 bg-[#0D0D0D] p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#F5C400]/10">
                      <Mail className="h-5 w-5 text-[#F5C400]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                        Email
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {email}
                      </p>
                      <p className="mt-1 text-xs text-white/30">
                        Respon dalam 1–2 hari kerja
                      </p>
                    </div>
                  </div>

                  {whatsapp && (
                    <div className="flex items-start gap-4 border border-white/5 bg-[#0D0D0D] p-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#F5C400]/10">
                        <Phone className="h-5 w-5 text-[#F5C400]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                          WhatsApp
                        </p>
                        <Link
                          href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-sm font-semibold text-white transition hover:text-[#F5C400]"
                        >
                          {whatsapp}
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  <div className="flex items-start gap-4 border border-white/5 bg-[#0D0D0D] p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#F5C400]/10">
                      <span className="text-xs font-black text-[#F5C400]">ID</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                        Lokasi
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {location}
                      </p>
                      <p className="mt-1 text-xs text-white/30">Indonesia</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: join CTA */}
              <div className="flex flex-col justify-center">
                <div className="border border-[#F5C400]/15 bg-[#0D0D0D] p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="h-px w-8 bg-[#F5C400]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
                      Bergabung
                    </span>
                  </div>
                  <h3 className="text-2xl font-black uppercase leading-tight tracking-tight text-white sm:text-3xl">
                    INGIN JADI BAGIAN
                    <br />
                    <span className="text-[#F5C400]">HYPERION TEAM?</span>
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/45">
                    Kami selalu membuka kesempatan untuk talenta muda yang
                    bersemangat, disiplin, dan berambisi tinggi di dunia esports.
                  </p>
                  <Link
                    href="/register"
                    className="mt-8 inline-flex h-12 items-center gap-2 bg-[#F5C400] px-7 text-sm font-black uppercase tracking-wide text-black transition hover:bg-yellow-300"
                  >
                    Daftar Sekarang →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
