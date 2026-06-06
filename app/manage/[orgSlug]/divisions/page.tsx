import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Only owner can edit divisions
const ManagerDivisionsPage = () => {
  redirect("/dashboard/divisions");
};
export default ManagerDivisionsPage;
