import { redirect } from "next/navigation";
import WorkshopRegistrationForm from "@/components/workshops/WorkshopRegistrationForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WorkshopRegistrationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin?next=/workshops/register");
  }

  const accountName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";

  return (
    <WorkshopRegistrationForm
      accountEmail={user.email || ""}
      accountName={accountName}
    />
  );
}
