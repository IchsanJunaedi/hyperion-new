import { getAchievements } from "@/features/admin/queries";
import { AchievementsAdminClient } from "@/features/admin/components/AchievementsAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminAchievementsPage() {
  const entries = await getAchievements();
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-[#2D2D2D] bg-[#191919] px-6">
        <div className="text-sm text-[#9B9A97]">
          Admin <span className="text-[#6B6A68]">/</span>{" "}
          <span className="text-[#D4D4D4]">Achievements</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-8 py-10">
        <AchievementsAdminClient entries={entries} />
      </main>
    </>
  );
}
