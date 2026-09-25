import WorkshopRegistrationPortal from "@/components/workshops/WorkshopRegistrationPortal";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WorkshopRegistrationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <WorkshopRegistrationPortal
      user={
        user
          ? {
              email: user.email || "",
              fullName:
                typeof user.user_metadata?.full_name === "string"
                  ? user.user_metadata.full_name.trim()
                  : "",
            }
          : null
      }
    />
  );
}
