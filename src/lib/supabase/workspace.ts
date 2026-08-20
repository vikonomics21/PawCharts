import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { OwnerProfile, VetProvider } from "@/data/demo";
import { fetchDocumentsForCurrentUser } from "@/lib/supabase/documents";
import { fetchMeasurementsForCurrentUser } from "@/lib/supabase/measurements";
import { fetchPetsForCurrentUser } from "@/lib/supabase/pets";

export type PawChartHousehold = {
  id: string;
  name: string;
};

export type PawChartHouseholdMembership = {
  id: string;
  householdId: string;
  role: "owner" | "admin" | "member";
};

export type PawChartWorkspace = {
  household: PawChartHousehold | null;
  householdMembership: PawChartHouseholdMembership | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
};

type HouseholdMemberWithHouseholdRow = {
  id: string;
  household_id: string;
  role: "owner" | "admin" | "member";
  households: {
    id: string;
    name: string;
  } | null;
};

type VetProviderRow = {
  id: string;
  household_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
};

export async function fetchProductionWorkspace(supabase: SupabaseClient, user: User) {
  const [profileResult, membershipResult, pets, archivedPets, documents, measurements] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, first_name, last_name, phone, city")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("household_members")
      .select("id, household_id, role, households(id, name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    fetchPetsForCurrentUser(supabase),
    fetchPetsForCurrentUser(supabase, { archived: true }),
    fetchDocumentsForCurrentUser(supabase),
    fetchMeasurementsForCurrentUser(supabase),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (membershipResult.error) {
    throw membershipResult.error;
  }

  const membershipRow = membershipResult.data as HouseholdMemberWithHouseholdRow | null;
  const householdId = membershipRow?.household_id ?? null;
  const vetProviders = householdId ? await fetchVetProvidersForHousehold(supabase, householdId) : [];

  return {
    ownerProfile: mapProfileToOwnerProfile(profileResult.data as ProfileRow | null, user),
    archivedPets,
    documents,
    measurements,
    pets,
    vetProviders,
    workspace: {
      household: membershipRow?.households
        ? {
            id: membershipRow.households.id,
            name: membershipRow.households.name,
          }
        : null,
      householdMembership: membershipRow
        ? {
            id: membershipRow.id,
            householdId: membershipRow.household_id,
            role: membershipRow.role,
          }
        : null,
    } satisfies PawChartWorkspace,
  };
}

export async function fetchVetProvidersForHousehold(supabase: SupabaseClient, householdId: string): Promise<VetProvider[]> {
  const { data, error } = await supabase
    .from("vet_providers")
    .select("id, household_id, name, phone, address, website, notes")
    .eq("household_id", householdId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as VetProviderRow[]).map(mapVetProviderRow);
}

export function mapProfileToOwnerProfile(row: ProfileRow | null, user: User): OwnerProfile {
  return {
    id: user.id,
    firstName: row?.first_name ?? user.user_metadata?.first_name ?? user.user_metadata?.name?.split(" ")[0] ?? "",
    lastName: row?.last_name ?? user.user_metadata?.last_name ?? "",
    email: row?.email ?? user.email ?? "",
    phone: row?.phone ?? "",
    city: row?.city ?? "",
  };
}

export function mapVetProviderRow(row: VetProviderRow): VetProvider {
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    phone: row.phone ?? "",
    address: row.address ?? "",
    website: row.website ?? "",
    notes: row.notes ?? "",
  };
}
