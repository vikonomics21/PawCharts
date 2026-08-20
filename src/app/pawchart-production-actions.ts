"use server";

import { revalidatePath } from "next/cache";

import type { DocumentRecordType, MeasurementSnapshot, OwnerProfile, Pet, PetSpecies, RecordDocument, VetProvider } from "@/data/demo";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  PET_DOCUMENT_BUCKET,
  createDocumentSignedUrl,
  fetchDocumentById,
  formatFileSize,
  isDocumentRecordType,
  mapDocumentRowToRecordDocument,
} from "@/lib/supabase/documents";
import { mapMeasurementRowToSnapshot, type MeasurementRow } from "@/lib/supabase/measurements";
import { PET_PHOTO_BUCKET, mapPetRowToPet, mapPetRowToPetWithSignedPhoto } from "@/lib/supabase/pets";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchVetProvidersForHousehold, mapVetProviderRow, type PawChartWorkspace } from "@/lib/supabase/workspace";

export type ProductionOnboardingInput = {
  ageLabel: string;
  breed: string;
  city: string;
  email: string;
  firstName: string;
  petName: string;
  species: PetSpecies;
  weight: string;
};

export type AddPetActionInput = {
  ageLabel: string;
  behaviorNotes: string;
  breed: string;
  name: string;
  species: PetSpecies;
  weight: string;
};

export type VetProviderActionInput = Omit<VetProvider, "householdId" | "id">;

type HouseholdMembershipRow = {
  id: string;
  household_id: string;
  role: "owner" | "admin" | "member";
  households: {
    id: string;
    name: string;
  } | null;
};

type PetWithCuesRow = Parameters<typeof mapPetRowToPet>[0];

export async function completeProductionOnboarding(input: ProductionOnboardingInput): Promise<{
  ownerProfile: OwnerProfile;
  pet: Pet;
  vetProviders: VetProvider[];
  workspace: PawChartWorkspace;
}> {
  const { user } = await requireCurrentUser();
  const admin = createSupabaseAdminClient();
  const existingMembership = await fetchCurrentHouseholdMembership();

  const ownerProfile = await upsertProfileForUser(user.id, {
    city: input.city,
    email: input.email || user.email || "",
    firstName: input.firstName,
    lastName: "",
    phone: "",
  });

  const household =
    existingMembership?.households ??
    (await createHouseholdForUser(user.id, ownerProfile.firstName || input.petName || "My"));
  const membership =
    existingMembership ??
    (await createOwnerMembershipForUser(household.id, user.id));

  const pet = await insertPet(admin, {
    ageLabel: input.ageLabel,
    behaviorNotes: "",
    breed: input.breed,
    householdId: household.id,
    name: input.petName || "New pet",
    species: input.species,
    weight: input.weight,
  });

  revalidatePath("/");

  return {
    ownerProfile,
    pet,
    vetProviders: await fetchVetProvidersForHousehold(admin, household.id),
    workspace: {
      household,
      householdMembership: {
        id: membership.id,
        householdId: membership.household_id,
        role: membership.role,
      },
    },
  };
}

export async function updateProductionOwnerProfile(input: OwnerProfile): Promise<OwnerProfile> {
  const { user } = await requireCurrentUser();
  const ownerProfile = await upsertProfileForUser(user.id, input);

  revalidatePath("/");

  return ownerProfile;
}

export async function createProductionPet(input: AddPetActionInput): Promise<Pet> {
  const { membership } = await requireCurrentHouseholdMembership();
  const supabase = createSupabaseServerClient();
  const pet = await insertPet(supabase, {
    ...input,
    householdId: membership.household_id,
  });

  revalidatePath("/");

  return pet;
}

