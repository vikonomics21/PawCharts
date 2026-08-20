import type { SupabaseClient } from "@supabase/supabase-js";

import type { MeasurementSnapshot } from "@/data/demo";

export type MeasurementRow = {
  id: string;
  pet_id: string;
  measured_at: string;
  weight_value: number | null;
  weight_unit: string | null;
  body_length_value: number | null;
  body_length_unit: string | null;
  height_value: number | null;
  height_unit: string | null;
  collar_circumference_value: number | null;
  collar_circumference_unit: string | null;
  chest_circumference_value: number | null;
  chest_circumference_unit: string | null;
  notes: string | null;
  created_at: string;
};

const MEASUREMENT_COLUMNS = [
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
].join(", ");

const BASE_MEASUREMENT_COLUMNS = [
  "id",
  "pet_id",
  "measured_at",
  "weight_value",
  "weight_unit",
  "notes",
  "created_at",
].join(", ");

export async function fetchMeasurementsForCurrentUser(supabase: SupabaseClient): Promise<MeasurementSnapshot[]> {
  const { data, error } = await supabase
    .from("measurements")
    .select(MEASUREMENT_COLUMNS)
    .order("measured_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingBodyMeasurementColumnError(error)) {
      const fallback = await supabase
        .from("measurements")
        .select(BASE_MEASUREMENT_COLUMNS)
        .order("measured_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (fallback.error) {
        throw fallback.error;
      }

      return ((fallback.data ?? []) as unknown as MeasurementRow[]).map(mapMeasurementRowToSnapshot);
    }

    throw error;
  }

  return ((data ?? []) as unknown as MeasurementRow[]).map(mapMeasurementRowToSnapshot);
}

export function mapMeasurementRowToSnapshot(row: MeasurementRow): MeasurementSnapshot {
  const measuredOn = row.measured_at.slice(0, 10);

  return {
    id: row.id,
    petId: row.pet_id,
    measuredOn,
    weightValue: formatNumericValue(row.weight_value),
    weightUnit: normalizeWeightUnit(row.weight_unit),
    bodyLengthValue: formatNumericValue(row.body_length_value),
    bodyLengthUnit: normalizeDimensionUnit(row.body_length_unit),
    heightValue: formatNumericValue(row.height_value),
    heightUnit: normalizeDimensionUnit(row.height_unit),
    collarCircumferenceValue: formatNumericValue(row.collar_circumference_value),
    collarCircumferenceUnit: normalizeDimensionUnit(row.collar_circumference_unit),
    chestCircumferenceValue: formatNumericValue(row.chest_circumference_value),
    chestCircumferenceUnit: normalizeDimensionUnit(row.chest_circumference_unit),
    notes: row.notes ?? "",
    createdLabel: formatDateForDisplay(measuredOn),
  };
}

function formatNumericValue(value: number | null) {
  if (value === null) return undefined;
  return Number.isInteger(value) ? String(value) : String(value).replace(/0+$/, "").replace(/\.$/, "");
}

function normalizeWeightUnit(unit: string | null): MeasurementSnapshot["weightUnit"] {
  return unit === "kg" ? "kg" : "lb";
}

function normalizeDimensionUnit(unit: string | null): MeasurementSnapshot["bodyLengthUnit"] {
  return unit === "cm" ? "cm" : "in";
}

function isMissingBodyMeasurementColumnError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    message.includes("body_length") ||
    message.includes("collar_circumference") ||
    message.includes("chest_circumference")
  );
}

function formatDateForDisplay(value: string) {
  if (!value) return "Not dated";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
