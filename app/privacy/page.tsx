import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";

export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    title: "Informasi yang Kami Kumpulkan",
    body: "Kami mengumpulkan informasi yang Anda berikan secara langsung, seperti nama, alamat email, dan informasi sekolah saat Anda mendaftar atau menghubungi kami. Kami juga mengumpulkan data penggunaan secara otomatis melalui cookie dan teknologi serupa.",
  },
  {
    title: "Penggunaan Informasi",
    body: "Informasi yang kami kumpulkan digunakan untuk mengelola keanggotaan tim, mengirimkan komunikasi terkait kegiatan dan turnamen, meningkatkan layanan kami, dan memenuhi kewajiban hukum yang berlaku.",
  },
  {
    title: "Keamanan Data",
    body: "Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi informasi pribadi Anda dari akses, pengungkapan, atau penghancuran yang tidak sah. Namun, tidak ada metode transmisi internet yang 100% aman.",
  },
  {
    title: "Berbagi Informasi",
    body: "Kami tidak menjual atau menyewakan informasi pribadi Anda kepada pihak ketiga. Kami dapat berbagi informasi dengan mitra terpercaya hanya untuk keperluan operasional dan dengan persetujuan Anda.",
  },
  {
    title: "Hak Anda",
    body: "Anda memiliki hak untuk mengakses, memperbarui, atau menghapus informasi pribadi Anda kapan saja. Hubungi kami melalui Instagram atau email jika Anda ingin menggunakan hak-hak tersebut.",
  },
  {
    title: "Perubahan Kebijakan",
    body: "Kami dapat memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan akan diumumkan di halaman ini dengan tanggal pembaruan yang baru. Penggunaan berkelanjutan atas layanan kami setelah perubahan berarti Anda menyetujui kebijakan yang diperbarui.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#040D1C]">
        <section className="mx-auto max-w-3xl px-6 py-20 sm:px-10">
          {/* Header */}
          <div className="mb-12">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px w-8 bg-[#F5C400]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
                Legal
              </span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              PRIVACY POLICY
            </h1>
            <p className="mt-3 text-sm text-white/40">
              Terakhir diperbarui: Januari 2025
            </p>
          </div>

          <p className="mb-10 text-sm leading-relaxed text-white/55">
            Hyperion Team (&quot;kami&quot;) berkomitmen untuk melindungi privasi Anda. Kebijakan
            ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi
            informasi pribadi Anda ketika menggunakan layanan kami.
          </p>

          <div className="space-y-10">
            {SECTIONS.map((s, i) => (
              <div key={s.title}>
                <h2 className="mb-3 flex items-start gap-3 text-base font-black uppercase tracking-tight text-white">
                  <span className="text-[#F5C400]">{String(i + 1).padStart(2, "0")}.</span>
                  {s.title}
                </h2>
                <p className="text-sm leading-relaxed text-white/55">{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