export async function updateProductionPet(input: Pet): Promise<Pet> {
  const supabase = createSupabaseServerClient();
  const age = parseAgeLabel(input.ageLabel);
  const weight = parseWeight(input.weight);
  const dogSize = findDynamicField(input, "Size");
  const dogGroomer = findDynamicField(input, "Groomer");
  const catLifestyle = findDynamicField(input, "Lifestyle");
  const catLitter = findDynamicField(input, "Litter");

  const { data, error } = await supabase
    .from("pets")
    .update({
      adoption_date: normalizeEmptyDate(input.background.adoptionDate),
      adoption_place: input.background.adoptionPlace || null,
      age_is_estimated: input.ageEstimated,
      approximate_age_months: age.months,
      approximate_age_years: age.years,
      behavior_notes: input.behaviorNotes,
      breed: input.breed || null,
      care_notes: input.careNotes,
      cat_lifestyle: input.species === "cat" ? catLifestyle : null,
      cat_litter_preference: input.species === "cat" ? catLitter : null,
      disliked_foods: input.foodPreferences.dislikes,
      dog_groomer_notes: input.species === "dog" ? dogGroomer : null,
      dog_size: input.species === "dog" ? dogSize : null,
      favorite_foods: input.foodPreferences.favorites,
      feeding_rules: input.foodPreferences.rules,
      known_history: input.background.knownHistory,
      medical_notes: input.medicalNotes,
      microchip_number: input.background.microchipNumber || null,
      microchipped: input.background.microchipped,
      name: input.name,
      primary_vet_provider_id: input.primaryVetId || null,
      secondary_vet_provider_id: input.secondaryVetId || null,
      secondary_vet_role: input.secondaryVetRole || null,
      sex: input.sex,
      spayed_or_neutered: input.background.spayedNeutered,
      updated_at: new Date().toISOString(),
      weight_unit: weight.unit,
      weight_value: weight.value,
    })
    .eq("id", input.id)
    .select("*, pet_training_cues(id, pet_id, cue, action, sort_order)")
    .single();

  if (error) {
    throw error;
  }

  await replaceTrainingCues(input.id, input.trainingCues ?? []);
  const pet = await fetchPetById(input.id);

  revalidatePath("/");

  return pet ?? (await mapPetRowToPetWithSignedPhoto(supabase, data as PetWithCuesRow));
}

export async function updateProductionPetPhoto(formData: FormData): Promise<Pet> {
  const { supabase } = await requireCurrentUser();
  const petId = String(formData.get("petId") || "");
  const photo = formData.get("photo");

  if (!petId) {
    throw new Error("Missing pet for photo upload.");
  }

  if (!(photo instanceof File) || photo.size === 0) {
    throw new Error("Choose a pet photo to upload.");
  }

  validatePetPhoto(photo);

  const { data: petRow, error: petError } = await supabase
    .from("pets")
    .select("id, household_id")
    .eq("id", petId)
    .single();

  if (petError) {
    throw petError;
  }

  const path = buildPetPhotoPath(petRow.household_id, petRow.id, photo);
  const { error: uploadError } = await supabase.storage.from(PET_PHOTO_BUCKET).upload(path, photo, {
    cacheControl: "3600",
    contentType: photo.type,
    upsert: false,
  });

  if (uploadError) {
    throw uploadError;
  }

  const { error: updateError } = await supabase
    .from("pets")
    .update({
      photo_path: path,
      updated_at: new Date().toISOString(),
    })
    .eq("id", petId);

  if (updateError) {
    throw updateError;
  }

  const pet = await fetchPetById(petId);

  if (!pet) {
    throw new Error("Pet photo uploaded, but the pet could not be reloaded.");
  }

  revalidatePath("/");

  return pet;
}

export async function createProductionMeasurementSnapshot(input: MeasurementSnapshot): Promise<MeasurementSnapshot> {
  const { supabase, user } = await requireCurrentUser();
  const measuredAt = input.measuredOn || new Date().toISOString().slice(0, 10);
  const weightValue = parseOptionalNumber(input.weightValue);

  if (
    weightValue === null &&
    parseOptionalNumber(input.bodyLengthValue) === null &&
    parseOptionalNumber(input.heightValue) === null &&
    parseOptionalNumber(input.collarCircumferenceValue) === null &&
    parseOptionalNumber(input.chestCircumferenceValue) === null
  ) {
    throw new Error("Add at least one measurement before saving.");
  }

  const { data, error } = await supabase
    .from("measurements")
    .insert({
      body_length_unit: normalizeDimensionUnit(input.bodyLengthUnit),
      body_length_value: parseOptionalNumber(input.bodyLengthValue),
      chest_circumference_unit: normalizeDimensionUnit(input.chestCircumferenceUnit),
      chest_circumference_value: parseOptionalNumber(input.chestCircumferenceValue),
      collar_circumference_unit: normalizeDimensionUnit(input.collarCircumferenceUnit),
      collar_circumference_value: parseOptionalNumber(input.collarCircumferenceValue),
      created_by: user.id,
      height_unit: normalizeDimensionUnit(input.heightUnit),
      height_value: parseOptionalNumber(input.heightValue),
      measured_at: `${measuredAt}T12:00:00.000Z`,
      notes: input.notes || null,
      pet_id: input.petId,
      weight_unit: input.weightUnit === "kg" ? "kg" : "lb",
      weight_value: weightValue,
    })
    .select(
      [
        "id",
        "pet_id",
        "measured_at",
        "weight_value",
        "weight_unit",
        "body_length_value",
        "body_length_unit",
        "height_value",
        "height_unit",
        "collar_circumference_value",
        "collar_circumference_unit",
        "chest_circumference_value",
        "chest_circumference_unit",
        "notes",
        "created_at",
      ].join(", "),
    )
    .single();

  if (error) {
    throw error;
  }

  if (weightValue !== null) {
    const { error: petError } = await supabase
      .from("pets")
      .update({
        updated_at: new Date().toISOString(),
        weight_unit: input.weightUnit === "kg" ? "kg" : "lb",
        weight_value: weightValue,
      })
      .eq("id", input.petId);

    if (petError) {
      throw petError;
    }
  }

  revalidatePath("/");

  return mapMeasurementRowToSnapshot(data as unknown as MeasurementRow);
}

