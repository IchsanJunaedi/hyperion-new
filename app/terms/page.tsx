import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";

export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    title: "Penerimaan Syarat",
    body: "Dengan mengakses dan menggunakan platform Hyperion Team, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. Jika Anda tidak menyetujui salah satu bagian dari syarat ini, Anda tidak diperbolehkan menggunakan layanan kami.",
  },
  {
    title: "Keanggotaan",
    body: "Untuk bergabung sebagai anggota tim, Anda wajib memberikan informasi yang akurat dan lengkap. Keanggotaan tunduk pada persetujuan manajemen dan dapat dicabut apabila terjadi pelanggaran terhadap kode etik tim.",
  },
  {
    title: "Kode Etik",
    body: "Semua anggota wajib menjaga sportivitas, menghormati sesama pemain dan staf, tidak menggunakan cheat atau software ilegal, serta mewakili Hyperion Team dengan perilaku yang baik di dalam maupun di luar arena.",
  },
  {
    title: "Konten dan Hak Kekayaan Intelektual",
    body: "Seluruh konten yang diterbitkan oleh Hyperion Team — termasuk logo, foto, dan nama — adalah milik organisasi. Penggunaan konten tanpa izin tertulis dilarang dan dapat dikenai tindakan hukum.",
  },
  {
    title: "Batasan Tanggung Jawab",
    body: "Hyperion Team tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul dari penggunaan platform kami atau partisipasi dalam kegiatan tim, kecuali yang diwajibkan oleh hukum yang berlaku.",
  },
  {
    title: "Perubahan Syarat",
    body: "Kami berhak mengubah syarat dan ketentuan ini kapan saja. Perubahan signifikan akan dikomunikasikan kepada anggota aktif. Penggunaan berkelanjutan atas layanan kami berarti Anda menerima perubahan tersebut.",
  },
];

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#070707]">
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
              TERMS OF SERVICE
            </h1>
            <p className="mt-3 text-sm text-white/40">
              Terakhir diperbarui: Januari 2025
            </p>
          </div>

          <p className="mb-10 text-sm leading-relaxed text-white/55">
            Syarat dan Ketentuan ini mengatur penggunaan Anda atas platform dan layanan
            Hyperion Team. Harap baca dengan seksama sebelum bergabung atau menggunakan
            layanan kami.
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
