import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const ManageTodosRedirect = () => {
  redirect("/manage");
};

export default ManageTodosRedirect;