export async function uploadProductionDocument(formData: FormData): Promise<RecordDocument> {
  const { supabase, user } = await requireCurrentUser();
  const petId = String(formData.get("petId") || "");
  const title = String(formData.get("title") || "").trim();
  const documentType = String(formData.get("documentType") || "general").trim() || "general";
  const recordTypeValue = String(formData.get("recordType") || "");
  const recordId = String(formData.get("recordId") || "");
  const file = formData.get("file");

  if (!petId) {
    throw new Error("Choose a pet for this document.");
  }

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a PDF or image to upload.");
  }

  validatePetDocument(file);

  const { data: petRow, error: petError } = await supabase
    .from("pets")
    .select("id, household_id")
    .eq("id", petId)
    .single();

  if (petError) {
    throw petError;
  }

  const storagePath = buildPetDocumentPath(petRow.household_id, petRow.id, file);
  const { error: uploadError } = await supabase.storage.from(PET_DOCUMENT_BUCKET).upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    throw uploadError;
  }

  try {
    const { data, error } = await supabase
      .from("documents")
      .insert({
        content_type: file.type,
        created_by: user.id,
        document_type: documentType,
        file_size_bytes: file.size,
        pet_id: petId,
        private_by_default: true,
        storage_path: storagePath,
        title: title || file.name || "Uploaded document",
      })
      .select("id, pet_id, title, storage_path, content_type, file_size_bytes, document_type, private_by_default, created_at")
      .single();

    if (error) {
      throw error;
    }

    const recordType = isDocumentRecordType(recordTypeValue) && recordTypeValue !== "pet" ? recordTypeValue : null;
    const shouldLinkRecord = Boolean(recordType && recordId);
    const documentLinks = shouldLinkRecord
      ? [
          {
            record_id: recordId,
            record_type: recordType as DocumentRecordType,
          },
        ]
      : [];

    if (recordType && recordId) {
      const { error: linkError } = await supabase.from("document_links").insert({
        created_by: user.id,
        document_id: data.id,
        record_id: recordId,
        record_type: recordType,
      });

      if (linkError) {
        throw linkError;
      }
    }

    revalidatePath("/");

    return mapDocumentRowToRecordDocument(supabase, {
      ...data,
      document_links: documentLinks,
    });
  } catch (error) {
    await supabase.storage.from(PET_DOCUMENT_BUCKET).remove([storagePath]);
    throw error;
  }
}

export async function renameProductionDocument(documentId: string, title: string): Promise<RecordDocument> {
  const supabase = createSupabaseServerClient();
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    throw new Error("Document name is required.");
  }

  const { error } = await supabase
    .from("documents")
    .update({ title: trimmedTitle })
    .eq("id", documentId);

  if (error) {
    throw error;
  }

  const document = await fetchDocumentById(supabase, documentId);

  if (!document) {
    throw new Error("Document was renamed, but could not be reloaded.");
  }

  revalidatePath("/");

  return document;
}

