import { PawChartApp } from "@/components/pawchart-app";
import { demoOwnerProfile, type OwnerProfile } from "@/data/demo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let ownerProfile: OwnerProfile | undefined;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, phone, city")
      .eq("id", user.id)
      .maybeSingle();

    ownerProfile = {
      id: user.id,
      firstName: profile?.first_name ?? user.user_metadata?.first_name ?? user.user_metadata?.name?.split(" ")[0] ?? demoOwnerProfile.firstName,
      lastName: profile?.last_name ?? user.user_metadata?.last_name ?? "",
      email: profile?.email ?? user.email ?? "",
      phone: profile?.phone ?? "",
      city: profile?.city ?? "",
    };
  }

  return <PawChartApp authEmail={user?.email ?? null} initialOwnerProfile={ownerProfile} isAuthenticated={Boolean(user)} />;
}
