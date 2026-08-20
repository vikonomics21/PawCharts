import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { brand } from "@/lib/brand";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CountResult = {
  label: string;
  value: number;
};

type ProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  created_at: string;
};

type HouseholdRow = {
  id: string;
  name: string;
  created_at: string;
};

type PetRow = {
  id: string;
  household_id: string;
  name: string;
  species: string;
  created_at: string;
};

export default async function SupportPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userEmail = user?.email?.toLowerCase() ?? "";

  if (!userEmail || !adminEmails().includes(userEmail)) {
    notFound();
  }

  const admin = createSupabaseAdminClient();
  const [authUsers, profiles, households, pets, counts] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 20 }),
    admin.from("profiles").select("id, email, first_name, last_name, city, created_at").order("created_at", { ascending: false }).limit(20),
    admin.from("households").select("id, name, created_at").order("created_at", { ascending: false }).limit(20),
    admin.from("pets").select("id, household_id, name, species, created_at").order("created_at", { ascending: false }).limit(30),
    loadCounts(admin),
  ]);

  if (authUsers.error) {
    throw authUsers.error;
  }

  if (profiles.error) {
    throw profiles.error;
  }

  if (households.error) {
    throw households.error;
  }

  if (pets.error) {
    throw pets.error;
  }

  const profileRows = (profiles.data ?? []) as ProfileRow[];
  const householdRows = (households.data ?? []) as HouseholdRow[];
  const petRows = (pets.data ?? []) as PetRow[];

  return (
    <main className="min-h-dvh bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">{brand.appName}</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight text-ink">Support</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Read-only private beta overview. Use Supabase Dashboard for user management and data changes.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
            Signed in as <span className="font-semibold text-ink">{userEmail}</span>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {counts.map((count) => (
            <div className="rounded-lg border border-line bg-surface p-4" key={count.label}>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{count.label}</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{count.value.toLocaleString("en-US")}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <SupportPanel title="Recent Auth Users">
            <div className="divide-y divide-line">
              {authUsers.data.users.map((authUser) => (
                <SupportRow
                  key={authUser.id}
                  label={authUser.email ?? authUser.phone ?? authUser.id}
                  meta={`Created ${formatDate(authUser.created_at)} · ${authUser.email_confirmed_at ? "Email confirmed" : "Email pending"}`}
                />
              ))}
            </div>
          </SupportPanel>

          <SupportPanel title="Recent Profiles">
            <div className="divide-y divide-line">
              {profileRows.map((profile) => (
                <SupportRow
                  key={profile.id}
                  label={[profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email || profile.id}
                  meta={[profile.email, profile.city, `Created ${formatDate(profile.created_at)}`].filter(Boolean).join(" · ")}
                />
              ))}
            </div>
          </SupportPanel>

          <SupportPanel title="Households">
            <div className="divide-y divide-line">
              {householdRows.map((household) => {
                const householdPets = petRows.filter((pet) => pet.household_id === household.id).length;

                return (
                  <SupportRow
                    key={household.id}
                    label={household.name}
                    meta={`${householdPets} ${householdPets === 1 ? "pet" : "pets"} · Created ${formatDate(household.created_at)}`}
                  />
                );
              })}
            </div>
          </SupportPanel>

          <SupportPanel title="Recent Pets">
            <div className="divide-y divide-line">
              {petRows.map((pet) => (
                <SupportRow
                  key={pet.id}
                  label={pet.name}
                  meta={`${capitalize(pet.species)} · Created ${formatDate(pet.created_at)}`}
                />
              ))}
            </div>
          </SupportPanel>
        </section>
      </div>
    </main>
  );
}

async function loadCounts(admin: ReturnType<typeof createSupabaseAdminClient>): Promise<CountResult[]> {
  const [profiles, households, householdMembers, pets, vetProviders, documents, shareLinks] = await Promise.all([
    countTable(admin, "profiles"),
    countTable(admin, "households"),
    countTable(admin, "household_members"),
    countTable(admin, "pets"),
    countTable(admin, "vet_providers"),
    countTable(admin, "documents"),
    countTable(admin, "share_links"),
  ]);

  return [
    { label: "Profiles", value: profiles },
    { label: "Households", value: households },
    { label: "Members", value: householdMembers },
    { label: "Pets", value: pets },
    { label: "Vets", value: vetProviders },
    { label: "Documents", value: documents },
    { label: "Share links", value: shareLinks },
  ];
}

async function countTable(admin: ReturnType<typeof createSupabaseAdminClient>, table: string) {
  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

function SupportPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-muted">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SupportRow({ label, meta }: { label: string; meta: string }) {
  return (
    <div className="px-4 py-3">
      <p className="break-words text-sm font-semibold text-ink">{label}</p>
      <p className="mt-1 break-words text-xs leading-5 text-muted">{meta}</p>
    </div>
  );
}

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