export async function deleteProductionDocument(documentId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .single();

  if (error) {
    throw error;
  }

  const { error: storageError } = await supabase.storage
    .from(PET_DOCUMENT_BUCKET)
    .remove([data.storage_path]);

  if (storageError) {
    throw storageError;
  }

  const { error: deleteError } = await supabase.from("documents").delete().eq("id", documentId);

  if (deleteError) {
    throw deleteError;
  }

  revalidatePath("/");
}

export async function createProductionDocumentSignedUrl(documentId: string): Promise<string> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .single();

  if (error) {
    throw error;
  }

  return createDocumentSignedUrl(supabase, data.storage_path);
}

export async function createProductionVetProvider(input: VetProviderActionInput): Promise<VetProvider> {
  const {
    membership: { household_id: householdId },
  } = await requireCurrentHouseholdMembership();
  const { user } = await requireCurrentUser();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("vet_providers")
    .insert({
      address: input.address || null,
      created_by: user.id,
      household_id: householdId,
      name: input.name || "New vet or clinic",
      notes: input.notes || null,
      phone: input.phone || null,
      website: input.website || null,
    })
    .select("id, household_id, name, phone, address, website, notes")
    .single();

  if (error) {
    throw error;
  }

  revalidatePath("/");

  return mapVetProviderRow(data);
}

export async function updateProductionVetProvider(input: VetProvider): Promise<VetProvider> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("vet_providers")
    .update({
      address: input.address || null,
      name: input.name,
      notes: input.notes || null,
      phone: input.phone || null,
      updated_at: new Date().toISOString(),
      website: input.website || null,
    })
    .eq("id", input.id)
    .select("id, household_id, name, phone, address, website, notes")
    .single();

  if (error) {
    throw error;
  }

  revalidatePath("/");

  return mapVetProviderRow(data);
}

export async function updateProductionPetCareTeam(input: {
  petId: string;
  primaryVetId: string;
  secondaryVetId: string;
  secondaryVetRole: string;
}): Promise<Pet> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("pets")
    .update({
      primary_vet_provider_id: input.primaryVetId || null,
      secondary_vet_provider_id: input.secondaryVetId || null,
      secondary_vet_role: input.secondaryVetRole || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.petId);

  if (error) {
    throw error;
  }

  const pet = await fetchPetById(input.petId);

  if (!pet) {
    throw new Error("Pet care team was saved, but the updated pet could not be loaded.");
  }

  revalidatePath("/");

  return pet;
}

async function requireCurrentUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("You must be signed in.");
  }

  return { supabase, user };
}

async function requireCurrentHouseholdMembership() {
  const membership = await fetchCurrentHouseholdMembership();

  if (!membership) {
    throw new Error("Create your first pet before adding more records.");
  }

  return { membership };
}

