import { redirect } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import { getAdminSession } from "@/lib/admin/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/researcher");

  return <AdminDashboard initialAdmin={admin} />;
}
