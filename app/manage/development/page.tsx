import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Redirect to /manage which redirects to /manage/[firstOrgSlug]
export default function OldManageRoute() {
  redirect("/manage");
}
