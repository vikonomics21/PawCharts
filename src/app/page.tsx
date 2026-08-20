import { PawChartApp, type PawChartDataMode, type PawChartInitialData } from "@/components/pawchart-app";
import type { OwnerProfile } from "@/data/demo";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { fetchProductionWorkspace, type PawChartWorkspace } from "@/lib/supabase/workspace";

export default async function Home() {
  const appMode: PawChartDataMode = process.env.NODE_ENV === "production" ? "production" : "local-demo";
  const hasSupabaseEnv = hasSupabasePublicEnv();

  let authEmail: string | null = null;
  let initialData: PawChartInitialData | undefined;
  let isAuthenticated = false;
  let ownerProfile: OwnerProfile | undefined;
  let productionLoadError = false;
  let workspace: PawChartWorkspace | undefined;

  if (!hasSupabaseEnv) {
    if (appMode === "production") {
      throw new Error("Missing Supabase environment variables for production.");
    }

    return <PawChartApp appMode={appMode} />;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    authEmail = user.email ?? null;
    isAuthenticated = true;

    if (appMode === "production") {
      try {
        const productionWorkspace = await fetchProductionWorkspace(supabase, user);
        ownerProfile = productionWorkspace.ownerProfile;
        initialData = {
          archivedPets: productionWorkspace.archivedPets,
          documents: productionWorkspace.documents,
          measurements: productionWorkspace.measurements,
          pets: productionWorkspace.pets,
          vetProviders: productionWorkspace.vetProviders,
        };
        workspace = productionWorkspace.workspace;
      } catch (error) {
        console.error("Failed to load Supabase workspace for the current user.", error);
        productionLoadError = true;
      }
    }
  }

  return (
    <PawChartApp
      appMode={appMode}
      authEmail={authEmail}
      initialData={initialData}
      initialOwnerProfile={ownerProfile}
      isAuthenticated={isAuthenticated}
      productionLoadError={productionLoadError}
      workspace={workspace}
    />
  );
}