async function fetchCurrentHouseholdMembership() {
  const {
    supabase,
    user,
  } = await requireCurrentUser();

  const { data, error } = await supabase
    .from("household_members")
    .select("id, household_id, role, households(id, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as HouseholdMembershipRow | null;
}

async function upsertProfileForUser(userId: string, input: OwnerProfile | Omit<OwnerProfile, "id">) {
  const admin = createSupabaseAdminClient();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  const { data, error } = await admin
    .from("profiles")
    .upsert({
      city: input.city.trim() || null,
      email: input.email.trim() || null,
      first_name: firstName || null,
      full_name: [firstName, lastName].filter(Boolean).join(" ") || null,
      id: userId,
      last_name: lastName || null,
      phone: input.phone.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .select("id, email, first_name, last_name, phone, city")
    .single();

  if (error) {
    throw error;
  }

  return {
    city: data.city ?? "",
    email: data.email ?? "",
    firstName: data.first_name ?? "",
    id: data.id,
    lastName: data.last_name ?? "",
    phone: data.phone ?? "",
  } satisfies OwnerProfile;
}

async function createHouseholdForUser(userId: string, ownerName: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("households")
    .insert({
      created_by: userId,
      name: `${ownerName.trim() || "My"} household`,
    })
    .select("id, name")
    .single();

  if (error) {
    throw error;
  }

  return data as { id: string; name: string };
}

async function createOwnerMembershipForUser(householdId: string, userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("household_members")
    .insert({
      household_id: householdId,
      role: "owner",
      user_id: userId,
    })
    .select("id, household_id, role")
    .single();

  if (error) {
    throw error;
  }

  return data as { id: string; household_id: string; role: "owner" };
}

async function insertPet(
  supabase: ReturnType<typeof createSupabaseServerClient> | ReturnType<typeof createSupabaseAdminClient>,
  input: AddPetActionInput & { householdId: string },
) {
  const age = parseAgeLabel(input.ageLabel);
  const weight = parseWeight(input.weight);

  const { data, error } = await supabase
    .from("pets")
    .insert({
      age_is_estimated: true,
      approximate_age_months: age.months,
      approximate_age_years: age.years,
      behavior_notes: input.behaviorNotes || "",
      breed: input.breed || null,
      household_id: input.householdId,
      name: input.name || "New pet",
      species: input.species,
      weight_unit: weight.unit,
      weight_value: weight.value,
    })
    .select("*, pet_training_cues(id, pet_id, cue, action, sort_order)")
    .single();

  if (error) {
    throw error;
  }

  if (input.species === "dog") {
    await replaceTrainingCues(data.id, [
      { action: "Sits and waits for release", cue: "Sit" },
      { action: "Touches nose to hand", cue: "Touch" },
      { action: "Holds position until released", cue: "Stay" },
    ]);
    const pet = await fetchPetById(data.id);
    if (pet) return pet;
  }

  return mapPetRowToPetWithSignedPhoto(supabase, data as PetWithCuesRow);
}

function validatePetPhoto(file: File) {
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  const maxBytes = 5 * 1024 * 1024;

  if (!allowedTypes.has(file.type)) {
    throw new Error("Pet photos must be JPG, PNG, or WebP images.");
  }

  if (file.size > maxBytes) {
    throw new Error("Pet photos must be 5 MB or smaller.");
  }
}

function buildPetPhotoPath(householdId: string, petId: string, file: File) {
  const extensionByType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensionByType[file.type] ?? "jpg";

  return `households/${householdId}/pets/${petId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
}

function validatePetDocument(file: File) {
  const allowedTypes = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ]);
  const maxBytes = 10 * 1024 * 1024;

  if (!allowedTypes.has(file.type)) {
    throw new Error("Documents must be PDF, JPG, PNG, WebP, HEIC, or HEIF files.");
  }

  if (file.size > maxBytes) {
    throw new Error(`Documents must be ${formatFileSize(maxBytes)} or smaller.`);
  }
}

function buildPetDocumentPath(householdId: string, petId: string, file: File) {
  const extensionByType: Record<string, string> = {
    "application/pdf": "pdf",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensionByType[file.type] ?? sanitizeFileExtension(file.name) ?? "bin";

  return `households/${householdId}/pets/${petId}/documents/${Date.now()}-${crypto.randomUUID()}.${extension}`;
}

function sanitizeFileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return extension || null;
}

async function replaceTrainingCues(petId: string, cues: { cue: string; action: string }[]) {
  const { supabase, user } = await requireCurrentUser();
  const { error: deleteError } = await supabase.from("pet_training_cues").delete().eq("pet_id", petId);

  if (deleteError) {
    throw deleteError;
  }

  if (cues.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("pet_training_cues").insert(
    cues.map((cue, index) => ({
      action: cue.action,
      created_by: user.id,
      cue: cue.cue,
      pet_id: petId,
      sort_order: index,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

async function fetchPetById(petId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pets")
    .select("*, pet_training_cues(id, pet_id, cue, action, sort_order)")
    .eq("id", petId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapPetRowToPetWithSignedPhoto(supabase, data as PetWithCuesRow) : null;
}

function parseAgeLabel(label: string) {
  const years = Number(label.match(/(\d+)\s*(?:year|yr)/i)?.[1] ?? 0);
  const months = Number(label.match(/(\d+)\s*(?:month|mo)/i)?.[1] ?? 0);

  return {
    months: months || null,
    years: years || null,
  };
}

function parseWeight(weight: string) {
  const value = Number(weight.match(/(\d+(?:\.\d+)?)/)?.[1] ?? 0);
  const unit = weight.toLowerCase().includes("kg") ? "kg" : "lb";

  return {
    unit,
    value: value || null,
  };
}

function parseOptionalNumber(value: string | undefined) {
  const parsed = Number(value || "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeDimensionUnit(unit: string | undefined) {
  return unit === "cm" ? "cm" : "in";
}

function findDynamicField(pet: Pet, label: string) {
  return pet.dynamicFields.find((field) => field.label.toLowerCase() === label.toLowerCase())?.value || null;
}

function normalizeEmptyDate(value: string) {
  return value.trim() ? value : null;
}
