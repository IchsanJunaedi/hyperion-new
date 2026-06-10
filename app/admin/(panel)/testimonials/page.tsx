import { getTestimonials } from "@/features/admin/queries";
import { TestimonialsAdminClient } from "@/features/admin/components/TestimonialsAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const testimonials = await getTestimonials();
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-ui-border bg-ui-bg px-6">
        <div className="text-sm text-ui-text-2">Admin <span className="text-ui-text-muted">/</span> <span className="text-ui-text-dim">Testimonials</span></div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-8 py-10">
        <TestimonialsAdminClient testimonials={testimonials} />
      </main>
    </>
  );
}
