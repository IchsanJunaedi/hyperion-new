import { getMembersForAdmin } from "@/features/admin/queries";
import { PlayersAdminClient } from "@/features/admin/components/PlayersAdminClient";

export const dynamic = "force-dynamic";

const AdminPlayersPage = async () => {
  const members = await getMembersForAdmin();
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-[#2D2D2D] bg-[#191919] px-6">
        <div className="text-sm text-[#9B9A97]">
          Admin <span className="text-[#6B6A68]">/</span>{" "}
          <span className="text-[#D4D4D4]">Players Publik</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-8 py-10">
        <PlayersAdminClient members={members} />
      </main>
    </>
  );
};
export { AdminPlayersPage as default };
