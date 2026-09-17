import { redirect } from "next/navigation";
import WorkshopAdminConsole from "@/components/admin/WorkshopAdminConsole";
import { getAdminSession } from "@/lib/admin/server";

export const dynamic = "force-dynamic";

export default async function AdminWorkshopsPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/researcher");

  return <WorkshopAdminConsole initialAdmin={admin} />;
}
