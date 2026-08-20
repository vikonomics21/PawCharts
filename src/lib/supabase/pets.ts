import type { SupabaseClient } from "@supabase/supabase-js";

import type { Pet, PetSpecies } from "@/data/demo";

export type PetRow = {
  id: string;
  household_id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  sex: "male" | "female" | "unknown";
  photo_path: string | null;
  date_of_birth: string | null;
  approximate_age_years: number | null;
  approximate_age_months: number | null;
  age_is_estimated: boolean;
  adoption_place: string | null;
  adoption_date: string | null;
  spayed_or_neutered: boolean | null;
  microchipped: boolean | null;
  microchip_number: string | null;
  weight_value: number | null;
  weight_unit: string;
  dog_size: string | null;
  dog_groomer_notes: string | null;
  cat_lifestyle: string | null;
  cat_litter_preference: string | null;
  behavior_notes: string | null;
  care_notes: string | null;
  medical_notes: string | null;
  known_history: string | null;
  favorite_foods: string[];
  disliked_foods: string[];
  feeding_rules: string[];
  primary_vet_provider_id: string | null;
  secondary_vet_provider_id: string | null;
  secondary_vet_role: string | null;
  archived_at: string | null;
  archived_reason: "passed-away" | "no-longer-owned" | "other" | null;
  archived_notes: string | null;
  deleted_at: string | null;
  deleted_reason: string | null;
  deleted_notes: string | null;
};

export type PetTrainingCueRow = {
  id: string;
  pet_id: string;
  cue: string;
  action: string;
  sort_order: number;
};

type PetWithCuesRow = PetRow & {
  pet_training_cues?: PetTrainingCueRow[];
};

export const PET_PHOTO_BUCKET = "pet-photos";
const PET_PHOTO_SIGNED_URL_TTL_SECONDS = 60 * 60;

export type PetCreateInput = {
  householdId: string;
  name: string;
  species: PetSpecies;
  breed?: string;
  approximateAgeYears?: number;
  approximateAgeMonths?: number;
  ageIsEstimated?: boolean;
  weightValue?: number;
  weightUnit?: string;
};

export type PetProfileUpdateInput = {
  id: string;
  name?: string;
  breed?: string;
  sex?: "male" | "female" | "unknown";
  approximateAgeYears?: number | null;
  approximateAgeMonths?: number | null;
  ageIsEstimated?: boolean;
  weightValue?: number | null;
  weightUnit?: string;
  adoptionPlace?: string | null;
  adoptionDate?: string | null;
  spayedOrNeutered?: boolean | null;
  microchipped?: boolean | null;
  microchipNumber?: string | null;
  behaviorNotes?: string | null;
  careNotes?: string | null;
  medicalNotes?: string | null;
  knownHistory?: string | null;
  favoriteFoods?: string[];
  dislikedFoods?: string[];
  feedingRules?: string[];
  primaryVetProviderId?: string | null;
  secondaryVetProviderId?: string | null;
  secondaryVetRole?: string | null;
};

