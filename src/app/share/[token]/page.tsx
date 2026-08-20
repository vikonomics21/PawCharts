import { notFound } from "next/navigation";

import { brand } from "@/lib/brand";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createDocumentSignedUrl } from "@/lib/supabase/documents";

export const dynamic = "force-dynamic";

type PublicShareDocument = {
  id: string;
  title: string;
  document_type?: string | null;
  content_type?: string | null;
  storage_path?: string | null;
};

type PublicSharePayload = {
  id: string;
  label: string;
  link_type: string;
  pet: {
    id: string;
    name: string;
    species: string;
    breed?: string | null;
  };
  documents?: PublicShareDocument[];
};

export default async function SharePacketPage({ params }: { params: { token: string } }) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("public_share_payload", { share_token: params.token });

  if (error || !data) {
    notFound();
  }

  const payload = data as PublicSharePayload;
  const documents = await Promise.all(
    (payload.documents ?? []).map(async (document) => ({
      ...document,
      signedUrl: document.storage_path ? await createDocumentSignedUrl(admin, document.storage_path) : "",
    })),
  );

  return (
    <main className="min-h-dvh bg-[#f4eeea] px-5 py-8 text-[#161513]">
      <section className="mx-auto max-w-2xl rounded-2xl border border-[#e4d8d1] bg-white p-5 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#81766f]">{brand.appName}</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight">{payload.label}</h1>
        <p className="mt-2 text-sm leading-6 text-[#81766f]">
          Shared read-only packet for {payload.pet.name}
          {payload.pet.breed ? `, ${payload.pet.breed}` : ""}.
        </p>

        <div className="mt-6 space-y-3">
          {documents.length === 0 ? (
            <p className="rounded-xl border border-[#e4d8d1] bg-[#faf7f4] p-4 text-sm text-[#81766f]">
              No documents are included in this packet.
            </p>
          ) : (
            documents.map((document) => (
              <a
                className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-[#e4d8d1] bg-[#faf7f4] px-4 py-3 text-sm font-semibold text-[#161513] transition hover:bg-white"
                href={document.signedUrl}
                key={document.id}
                rel="noreferrer"
                target="_blank"
              >
                <span className="min-w-0">
                  <span className="block truncate">{document.title}</span>
                  <span className="mt-1 block text-xs font-medium text-[#81766f]">
                    {document.document_type || document.content_type || "Document"}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-[#81766f]">Open</span>
              </a>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
