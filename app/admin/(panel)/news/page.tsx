import { getNewsPosts } from "@/features/admin/queries";
import { NewsAdminClient } from "@/features/admin/components/NewsAdminClient";

export const dynamic = "force-dynamic";

const AdminNewsPage = async () => {
  const posts = await getNewsPosts();
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-[#2D2D2D] bg-[#191919] px-6">
        <div className="text-sm text-[#9B9A97]">
          Admin <span className="text-[#6B6A68]">/</span>{" "}
          <span className="text-[#D4D4D4]">News</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-8 py-10">
        <NewsAdminClient posts={posts} />
      </main>
    </>
  );
};
export { AdminNewsPage as default };