export async function fetchPetsForCurrentUser(supabase: SupabaseClient, options?: { archived?: boolean }): Promise<Pet[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("pets")
    .select("*, pet_training_cues(id, pet_id, cue, action, sort_order)")
    .filter("archived_at", options?.archived ? "not.is" : "is", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .order("sort_order", { ascending: true, referencedTable: "pet_training_cues" });

  if (error) {
    throw error;
  }

  return Promise.all((data ?? []).map((row) => mapPetRowToPetWithSignedPhoto(supabase, row as PetWithCuesRow)));
}

export async function createPetProfile(supabase: SupabaseClient, input: PetCreateInput): Promise<Pet> {
  const { data, error } = await supabase
    .from("pets")
    .insert({
      household_id: input.householdId,
      name: input.name,
      species: input.species,
      breed: input.breed ?? null,
      approximate_age_years: input.approximateAgeYears ?? null,
      approximate_age_months: input.approximateAgeMonths ?? null,
      age_is_estimated: input.ageIsEstimated ?? true,
      weight_value: input.weightValue ?? null,
      weight_unit: input.weightUnit ?? "lb",
    })
    .select("*, pet_training_cues(id, pet_id, cue, action, sort_order)")
    .single();

  if (error) {
    throw error;
  }

  return mapPetRowToPetWithSignedPhoto(supabase, data as PetWithCuesRow);
}

export async function updatePetProfile(supabase: SupabaseClient, input: PetProfileUpdateInput): Promise<Pet> {
  const { data, error } = await supabase
    .from("pets")
    .update({
      name: input.name,
      breed: input.breed,
      sex: input.sex,
      approximate_age_years: input.approximateAgeYears,
      approximate_age_months: input.approximateAgeMonths,
      age_is_estimated: input.ageIsEstimated,
      weight_value: input.weightValue,
      weight_unit: input.weightUnit,
      adoption_place: input.adoptionPlace,
      adoption_date: input.adoptionDate,
      spayed_or_neutered: input.spayedOrNeutered,
      microchipped: input.microchipped,
      microchip_number: input.microchipNumber,
      behavior_notes: input.behaviorNotes,
      care_notes: input.careNotes,
      medical_notes: input.medicalNotes,
      known_history: input.knownHistory,
      favorite_foods: input.favoriteFoods,
      disliked_foods: input.dislikedFoods,
      feeding_rules: input.feedingRules,
      primary_vet_provider_id: input.primaryVetProviderId,
      secondary_vet_provider_id: input.secondaryVetProviderId,
      secondary_vet_role: input.secondaryVetRole,
    })
    .eq("id", input.id)
    .select("*, pet_training_cues(id, pet_id, cue, action, sort_order)")
    .single();

  if (error) {
    throw error;
  }

  return mapPetRowToPetWithSignedPhoto(supabase, data as PetWithCuesRow);
}

export async function replacePetTrainingCues(
  supabase: SupabaseClient,
  petId: string,
  cues: { cue: string; action: string }[],
): Promise<void> {
  const { error: deleteError } = await supabase.from("pet_training_cues").delete().eq("pet_id", petId);

  if (deleteError) {
    throw deleteError;
  }

  if (cues.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("pet_training_cues").insert(
    cues.map((cue, index) => ({
      pet_id: petId,
      cue: cue.cue,
      action: cue.action,
      sort_order: index,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

export async function mapPetRowToPetWithSignedPhoto(supabase: SupabaseClient, row: PetWithCuesRow): Promise<Pet> {
  const signedPhotoUrl = row.photo_path ? await createPetPhotoSignedUrl(supabase, row.photo_path) : null;
  return mapPetRowToPet(row, signedPhotoUrl);
}

export async function createPetPhotoSignedUrl(supabase: SupabaseClient, photoPath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PET_PHOTO_BUCKET)
    .createSignedUrl(photoPath, PET_PHOTO_SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error("Failed to create signed pet photo URL.", error);
    return null;
  }

  return data.signedUrl;
}

export function mapPetRowToPet(row: PetWithCuesRow, signedPhotoUrl?: string | null): Pet {
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    breed: row.breed ?? "Unknown breed",
    sex: row.sex === "female" ? "female" : "male",
    photo: signedPhotoUrl ?? defaultPhotoForSpecies(row.species),
    ageLabel: formatAgeLabel(row),
    ageEstimated: row.age_is_estimated,
    weight: formatWeight(row.weight_value, row.weight_unit),
    status: "Ready for care",
    behaviorNotes: row.behavior_notes ?? "",
    careNotes: row.care_notes ?? "",
    medicalNotes: row.medical_notes ?? "",
    background: {
      adoptionPlace: row.adoption_place ?? "",
      adoptionDate: row.adoption_date ?? "",
      spayedNeutered: row.spayed_or_neutered ?? false,
      microchipped: row.microchipped ?? false,
      microchipNumber: row.microchip_number ?? "",
      knownHistory: row.known_history ?? "",
    },
    foodPreferences: {
      favorites: row.favorite_foods ?? [],
      dislikes: row.disliked_foods ?? [],
      rules: row.feeding_rules ?? [],
    },
    dynamicFields:
      row.species === "cat"
        ? [
            { label: "Lifestyle", value: row.cat_lifestyle ?? "Not set" },
            { label: "Litter", value: row.cat_litter_preference ?? "Not set" },
          ]
        : [],
    primaryVetId: row.primary_vet_provider_id ?? undefined,
    secondaryVetId: row.secondary_vet_provider_id ?? undefined,
    secondaryVetRole: row.secondary_vet_role ?? undefined,
    archivedAt: row.archived_at ?? undefined,
    archivedReason: row.archived_reason ?? undefined,
    archivedNotes: row.archived_notes ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    deletedReason: row.deleted_reason ?? undefined,
    deletedNotes: row.deleted_notes ?? undefined,
    trainingCues:
      row.species === "dog"
        ? (row.pet_training_cues ?? [])
            .slice()
            .sort((first, second) => first.sort_order - second.sort_order)
            .map((cue) => ({ id: cue.id, cue: cue.cue, action: cue.action }))
        : undefined,
  };
}

function formatAgeLabel(row: PetRow) {
  if (row.approximate_age_years || row.approximate_age_months) {
    const parts = [
      row.approximate_age_years ? `${row.approximate_age_years} ${row.approximate_age_years === 1 ? "year" : "years"}` : "",
      row.approximate_age_months ? `${row.approximate_age_months} ${row.approximate_age_months === 1 ? "month" : "months"}` : "",
    ].filter(Boolean);
    return `${row.age_is_estimated ? "About " : ""}${parts.join(", ")}`;
  }

  if (row.date_of_birth) {
    return row.age_is_estimated ? "Approximate age set" : "DOB saved";
  }

  return row.age_is_estimated ? "Approximate age" : "Age not set";
}

function formatWeight(value: number | null, unit: string) {
  return value === null ? "Not logged" : `${Number(value).toLocaleString("en-US")} ${unit || "lb"}`;
}

function defaultPhotoForSpecies(species: PetSpecies) {
  return species === "dog"
    ? "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=640&q=80"
    : "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=640&q=80";
}
