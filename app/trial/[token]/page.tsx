import type { Metadata } from "next";

import { getTrialByToken } from "@/features/trials/queries";
import { TrialRegistrationForm } from "@/features/trials/components/TrialRegistrationForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const trial = await getTrialByToken(token);
  return { title: trial ? `Daftar Trial — ${trial.title}` : "Trial tidak ditemukan" };
}

export default async function TrialPublicPage({ params }: Props) {
  const { token } = await params;
  const trial = await getTrialByToken(token);

  return (
    <div className="min-h-screen bg-[#191919] flex flex-col">
      <header className="border-b border-[#2D2D2D] bg-[#202020]">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center px-4">
          <span className="text-sm font-semibold tracking-tight text-[#E5E2E1]">Hyperion Team</span>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {!trial ? (
            <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-8 text-center">
              <p className="text-sm font-semibold text-[#E5E2E1]">Trial tidak ditemukan</p>
              <p className="mt-1 text-xs text-[#9B9A97]">Link mungkin sudah tidak aktif atau salah ketik.</p>
            </div>
          ) : trial.status !== "active" ? (
            <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-8 text-center">
              <p className="text-sm font-semibold text-[#E5E2E1]">Pendaftaran ditutup</p>
              <p className="mt-1 text-xs text-[#9B9A97]">Trial ini sudah tidak menerima pendaftar baru.</p>
            </div>
          ) : (
            <TrialRegistrationForm trial={trial} />
          )}
        </div>
      </main>
    </div>
  );
}
