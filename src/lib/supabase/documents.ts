import type { SupabaseClient } from "@supabase/supabase-js";

import type { DocumentRecordType, RecordDocument } from "@/data/demo";

export const PET_DOCUMENT_BUCKET = "pet-documents";
export const PET_DOCUMENT_SIGNED_URL_TTL_SECONDS = 60 * 60;

const DOCUMENT_RECORD_TYPES: DocumentRecordType[] = [
  "vaccine_record",
  "medication",
  "vet_visit",
  "care_event",
  "measurement",
  "pet",
];

type DocumentLinkRow = {
  record_id: string;
  record_type: DocumentRecordType;
};

export type DocumentRow = {
  content_type: string | null;
  created_at: string;
  document_links?: DocumentLinkRow[] | null;
  document_type: string | null;
  file_size_bytes: number | null;
  id: string;
  pet_id: string;
  private_by_default: boolean;
  storage_path: string;
  title: string;
};

export async function fetchDocumentsForCurrentUser(supabase: SupabaseClient): Promise<RecordDocument[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("id, pet_id, title, storage_path, content_type, file_size_bytes, document_type, private_by_default, created_at, document_links(record_type, record_id)")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return Promise.all(((data ?? []) as DocumentRow[]).map((row) => mapDocumentRowToRecordDocument(supabase, row)));
}

export async function fetchDocumentById(supabase: SupabaseClient, documentId: string): Promise<RecordDocument | null> {
  const { data, error } = await supabase
    .from("documents")
    .select("id, pet_id, title, storage_path, content_type, file_size_bytes, document_type, private_by_default, created_at, document_links(record_type, record_id)")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapDocumentRowToRecordDocument(supabase, data as DocumentRow) : null;
}

export async function createDocumentSignedUrl(supabase: SupabaseClient, storagePath: string) {
  const { data, error } = await supabase.storage
    .from(PET_DOCUMENT_BUCKET)
    .createSignedUrl(storagePath, PET_DOCUMENT_SIGNED_URL_TTL_SECONDS);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function mapDocumentRowToRecordDocument(
  supabase: SupabaseClient,
  row: DocumentRow,
): Promise<RecordDocument> {
  const link = row.document_links?.find((item) => isDocumentRecordType(item.record_type));
  const recordType = link?.record_type ?? "pet";
  const recordId = link?.record_id ?? row.pet_id;
  const documentType = row.document_type ?? "general";

  return {
    addedLabel: formatDocumentDate(row.created_at),
    contentType: row.content_type ?? undefined,
    createdAt: row.created_at,
    documentGroupId: `${recordType}:${recordId}:${documentType}`,
    documentType,
    fileType: row.content_type === "application/pdf" ? "pdf" : "image",
    id: row.id,
    petId: row.pet_id,
    privateByDefault: row.private_by_default,
    recordId,
    recordType,
    signedUrl: await createDocumentSignedUrl(supabase, row.storage_path),
    sizeLabel: formatFileSize(row.file_size_bytes ?? 0),
    storagePath: row.storage_path,
    title: row.title,
    versionLabel: "Latest",
  };
}

export function isDocumentRecordType(value: string): value is DocumentRecordType {
  return DOCUMENT_RECORD_TYPES.includes(value as DocumentRecordType);
}

export function formatFileSize(bytes: number) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function formatDocumentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Added";

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
}
