import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { OwnerProfile, ShareLink, VetProvider } from "@/data/demo";
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

type ShareLinkRow = {
  id: string;
  pet_id: string;
  label: string;
  link_type: "vaccination_record" | "document_packet";
  token: string;
  show_owner_contact: boolean;
  status: "active" | "revoked";
  created_at: string;
  share_link_documents?: { document_id: string }[];
};

export async function fetchProductionWorkspace(supabase: SupabaseClient, user: User) {
  const [profileResult, membershipResult, pets, archivedPets, documents, measurements, shareLinks] = await Promise.all([
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
    fetchShareLinksForCurrentUser(supabase),
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
    shareLinks,
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

export async function fetchShareLinksForCurrentUser(supabase: SupabaseClient): Promise<ShareLink[]> {
  const { data, error } = await supabase
    .from("share_links")
    .select("id, pet_id, label, link_type, token, show_owner_contact, status, created_at, share_link_documents(document_id)")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as ShareLinkRow[]).map((row) => ({
    id: row.id,
    petId: row.pet_id,
    label: row.label,
    type: row.link_type === "document_packet" ? "Document packet" : "Vaccination record",
    token: row.token,
    url: `${getPublicSiteUrl()}/share/${row.token}`,
    includeOwnerContact: row.show_owner_contact,
    status: row.status === "active" ? "Active" : "Revoked",
    createdLabel: formatShortDate(row.created_at),
    documentIds: (row.share_link_documents ?? []).map((document) => document.document_id),
  }));
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

function getPublicSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || "https://pets.vikonomics.com").replace(/\/$/, "");
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
