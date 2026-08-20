"use client";

import {
  ArrowLeft,
  Bell,
  CalendarCheck,
  Cat,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Dog,
  Droplets,
  Eye,
  FileImage,
  FileText,
  HeartPulse,
  Home,
  Link2,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Pill,
  Plus,
  QrCode,
  Scissors,
  ShieldCheck,
  Trash2,
  Undo2,
  Upload,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  archiveProductionPet,
  completeProductionOnboarding,
  createProductionPet,
  createProductionVetProvider,
  createProductionMeasurementSnapshot,
  createProductionDocumentSignedUrl,
  deleteProductionPet,
  createProductionSharePacket,
  updateProductionOwnerProfile,
  updateProductionPet,
  updateProductionPetCareTeam,
  updateProductionPetPhoto,
  updateProductionVetProvider,
  deleteProductionDocument,
  renameProductionDocument,
  revokeProductionShareLink,
  restoreProductionPet,
  uploadProductionDocument,
} from "@/app/pawchart-production-actions";
import {
  demoCareEvents,
  demoDocuments,
  demoOwnerProfile,
  demoObservations,
  demoPets,
  demoTasks,
  demoKitTemplates,
  demoPetKits,
  demoVetPrepItems,
  demoVetProviders,
  demoVetVisits,
  demoVaccines,
  type CareEvent,
  type DocumentRecordType,
  type MeasurementSnapshot,
  type ObservationRecord,
  type OwnerProfile,
  type Pet,
  type PetSpecies,
  type RecordDocument,
  type ShareLink,
  type Task,
  type KitChecklistItem,
  type KitDocumentLink,
  type KitDocumentStatus,
  type KitTemplate,
  type PetKit,
  type VetPrepItem,
  type VetProvider,
  type VetVisit,
  type VaccineRecord,
} from "@/data/demo";
import { signInWithGoogle, signOut } from "@/app/auth/actions";
import { brand } from "@/lib/brand";
import type { PawChartWorkspace } from "@/lib/supabase/workspace";
import { cn } from "@/lib/utils";

type Tab = "home" | "calendar" | "records" | "pets";
type PetEditSection = "profile" | "background" | "training" | "behavior" | "food" | "care" | "medical";

type ModalState =
  | { title: string; type: "global-add" }
  | { title: string; type: "add-pet" }
  | { title: string; type: "edit-pet"; pet: Pet; section: PetEditSection }
  | { title: string; type: "edit-profiles" }
  | { title: string; type: "archive-pet"; pet: Pet; returnToEditProfiles?: boolean }
  | { title: string; type: "archived-pet-detail"; pet: Pet }
  | { title: string; type: "confirm-delete-pet"; pet: Pet }
  | { title: string; type: "confirm-restore-pet"; pet: Pet }
  | { title: string; type: "add-observation"; petId: string }
  | { title: string; type: "quick-care"; petId: string }
  | { title: string; type: "add-vet-note"; petId: string }
  | { title: string; type: "change-vet"; pet: Pet }
  | { title: string; type: "add-vet"; returnPetId?: string }
  | { title: string; type: "edit-vet"; provider: VetProvider; returnPetId?: string }
  | { title: string; type: "owner-profile" }
  | { title: string; type: "invite-member"; pet: Pet }
  | { title: string; type: "log-vet-visit"; petId: string }
  | { title: string; type: "add-vaccine"; petId: string; vaccine?: VaccineRecord }
  | { title: string; type: "add-care-type"; petId: string }
  | { title: string; type: "edit-care-type"; event: CareEvent }
  | { title: string; type: "confirm-delete-care-type"; event: CareEvent }
  | { title: string; type: "confirm-delete-document"; document: RecordDocument }
  | { title: string; type: "confirm-delete-schedule"; task: Task }
  | { title: string; type: "confirm-delete-vaccine"; vaccine: VaccineRecord }
  | { title: string; type: "confirm-delete-vet-visit"; visit: VetVisit }
  | { title: string; type: "confirm-remove-access"; member: PetAccessMember }
  | { title: string; type: "confirm-revoke-share-link"; link: ShareLink }
  | { title: string; type: "create-share-packet"; pet: Pet }
  | { title: string; type: "schedule-care"; petId: string; initialDueDate?: string }
  | { title: string; type: "manage-schedule"; petId: string }
  | { title: string; type: "edit-schedule"; task: Task }
  | { title: string; type: "log-task"; task: Task; mode: "today" | "change-date" }
  | { title: string; type: "weight"; task: Task }
  | { title: string; type: "medication"; task?: Task; petId: string }
  | { title: string; type: "upload-document"; petId: string }
  | { title: string; type: "health-documents"; petId: string }
  | { title: string; type: "pet-measurements"; petId: string }
  | { title: string; type: "lists-kits"; pet: Pet; kitId?: string; allPets?: boolean }
  | { title: string; type: "create-kit"; petId: string; templateId?: string }
  | { title: string; type: "edit-kit"; trip: PetKit }
  | { title: string; type: "confirm-delete-kit"; trip: PetKit }
  | { title: string; type: "kit-attach-item-document"; tripId: string; item: KitChecklistItem }
  | { title: string; type: "kit-attach-document"; tripId: string; link: KitDocumentLink }
  | { title: string; type: "kit-document-item"; tripId: string; link?: KitDocumentLink }
  | { title: string; type: "confirm-remove-kit-document"; tripId: string; link: KitDocumentLink }
  | { title: string; type: "confirm-remove-kit-item"; tripId: string; itemId: string; label: string }
  | { title: string; type: "confirm-reset-kit"; trip: PetKit }
  | { title: string; type: "sharing-access"; pet: Pet }
  | { title: string; type: "share-link-qr"; link: ShareLink }
  | { title: string; type: "training-cues"; pet: Pet }
  | { title: string; type: "rename-document"; document: RecordDocument }
  | { title: string; type: "confirm-undo-log"; log: LogEntry }
  | { title: string; type: "record-detail"; titleText: string; body: string }
  | null;

type LogEntry = {
  id: string;
  petId: string;
  taskId?: string;
  recordId?: string;
  recordType: "medication" | "care" | "vaccine" | "measurement" | "vet_visit" | "observation";
  title: string;
  occurredOn: string;
  dueDate?: string;
  completedTiming?: "early" | "on-time" | "late";
  details?: string;
  value?: string;
  createdLabel: string;
};

type MeasurementFormInput = {
  details: string;
  measurement: MeasurementSnapshot;
  occurredOn: string;
  value: string;
};

type UndoSnapshot = {
  careEvent?: CareEvent;
  petWeight?: string;
  task?: Task;
};

type KitPrepItem = {
  endDate: string;
  id: string;
  date: string;
  destination: string;
  petIds: string[];
  prepLabel: "List prep" | "Trip prep";
  title: string;
  tripId: string;
  tripTitle: string;
};

type KitDocumentItemInput = {
  documentType: KitDocumentLink["documentType"];
  expiresOn: string;
  label: string;
  petId: string;
};

type KitChecklistItemInput = {
  documentType: KitChecklistItem["documentType"];
  itemType: NonNullable<KitChecklistItem["itemType"]>;
  label: string;
  petId: string;
  resourceLabel: string;
  resourceUrl: string;
};

type KitUnifiedItem = KitChecklistItem & {
  source: "checklist" | "document-link";
  status?: KitDocumentLink["status"];
};

type HomeGetStartedItem = {
  id: string;
  icon: typeof Home;
  onClick: () => void;
  reason: string;
  statusLabel: string;
  title: string;
};

type OnboardingInput = {
  firstName: string;
  email: string;
  city: string;
  petName: string;
  species: PetSpecies;
  breed: string;
  ageLabel: string;
  dateOfBirth: string;
  weight: string;
  weightUnit: "lb" | "kg";
  weightValue: string;
  photoFile: File | null;
};

type ArchivePetInput = {
  reason: NonNullable<Pet["archivedReason"]>;
  notes: string;
};

type PetFormSubmitInput = {
  ageLabel: string;
  behaviorNotes: string;
  breed: string;
  dateOfBirth: string;
  name: string;
  photoFile: File | null;
  species: PetSpecies;
  weight: string;
  weightUnit: "lb" | "kg";
  weightValue: string;
};

type VetProviderFormInput = Omit<VetProvider, "householdId" | "id">;

type PetAccessMember = {
  id: string;
  petId: string;
  name: string;
  email: string;
  role: "Admin" | "Editor" | "Viewer";
  status: "Active" | "Invited";
  removable?: boolean;
};

export type PawChartDataMode = "local-demo" | "production";

export type PawChartInitialData = Partial<{
  archivedPets: Pet[];
  careEvents: CareEvent[];
  documents: RecordDocument[];
  logs: LogEntry[];
  measurements: MeasurementSnapshot[];
  observations: ObservationRecord[];
  petAccessMembers: PetAccessMember[];
  petKits: PetKit[];
  pets: Pet[];
  shareLinks: ShareLink[];
  tasks: Task[];
  vaccines: VaccineRecord[];
  vetPrepItems: VetPrepItem[];
  vetProviders: VetProvider[];
  vetVisits: VetVisit[];
}>;

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "calendar", label: "Calendar", icon: CalendarCheck },
  { id: "records", label: "Health", icon: HeartPulse },
  { id: "pets", label: "Pets", icon: Dog },
];

const todayValue = new Date().toISOString().slice(0, 10);

function calculateAgeLabelFromBirthDate(value: string) {
  if (!value) return "";
  const birthDate = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(birthDate.getTime())) return "";

  const now = new Date();
  let years = now.getUTCFullYear() - birthDate.getUTCFullYear();
  let months = now.getUTCMonth() - birthDate.getUTCMonth();
  if (now.getUTCDate() < birthDate.getUTCDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts = [
    years > 0 ? `${years} ${years === 1 ? "year" : "years"}` : "",
    months > 0 ? `${months} ${months === 1 ? "month" : "months"}` : "",
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "Less than 1 month";
}

function formatWeightDisplay(value: string, unit: "lb" | "kg", fallback = "Not logged") {
  const parsed = Number(value || "");
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  const unitLabel = unit === "kg" ? "kg" : parsed === 1 ? "lb" : "lbs";
  return `${parsed.toLocaleString("en-US")} ${unitLabel}`;
}

function formatProviderPhone(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  const normalized = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (normalized.length !== 10) return trimmed;
  return `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`;
}

function providerPhoneHref(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  const normalized = trimmed.replace(/[^+\d]/g, "");
  return normalized ? `tel:${normalized}` : "";
}

function formatProviderAddress(value?: string) {
  const trimmed = value?.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  if (trimmed !== trimmed.toLowerCase()) return trimmed;
  return trimmed.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function providerLinkHref(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  if (trimmed.includes("@") && !trimmed.startsWith("http")) return `mailto:${trimmed}`;
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

function formatProviderLinkLabel(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  if (trimmed.includes("@") && !trimmed.startsWith("http")) return trimmed;
  return trimmed.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

const initialPetAccessMembers: PetAccessMember[] = [
  {
    id: "access-oliver-owner",
    petId: "oliver",
    name: "You",
    email: "vikram@example.com",
    role: "Admin",
    status: "Active",
    removable: false,
  },
  {
    id: "access-oliver-sam",
    petId: "oliver",
    name: "Sam",
    email: "sam@example.com",
    role: "Editor",
    status: "Active",
    removable: true,
  },
  {
    id: "access-luna-owner",
    petId: "luna",
    name: "You",
    email: "vikram@example.com",
    role: "Admin",
    status: "Active",
    removable: false,
  },
];

const initialShareLinks: ShareLink[] = [
  {
    id: "share-oliver-vax",
    petId: "oliver",
    label: "Oliver vaccination record",
    type: "Vaccination record",
    token: "oliver-vax-demo",
    url: "https://pawchart.app/share/oliver-vax-demo",
    includeOwnerContact: true,
    status: "Active",
    createdLabel: "Just now",
  },
];

const demoLogEntries: LogEntry[] = [
  {
    id: "log-flea-apr",
    petId: "oliver",
    recordId: "flea",
    recordType: "medication",
    title: "Flea and tick treatment",
    occurredOn: "2026-05-06",
    details: "Simparica Trio, monthly dose",
    createdLabel: "May 6",
  },
  {
    id: "log-weight-luna",
    petId: "luna",
    recordId: "weight",
    recordType: "measurement",
    title: "Body measurements check",
    occurredOn: "2026-05-28",
    value: "10.5 lb",
    createdLabel: "May 28",
  },
  {
    id: "log-visit-oliver-allergy",
    petId: "oliver",
    recordId: "visit-oliver-allergy",
    recordType: "vet_visit",
    title: "Skin and allergy check",
    occurredOn: "2026-04-18",
    details: "Parkside Vet - Discussed paw licking after grass-heavy walks.",
    createdLabel: "Apr 18",
  },
  {
    id: "log-visit-luna-wellness",
    petId: "luna",
    recordId: "visit-luna-wellness",
    recordType: "vet_visit",
    title: "Annual wellness exam",
    occurredOn: "2026-03-12",
    details: "Mission Cat Clinic - Weight steady.",
    createdLabel: "Mar 12",
  },
];

const demoMeasurementSnapshots: MeasurementSnapshot[] = [
  {
    id: "measurement-oliver-may",
    petId: "oliver",
    measuredOn: "2026-05-26",
    weightValue: "22",
    weightUnit: "lb",
    bodyLengthValue: "19",
    bodyLengthUnit: "in",
    heightValue: "15",
    heightUnit: "in",
    collarCircumferenceValue: "13",
    collarCircumferenceUnit: "in",
    chestCircumferenceValue: "21",
    chestCircumferenceUnit: "in",
    notes: "Useful for harness sizing.",
    createdLabel: "May 26, 2026",
  },
  {
    id: "measurement-luna-may",
    petId: "luna",
    measuredOn: "2026-05-28",
    weightValue: "10.5",
    weightUnit: "lb",
    bodyLengthUnit: "in",
    heightUnit: "in",
    collarCircumferenceUnit: "in",
    chestCircumferenceUnit: "in",
    notes: "",
    createdLabel: "May 28, 2026",
  },
];

const localDemoInitialData: Required<PawChartInitialData> = {
  archivedPets: [],
  careEvents: demoCareEvents,
  documents: demoDocuments,
  logs: demoLogEntries,
  measurements: demoMeasurementSnapshots,
  observations: demoObservations,
  petAccessMembers: initialPetAccessMembers,
  petKits: demoPetKits,
  pets: demoPets,
  shareLinks: initialShareLinks,
  tasks: demoTasks,
  vaccines: demoVaccines,
  vetPrepItems: demoVetPrepItems,
  vetProviders: demoVetProviders,
  vetVisits: demoVetVisits,
};

const productionInitialData: Required<PawChartInitialData> = {
  archivedPets: [],
  careEvents: [],
  documents: [],
  logs: [],
  measurements: [],
  observations: [],
  petAccessMembers: [],
  petKits: [],
  pets: [],
  shareLinks: [],
  tasks: [],
  vaccines: [],
  vetPrepItems: [],
  vetProviders: [],
  vetVisits: [],
};

const emptyOwnerProfile: OwnerProfile = {
  id: "current-owner",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
};

function resolveInitialData(mode: PawChartDataMode, initialData?: PawChartInitialData): Required<PawChartInitialData> {
  const base = mode === "local-demo" ? localDemoInitialData : productionInitialData;

  return {
    ...base,
    ...initialData,
  };
}

export function PawChartApp({
  appMode,
  authEmail = null,
  initialData,
  initialOwnerProfile,
  isAuthenticated = false,
  productionLoadError = false,
  workspace: initialWorkspace,
}: {
  appMode?: PawChartDataMode;
  authEmail?: string | null;
  initialData?: PawChartInitialData;
  initialOwnerProfile?: OwnerProfile;
  isAuthenticated?: boolean;
  productionLoadError?: boolean;
  workspace?: PawChartWorkspace;
}) {
  const resolvedAppMode = appMode ?? (process.env.NODE_ENV !== "production" ? "local-demo" : "production");
  const resolvedInitialData = resolveInitialData(resolvedAppMode, initialData);
  const isLocalDemo = resolvedAppMode === "local-demo";
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [pets, setPets] = useState<Pet[]>(() => resolvedInitialData.pets);
  const [archivedPets, setArchivedPets] = useState<Pet[]>(() => resolvedInitialData.archivedPets);
  const [selectedPetId, setSelectedPetId] = useState(resolvedInitialData.pets[0]?.id ?? "");
  const [tasks, setTasks] = useState<Task[]>(() => resolvedInitialData.tasks);
  const [vaccines, setVaccines] = useState<VaccineRecord[]>(() => resolvedInitialData.vaccines);
  const [careEvents, setCareEvents] = useState<CareEvent[]>(() => resolvedInitialData.careEvents);
  const [documents, setDocuments] = useState<RecordDocument[]>(() => resolvedInitialData.documents);
  const [observations, setObservations] = useState<ObservationRecord[]>(() => resolvedInitialData.observations);
  const [vetPrepItems, setVetPrepItems] = useState<VetPrepItem[]>(() => resolvedInitialData.vetPrepItems);
  const [vetProviders, setVetProviders] = useState<VetProvider[]>(() => resolvedInitialData.vetProviders);
  const [vetVisits, setVetVisits] = useState<VetVisit[]>(() => resolvedInitialData.vetVisits);
  const [kitTemplates] = useState<KitTemplate[]>(demoKitTemplates);
  const [petKits, setPetKits] = useState<PetKit[]>(() => resolvedInitialData.petKits);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile>(
    initialOwnerProfile ?? (isLocalDemo ? demoOwnerProfile : emptyOwnerProfile),
  );
  const [petAccessMembers, setPetAccessMembers] = useState<PetAccessMember[]>(() => resolvedInitialData.petAccessMembers);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>(() => resolvedInitialData.shareLinks);
  const [workspace, setWorkspace] = useState<PawChartWorkspace | undefined>(initialWorkspace);
  const [copiedShareLinkId, setCopiedShareLinkId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(resolvedInitialData.pets.length > 0);
  const [lastUndo, setLastUndo] = useState<LogEntry | null>(null);
  const [undoSnapshots, setUndoSnapshots] = useState<Record<string, UndoSnapshot>>({});
  const [logs, setLogs] = useState<LogEntry[]>(() => resolvedInitialData.logs);
  const [measurements, setMeasurements] = useState<MeasurementSnapshot[]>(() => resolvedInitialData.measurements);

  const selectedPet = pets.find((pet) => pet.id === selectedPetId) ?? pets[0];
  const activePetIds = useMemo(() => new Set(pets.map((pet) => pet.id)), [pets]);
  const scheduledTasks = useMemo(
    () => tasks.filter((task) => !task.completed && activePetIds.has(task.petId)),
    [activePetIds, tasks],
  );
  const dueTasks = useMemo(
    () => scheduledTasks.filter((task) => activePetIds.has(task.petId) && task.dueDate <= todayValue),
    [activePetIds, scheduledTasks],
  );

  if (resolvedAppMode === "production" && !isAuthenticated) {
    return <ProductionSignInView />;
  }

  if (resolvedAppMode === "production" && isAuthenticated && productionLoadError) {
    return (
      <main className="min-h-dvh bg-background px-5 py-8 text-foreground sm:px-8">
        <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-xl items-center">
          <div className="w-full rounded-lg border border-line bg-surface p-5 text-center shadow-sm sm:p-7">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
              <Dog aria-hidden className="h-6 w-6" />
            </span>
            <h1 className="mt-4 text-2xl font-semibold text-ink">We could not load your pets</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Your account is signed in, but PawChart could not load your saved pet profile. Refresh the page before adding another pet.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                className="min-h-11 rounded-lg bg-ink px-4 text-sm font-semibold text-white"
                onClick={() => window.location.reload()}
                type="button"
              >
                Retry
              </button>
              <form action={signOut}>
                <button className="min-h-11 w-full rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink" type="submit">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    );
  }

  function handleProductionError(error: unknown) {
    console.error(error);
    window.alert(error instanceof Error ? error.message : "Something went wrong while saving. Please try again.");
  }

  async function uploadProductionPhotoForPet(petId: string, photoFile: File) {
    const formData = new FormData();
    formData.set("petId", petId);
    formData.set("photo", photoFile);

    const result = await updateProductionPetPhoto(formData);

    if (!result.pet) {
      throw new Error(result.error || "Pet photo could not be saved. Please try again.");
    }

    return result.pet;
  }

  function localPhotoUrl(file: File | null, species: PetSpecies) {
    return file
      ? URL.createObjectURL(file)
      : species === "dog"
        ? "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=640&q=80"
        : "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=640&q=80";
  }

  function openRecordsForPet(petId: string) {
    setSelectedPetId(petId);
    setActiveTab("records");
    setShowNotifications(false);
  }

  async function addPet(input: PetFormSubmitInput) {
    if (!isLocalDemo) {
      try {
        const { photoFile, ...petInput } = input;
        const pet = await createProductionPet(petInput);
        let savedPet = pet;

        if (photoFile) {
          try {
            savedPet = await uploadProductionPhotoForPet(pet.id, photoFile);
          } catch (error) {
            handleProductionError(error);
          }
        }

        setPets((current) => [...current, savedPet]);
        setSelectedPetId(savedPet.id);
        setActiveTab("pets");
        setModal(null);
      } catch (error) {
        handleProductionError(error);
      }
      return;
    }

    const pet: Pet = {
      id: uniqueId(slugify(input.name || "pet"), pets.map((item) => item.id)),
      name: input.name || "New pet",
      species: input.species,
      breed: input.breed || "Unknown breed",
      sex: "male",
      photo: localPhotoUrl(input.photoFile, input.species),
      dateOfBirth: input.dateOfBirth || undefined,
      ageLabel: input.dateOfBirth ? calculateAgeLabelFromBirthDate(input.dateOfBirth) : input.ageLabel || "Approximate age",
      ageEstimated: !input.dateOfBirth,
      weight: formatWeightDisplay(input.weightValue, input.weightUnit, input.weight || "Not logged"),
      weightValue: input.weightValue || undefined,
      weightUnit: input.weightUnit,
      status: "Ready for care",
      behaviorNotes: input.behaviorNotes,
      careNotes: "",
      medicalNotes: "",
      background: {
        adoptionPlace: "",
        adoptionDate: "",
        spayedNeutered: false,
        microchipped: false,
        microchipNumber: "",
        knownHistory: "",
      },
      foodPreferences: {
        favorites: [],
        dislikes: [],
        rules: [],
      },
      dynamicFields:
        input.species === "dog"
          ? []
          : [
              { label: "Lifestyle", value: "Not set" },
              { label: "Litter", value: "Not set" },
            ],
      trainingCues:
        input.species === "dog"
          ? [
              { id: "sit", cue: "Sit", action: "Sits and waits for release" },
              { id: "touch", cue: "Touch", action: "Touches nose to hand" },
              { id: "stay", cue: "Stay", action: "Holds position until released" },
            ]
          : undefined,
    };

    setPets((current) => [...current, pet]);
    setSelectedPetId(pet.id);
    setActiveTab("pets");
    setModal(null);
  }

  async function completeOnboarding(input: OnboardingInput) {
    if (!isLocalDemo) {
      try {
        const result = await completeProductionOnboarding({
          ageLabel: input.ageLabel,
          breed: input.breed,
          city: input.city,
          dateOfBirth: input.dateOfBirth,
          email: input.email,
          firstName: input.firstName,
          petName: input.petName,
          species: input.species,
          weight: input.weight,
          weightUnit: input.weightUnit,
          weightValue: input.weightValue,
        });
        let savedPet = result.pet;

        if (input.photoFile) {
          try {
            savedPet = await uploadProductionPhotoForPet(result.pet.id, input.photoFile);
          } catch (error) {
            handleProductionError(error);
          }
        }

        setOwnerProfile(result.ownerProfile);
        setArchivedPets([]);
        setPets([savedPet]);
        setSelectedPetId(savedPet.id);
        setVetProviders(result.vetProviders);
        setWorkspace(result.workspace);
        setPetKits([]);
        setOnboardingDismissed(true);
        setActiveTab("home");
      } catch (error) {
        handleProductionError(error);
      }
      return;
    }

    const petId = uniqueId(slugify(input.petName || "pet"), pets.map((item) => item.id));
    const pet: Pet = {
      id: petId,
      name: input.petName || "New pet",
      species: input.species,
      breed: input.breed || "Unknown breed",
      sex: "male",
      photo: localPhotoUrl(input.photoFile, input.species),
      dateOfBirth: input.dateOfBirth || undefined,
      ageLabel: input.dateOfBirth ? calculateAgeLabelFromBirthDate(input.dateOfBirth) : input.ageLabel || "Approximate age",
      ageEstimated: !input.dateOfBirth,
      weight: formatWeightDisplay(input.weightValue, input.weightUnit, input.weight || "Not logged"),
      weightValue: input.weightValue || undefined,
      weightUnit: input.weightUnit,
      status: "Ready for care",
      behaviorNotes: "",
      careNotes: "",
      medicalNotes: "",
      background: {
        adoptionPlace: "",
        adoptionDate: "",
        spayedNeutered: false,
        microchipped: false,
        microchipNumber: "",
        knownHistory: "",
      },
      foodPreferences: {
        favorites: [],
        dislikes: [],
        rules: [],
      },
      dynamicFields:
        input.species === "dog"
          ? []
          : [
              { label: "Lifestyle", value: "Not set" },
              { label: "Litter", value: "Not set" },
            ],
      trainingCues: input.species === "dog" ? [] : undefined,
    };
    const completeLaterKit: PetKit = {
      id: `kit-complete-later-${petId}`,
      title: `${pet.name} setup checklist`,
      destination: "Complete later",
      petIds: [petId],
      sourceTemplateId: "template-blank",
      checklistItems: [
        { id: `setup-${petId}-vaccines`, itemType: "document", label: "Add vaccine records", completed: false, petId, documentType: "vaccination-records" },
        { id: `setup-${petId}-vet`, itemType: "task", label: "Add primary vet", completed: false },
        { id: `setup-${petId}-routine`, itemType: "task", label: "Create first care routine", completed: false },
        { id: `setup-${petId}-food`, itemType: "task", label: "Add food preferences", completed: false },
        { id: `setup-${petId}-microchip`, itemType: "document", label: "Add microchip or registration info", completed: false, petId, documentType: "microchip-info" },
      ],
      documentLinks: [],
      notes: "Add more context when it becomes useful.",
    };

    setOwnerProfile((current) => ({
      ...current,
      city: input.city || current.city,
      email: input.email || current.email,
      firstName: input.firstName || current.firstName,
    }));
    setPets([pet]);
    setArchivedPets([]);
    setSelectedPetId(pet.id);
    setPetKits([completeLaterKit]);
    setOnboardingDismissed(true);
    setActiveTab("home");
  }

  async function updatePet(input: Pet, photoFile?: File | null) {
    if (!isLocalDemo) {
      try {
        const pet = await updateProductionPet(input);
        const savedPet = photoFile ? await uploadProductionPhotoForPet(pet.id, photoFile) : pet;
        setPets((current) => current.map((currentPet) => (currentPet.id === savedPet.id ? savedPet : currentPet)));
        setModal(null);
      } catch (error) {
        handleProductionError(error);
      }
      return;
    }

    const nextPet = photoFile ? { ...input, photo: localPhotoUrl(photoFile, input.species) } : input;
    setPets((current) => current.map((pet) => (pet.id === nextPet.id ? nextPet : pet)));
    setModal(null);
  }

  async function changePetPhoto(petId: string, photoFile: File | null) {
    if (!photoFile) return;

    if (!isLocalDemo) {
      try {
        const pet = await uploadProductionPhotoForPet(petId, photoFile);
        setPets((current) => current.map((currentPet) => (currentPet.id === pet.id ? pet : currentPet)));
      } catch (error) {
        handleProductionError(error);
      }
      return;
    }

    setPets((current) =>
      current.map((pet) => (pet.id === petId ? { ...pet, photo: localPhotoUrl(photoFile, pet.species) } : pet)),
    );
  }

  async function archivePet(pet: Pet, input: ArchivePetInput, options?: { returnToEditProfiles?: boolean }) {
    if (!isLocalDemo) {
      try {
        const archivedPet = await archiveProductionPet({
          notes: input.notes,
          petId: pet.id,
          reason: input.reason,
        });
        setPets((current) => current.filter((item) => item.id !== pet.id));
        setArchivedPets((current) => [archivedPet, ...current.filter((item) => item.id !== pet.id)]);
        const nextPet = pets.find((item) => item.id !== pet.id);
        setSelectedPetId(nextPet?.id ?? "");
        setModal(options?.returnToEditProfiles ? { title: "Edit profiles", type: "edit-profiles" } : null);
      } catch (error) {
        handleProductionError(error);
      }
      return;
    }

    const archivedPet: Pet = {
      ...pet,
      archivedAt: new Date().toISOString(),
      archivedNotes: input.notes,
      archivedReason: input.reason,
    };
    setPets((current) => current.filter((item) => item.id !== pet.id));
    setArchivedPets((current) => [archivedPet, ...current.filter((item) => item.id !== pet.id)]);
    const nextPet = pets.find((item) => item.id !== pet.id);
    setSelectedPetId(nextPet?.id ?? "");
    setModal(options?.returnToEditProfiles ? { title: "Edit profiles", type: "edit-profiles" } : null);
  }

  async function restorePet(pet: Pet, options?: { returnToEditProfiles?: boolean }) {
    if (!isLocalDemo) {
      try {
        const restoredPet = await restoreProductionPet(pet.id);
        setArchivedPets((current) => current.filter((item) => item.id !== pet.id));
        setPets((current) => [...current, restoredPet]);
        setSelectedPetId(restoredPet.id);
        setModal(options?.returnToEditProfiles ? { title: "Edit profiles", type: "edit-profiles" } : null);
        setActiveTab("pets");
      } catch (error) {
        handleProductionError(error);
      }
      return;
    }

    const restoredPet = {
      ...pet,
      archivedAt: undefined,
      archivedNotes: undefined,
      archivedReason: undefined,
    };
    setArchivedPets((current) => current.filter((item) => item.id !== pet.id));
    setPets((current) => [...current, restoredPet]);
    setSelectedPetId(restoredPet.id);
    setModal(options?.returnToEditProfiles ? { title: "Edit profiles", type: "edit-profiles" } : null);
    setActiveTab("pets");
  }

  async function deletePetProfile(pet: Pet) {
    if (!isLocalDemo) {
      try {
        await deleteProductionPet({ petId: pet.id, reason: "user-requested" });
        setPets((current) => current.filter((item) => item.id !== pet.id));
        setArchivedPets((current) => current.filter((item) => item.id !== pet.id));
        const nextPet = pets.find((item) => item.id !== pet.id);
        setSelectedPetId(nextPet?.id ?? "");
        setModal({ title: "Edit profiles", type: "edit-profiles" });
      } catch (error) {
        handleProductionError(error);
      }
      return;
    }

    setPets((current) => current.filter((item) => item.id !== pet.id));
    setArchivedPets((current) => current.filter((item) => item.id !== pet.id));
    const nextPet = pets.find((item) => item.id !== pet.id);
    setSelectedPetId(nextPet?.id ?? "");
    setModal({ title: "Edit profiles", type: "edit-profiles" });
  }

  function addVetPrepItem(input: { petId: string; title: string; details: string; observedOn: string }) {
    const observedOn = input.observedOn || todayValue;
    const item: VetPrepItem = {
      id: `vet-prep-${Date.now()}`,
      petId: input.petId,
      title: input.title || "Ask the vet",
      details: input.details,
      observedOn,
      status: "open",
      createdLabel: formatDateForDisplay(observedOn),
    };

    setVetPrepItems((current) => [item, ...current]);
    setModal(null);
  }

  function markVetPrepAddressed(itemId: string) {
    setVetPrepItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, status: "addressed" } : item)),
    );
  }

  function dismissVetPrepItem(itemId: string) {
    setVetPrepItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, status: "dismissed" } : item)),
    );
  }

  function carryVetPrepItem(itemId: string) {
    setVetPrepItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, status: "open" } : item)),
    );
  }

  async function changePetVet(input: { petId: string; primaryVetId: string; secondaryVetId: string; secondaryVetRole: string }) {
    const normalizedInput = {
      ...input,
      secondaryVetId: input.primaryVetId && input.primaryVetId === input.secondaryVetId ? "" : input.secondaryVetId,
      secondaryVetRole: input.primaryVetId && input.primaryVetId === input.secondaryVetId ? "" : input.secondaryVetRole,
    };

    if (!isLocalDemo) {
      try {
        const pet = await updateProductionPetCareTeam(normalizedInput);
        setPets((current) => current.map((currentPet) => (currentPet.id === pet.id ? pet : currentPet)));
        setModal({ title: "Manage care team", type: "change-vet", pet });
      } catch (error) {
        handleProductionError(error);
      }
      return;
    }

    setPets((current) =>
      current.map((pet) =>
        pet.id === input.petId
          ? {
              ...pet,
              primaryVetId: normalizedInput.primaryVetId || undefined,
              secondaryVetId: normalizedInput.secondaryVetId || undefined,
              secondaryVetRole: normalizedInput.secondaryVetRole || undefined,
            }
          : pet,
      ),
    );
    const updatedPet = pets.find((pet) => pet.id === input.petId);
    setModal({
      title: "Manage care team",
      type: "change-vet",
      pet: updatedPet
        ? {
            ...updatedPet,
            primaryVetId: normalizedInput.primaryVetId || undefined,
            secondaryVetId: normalizedInput.secondaryVetId || undefined,
            secondaryVetRole: normalizedInput.secondaryVetRole || undefined,
          }
        : selectedPet,
    });
  }

  async function updateOwnerProfile(input: OwnerProfile) {
    if (!isLocalDemo) {
      try {
        const owner = await updateProductionOwnerProfile(input);
        setOwnerProfile(owner);
        setModal(null);
      } catch (error) {
        handleProductionError(error);
      }
      return;
    }

    setOwnerProfile(input);
    setModal(null);
  }

  async function addVetProvider(input: VetProviderFormInput, returnPetId?: string) {
    if (!isLocalDemo) {
      try {
        const provider = await createProductionVetProvider(input);
        setVetProviders((current) => [...current, provider]);
        const returnPet = returnPetId ? pets.find((pet) => pet.id === returnPetId) : undefined;
        if (returnPet && !returnPet.primaryVetId) {
          const updatedPet = await updateProductionPetCareTeam({
            petId: returnPet.id,
            primaryVetId: provider.id,
            secondaryVetId: returnPet.secondaryVetId ?? "",
            secondaryVetRole: returnPet.secondaryVetRole ?? "",
          });
          setPets((current) => current.map((pet) => (pet.id === updatedPet.id ? updatedPet : pet)));
          setModal({ title: "Manage care team", type: "change-vet", pet: updatedPet });
          return;
        }
        setModal(returnPet ? { title: "Manage care team", type: "change-vet", pet: returnPet } : null);
      } catch (error) {
        handleProductionError(error);
      }
      return;
    }

    const provider: VetProvider = {
      id: uniqueId(slugify(input.name || "vet"), vetProviders.map((item) => item.id)),
      householdId: workspace?.household?.id ?? "household-demo",
      name: input.name || "New vet or clinic",
      phone: input.phone,
      address: input.address,
      website: input.website,
      notes: input.notes,
    };

    setVetProviders((current) => [...current, provider]);
    const returnPet = returnPetId ? pets.find((pet) => pet.id === returnPetId) : undefined;
    if (returnPet && !returnPet.primaryVetId) {
      const updatedPet = { ...returnPet, primaryVetId: provider.id };
      setPets((current) => current.map((pet) => (pet.id === updatedPet.id ? updatedPet : pet)));
      setModal({ title: "Manage care team", type: "change-vet", pet: updatedPet });
      return;
    }
    setModal(returnPet ? { title: "Manage care team", type: "change-vet", pet: returnPet } : null);
  }

  async function updateVetProvider(input: VetProvider, returnPetId?: string) {
    if (!isLocalDemo) {
      try {
        const provider = await updateProductionVetProvider(input);
        setVetProviders((current) =>
          current.map((currentProvider) => (currentProvider.id === provider.id ? provider : currentProvider)),
        );
        const returnPet = returnPetId ? pets.find((pet) => pet.id === returnPetId) : undefined;
        setModal(returnPet ? { title: "Manage care team", type: "change-vet", pet: returnPet } : null);
      } catch (error) {
        handleProductionError(error);
      }
      return;
    }

    setVetProviders((current) =>
      current.map((provider) => (provider.id === input.id ? input : provider)),
    );
    const returnPet = returnPetId ? pets.find((pet) => pet.id === returnPetId) : undefined;
    setModal(returnPet ? { title: "Manage care team", type: "change-vet", pet: returnPet } : null);
  }

  function addObservation(input: {
    petId: string;
    category: ObservationRecord["category"];
    title: string;
    severity: ObservationRecord["severity"];
    trigger: string;
    duration: string;
    medicationStatus: string;
    notes: string;
    observedOn: string;
  }) {
    const observedOn = input.observedOn || todayValue;
    const observation: ObservationRecord = {
      id: `observation-${Date.now()}`,
      petId: input.petId,
      category: input.category,
      title: input.title || "Observation",
      severity: input.severity,
      trigger: input.trigger,
      duration: input.duration,
      medicationStatus: input.medicationStatus,
      notes: input.notes,
      observedOn,
      createdLabel: formatDateForDisplay(observedOn),
    };
    const log: LogEntry = {
      id: `log-${observation.id}`,
      petId: input.petId,
      recordId: observation.id,
      recordType: "observation",
      title: observation.title,
      occurredOn: observedOn,
      details: [
        capitalize(observation.category),
        capitalize(observation.severity),
        observation.trigger ? `Trigger: ${observation.trigger}` : "",
        observation.notes,
      ].filter(Boolean).join(" - "),
      createdLabel: observation.createdLabel,
    };

    setObservations((current) => [observation, ...current]);
    setLogs((current) => [log, ...current]);
    setModal(null);
  }

  function addVetVisit(input: {
    petId: string;
    vetProviderId: string;
    visitedOn: string;
    reason: string;
    notes: string;
    followUpDate: string;
    totalCost: string;
    servicesPerformed: string[];
    billDocument?: {
      title: string;
      fileType: "pdf" | "image";
      sizeLabel: string;
    };
  }) {
    const visitedOn = input.visitedOn || todayValue;
    const provider = vetProviders.find((item) => item.id === input.vetProviderId);
    const visitId = `visit-${Date.now()}`;
    const billDocumentId = input.billDocument ? `doc-bill-${Date.now()}` : undefined;
    const visit: VetVisit = {
      id: visitId,
      petId: input.petId,
      vetProviderId: input.vetProviderId,
      visitedOn,
      reason: input.reason || "Vet visit",
      notes: input.notes,
      followUpDate: input.followUpDate,
      totalCost: input.totalCost,
      currency: "USD",
      servicesPerformed: input.servicesPerformed,
      billDocumentId,
      createdLabel: formatDateForDisplay(visitedOn),
    };
    const billDocument: RecordDocument | null = input.billDocument
      ? {
          createdAt: new Date().toISOString(),
          documentGroupId: `vet_visit:${visit.id}:bill`,
          id: billDocumentId ?? `doc-bill-${Date.now()}`,
          petId: input.petId,
          recordId: visit.id,
          recordType: "vet_visit",
          title: input.billDocument.title,
          fileType: input.billDocument.fileType,
          sizeLabel: input.billDocument.sizeLabel,
          addedLabel: "Just now",
          privateByDefault: true,
          versionLabel: "Latest",
        }
      : null;
    const log: LogEntry = {
      id: `log-${visit.id}`,
      petId: input.petId,
      recordId: visit.id,
      recordType: "vet_visit",
      title: visit.reason,
      occurredOn: visitedOn,
      details: [
        provider?.name,
        visit.totalCost ? formatCurrency(visit.totalCost, visit.currency) : "",
        visit.servicesPerformed.length ? visit.servicesPerformed.join(", ") : "",
        visit.notes,
      ].filter(Boolean).join(" - "),
      createdLabel: visit.createdLabel,
    };

    setVetVisits((current) => [visit, ...current]);
    if (billDocument) setDocuments((current) => [billDocument, ...current]);
    setLogs((current) => [log, ...current]);
    setModal(null);
  }

  function addOrUpdateVaccine(input: {
    petId: string;
    id?: string;
    name: string;
    protectsAgainst: string;
    dateGiven: string;
    expires: string;
    provider: string;
  }) {
    const vaccine: VaccineRecord = {
      id: input.id ?? `vaccine-${Date.now()}`,
      petId: input.petId,
      name: input.name || "Vaccine",
      protectsAgainst: input.protectsAgainst || "Add what this vaccine protects against.",
      dateGiven: formatDateForDisplay(input.dateGiven),
      expires: formatDateForDisplay(input.expires),
      provider: input.provider || "Provider not set",
      status: "current",
    };

    setVaccines((current) =>
      input.id
        ? current.map((item) => (item.id === input.id ? vaccine : item))
        : [vaccine, ...current],
    );
    setModal(null);
  }

  function addCareType(input: { petId: string; label: string; defaultAction: string }) {
    const event: CareEvent = {
      id: `care-${Date.now()}`,
      petId: input.petId,
      label: input.label || "Custom care",
      lastLogged: "Not logged yet",
      defaultAction: input.defaultAction || "Log today",
      custom: true,
    };

    setCareEvents((current) => [event, ...current]);
    setModal(null);
  }

  function updateCareType(input: { id: string; label: string; defaultAction: string }) {
    setCareEvents((current) =>
      current.map((event) =>
        event.id === input.id
          ? {
              ...event,
              label: input.label || event.label,
              defaultAction: input.defaultAction || event.defaultAction,
            }
          : event,
      ),
    );
    setModal(null);
  }

  function scheduleTask(input: {
    actionLabel: string;
    cadence: Task["cadence"];
    doseLabel: string;
    dueDate: string;
    notes: string;
    petId: string;
    providerId: string;
    refillByDate: string;
    reminderKind: Task["reminderKind"];
    title: string;
    type: Task["type"];
  }) {
    const dueDate = input.dueDate || todayValue;
    const task: Task = {
      id: `schedule-${slugify(input.title || input.type)}-${Date.now()}`,
      petId: input.petId,
      title: input.title || taskTypeLabel(input.type),
      type: input.type,
      dueDate,
      dueLabel: relativeDateLabel(dueDate),
      actionLabel: input.actionLabel || defaultActionLabel(input.type),
      cadence: input.cadence,
      reminderKind: input.reminderKind,
      notes: input.notes,
      doseLabel: input.doseLabel,
      providerId: input.providerId || undefined,
      refillByDate: input.refillByDate || undefined,
    };

    setTasks((current) => [task, ...current]);
    setSelectedPetId(input.petId);
    setActiveTab("calendar");
    setModal(null);
  }

  function updateScheduledTask(taskId: string, input: {
    actionLabel: string;
    cadence: Task["cadence"];
    doseLabel: string;
    dueDate: string;
    notes: string;
    petId: string;
    providerId: string;
    refillByDate: string;
    reminderKind: Task["reminderKind"];
    title: string;
    type: Task["type"];
  }) {
    const nextDueDate = input.dueDate || todayValue;
    setTasks((current) =>
      current.map((item) =>
        item.id === taskId
          ? {
              ...item,
              petId: input.petId,
              title: input.title || item.title,
              type: input.type,
              dueDate: nextDueDate,
              dueLabel: relativeDateLabel(nextDueDate),
              actionLabel: input.actionLabel || defaultActionLabel(input.type),
              cadence: input.cadence,
              reminderKind: input.reminderKind,
              notes: input.notes,
              doseLabel: input.doseLabel,
              providerId: input.providerId || undefined,
              refillByDate: input.refillByDate || undefined,
            }
          : item,
      ),
    );
    setModal(null);
  }

  async function logMeasurement(task: Task, input: MeasurementFormInput) {
    let measurement = input.measurement;

    if (!isLocalDemo) {
      try {
        measurement = await createProductionMeasurementSnapshot(input.measurement);
      } catch (error) {
        handleProductionError(error);
        return;
      }
    }

    setMeasurements((current) => [measurement, ...current]);
    logTask(task, {
      details: input.details,
      measurement,
      occurredOn: input.occurredOn,
      value: measurementSnapshotSummary(measurement),
    });
  }

  function logTask(task: Task, input?: { occurredOn?: string; details?: string; value?: string; measurement?: MeasurementSnapshot }) {
    const occurredOn = input?.occurredOn || todayValue;
    const nextDueDate = getNextDueDate(task, occurredOn);
    const petBeforeLog = pets.find((pet) => pet.id === task.petId);
    const careEventBeforeLog = careEvents.find((event) => event.id === task.id);
    const log: LogEntry = {
      id: `log-${task.id}-${Date.now()}`,
      petId: task.petId,
      taskId: task.id,
      recordId: input?.measurement?.id ?? task.id,
      recordType: recordTypeForTask(task),
      title: task.title,
      occurredOn,
      dueDate: task.dueDate,
      completedTiming: completionTiming(task.dueDate, occurredOn),
      details: [task.notes, task.doseLabel, input?.details].filter(Boolean).join(" - "),
      value: input?.value,
      createdLabel: formatDateForDisplay(occurredOn),
    };

    setLogs((current) => [log, ...current]);
    setLastUndo(log);
    setUndoSnapshots((current) => ({
      ...current,
      [log.id]: {
        careEvent: task.type === "care" ? careEventBeforeLog : undefined,
        petWeight: task.type === "measurement" ? petBeforeLog?.weight : undefined,
        task,
      },
    }));
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? nextDueDate
            ? {
                ...item,
                dueDate: nextDueDate,
                dueLabel: relativeDateLabel(nextDueDate),
                lastCompletedOn: occurredOn,
              }
            : {
                ...item,
                completed: true,
                dueLabel: "Logged",
                lastCompletedOn: occurredOn,
              }
          : item,
      ),
    );

    if (task.type === "measurement" && input?.measurement?.weightValue) {
      const nextWeight = measurementWeightLabel(input.measurement);
      setPets((current) =>
        current.map((item) => (item.id === task.petId ? { ...item, weight: nextWeight ?? item.weight } : item)),
      );
    }

    if (task.type === "care") {
      setCareEvents((current) =>
        current.map((event) =>
          event.id === task.id ? { ...event, lastLogged: formatDateForDisplay(occurredOn) } : event,
        ),
      );
    }

    setModal(null);
  }

  function undoLog(logId: string) {
    const log = logs.find((item) => item.id === logId);
    if (!log) return;
    const snapshot = undoSnapshots[logId];

    setLogs((current) => current.filter((item) => item.id !== logId));
    setLastUndo((current) => (current?.id === logId ? null : current));
    setUndoSnapshots((current) => {
      const next = { ...current };
      delete next[logId];
      return next;
    });

    const taskSnapshot = snapshot?.task;

    if (taskSnapshot) {
      setTasks((current) =>
        current.some((task) => task.id === taskSnapshot.id)
          ? current.map((task) => (task.id === taskSnapshot.id ? taskSnapshot : task))
          : [taskSnapshot, ...current],
      );
    } else if (log.taskId) {
      setTasks((current) => current.map((task) => (task.id === log.taskId ? { ...task, completed: false } : task)));
    }

    if (snapshot?.petWeight !== undefined) {
      setPets((current) =>
        current.map((pet) => (pet.id === log.petId ? { ...pet, weight: snapshot.petWeight ?? pet.weight } : pet)),
      );
    }

    if (log.recordType === "measurement" && log.recordId) {
      setMeasurements((current) => current.filter((measurement) => measurement.id !== log.recordId));
    }

    const careEventSnapshot = snapshot?.careEvent;

    if (careEventSnapshot) {
      setCareEvents((current) =>
        current.some((event) => event.id === careEventSnapshot.id)
          ? current.map((event) => (event.id === careEventSnapshot.id ? careEventSnapshot : event))
          : [careEventSnapshot, ...current],
      );
    }
  }

  function deleteVaccine(vaccineId: string) {
    setVaccines((current) => current.filter((vaccine) => vaccine.id !== vaccineId));
  }

  function deleteCareEvent(eventId: string) {
    setCareEvents((current) => current.filter((event) => event.id !== eventId));
  }

  function deleteScheduledTask(taskId: string) {
    setTasks((current) => current.filter((task) => task.id !== taskId));
  }

  async function deleteDocument(documentId: string) {
    if (!isLocalDemo) {
      try {
        await deleteProductionDocument(documentId);
        setDocuments((current) => current.filter((document) => document.id !== documentId));
        setModal(null);
      } catch (error) {
        handleProductionError(error);
      }
      return;
    }

    setDocuments((current) => current.filter((document) => document.id !== documentId));
    setModal(null);
  }

  function deleteVetVisit(visitId: string) {
    setVetVisits((current) => current.filter((visit) => visit.id !== visitId));
    setLogs((current) => current.filter((log) => !(log.recordType === "vet_visit" && log.recordId === visitId)));
  }

  function invitePetAccessMember(input: { petId: string; email: string; role: PetAccessMember["role"] }) {
    const email = input.email.trim();
    if (!email) return;

    setPetAccessMembers((current) => [
      ...current,
      {
        id: `access-${input.petId}-${Date.now()}`,
        petId: input.petId,
        name: email.split("@")[0] || "Invited member",
        email,
        role: input.role,
        status: "Invited",
        removable: true,
      },
    ]);
    const pet = pets.find((item) => item.id === input.petId) ?? selectedPet;
    setModal({ title: "Sharing and access", type: "sharing-access", pet });
  }

  function updatePetAccessRole(memberId: string, role: PetAccessMember["role"]) {
    setPetAccessMembers((current) =>
      current.map((member) => (member.id === memberId ? { ...member, role } : member)),
    );
  }

  function removePetAccessMember(memberId: string) {
    setPetAccessMembers((current) => current.filter((member) => member.id !== memberId));
  }

  async function createSharePacket(input: { documentIds: string[]; includeOwnerContact: boolean; label: string; petId: string }) {
    if (!isLocalDemo) {
      try {
        const link = await createProductionSharePacket(input);
        setShareLinks((current) => [link, ...current.filter((item) => item.id !== link.id)]);
        setCopiedShareLinkId(null);
        const pet = pets.find((item) => item.id === input.petId) ?? selectedPet;
        setModal({ title: "Sharing and access", type: "sharing-access", pet });
      } catch (error) {
        handleProductionError(error);
      }
      return;
    }

    const token = `${input.petId}-packet-${Date.now().toString(36)}`;
    const link: ShareLink = {
      id: `share-${token}`,
      petId: input.petId,
      label: input.label.trim() || "Document packet",
      type: "Document packet",
      token,
      url: `${window.location.origin}/share/${token}`,
      includeOwnerContact: input.includeOwnerContact,
      status: "Active",
      createdLabel: "Just now",
      documentIds: input.documentIds,
    };

    setShareLinks((current) => [link, ...current]);
    setCopiedShareLinkId(null);
    const pet = pets.find((item) => item.id === input.petId) ?? selectedPet;
    setModal({ title: "Sharing and access", type: "sharing-access", pet });
  }

  function copyShareLink(linkId: string) {
    const link = shareLinks.find((item) => item.id === linkId);
    if (link && typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(link.url);
    }
    setCopiedShareLinkId(linkId);
  }

  async function revokeShareLink(linkId: string) {
    if (!isLocalDemo) {
      try {
        await revokeProductionShareLink(linkId);
      } catch (error) {
        handleProductionError(error);
        return;
      }
    }

    setShareLinks((current) =>
      current.map((link) => (link.id === linkId ? { ...link, status: "Revoked" } : link)),
    );
    setCopiedShareLinkId((current) => (current === linkId ? null : current));
  }

  async function renameDocument(documentId: string, title: string) {
    if (!isLocalDemo) {
      try {
        const document = await renameProductionDocument(documentId, title);
        setDocuments((current) => current.map((item) => (item.id === documentId ? document : item)));
        setModal(null);
      } catch (error) {
        handleProductionError(error);
      }
      return;
    }

    setDocuments((current) =>
      current.map((document) => (document.id === documentId ? { ...document, title } : document)),
    );
    setModal(null);
  }

  async function attachDocuments({
    files,
    petId,
    recordId,
    recordType,
  }: {
    files: FileList | null;
    petId: string;
    recordId: string;
    recordType: DocumentRecordType;
  }) {
    if (!files?.length) return;
    const uploadedFiles = Array.from(files);

    if (!isLocalDemo) {
      try {
        const uploadedDocuments: RecordDocument[] = [];

        for (const file of uploadedFiles) {
          uploadedDocuments.push(
            await uploadPersistentDocument({
              documentType: recordType === "vaccine_record" ? "vaccine" : recordType,
              file,
              petId,
              recordId,
              recordType,
              title: file.name,
            }),
          );
        }

        setDocuments((current) => [...uploadedDocuments, ...current]);
      } catch (error) {
        handleProductionError(error);
      }
      return;
    }

    setDocuments((current) => {
      const existing = current.filter(
        (document) =>
          document.petId === petId &&
          document.recordId === recordId &&
          document.recordType === recordType,
      );
      const latestExisting = latestDocument(existing);
      const groupId =
        latestExisting?.documentGroupId ?? `${recordType}:${recordId}:${recordType === "vaccine_record" ? "proof" : "files"}`;
      const baseTime = Date.now();
      const newDocuments = uploadedFiles.map((file, index) => ({
        createdAt: new Date(baseTime + index).toISOString(),
        documentGroupId: groupId,
        id: `doc-${recordType}-${recordId}-${file.name}-${baseTime + index}`,
        petId,
        recordId,
        recordType,
        title: file.name,
        fileType: file.type === "application/pdf" ? ("pdf" as const) : ("image" as const),
        sizeLabel: formatFileSize(file.size),
        addedLabel: "Just now",
        privateByDefault: true,
        versionLabel: "Latest",
      }));
      const newestUpload = newDocuments[newDocuments.length - 1];

      return [
        ...newDocuments,
        ...current.map((document) =>
          document.id === latestExisting?.id && newestUpload
            ? { ...document, supersededById: newestUpload.id, versionLabel: "Older" }
            : document,
        ),
      ];
    });
  }

  async function uploadDocument(input: {
    documentType: string;
    file: File | null;
    petId: string;
    title: string;
  }) {
    if (!isLocalDemo) {
      const file = input.file;

      if (!file) {
        handleProductionError(new Error("Choose a PDF or image to upload."));
        return;
      }

      try {
        const document = await uploadPersistentDocument({ ...input, file });
        setDocuments((current) => [document, ...current]);
        setModal(null);
      } catch (error) {
        handleProductionError(error);
      }
      return;
    }

    uploadPlaceholderDocument({
      documentType: input.documentType,
      fileType: input.file ? (input.file.type === "application/pdf" ? "pdf" : "image") : undefined,
      petId: input.petId,
      sizeLabel: input.file ? formatFileSize(input.file.size) : "Pending upload",
      title: input.title || input.file?.name || "",
    });
  }

  async function uploadPersistentDocument(input: {
    documentType: string;
    file: File;
    petId: string;
    recordId?: string;
    recordType?: DocumentRecordType;
    title: string;
  }) {
    const formData = new FormData();
    formData.set("documentType", input.documentType);
    formData.set("file", input.file);
    formData.set("petId", input.petId);
    formData.set("title", input.title || input.file.name);

    if (input.recordId && input.recordType) {
      formData.set("recordId", input.recordId);
      formData.set("recordType", input.recordType);
    }

    return uploadProductionDocument(formData);
  }

  function uploadPlaceholderDocument(input: {
    petId: string;
    title: string;
    documentType: string;
    fileType?: "pdf" | "image";
    sizeLabel?: string;
  }) {
    const document: RecordDocument = {
      createdAt: new Date().toISOString(),
      documentGroupId: `pet:${input.petId}:uploads`,
      id: `doc-upload-${Date.now()}`,
      petId: input.petId,
      recordId: input.petId,
      recordType: "pet",
      title: input.title || "Uploaded document.pdf",
      fileType: input.fileType ?? (input.title.toLowerCase().match(/\.(png|jpg|jpeg|webp)$/) ? "image" : "pdf"),
      sizeLabel: input.sizeLabel ?? "Pending upload",
      addedLabel: "Just now",
      privateByDefault: true,
      versionLabel: "Latest",
    };

    setDocuments((current) => [document, ...current]);
    setModal(null);
  }

  async function previewDocument(document: RecordDocument) {
    if (!isLocalDemo) {
      try {
        const signedUrl = document.signedUrl ?? await createProductionDocumentSignedUrl(document.id);
        setDocuments((current) =>
          current.map((item) => (item.id === document.id ? { ...item, signedUrl } : item)),
        );
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      } catch (error) {
        handleProductionError(error);
      }
      return;
    }

    setModal({
      title: document.title,
      type: "record-detail",
      titleText: document.title,
      body: `${document.fileType.toUpperCase()} preview placeholder. This file stays private unless you explicitly share it later.`,
    });
  }

  function createPetKit(input: {
    destination: string;
    endDate: string;
    notes: string;
    petIds: string[];
    startDate: string;
    templateId: string;
    title: string;
  }) {
    const template = kitTemplates.find((item) => item.id === input.templateId) ?? kitTemplates[0];
    const selectedPetIds = input.petIds.length > 0 ? input.petIds : [selectedPet.id];
    const kitId = `kit-${slugify(input.title || template.name)}-${Date.now()}`;
    const checklistItems = template.checklistItems.map((item, index) => ({
      ...item,
      id: `${kitId}-item-${index}`,
      completed: false,
      itemType: item.resourceUrl ? ("link" as const) : ("task" as const),
    }));
    const shouldCreateDocumentBundle = Boolean(input.startDate) && template.suggestedDocumentTypes.length > 0;
    const documentItems = shouldCreateDocumentBundle
      ? selectedPetIds.flatMap((petId) =>
          template.suggestedDocumentTypes.map((documentType) => {
            const latestMatch = findLatestDocumentForKitType(documents, petId, documentType);

            return {
              id: `${kitId}-${petId}-${documentType}`,
              completed: Boolean(latestMatch),
              petId,
              label: `${pets.find((pet) => pet.id === petId)?.name ?? "Pet"} ${kitDocumentTypeLabel(documentType)}`,
              documentId: latestMatch?.id,
              recordId: latestMatch?.recordId,
              recordType: latestMatch?.recordType,
              documentType,
              itemType: "document" as const,
            };
          }),
        )
      : [];
    const kit: PetKit = {
      id: kitId,
      title: input.title || (template.id === "template-blank" ? "Custom list" : `${template.name} list`),
      destination: input.destination || undefined,
      startDate: input.startDate || undefined,
      endDate: input.endDate || input.startDate || undefined,
      petIds: selectedPetIds,
      sourceTemplateId: template.id,
      checklistItems: [...checklistItems, ...documentItems],
      documentLinks: [],
      notes: input.notes,
    };

    setPetKits((current) => [kit, ...current]);
    setModal({ title: "Lists & kits", type: "lists-kits", pet: selectedPet, kitId: kit.id, allPets: true });
  }

  function updatePetKit(input: {
    destination: string;
    endDate: string;
    notes: string;
    petIds: string[];
    startDate: string;
    title: string;
    tripId: string;
  }) {
    const selectedPetIds = input.petIds.length > 0 ? input.petIds : [selectedPet.id];

    setPetKits((current) =>
      current.map((trip) =>
        trip.id === input.tripId
          ? {
              ...trip,
              destination: input.destination || undefined,
              endDate: input.endDate || input.startDate || undefined,
              notes: input.notes,
              petIds: selectedPetIds,
              startDate: input.startDate || undefined,
              title: input.title.trim() || trip.title,
            }
          : trip,
      ),
    );

    const pet = pets.find((item) => item.id === selectedPetIds[0]) ?? selectedPet;
    setModal({ title: "Lists & kits", type: "lists-kits", pet, kitId: input.tripId, allPets: true });
  }

  function deletePetKit(tripId: string) {
    setPetKits((current) => current.filter((trip) => trip.id !== tripId));
    setModal({ title: "Lists & kits", type: "lists-kits", pet: selectedPet, allPets: true });
  }

  function toggleKitChecklistItem(tripId: string, itemId: string) {
    setPetKits((current) =>
      current.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              checklistItems: trip.checklistItems.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item,
              ),
              documentLinks: trip.documentLinks.map((link) =>
                link.id === itemId ? { ...link, completed: !kitDocumentResolved(link), status: kitDocumentResolved(link) ? "missing" : "attached" } : link,
              ),
            }
          : trip,
      ),
    );
  }

  function removeKitChecklistItem(tripId: string, itemId: string) {
    setPetKits((current) =>
      current.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              checklistItems: trip.checklistItems.filter((item) => item.id !== itemId),
              documentLinks: trip.documentLinks.filter((link) => link.id !== itemId),
            }
          : trip,
      ),
    );
    reopenKitModal(tripId);
  }

  function addKitChecklistItem(input: KitChecklistItemInput & { tripId: string }) {
    const label = input.label.trim();
    if (!label) return;

    setPetKits((current) =>
      current.map((trip) =>
        trip.id === input.tripId
          ? {
              ...trip,
              checklistItems: [
                ...trip.checklistItems,
                {
                  id: `travel-item-${Date.now()}`,
                  label,
                  completed: false,
                  documentType: input.itemType === "document" ? input.documentType : undefined,
                  itemType: input.itemType,
                  petId: input.itemType === "document" ? input.petId : undefined,
                  resourceLabel: input.resourceLabel.trim(),
                  resourceUrl: input.resourceUrl.trim(),
                },
              ],
            }
          : trip,
      ),
    );
  }

  function attachKitItemDocument(tripId: string, itemId: string, documentId: string) {
    const document = documents.find((item) => item.id === documentId);
    if (!document) return;

    setPetKits((current) =>
      current.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              checklistItems: trip.checklistItems.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      completed: true,
                      documentId: document.id,
                      petId: document.petId,
                      recordId: document.recordId,
                      recordType: document.recordType,
                    }
                  : item,
              ),
              documentLinks: trip.documentLinks.map((link) =>
                link.id === itemId
                  ? {
                      ...link,
                      completed: true,
                      documentId: document.id,
                      petId: document.petId,
                      recordId: document.recordId,
                      recordType: document.recordType,
                      status: kitResolvedStatus(link, trip),
                    }
                  : link,
              ),
            }
          : trip,
      ),
    );
  }

  async function uploadKitItemDocument(tripId: string, itemId: string, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    const trip = petKits.find((item) => item.id === tripId);
    const checklistItem = trip?.checklistItems.find((item) => item.id === itemId);
    const documentLink = trip?.documentLinks.find((item) => item.id === itemId);
    const itemPetId = checklistItem?.petId ?? documentLink?.petId ?? trip?.petIds[0] ?? selectedPet.id;
    if (!trip) return;

    const timestamp = Date.now();
    let document: RecordDocument;

    if (!isLocalDemo) {
      try {
        document = await uploadPersistentDocument({
          documentType: checklistItem?.documentType ?? documentLink?.documentType ?? "general",
          file,
          petId: itemPetId,
          title: file.name,
        });
      } catch (error) {
        handleProductionError(error);
        return;
      }
    } else {
      document = {
        addedLabel: "Just now",
        createdAt: new Date(timestamp).toISOString(),
        documentGroupId: `kit:${tripId}:${itemId}`,
        fileType: file.type === "application/pdf" ? "pdf" : "image",
        id: `doc-kit-item-${itemId}-${timestamp}`,
        petId: itemPetId,
        privateByDefault: true,
        recordId: itemPetId,
        recordType: "pet",
        sizeLabel: formatFileSize(file.size),
        title: file.name,
        versionLabel: "Latest",
      };
    }

    setDocuments((current) => [document, ...current]);
    setPetKits((current) =>
      current.map((kit) =>
        kit.id === tripId
          ? {
              ...kit,
              checklistItems: kit.checklistItems.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      completed: true,
                      documentId: document.id,
                      itemType: "document",
                      petId: document.petId,
                      recordId: document.recordId,
                      recordType: document.recordType,
                    }
                  : item,
              ),
              documentLinks: kit.documentLinks.map((link) =>
                link.id === itemId
                  ? {
                      ...link,
                      completed: true,
                      documentId: document.id,
                      petId: document.petId,
                      recordId: document.recordId,
                      recordType: document.recordType,
                      status: kitResolvedStatus(link, kit),
                    }
                  : link,
              ),
            }
          : kit,
      ),
    );
  }

  function resetKit(tripId: string) {
    setPetKits((current) =>
      current.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              checklistItems: trip.checklistItems.map((item) => ({ ...item, completed: false })),
              documentLinks: trip.documentLinks.map((link) => ({ ...link, completed: false })),
            }
          : trip,
      ),
    );
    reopenKitModal(tripId);
  }

  function attachKitDocument(tripId: string, documentLinkId: string, documentId: string) {
    const document = documents.find((item) => item.id === documentId);
    if (!document) return;

    setPetKits((current) =>
      current.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              documentLinks: trip.documentLinks.map((link) =>
                link.id === documentLinkId
                  ? {
                      ...link,
                      documentId: document.id,
                      recordId: document.recordId,
                      recordType: document.recordType,
                      status: kitResolvedStatus(link, trip),
                    }
                  : link,
              ),
              checklistItems: completeRelatedKitChecklistItem(trip.checklistItems, trip.documentLinks.find((link) => link.id === documentLinkId)),
            }
          : trip,
      ),
    );
  }

  async function uploadKitDocument(tripId: string, documentLinkId: string, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    const trip = petKits.find((item) => item.id === tripId);
    const link = trip?.documentLinks.find((item) => item.id === documentLinkId);
    if (!trip || !link) return;

    const timestamp = Date.now();
    let document: RecordDocument;

    if (!isLocalDemo) {
      try {
        document = await uploadPersistentDocument({
          documentType: link.documentType,
          file,
          petId: link.petId,
          title: file.name,
        });
      } catch (error) {
        handleProductionError(error);
        return;
      }
    } else {
      const recordType = link.recordType ?? "pet";
      const recordId = link.recordId ?? link.petId;
      document = {
        addedLabel: "Just now",
        createdAt: new Date(timestamp).toISOString(),
        documentGroupId: link.documentId
          ? documents.find((item) => item.id === link.documentId)?.documentGroupId ?? `kit:${tripId}:${documentLinkId}`
          : `kit:${tripId}:${documentLinkId}`,
        fileType: file.type === "application/pdf" ? "pdf" : "image",
        id: `doc-kit-${documentLinkId}-${timestamp}`,
        petId: link.petId,
        privateByDefault: true,
        recordId,
        recordType,
        sizeLabel: formatFileSize(file.size),
        title: file.name,
        versionLabel: "Latest",
      };
    }

    setDocuments((current) => [document, ...current]);
    setPetKits((current) =>
      current.map((item) =>
        item.id === tripId
          ? {
              ...item,
              documentLinks: item.documentLinks.map((currentLink) =>
                currentLink.id === documentLinkId
                  ? {
                      ...currentLink,
                      documentId: document.id,
                      recordId: document.recordId,
                      recordType: document.recordType,
                      status: kitResolvedStatus(currentLink, item),
                    }
                  : currentLink,
              ),
              checklistItems: completeRelatedKitChecklistItem(item.checklistItems, link),
            }
          : item,
      ),
    );
  }

  function addKitDocumentLink(tripId: string, input: KitDocumentItemInput) {
    const label = input.label.trim();
    if (!label) return;

    setPetKits((current) =>
      current.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              documentLinks: [
                ...trip.documentLinks,
                {
                  id: `kit-document-${Date.now()}`,
                  petId: input.petId,
                  label,
                  documentType: input.documentType,
                  status: "missing",
                  expiresOn: input.expiresOn || undefined,
                  renewalLeadDays: defaultKitRenewalLeadDays(input.documentType),
                },
              ],
            }
          : trip,
      ),
    );
    reopenKitModal(tripId);
  }

  function updateKitDocumentLink(tripId: string, linkId: string, input: KitDocumentItemInput) {
    const label = input.label.trim();
    if (!label) return;

    setPetKits((current) =>
      current.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              documentLinks: trip.documentLinks.map((link) =>
                link.id === linkId
                  ? {
                      ...link,
                      petId: input.petId,
                      label,
                      documentType: input.documentType,
                      expiresOn: input.expiresOn || undefined,
                      renewalLeadDays: defaultKitRenewalLeadDays(input.documentType),
                    }
                  : link,
              ),
            }
          : trip,
      ),
    );
    reopenKitModal(tripId);
  }

  function removeKitDocumentLink(tripId: string, linkId: string) {
    setPetKits((current) =>
      current.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              documentLinks: trip.documentLinks.filter((link) => link.id !== linkId),
            }
          : trip,
      ),
    );
    reopenKitModal(tripId);
  }

  function reopenKitModal(tripId: string) {
    const trip = petKits.find((item) => item.id === tripId);
    const pet = pets.find((item) => item.id === trip?.petIds[0]) ?? selectedPet;
    setModal({ title: "Lists & kits", type: "lists-kits", pet, kitId: tripId, allPets: true });
  }

  function handleTaskPrimary(task: Task) {
    if (task.type === "vaccine") {
      openRecordsForPet(task.petId);
      return;
    }

    if (task.type === "measurement") {
      setModal({ title: "Log measurements", type: "weight", task });
      return;
    }

    logTask(task);
  }

  function handleTaskBackdate(task: Task) {
    if (task.type === "measurement") {
      setModal({ title: "Log measurements", type: "weight", task });
      return;
    }

    if (task.type === "medication" || task.type === "refill") {
      setModal({ title: task.type === "refill" ? "Log refill date" : "Log dose date", type: "medication", task, petId: task.petId });
      return;
    }

    setModal({ title: "Log for another date", type: "log-task", task, mode: "change-date" });
  }

  function openAttentionTask(task: Task) {
    setSelectedPetId(task.petId);
    setActiveTab(task.type === "vaccine" ? "records" : "calendar");
    setShowNotifications(false);
  }

  function openKitPrep(item: KitPrepItem) {
    const pet = pets.find((currentPet) => currentPet.id === item.petIds[0]) ?? selectedPet;
    setSelectedPetId(pet.id);
    setShowNotifications(false);
    setModal({ title: "Lists & kits", type: "lists-kits", pet, kitId: item.tripId, allPets: true });
  }

  function openHealthSectionForPet(petId: string, sectionId: string) {
    setSelectedPetId(petId);
    setActiveTab("records");
    setShowNotifications(false);
    setModal(null);
    window.setTimeout(() => scrollToSection(sectionId), 80);
  }

  function openPetProfileSetup(petId: string) {
    const pet = pets.find((item) => item.id === petId) ?? selectedPet;
    setSelectedPetId(pet.id);
    setActiveTab("pets");
    setShowNotifications(false);
    setModal({ title: `Edit ${pet.name}'s profile`, type: "edit-pet", pet, section: "profile" });
  }

  function openPrimaryVetSetup(petId: string) {
    const pet = pets.find((item) => item.id === petId) ?? selectedPet;
    setSelectedPetId(pet.id);
    setActiveTab("pets");
    setShowNotifications(false);
    setModal({ title: "Manage care team", type: "change-vet", pet });
  }

  function openRoutineSetup(petId: string) {
    setSelectedPetId(petId);
    setActiveTab("calendar");
    setShowNotifications(false);
    setModal({ title: "Add care routine", type: "schedule-care", petId });
  }

  function openMedicationSetup(petId: string) {
    setSelectedPetId(petId);
    setActiveTab("records");
    setShowNotifications(false);
    setModal({ title: "Add medication", type: "medication", petId });
  }

  function openRecordUploadSetup(petId: string) {
    setSelectedPetId(petId);
    setActiveTab("records");
    setShowNotifications(false);
    setModal({ title: "Upload file", type: "upload-document", petId });
  }

  if (!onboardingDismissed && pets.length === 0 && archivedPets.length === 0) {
    return (
      <OnboardingView
        authEmail={authEmail}
        ownerProfile={ownerProfile}
        onSubmit={completeOnboarding}
      />
    );
  }

  if (pets.length === 0) {
    return (
      <main className="min-h-dvh bg-background px-5 py-8 text-foreground sm:px-8">
        <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-xl items-center">
          <div className="w-full rounded-lg border border-line bg-surface p-5 text-center shadow-sm sm:p-7">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
              <Dog aria-hidden className="h-6 w-6" />
            </span>
            <h1 className="mt-4 text-2xl font-semibold text-ink">No active pets</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Add a pet to continue using PawChart, or restore an archived pet.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                className="min-h-11 rounded-lg bg-ink px-4 text-sm font-semibold text-white"
                onClick={() => setModal({ title: "Add pet", type: "add-pet" })}
                type="button"
              >
                Add pet
              </button>
              <button
                className="min-h-11 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink"
                onClick={() => setModal({ title: "Edit profiles", type: "edit-profiles" })}
                type="button"
              >
                Edit profiles
              </button>
            </div>
            {isAuthenticated ? (
              <form action={signOut} className="mt-4">
                <button className="text-sm font-semibold text-muted underline" type="submit">
                  Sign out
                </button>
              </form>
            ) : null}
          </div>
        </section>
        <AppModal modal={modal} onClose={() => setModal(null)}>
          {modal?.type === "add-pet" && <AddPetForm onSubmit={addPet} />}
          {modal?.type === "edit-profiles" && (
            <EditProfilesPanel
              archivedPets={archivedPets}
              onArchive={(pet) => setModal({ title: `Archive ${pet.name}?`, type: "archive-pet", pet, returnToEditProfiles: true })}
              onDelete={(pet) => setModal({ title: `Delete ${pet.name}?`, type: "confirm-delete-pet", pet })}
              onRestore={(pet) => setModal({ title: `Restore ${pet.name}?`, type: "confirm-restore-pet", pet })}
              onViewArchived={(pet) => setModal({ title: pet.name, type: "archived-pet-detail", pet })}
              pets={pets}
            />
          )}
          {modal?.type === "archived-pet-detail" && (
            <ArchivedPetDetail
              documents={documents.filter((document) => document.petId === modal.pet.id)}
              measurements={measurements.filter((measurement) => measurement.petId === modal.pet.id)}
              onBack={() => setModal({ title: "Edit profiles", type: "edit-profiles" })}
              pet={modal.pet}
            />
          )}
          {modal?.type === "archive-pet" && (
            <ArchivePetForm
              onCancel={() => setModal({ title: "Edit profiles", type: "edit-profiles" })}
              onSubmit={(input) => void archivePet(modal.pet, input, { returnToEditProfiles: modal.returnToEditProfiles })}
              pet={modal.pet}
            />
          )}
          {modal?.type === "confirm-delete-pet" && (
            <ConfirmDeleteForm
              body="Delete this pet profile? Records and documents stay preserved internally during beta, but this pet will no longer appear in the app."
              confirmLabel="Delete profile"
              onCancel={() => setModal({ title: "Edit profiles", type: "edit-profiles" })}
              onConfirm={() => void deletePetProfile(modal.pet)}
            />
          )}
          {modal?.type === "confirm-restore-pet" && (
            <ConfirmDeleteForm
              body={`Restore ${modal.pet.name} to active pet profiles? They will appear in Home, Calendar, and Pets again.`}
              confirmLabel="Restore pet"
              onCancel={() => setModal({ title: "Edit profiles", type: "edit-profiles" })}
              onConfirm={() => void restorePet(modal.pet, { returnToEditProfiles: true })}
            />
          )}
        </AppModal>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] bg-background">
        <DesktopSidebar
          activeTab={activeTab}
          dataMode={resolvedAppMode}
          isAuthenticated={isAuthenticated}
          onAdd={() => setModal({ title: "Log something", type: "global-add" })}
          setActiveTab={setActiveTab}
        />

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <AppHeader
            activeTab={activeTab}
            authEmail={authEmail}
            isAuthenticated={isAuthenticated}
            logs={logs}
            onLogForDate={handleTaskBackdate}
            onCloseNotifications={() => setShowNotifications(false)}
            onOpenOwnerProfile={() => setModal({ title: "Your info", type: "owner-profile" })}
            onPrimary={handleTaskPrimary}
            onToggleNotifications={() => setShowNotifications((current) => !current)}
            onViewRecord={(task) => openRecordsForPet(task.petId)}
            openTasks={dueTasks}
            ownerProfile={ownerProfile}
            pets={pets}
            showNotifications={showNotifications}
          />

          <section className="flex-1 overflow-y-auto px-5 pb-28 pt-4 sm:px-8 lg:px-10 lg:pb-10 lg:pt-8">
            <div className="mx-auto w-full max-w-6xl">
              {activeTab === "home" && (
                <HomeView
                  documents={documents}
                  lastUndo={lastUndo}
                  logs={logs}
                  onAddMedicationSetup={openMedicationSetup}
                  onLogForDate={handleTaskBackdate}
                  onCreateKit={() =>
                    setModal({ title: "Create list", type: "create-kit", petId: selectedPet.id, templateId: "template-blank" })
                  }
                  onOpenAttentionTask={openAttentionTask}
                  onOpenKit={(kit) => {
                    const pet = pets.find((item) => item.id === kit.petIds[0]) ?? selectedPet;
                    setSelectedPetId(pet.id);
                    setModal({ title: "Lists & kits", type: "lists-kits", pet, kitId: kit.id, allPets: true });
                  }}
                  onOpenKitPrep={openKitPrep}
                  onOpenPetProfileSetup={openPetProfileSetup}
                  onOpenPrimaryVetSetup={openPrimaryVetSetup}
                  onOpenRecordUploadSetup={openRecordUploadSetup}
                  onOpenRoutineSetup={openRoutineSetup}
                  onOpenVaccineSetup={(petId) => openHealthSectionForPet(petId, "health-vaccines")}
                  onToggleKitItem={toggleKitChecklistItem}
                  onViewAllKits={() => setModal({ title: "Lists & kits", type: "lists-kits", pet: selectedPet, allPets: true })}
                  onPrimary={handleTaskPrimary}
                  onUndo={undoLog}
                  openTasks={dueTasks}
                  ownerProfile={ownerProfile}
                  pets={pets}
                  scheduledTasks={scheduledTasks}
                  petKits={petKits}
                  vaccines={vaccines}
                />
              )}
              {activeTab === "calendar" && (
                <CalendarView
                  logs={logs}
                  observations={observations}
                  onEditSchedule={(task) => setModal({ title: "Edit routine", type: "edit-schedule", task })}
                  onLogForDate={handleTaskBackdate}
                  onManageSchedule={() => setModal({ title: "Edit routines", type: "manage-schedule", petId: selectedPet.id })}
                  onPrimary={handleTaskPrimary}
                  onSchedule={(initialDueDate) =>
                    setModal({ title: "Add care routine", type: "schedule-care", petId: selectedPet.id, initialDueDate })
                  }
                  openTasks={scheduledTasks}
                  pets={pets}
                  selectedPet={selectedPet}
                  selectedPetId={selectedPetId}
                  setSelectedPetId={setSelectedPetId}
                  petKits={petKits}
                  vetProviders={vetProviders}
                  vetVisits={vetVisits}
                  vaccines={vaccines}
                />
              )}
              {activeTab === "pets" && (
                <PetsView
                  carryVetPrepItem={carryVetPrepItem}
                  dismissVetPrepItem={dismissVetPrepItem}
                  markVetPrepAddressed={markVetPrepAddressed}
                  measurements={measurements.filter((measurement) => measurement.petId === selectedPet.id)}
                  onAddPet={() => setModal({ title: "Add pet", type: "add-pet" })}
                  onAddVetNote={() => setModal({ title: "Add vet note", type: "add-vet-note", petId: selectedPet.id })}
                  onChangeVet={() => setModal({ title: "Manage care team", type: "change-vet", pet: selectedPet })}
                  onEditPet={(section) =>
                    setModal({
                      title:
                        section === "profile"
                          ? `Edit ${selectedPet.name}'s profile`
                          : section === "background"
                            ? `Edit ${selectedPet.name}'s background`
                          : section === "training"
                            ? "Edit training cues"
                            : section === "food"
                              ? `Edit ${selectedPet.name}'s food preferences`
                            : `Edit ${selectedPet.name}`,
                      type: "edit-pet",
                      pet: selectedPet,
                      section,
                    })
                  }
                  onManageSharing={() => setModal({ title: "Sharing and access", type: "sharing-access", pet: selectedPet })}
                  onEditProfiles={() => setModal({ title: "Edit profiles", type: "edit-profiles" })}
                  onPhotoChange={changePetPhoto}
                  onViewTrainingCues={() => setModal({ title: "Training cues", type: "training-cues", pet: selectedPet })}
                  onViewMeasurements={() => setModal({ title: "Measurements", type: "pet-measurements", petId: selectedPet.id })}
                  petAccessMembers={petAccessMembers.filter((member) => member.petId === selectedPet.id)}
                  pets={pets}
                  selectedPet={selectedPet}
                  selectedPetId={selectedPetId}
                  setSelectedPetId={setSelectedPetId}
                  shareLinks={shareLinks.filter((link) => link.petId === selectedPet.id)}
                  vetProviders={vetProviders}
                  vetPrepItems={vetPrepItems.filter((item) => item.petId === selectedPet.id)}
                />
              )}
              {activeTab === "records" && (
                <RecordsView
                  deleteVaccine={(vaccineId) => {
                    const vaccine = vaccines.find((item) => item.id === vaccineId);
                    if (vaccine) setModal({ title: "Delete vaccine?", type: "confirm-delete-vaccine", vaccine });
                  }}
                  documents={documents}
                  logs={logs}
                  observations={observations}
                  onAddObservation={() => setModal({ title: "Log observation", type: "add-observation", petId: selectedPet.id })}
                  onAddVaccine={() => setModal({ title: "Add vaccine", type: "add-vaccine", petId: selectedPet.id })}
                  onAddVetVisit={() => setModal({ title: "Log vet visit", type: "log-vet-visit", petId: selectedPet.id })}
                  onAttachDocuments={attachDocuments}
                  onEditVaccine={(vaccine) => setModal({ title: "Edit vaccine", type: "add-vaccine", petId: selectedPet.id, vaccine })}
                  onLogMedication={() => setModal({ title: "Add medication", type: "medication", petId: selectedPet.id })}
                  onPreviewDocument={(document) => void previewDocument(document)}
                  onRecordDetail={(titleText, body) => setModal({ title: titleText, type: "record-detail", titleText, body })}
                  onDeleteVetVisit={(visit) => setModal({ title: "Delete vet visit?", type: "confirm-delete-vet-visit", visit })}
                  onUndo={(logId) => {
                    const log = logs.find((item) => item.id === logId);
                    if (log) setModal({ title: "Undo this log?", type: "confirm-undo-log", log });
                  }}
                  onViewDocuments={() => setModal({ title: "All documents", type: "health-documents", petId: selectedPet.id })}
                  pets={pets}
                  selectedPet={selectedPet}
                  setSelectedPetId={setSelectedPetId}
                  vetProviders={vetProviders}
                  vetVisits={vetVisits}
                  vaccines={vaccines}
                />
              )}
            </div>
          </section>
        </div>

        <MobileNav
          activeTab={activeTab}
          onAdd={() => setModal({ title: "Log something", type: "global-add" })}
          setActiveTab={setActiveTab}
        />
      </div>

      <AppModal modal={modal} onClose={() => setModal(null)}>
        {modal?.type === "global-add" && (
          <GlobalAddMenu
            onSelect={(type) => {
              if (type === "care") setModal({ title: "Log care", type: "quick-care", petId: selectedPet.id });
              if (type === "observation") setModal({ title: "Log observation", type: "add-observation", petId: selectedPet.id });
              if (type === "vet") setModal({ title: "Log vet visit", type: "log-vet-visit", petId: selectedPet.id });
              if (type === "measurement") {
                setModal({
                  title: "Log measurements",
                  type: "weight",
                  task: createMeasurementTask(selectedPet.id),
                });
              }
              if (type === "document") setModal({ title: "Upload file", type: "upload-document", petId: selectedPet.id });
            }}
            pet={selectedPet}
          />
        )}
        {modal?.type === "add-pet" && <AddPetForm onSubmit={addPet} />}
        {modal?.type === "edit-pet" && (
          <EditPetSectionForm onSubmit={updatePet} pet={modal.pet} section={modal.section} />
        )}
        {modal?.type === "archive-pet" && (
          <ArchivePetForm
            onCancel={() => setModal(null)}
            onSubmit={(input) => void archivePet(modal.pet, input, { returnToEditProfiles: modal.returnToEditProfiles })}
            pet={modal.pet}
          />
        )}
        {modal?.type === "edit-profiles" && (
          <EditProfilesPanel
            archivedPets={archivedPets}
            onArchive={(pet) => setModal({ title: `Archive ${pet.name}?`, type: "archive-pet", pet, returnToEditProfiles: true })}
            onDelete={(pet) => setModal({ title: `Delete ${pet.name}?`, type: "confirm-delete-pet", pet })}
            onRestore={(pet) => setModal({ title: `Restore ${pet.name}?`, type: "confirm-restore-pet", pet })}
            onViewArchived={(pet) => setModal({ title: pet.name, type: "archived-pet-detail", pet })}
            pets={pets}
          />
        )}
        {modal?.type === "archived-pet-detail" && (
          <ArchivedPetDetail
            documents={documents.filter((document) => document.petId === modal.pet.id)}
            measurements={measurements.filter((measurement) => measurement.petId === modal.pet.id)}
            onBack={() => setModal({ title: "Edit profiles", type: "edit-profiles" })}
            pet={modal.pet}
          />
        )}
        {modal?.type === "confirm-delete-pet" && (
          <ConfirmDeleteForm
            body="Delete this pet profile? Records and documents stay preserved internally during beta, but this pet will no longer appear in the app."
            confirmLabel="Delete profile"
            onCancel={() => setModal({ title: "Edit profiles", type: "edit-profiles" })}
            onConfirm={() => void deletePetProfile(modal.pet)}
          />
        )}
        {modal?.type === "confirm-restore-pet" && (
          <ConfirmDeleteForm
            body={`Restore ${modal.pet.name} to active pet profiles? They will appear in Home, Calendar, and Pets again.`}
            confirmLabel="Restore pet"
            onCancel={() => setModal({ title: "Edit profiles", type: "edit-profiles" })}
            onConfirm={() => void restorePet(modal.pet, { returnToEditProfiles: true })}
          />
        )}
        {modal?.type === "add-vet-note" && (
          <VetPrepItemForm onSubmit={(input) => addVetPrepItem({ ...input, petId: modal.petId })} />
        )}
        {modal?.type === "add-observation" && (
          <ObservationForm onSubmit={(input) => addObservation({ ...input, petId: modal.petId })} />
        )}
        {modal?.type === "quick-care" && (
          <QuickCareForm
            careEvents={careEvents.filter((event) => event.petId === modal.petId)}
            onSubmit={(input) => {
              const event = careEvents.find((item) => item.id === input.careEventId);
              logTask(
                {
                  id: event?.id ?? `care-${Date.now()}`,
                  petId: modal.petId,
                  title: event?.label ?? (input.label || "Care"),
                  type: "care",
                  dueDate: todayValue,
                  dueLabel: "Ready",
                  actionLabel: "Log care",
                  cadence: "once",
                  reminderKind: "care",
                  notes: "",
                },
                { occurredOn: input.occurredOn, details: input.details },
              );
            }}
          />
        )}
        {modal?.type === "change-vet" && (
          <ManageCareTeamForm
            onAddProvider={() => setModal({ title: "Add vet or clinic", type: "add-vet", returnPetId: modal.pet.id })}
            onEditProvider={(provider) => setModal({ title: "Edit vet or clinic", type: "edit-vet", provider, returnPetId: modal.pet.id })}
            onSubmit={(input) => changePetVet({ petId: modal.pet.id, ...input })}
            pet={modal.pet}
            providers={vetProviders}
          />
        )}
        {modal?.type === "add-vet" && (
          <VetProviderForm
            onBack={modal.returnPetId ? () => {
              const pet = pets.find((item) => item.id === modal.returnPetId);
              if (pet) setModal({ title: "Manage care team", type: "change-vet", pet });
            } : undefined}
            onSubmit={(input) => addVetProvider(input, modal.returnPetId)}
          />
        )}
        {modal?.type === "edit-vet" && (
          <VetProviderForm
            onBack={modal.returnPetId ? () => {
              const pet = pets.find((item) => item.id === modal.returnPetId);
              if (pet) setModal({ title: "Manage care team", type: "change-vet", pet });
            } : undefined}
            onSubmit={(input) => void updateVetProvider({ ...modal.provider, ...input }, modal.returnPetId)}
            provider={modal.provider}
          />
        )}
        {modal?.type === "owner-profile" && (
          <OwnerProfileForm
            appMode={resolvedAppMode}
            authEmail={authEmail}
            isAuthenticated={isAuthenticated}
            ownerProfile={ownerProfile}
            onSubmit={updateOwnerProfile}
          />
        )}
        {modal?.type === "invite-member" && (
          <InviteMemberForm
            onSubmit={(input) => invitePetAccessMember({ ...input, petId: modal.pet.id })}
            pet={modal.pet}
          />
        )}
        {modal?.type === "log-vet-visit" && (
          <VetVisitForm
            onPrepAction={(action, itemId) => {
              if (action === "addressed") markVetPrepAddressed(itemId);
              if (action === "dismissed") dismissVetPrepItem(itemId);
              if (action === "carry") carryVetPrepItem(itemId);
            }}
            onSubmit={(input) => addVetVisit({ ...input, petId: modal.petId })}
            prepItems={vetPrepItems.filter((item) => item.petId === modal.petId && item.status === "open")}
            providers={vetProviders}
            selectedProviderId={pets.find((pet) => pet.id === modal.petId)?.primaryVetId}
          />
        )}
        {modal?.type === "add-vaccine" && (
          <AddVaccineForm
            onSubmit={(input) => addOrUpdateVaccine({ ...input, petId: modal.petId, id: modal.vaccine?.id })}
            vaccine={modal.vaccine}
          />
        )}
        {modal?.type === "add-care-type" && (
          <CareTypeForm onSubmit={(input) => addCareType({ ...input, petId: modal.petId })} />
        )}
        {modal?.type === "edit-care-type" && (
          <CareTypeForm
            careEvent={modal.event}
            onSubmit={(input) => updateCareType({ ...input, id: modal.event.id })}
          />
        )}
        {modal?.type === "confirm-delete-care-type" && (
          <ConfirmDeleteForm
            body={`Delete ${modal.event.label}? Existing logs stay in history, but this care type will no longer appear in Care.`}
            confirmLabel="Delete care type"
            onCancel={() => setModal(null)}
            onConfirm={() => {
              deleteCareEvent(modal.event.id);
              setModal(null);
            }}
          />
        )}
        {modal?.type === "confirm-delete-document" && (
          <ConfirmDeleteForm
            body={`Delete "${modal.document.title}"? This removes the document from this prototype. Records that referenced it will no longer show the file.`}
            confirmLabel="Delete document"
            onCancel={() => setModal(null)}
            onConfirm={() => {
              void deleteDocument(modal.document.id);
            }}
          />
        )}
        {modal?.type === "confirm-delete-schedule" && (
          <ConfirmDeleteForm
            body={`Delete "${modal.task.title}"? Past logs stay in history, but this routine will no longer appear in upcoming care.`}
            confirmLabel="Delete routine"
            onCancel={() => setModal(null)}
            onConfirm={() => {
              deleteScheduledTask(modal.task.id);
              setModal(null);
            }}
          />
        )}
        {modal?.type === "confirm-delete-vaccine" && (
          <ConfirmDeleteForm
            body={`Delete the ${modal.vaccine.name} vaccine record? Attached proof files stay in All documents for now.`}
            confirmLabel="Delete vaccine"
            onCancel={() => setModal(null)}
            onConfirm={() => {
              deleteVaccine(modal.vaccine.id);
              setModal(null);
            }}
          />
        )}
        {modal?.type === "confirm-delete-vet-visit" && (
          <ConfirmDeleteForm
            body={`Delete "${modal.visit.reason}"? Attached bill files stay in All documents for now.`}
            confirmLabel="Delete vet visit"
            onCancel={() => setModal(null)}
            onConfirm={() => {
              deleteVetVisit(modal.visit.id);
              setModal(null);
            }}
          />
        )}
        {modal?.type === "confirm-remove-access" && (
          <ConfirmDeleteForm
            body={`Remove ${modal.member.name}'s access to this pet? They will no longer see this pet profile in the prototype.`}
            confirmLabel="Remove access"
            onCancel={() => setModal(null)}
            onConfirm={() => {
              const pet = pets.find((item) => item.id === modal.member.petId) ?? selectedPet;
              removePetAccessMember(modal.member.id);
              setModal({ title: "Sharing and access", type: "sharing-access", pet });
            }}
          />
        )}
        {modal?.type === "confirm-revoke-share-link" && (
          <ConfirmDeleteForm
            body={`Revoke "${modal.link.label}"? Anyone with this public link should lose access once links are backed by live data.`}
            confirmLabel="Revoke link"
            onCancel={() => setModal(null)}
            onConfirm={() => {
              const pet = pets.find((item) => item.id === modal.link.petId) ?? selectedPet;
              revokeShareLink(modal.link.id);
              setModal({ title: "Sharing and access", type: "sharing-access", pet });
            }}
          />
        )}
        {modal?.type === "schedule-care" && (
          <ScheduleCareForm
            onSubmit={scheduleTask}
            pets={pets}
            providers={vetProviders}
            initialDueDate={modal.initialDueDate}
            selectedPetId={modal.petId}
          />
        )}
        {modal?.type === "manage-schedule" && (
          <ManageScheduleList
            onEdit={(task) => setModal({ title: "Edit routine", type: "edit-schedule", task })}
            onDelete={(task) => setModal({ title: "Delete routine?", type: "confirm-delete-schedule", task })}
            tasks={scheduledTasks.filter((task) => task.petId === modal.petId)}
          />
        )}
        {modal?.type === "edit-schedule" && (
          <ScheduleCareForm
            onSubmit={(input) => updateScheduledTask(modal.task.id, input)}
            pets={pets}
            providers={vetProviders}
            selectedPetId={modal.task.petId}
            task={modal.task}
          />
        )}
        {modal?.type === "log-task" && (
          <LogTaskForm
            mode={modal.mode}
            onSubmit={(input) => logTask(modal.task, input)}
            task={modal.task}
          />
        )}
        {modal?.type === "weight" && (
          <MeasurementForm onSubmit={(input) => void logMeasurement(modal.task, input)} task={modal.task} />
        )}
        {modal?.type === "medication" && (
          <MedicationForm
            documents={documents.filter(
              (document) =>
                document.recordType === "medication" && document.recordId === (modal.task?.id ?? "medication"),
            )}
            onAttachDocuments={(files) =>
              attachDocuments({
                files,
                petId: modal.petId,
                recordId: modal.task?.id ?? "medication",
                recordType: "medication",
              })
            }
            onSubmit={(input) =>
              logTask(
                modal.task ?? {
                  id: `medication-${Date.now()}`,
                  petId: modal.petId,
                  title: input.medication || "Medication",
                  type: "medication",
                  dueDate: input.occurredOn || todayValue,
                  dueLabel: "Logged",
                  actionLabel: "Log dose",
                  cadence: "once",
                  reminderKind: "medication",
                  notes: "",
                },
                input,
              )
            }
            onPreviewDocument={(document) => void previewDocument(document)}
            task={modal.task}
          />
        )}
        {modal?.type === "upload-document" && (
          <UploadDocumentForm onSubmit={(input) => void uploadDocument({ ...input, petId: modal.petId })} />
        )}
        {modal?.type === "rename-document" && (
          <RenameDocumentForm
            document={modal.document}
            onSubmit={(title) => renameDocument(modal.document.id, title)}
          />
        )}
        {modal?.type === "health-documents" && (
          <HealthDocumentsModal
            deleteDocument={(documentId) => {
              const document = documents.find((item) => item.id === documentId);
              if (document) setModal({ title: "Delete document?", type: "confirm-delete-document", document });
            }}
            documents={documents.filter((document) => document.petId === modal.petId)}
            onEditDocument={(document) => setModal({ title: "Rename document", type: "rename-document", document })}
            onPreviewDocument={(document) => void previewDocument(document)}
            onUploadDocument={() => setModal({ title: "Upload file", type: "upload-document", petId: modal.petId })}
          />
        )}
        {modal?.type === "pet-measurements" && (
          <MeasurementHistoryModal
            measurements={measurements.filter((measurement) => measurement.petId === modal.petId)}
            onLogMeasurements={() => setModal({ title: "Log measurements", type: "weight", task: createMeasurementTask(modal.petId) })}
          />
        )}
        {modal?.type === "lists-kits" && (
          <ListsKitsModal
            documents={documents}
            onAddChecklistItem={addKitChecklistItem}
            onAttachItemDocument={(trip, item) =>
              setModal({ title: "Attach existing document", type: "kit-attach-item-document", tripId: trip.id, item })
            }
            onAttachExistingDocument={(trip, link) =>
              setModal({ title: "Attach existing document", type: "kit-attach-document", tripId: trip.id, link })
            }
            onDeleteKit={(trip) => setModal({ title: "Delete list?", type: "confirm-delete-kit", trip })}
            onEditKit={(trip) => setModal({ title: "Edit list", type: "edit-kit", trip })}
            focusedKitId={modal.kitId}
            onCreateTrip={(templateId) => setModal({ title: "Create list", type: "create-kit", petId: modal.pet.id, templateId })}
            onPreviewDocument={(document) => void previewDocument(document)}
            onRemoveChecklistItem={(trip, item) =>
              setModal({ title: "Remove item?", type: "confirm-remove-kit-item", tripId: trip.id, itemId: item.id, label: item.label })
            }
            onResetKit={(trip) => setModal({ title: "Reset list?", type: "confirm-reset-kit", trip })}
            onToggleChecklistItem={toggleKitChecklistItem}
            onUploadItemDocument={uploadKitItemDocument}
            onUploadDocument={uploadKitDocument}
            allPets={modal.allPets}
            pets={pets}
            selectedPet={modal.pet}
            templates={kitTemplates}
            trips={modal.allPets ? petKits : petKits.filter((trip) => trip.petIds.includes(modal.pet.id))}
          />
        )}
        {modal?.type === "kit-attach-item-document" && (
          <KitAttachChecklistDocumentForm
            documents={documents.filter((document) =>
              document.petId === (modal.item.petId ?? petKits.find((kit) => kit.id === modal.tripId)?.petIds[0]),
            )}
            item={modal.item}
            onSubmit={(documentId) => {
              attachKitItemDocument(modal.tripId, modal.item.id, documentId);
              reopenKitModal(modal.tripId);
            }}
          />
        )}
        {modal?.type === "kit-attach-document" && (
          <KitAttachDocumentForm
            documents={documents.filter((document) => document.petId === modal.link.petId)}
            link={modal.link}
            onSubmit={(documentId) => {
              attachKitDocument(modal.tripId, modal.link.id, documentId);
              reopenKitModal(modal.tripId);
            }}
          />
        )}
        {modal?.type === "kit-document-item" && (
          <KitDocumentItemForm
            link={modal.link}
            onSubmit={(input) => {
              if (modal.link) {
                updateKitDocumentLink(modal.tripId, modal.link.id, input);
                return;
              }
              addKitDocumentLink(modal.tripId, input);
            }}
            pets={pets.filter((pet) => petKits.find((kit) => kit.id === modal.tripId)?.petIds.includes(pet.id))}
          />
        )}
        {modal?.type === "confirm-reset-kit" && (
          <ConfirmDeleteForm
            body="Reset this list? Attached documents and links stay saved."
            confirmLabel="Reset list"
            onCancel={() => reopenKitModal(modal.trip.id)}
            onConfirm={() => resetKit(modal.trip.id)}
          />
        )}
        {modal?.type === "confirm-remove-kit-document" && (
          <ConfirmDeleteForm
            body={`Remove "${modal.link.label}" from this list? The underlying document stays saved.`}
            confirmLabel="Remove item"
            onCancel={() => reopenKitModal(modal.tripId)}
            onConfirm={() => removeKitDocumentLink(modal.tripId, modal.link.id)}
          />
        )}
        {modal?.type === "create-kit" && (
          <CreatePetKitForm
            onSubmit={createPetKit}
            pets={pets}
            selectedPetId={modal.petId}
            templateId={modal.templateId}
            templates={kitTemplates}
          />
        )}
        {modal?.type === "edit-kit" && (
          <CreatePetKitForm
            kit={modal.trip}
            onSubmit={(input) => updatePetKit({ ...input, tripId: modal.trip.id })}
            pets={pets}
            selectedPetId={modal.trip.petIds[0] ?? selectedPet.id}
            templates={kitTemplates}
          />
        )}
        {modal?.type === "confirm-delete-kit" && (
          <ConfirmDeleteForm
            body="Delete this list? Attached documents stay saved in All documents."
            confirmLabel="Delete list"
            onCancel={() => reopenKitModal(modal.trip.id)}
            onConfirm={() => deletePetKit(modal.trip.id)}
          />
        )}
        {modal?.type === "confirm-remove-kit-item" && (
          <ConfirmDeleteForm
            body={`Remove "${modal.label}" from the list? Attached documents stay saved.`}
            confirmLabel="Remove item"
            onCancel={() => reopenKitModal(modal.tripId)}
            onConfirm={() => removeKitChecklistItem(modal.tripId, modal.itemId)}
          />
        )}
        {modal?.type === "sharing-access" && (
          <SharingAccessDetails
            copiedShareLinkId={copiedShareLinkId}
            documents={documents.filter((document) => document.petId === modal.pet.id)}
            members={petAccessMembers.filter((member) => member.petId === modal.pet.id)}
            onCopyShareLink={copyShareLink}
            onCreateSharePacket={() => setModal({ title: "Create packet", type: "create-share-packet", pet: modal.pet })}
            onInviteMember={() => setModal({ title: "Invite member", type: "invite-member", pet: modal.pet })}
            onRemoveMember={(member) => setModal({ title: "Remove access?", type: "confirm-remove-access", member })}
            onRevokeShareLink={(link) => setModal({ title: "Revoke link?", type: "confirm-revoke-share-link", link })}
            onShowQr={(link) => setModal({ title: "Vaccination link QR", type: "share-link-qr", link })}
            onUpdateMemberRole={updatePetAccessRole}
            pet={modal.pet}
            shareLinks={shareLinks.filter((link) => link.petId === modal.pet.id)}
          />
        )}
        {modal?.type === "share-link-qr" && (
          <ShareLinkQrDetails link={modal.link} />
        )}
        {modal?.type === "create-share-packet" && (
          <SharePacketForm
            documents={documents.filter((document) => document.petId === modal.pet.id)}
            onSubmit={(input) => void createSharePacket({ ...input, petId: modal.pet.id })}
            pet={modal.pet}
          />
        )}
        {modal?.type === "training-cues" && (
          <TrainingCueDetails cues={modal.pet.trainingCues ?? []} petName={modal.pet.name} />
        )}
        {modal?.type === "record-detail" && (
          <RecordDetail titleText={modal.titleText} body={modal.body} />
        )}
        {modal?.type === "confirm-undo-log" && (
          <ConfirmDeleteForm
            body={`Undo "${modal.log.title}" from ${modal.log.createdLabel}? This removes the history log and restores the due item or routine state when available.`}
            confirmLabel="Undo log"
            onCancel={() => setModal(null)}
            onConfirm={() => {
              undoLog(modal.log.id);
              setModal(null);
            }}
          />
        )}
      </AppModal>
    </main>
  );
}

function OnboardingView({
  authEmail,
  onSubmit,
  ownerProfile,
}: {
  authEmail: string | null;
  onSubmit: (input: OnboardingInput) => void;
  ownerProfile: OwnerProfile;
}) {
  return (
    <main className="min-h-dvh bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-3xl items-center">
        <div className="w-full rounded-lg border border-white/70 bg-surface p-5 shadow-[0_18px_60px_rgba(68,52,42,0.08)] sm:p-7">
          <div className="mb-6">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-ink text-white">
              <Dog aria-hidden className="h-6 w-6" />
            </span>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{brand.appName}</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-ink">Set up your first pet</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Add only the basics now. PawChart will create a short Complete later list for vaccines, vet info, microchip, food preferences, and routines.
            </p>
          </div>

          <form className="space-y-5" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const photoInput = event.currentTarget.elements.namedItem("petPhoto") as HTMLInputElement | null;
            const weightUnit = String(form.get("weightUnit") || "lb") === "kg" ? "kg" : "lb";
            const weightValue = String(form.get("weightValue") || "");
            onSubmit({
              ageLabel: String(form.get("ageLabel") || ""),
              breed: String(form.get("breed") || ""),
              city: String(form.get("city") || ""),
              dateOfBirth: String(form.get("dateOfBirth") || ""),
              email: String(form.get("email") || ""),
              firstName: String(form.get("firstName") || ""),
              petName: String(form.get("petName") || ""),
              photoFile: photoInput?.files?.[0] ?? null,
              species: String(form.get("species") || "dog") as PetSpecies,
              weight: formatWeightDisplay(weightValue, weightUnit),
              weightUnit,
              weightValue,
            });
          }}>
            <section className="grid gap-3 sm:grid-cols-3">
              <FormField defaultValue={ownerProfile.firstName} label="Your first name" name="firstName" required />
              <FormField defaultValue={authEmail ?? ownerProfile.email} label="Email" name="email" type="email" />
              <FormField defaultValue={ownerProfile.city} label="City" name="city" />
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <FormField label="Pet name" name="petName" required />
              <SelectField defaultValue="dog" label="Pet type" name="species">
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
              </SelectField>
              <FormField label="Birth date" name="dateOfBirth" type="date" />
              <FormField label="Breed" name="breed" />
              <WeightInputFields label="Weight" />
            </section>

            <PhotoFileField label="Pet photo" name="petPhoto" />

            <p className="rounded-lg bg-background p-3 text-sm leading-6 text-muted">
              Start with the profile now. After this pet is created, you can upload vaccine, vet, and other records from Home or Health.
            </p>

            <SubmitButton label="Start PawChart" />
          </form>
        </div>
      </section>
    </main>
  );
}

function ProductionSignInView() {
  return (
    <main className="min-h-dvh bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-lg items-center">
        <div className="w-full rounded-lg border border-white/70 bg-surface p-5 shadow-[0_18px_60px_rgba(68,52,42,0.08)] sm:p-7">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-ink text-white">
            <Dog aria-hidden className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{brand.appName}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-ink">Sign in to start</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Production accounts use authenticated pet records. The local demo playground is available only while developing on your machine.
          </p>
          <form action={signInWithGoogle} className="mt-5">
            <button className="min-h-12 w-full rounded-lg bg-ink px-4 text-sm font-semibold text-white" type="submit">
              Continue with Google
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function DesktopSidebar({
  activeTab,
  dataMode,
  isAuthenticated,
  onAdd,
  setActiveTab,
}: {
  activeTab: Tab;
  dataMode: PawChartDataMode;
  isAuthenticated: boolean;
  onAdd: () => void;
  setActiveTab: (tab: Tab) => void;
}) {
  const isLocalDemo = dataMode === "local-demo";

  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 border-r border-white/70 bg-surface/80 px-5 py-6 shadow-[20px_0_60px_rgba(68,52,42,0.06)] backdrop-blur lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-2">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-ink text-white">
          <Dog aria-hidden className="h-6 w-6" />
        </span>
        <div>
          <p className="text-lg font-semibold leading-none text-ink">{brand.appName}</p>
          <p className="mt-1 text-sm text-muted">{brand.tagline}</p>
        </div>
      </div>

      <button
        className="mt-7 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(23,23,21,0.18)] active:scale-[0.99]"
        onClick={onAdd}
        type="button"
      >
        <Plus aria-hidden className="h-5 w-5" />
        Log
      </button>

      <nav className="mt-5 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;

          return (
            <button
              aria-current={selected ? "page" : undefined}
              className={cn(
                "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition",
                selected ? "bg-ink text-white shadow-sm" : "text-muted hover:bg-background hover:text-ink",
              )}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <Icon aria-hidden className="h-5 w-5" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-line bg-background/80 p-4">
        <p className="text-sm font-semibold text-ink">
          {isLocalDemo ? "Local demo data" : isAuthenticated ? "Signed in" : "Sign in required"}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          {isLocalDemo
            ? "Full mock feature playground is active only in local development."
            : "Production uses authenticated Supabase records and does not initialize demo pets or documents."}
        </p>
        {!isAuthenticated && isLocalDemo ? (
          <form action={signInWithGoogle} className="mt-3">
            <button className="min-h-11 w-full rounded-lg bg-ink px-3 text-sm font-semibold text-white" type="submit">
              Continue with Google
            </button>
          </form>
        ) : null}
      </div>
    </aside>
  );
}

function MobileNav({
  activeTab,
  onAdd,
  setActiveTab,
}: {
  activeTab: Tab;
  onAdd: () => void;
  setActiveTab: (tab: Tab) => void;
}) {
  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/70 bg-surface/90 px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 shadow-[0_-16px_50px_rgba(68,52,42,0.12)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-5 items-end gap-1">
        {leftTabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;

          return (
            <button
              aria-current={selected ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition",
                selected ? "bg-primary/10 text-primary" : "text-muted active:bg-primary/5",
              )}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <Icon aria-hidden className="h-5 w-5" strokeWidth={2.2} />
              {tab.label}
            </button>
          );
        })}
        <button
          aria-label="Log"
          className="mx-auto -mt-7 grid h-16 w-16 place-items-center rounded-full bg-ink text-white shadow-[0_16px_34px_rgba(23,23,21,0.25)] active:scale-[0.98]"
          onClick={onAdd}
          type="button"
        >
          <Plus aria-hidden className="h-7 w-7" />
        </button>
        {rightTabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;

          return (
            <button
              aria-current={selected ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition",
                selected ? "bg-primary/10 text-primary" : "text-muted active:bg-primary/5",
              )}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <Icon aria-hidden className="h-5 w-5" strokeWidth={2.2} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function AppHeader({
  activeTab,
  authEmail,
  isAuthenticated,
  logs,
  onLogForDate,
  onCloseNotifications,
  onOpenOwnerProfile,
  onPrimary,
  onToggleNotifications,
  onViewRecord,
  openTasks,
  ownerProfile,
  pets,
  showNotifications,
}: {
  activeTab: Tab;
  authEmail: string | null;
  isAuthenticated: boolean;
  logs: LogEntry[];
  onLogForDate: (task: Task) => void;
  onCloseNotifications: () => void;
  onOpenOwnerProfile: () => void;
  onPrimary: (task: Task) => void;
  onToggleNotifications: () => void;
  onViewRecord: (task: Task) => void;
  openTasks: Task[];
  ownerProfile: OwnerProfile;
  pets: Pet[];
  showNotifications: boolean;
}) {
  const label = tabs.find((tab) => tab.id === activeTab)?.label ?? "Home";
  const ownerInitials = `${ownerProfile.firstName.charAt(0)}${ownerProfile.lastName.charAt(0)}`.trim() || "Me";
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showNotifications) return;

    function handlePointerDown(event: MouseEvent) {
      if (notificationsRef.current?.contains(event.target as Node)) return;
      onCloseNotifications();
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [onCloseNotifications, showNotifications]);

  return (
    <header className="sticky top-0 z-10 border-b border-line/70 bg-background/92 px-5 pb-3 pt-[max(env(safe-area-inset-top),16px)] backdrop-blur sm:px-8 lg:px-10 lg:pb-5 lg:pt-6">
      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary lg:hidden">
            {brand.appName}
          </p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight text-ink lg:mt-0 lg:text-4xl">
            {label}
          </h1>
          <p className="mt-2 hidden text-sm text-muted lg:block">
            Keep each pet&apos;s care current without extra admin work.
          </p>
        </div>
        <div className="flex items-center gap-2" ref={notificationsRef}>
          {!isAuthenticated ? (
            <form action={signInWithGoogle}>
              <button
                className="min-h-11 rounded-full bg-ink px-4 text-sm font-semibold text-white shadow-sm active:scale-[0.98]"
                type="submit"
              >
                Sign in
              </button>
            </form>
          ) : null}
          <button
            aria-label="Notifications"
            className="relative grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-ink shadow-sm active:scale-[0.98]"
            onClick={onToggleNotifications}
            type="button"
          >
            <Bell aria-hidden className="h-5 w-5" />
            {openTasks.length > 0 ? (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">
                {openTasks.length}
              </span>
            ) : null}
          </button>
          <button
            aria-label={isAuthenticated ? `Your info${authEmail ? `, ${authEmail}` : ""}` : "Your info"}
            className="grid h-11 min-w-11 place-items-center rounded-full border border-line bg-surface px-3 text-sm font-semibold text-ink shadow-sm active:scale-[0.98]"
            onClick={onOpenOwnerProfile}
            title="Your info"
            type="button"
          >
            {ownerInitials}
          </button>
          {showNotifications ? (
            <NotificationPanel
              logs={logs}
              onLogForDate={onLogForDate}
              onPrimary={onPrimary}
              onViewRecord={onViewRecord}
              openTasks={openTasks}
              pets={pets}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}

function NotificationPanel({
  logs,
  onLogForDate,
  onPrimary,
  onViewRecord,
  openTasks,
  pets,
}: {
  logs: LogEntry[];
  onLogForDate: (task: Task) => void;
  onPrimary: (task: Task) => void;
  onViewRecord: (task: Task) => void;
  openTasks: Task[];
  pets: Pet[];
}) {
  return (
    <div className="absolute right-0 top-14 z-30 w-[min(380px,calc(100vw-40px))] rounded-lg border border-line bg-surface p-4 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
          Notifications
        </h2>
        <StatusPill status={`${openTasks.length} due`} />
      </div>
      <div className="mt-4 space-y-3">
        {openTasks.map((task) => {
          const pet = pets.find((item) => item.id === task.petId);
          return (
            <div className="rounded-lg bg-background p-3" key={task.id}>
              <p className="text-sm font-semibold text-ink">
                {pet?.name ?? "Pet"}: {task.title}
              </p>
              <p className="mt-1 text-sm text-muted">{task.dueLabel}</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <SmallButton label="Done" onClick={() => onPrimary(task)} />
                <SmallButton label="Log date" onClick={() => onLogForDate(task)} />
                <SmallButton label="View" onClick={() => onViewRecord(task)} />
              </div>
            </div>
          );
        })}
        {logs.slice(0, 2).map((log) => (
          <div className="rounded-lg bg-background p-3" key={log.id}>
            <p className="text-sm font-semibold text-ink">{log.title} logged</p>
            <p className="mt-1 text-sm text-muted">{log.createdLabel}</p>
          </div>
        ))}
        {openTasks.length === 0 && logs.length === 0 ? (
          <p className="text-sm leading-6 text-muted">No new notifications.</p>
        ) : null}
      </div>
    </div>
  );
}

function HomeView({
  documents,
  lastUndo,
  logs,
  onAddMedicationSetup,
  onCreateKit,
  onLogForDate,
  onOpenAttentionTask,
  onOpenKit,
  onOpenKitPrep,
  onOpenPetProfileSetup,
  onOpenPrimaryVetSetup,
  onOpenRecordUploadSetup,
  onOpenRoutineSetup,
  onOpenVaccineSetup,
  onToggleKitItem,
  onViewAllKits,
  onPrimary,
  onUndo,
  openTasks,
  ownerProfile,
  pets,
  scheduledTasks,
  petKits,
  vaccines,
}: {
  documents: RecordDocument[];
  lastUndo: LogEntry | null;
  logs: LogEntry[];
  onAddMedicationSetup: (petId: string) => void;
  onCreateKit: () => void;
  onLogForDate: (task: Task) => void;
  onOpenAttentionTask: (task: Task) => void;
  onOpenKit: (kit: PetKit) => void;
  onOpenKitPrep: (item: KitPrepItem) => void;
  onOpenPetProfileSetup: (petId: string) => void;
  onOpenPrimaryVetSetup: (petId: string) => void;
  onOpenRecordUploadSetup: (petId: string) => void;
  onOpenRoutineSetup: (petId: string) => void;
  onOpenVaccineSetup: (petId: string) => void;
  onToggleKitItem: (kitId: string, itemId: string) => void;
  onViewAllKits: () => void;
  onPrimary: (task: Task) => void;
  onUndo: (logId: string) => void;
  openTasks: Task[];
  ownerProfile: OwnerProfile;
  pets: Pet[];
  scheduledTasks: Task[];
  petKits: PetKit[];
  vaccines: VaccineRecord[];
}) {
  const overdueTasks = openTasks
    .filter((task) => task.dueDate < todayValue)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const dueTodayTasks = openTasks
    .filter((task) => task.dueDate === todayValue)
    .sort((a, b) => a.title.localeCompare(b.title));
  const todaysLogs = logs.filter((log) => log.occurredOn === todayValue);
  const attentionTasks = getHomeAttentionTasks(scheduledTasks, vaccines);
  const travelPrepItems = getKitPrepItems(petKits)
    .filter((item) => item.endDate >= todayValue && item.date <= addDays(todayValue, 28))
    .sort((a, b) => a.date.localeCompare(b.date));
  const duePets = pets.filter((pet) => openTasks.some((task) => task.petId === pet.id));
  const homeSummary =
    openTasks.length === 0
      ? "Everything is current across your pets."
      : overdueTasks.length > 0
        ? `${overdueTasks.length} overdue and ${dueTodayTasks.length} due today across your pets.`
        : duePets.length > 1
          ? `${dueTodayTasks.length} items are due today across your pets.`
          : `${duePets[0]?.name ?? "Your pet"} has ${dueTodayTasks.length} ${dueTodayTasks.length === 1 ? "item" : "items"} due today.`;
  const getStartedItems = getHomeGetStartedItems({
    documents,
    onAddMedicationSetup,
    onCreateKit,
    onOpenPetProfileSetup,
    onOpenPrimaryVetSetup,
    onOpenRecordUploadSetup,
    onOpenRoutineSetup,
    onOpenVaccineSetup,
    petKits,
    pets,
    scheduledTasks,
    vaccines,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/70 bg-surface/85 px-5 py-5 shadow-[0_18px_60px_rgba(68,52,42,0.08)] backdrop-blur lg:px-8 lg:py-7">
        <div className="min-w-0">
          <p className="text-sm text-muted">{formatLongDate(todayValue)}</p>
          <h2 className="mt-2 text-3xl font-semibold leading-tight text-ink lg:text-5xl">
            {ownerProfile.firstName ? `Hello, ${ownerProfile.firstName}` : "Hello"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">{homeSummary}</p>
        </div>
      </section>

      {getStartedItems.length > 0 ? <HomeGetStartedChecklist items={getStartedItems} /> : null}

      {lastUndo ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
            <Check aria-hidden className="h-4 w-4" />
          </span>
          <p className="min-w-0 flex-1 text-sm font-medium text-ink">
            {lastUndo.title} logged for {lastUndo.createdLabel}
          </p>
          <button
            className="min-h-10 rounded-lg px-3 text-sm font-semibold text-primary"
            onClick={() => onUndo(lastUndo.id)}
            type="button"
          >
            <Undo2 aria-hidden className="mr-1 inline h-4 w-4" />
            Undo
          </button>
        </div>
      ) : null}

      {overdueTasks.length > 0 ? (
        <HomeTaskSection
          onLogForDate={onLogForDate}
          onPrimary={onPrimary}
          pets={pets}
          tasks={overdueTasks}
          title="Overdue"
        />
      ) : null}

      <HomeTaskSection
        emptyText="No care items are due today."
        onLogForDate={onLogForDate}
        onPrimary={onPrimary}
        pets={pets}
        tasks={dueTodayTasks}
        title="Due today"
      />

      <section className="space-y-3">
        <SectionTitle title="Recently logged" />
        <div className="rounded-lg border border-line bg-surface p-4 lg:p-5">
          {todaysLogs.length === 0 ? (
            <p className="text-sm leading-6 text-muted">
              Logs completed today will appear here briefly with undo.
            </p>
          ) : (
            <div className="divide-y divide-line">
              {todaysLogs.slice(0, 4).map((log) => (
                <HomeRecentLogRow key={log.id} log={log} onUndo={onUndo} pets={pets} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle title="Needs attention" />
        <div className="rounded-lg border border-line bg-surface p-4 lg:p-5">
          {attentionTasks.length === 0 && travelPrepItems.length === 0 ? (
            <p className="text-sm leading-6 text-muted">
              No upcoming health or list prep items need attention in the next 4 weeks.
            </p>
          ) : (
            <div className="divide-y divide-line">
              {attentionTasks.slice(0, 5).map((task) => {
                const pet = pets.find((item) => item.id === task.petId) ?? pets[0];

                return <HomeAttentionRow key={task.id} onOpen={() => onOpenAttentionTask(task)} pet={pet} task={task} />;
              })}
              {travelPrepItems.slice(0, 4).map((item) => (
                <HomeTravelPrepRow item={item} key={item.id} onOpen={() => onOpenKitPrep(item)} pets={pets} />
              ))}
            </div>
          )}
        </div>
      </section>

      <HomeListsKitsSection
        onCreateKit={onCreateKit}
        onOpenKit={onOpenKit}
        onToggleKitItem={onToggleKitItem}
        onViewAll={onViewAllKits}
        petKits={petKits}
        pets={pets}
      />
    </div>
  );
}

function HomeGetStartedChecklist({ items }: { items: HomeGetStartedItem[] }) {
  const [isHidden, setIsHidden] = useState(false);

  if (isHidden) return null;

  return (
    <section className="space-y-3">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <SectionTitle title="Get started" />
        <button
          className="min-h-10 rounded-lg px-3 text-sm font-semibold text-muted transition hover:text-ink"
          onClick={() => setIsHidden(true)}
          type="button"
        >
          Hide
        </button>
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <div className="divide-y divide-line">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <button
                className="flex min-h-[72px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-background active:scale-[0.995]"
                key={item.id}
                onClick={item.onClick}
                type="button"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon aria-hidden className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{item.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">{item.reason}</span>
                </span>
                <span className="shrink-0 rounded-full bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  {item.statusLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function getHomeGetStartedItems({
  documents,
  onAddMedicationSetup,
  onCreateKit,
  onOpenPetProfileSetup,
  onOpenPrimaryVetSetup,
  onOpenRecordUploadSetup,
  onOpenRoutineSetup,
  onOpenVaccineSetup,
  petKits,
  pets,
  scheduledTasks,
  vaccines,
}: {
  documents: RecordDocument[];
  onAddMedicationSetup: (petId: string) => void;
  onCreateKit: () => void;
  onOpenPetProfileSetup: (petId: string) => void;
  onOpenPrimaryVetSetup: (petId: string) => void;
  onOpenRecordUploadSetup: (petId: string) => void;
  onOpenRoutineSetup: (petId: string) => void;
  onOpenVaccineSetup: (petId: string) => void;
  petKits: PetKit[];
  pets: Pet[];
  scheduledTasks: Task[];
  vaccines: VaccineRecord[];
}) {
  const firstPet = pets[0];
  if (!firstPet) return [];

  const petWithoutPhoto = pets.find((pet) => isDefaultPetPhoto(pet.photo)) ?? firstPet;
  const petWithoutVaccines = pets.find((pet) => !vaccines.some((vaccine) => vaccine.petId === pet.id)) ?? firstPet;
  const petWithoutVet = pets.find((pet) => !pet.primaryVetId) ?? firstPet;
  const petWithoutRoutine = pets.find((pet) => !scheduledTasks.some((task) => task.petId === pet.id)) ?? firstPet;
  const petWithoutDocuments = pets.find((pet) => !documents.some((document) => document.petId === pet.id)) ?? firstPet;
  const hasMedicationSetup = scheduledTasks.some((task) => task.type === "medication" || task.type === "refill");
  const items: HomeGetStartedItem[] = [];

  if (petWithoutPhoto && isDefaultPetPhoto(petWithoutPhoto.photo)) {
    items.push({
      id: "pet-photo",
      icon: Upload,
      onClick: () => onOpenPetProfileSetup(petWithoutPhoto.id),
      reason: "Make the profile recognizable for care handoffs.",
      statusLabel: "Missing",
      title: `Add ${petWithoutPhoto.name}'s photo`,
    });
  }

  if (petWithoutVaccines && !vaccines.some((vaccine) => vaccine.petId === petWithoutVaccines.id)) {
    items.push({
      id: "vaccines",
      icon: ShieldCheck,
      onClick: () => onOpenVaccineSetup(petWithoutVaccines.id),
      reason: "Useful for boarding, travel, groomers, and vet handoffs.",
      statusLabel: "Setup",
      title: "Add vaccine records",
    });
  }

  if (petWithoutVet && !petWithoutVet.primaryVetId) {
    items.push({
      id: "primary-vet",
      icon: HeartPulse,
      onClick: () => onOpenPrimaryVetSetup(petWithoutVet.id),
      reason: "Connect visits, follow-ups, and care-team context.",
      statusLabel: "Missing",
      title: "Add a primary vet",
    });
  }

  if (petWithoutRoutine && !scheduledTasks.some((task) => task.petId === petWithoutRoutine.id)) {
    items.push({
      id: "care-routine",
      icon: CalendarCheck,
      onClick: () => onOpenRoutineSetup(petWithoutRoutine.id),
      reason: "Set recurring meds, baths, refills, or checkups.",
      statusLabel: "Setup",
      title: "Create the first care routine",
    });
  }

  if (!hasMedicationSetup) {
    items.push({
      id: "medication",
      icon: Pill,
      onClick: () => onAddMedicationSetup(firstPet.id),
      reason: "Optional, for active prescriptions or preventives.",
      statusLabel: "Optional",
      title: "Add medication if needed",
    });
  }

  if (petWithoutDocuments && !documents.some((document) => document.petId === petWithoutDocuments.id)) {
    items.push({
      id: "important-records",
      icon: FileText,
      onClick: () => onOpenRecordUploadSetup(petWithoutDocuments.id),
      reason: "Upload PDFs/images now. AI extraction comes later with review before saving.",
      statusLabel: "Upload",
      title: "Upload important records",
    });
  }

  if (petKits.length === 0) {
    items.push({
      id: "list-kit",
      icon: ClipboardList,
      onClick: onCreateKit,
      reason: "Build packing, travel, boarding, or custom prep lists.",
      statusLabel: "Optional",
      title: "Create a list or kit",
    });
  }

  return items.slice(0, 7);
}

function HomeListsKitsSection({
  onCreateKit,
  onOpenKit,
  onToggleKitItem,
  onViewAll,
  petKits,
  pets,
}: {
  onCreateKit: () => void;
  onOpenKit: (kit: PetKit) => void;
  onToggleKitItem: (kitId: string, itemId: string) => void;
  onViewAll: () => void;
  petKits: PetKit[];
  pets: Pet[];
}) {
  const visibleKits = [...petKits]
    .sort((a, b) => {
      if (a.startDate && b.startDate) return a.startDate.localeCompare(b.startDate);
      if (a.startDate) return -1;
      if (b.startDate) return 1;
      return a.title.localeCompare(b.title);
    })
    .slice(0, 4);

  return (
    <section className="space-y-3">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <SectionTitle title="Lists & kits" />
        <div className="flex shrink-0 gap-2">
          <button
            className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink"
            onClick={onViewAll}
            type="button"
          >
            View all
          </button>
          <button
            className="min-h-10 rounded-lg bg-ink px-3 text-sm font-semibold text-white"
            onClick={onCreateKit}
            type="button"
          >
            Create list
          </button>
        </div>
      </div>

      {visibleKits.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-4 text-sm leading-6 text-muted">
          Create packing, travel, picnic, boarding, grooming, or custom prep lists for your pets.
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {visibleKits.map((kit) => (
            <HomeKitRow
              key={kit.id}
              kit={kit}
              onOpen={() => onOpenKit(kit)}
              onToggleItem={(itemId) => onToggleKitItem(kit.id, itemId)}
              pets={pets}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function HomeKitRow({
  kit,
  onOpen,
  onToggleItem,
  pets,
}: {
  kit: PetKit;
  onOpen: () => void;
  onToggleItem: (itemId: string) => void;
  pets: Pet[];
}) {
  const kitPets = kit.petIds.map((petId) => pets.find((pet) => pet.id === petId)).filter(Boolean) as Pet[];
  const allItems = kitUnifiedItems(kit);
  const visibleItems = allItems.slice(0, 3);
  const hiddenCount = Math.max(0, allItems.length - visibleItems.length);
  const progress = kitProgressParts(kit);

  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-white/70 bg-surface p-4 shadow-[0_14px_36px_rgba(68,52,42,0.07)]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#ffe3c7] text-ink">
          <ClipboardList aria-hidden className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <button className="min-w-0 text-left" onClick={onOpen} type="button">
              <h3 className="truncate text-sm font-semibold text-ink">{kit.title}</h3>
            </button>
            <KitProgressChips progress={progress} />
          </div>
          <p className="mt-1 truncate text-sm text-muted">{kitContextLabel(kit)}</p>
          <div className="mt-2 flex min-w-0 items-center gap-2">
            <CompactPetStack pets={kitPets} />
            <span className="truncate text-xs font-semibold text-muted">{compactPetNames(kitPets)}</span>
          </div>
        </div>
      </div>

      {visibleItems.length > 0 ? (
        <div className="mt-3 divide-y divide-line rounded-lg bg-background/60">
          {visibleItems.map((item) => (
            <HomeKitItemRow item={item} key={item.id} onToggle={() => onToggleItem(item.id)} />
          ))}
        </div>
      ) : null}

      {hiddenCount > 0 || visibleItems.length === 0 ? (
        <button
          className="mt-3 min-h-10 rounded-lg px-1 text-sm font-semibold text-primary"
          onClick={onOpen}
          type="button"
        >
          {hiddenCount > 0 ? `View full list (${hiddenCount} more)` : "View full list"}
        </button>
      ) : null}
    </article>
  );
}

function HomeKitItemRow({ item, onToggle }: { item: KitUnifiedItem; onToggle: () => void }) {
  const meta = kitItemMeta(item);

  return (
    <div className="flex min-w-0 items-center gap-2 px-2 py-2">
      <button
        aria-label={item.completed ? `Mark ${item.label} incomplete` : `Mark ${item.label} complete`}
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition active:scale-[0.98]",
          item.completed ? "border-primary bg-primary text-white" : "border-line bg-white text-muted",
        )}
        onClick={onToggle}
        type="button"
      >
        <Check aria-hidden className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-semibold", item.completed ? "text-muted line-through" : "text-ink")}>
          {item.label}
        </p>
        {meta ? <p className="truncate text-xs text-muted">{meta}</p> : null}
      </div>
    </div>
  );
}

function CompactPetStack({ pets }: { pets: Pet[] }) {
  return (
    <span className="flex shrink-0 -space-x-2">
      {pets.slice(0, 3).map((pet) => (
        <span className="relative block h-7 w-7 overflow-hidden rounded-full border-2 border-surface bg-primary/10" key={pet.id}>
          <Image alt="" className="h-full w-full object-cover" height={28} src={pet.photo} width={28} />
        </span>
      ))}
    </span>
  );
}

function compactPetNames(pets: Pet[]) {
  if (pets.length === 0) return "No pets";
  if (pets.length === 1) return pets[0].name;
  if (pets.length === 2) return `${pets[0].name} + ${pets[1].name}`;
  return `${pets[0].name} + ${pets.length - 1} more`;
}

function KitProgressChips({ progress }: { progress: ReturnType<typeof kitProgressParts> }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        {progress.done}
      </span>
      {progress.documentIssues ? (
        <span className="rounded-full bg-[#ffe7a8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink">
          {progress.documentIssues}
        </span>
      ) : null}
    </div>
  );
}

function HomeTravelPrepRow({ item, onOpen, pets }: { item: KitPrepItem; onOpen: () => void; pets: Pet[] }) {
  const tripPets = item.petIds.map((petId) => pets.find((pet) => pet.id === petId)?.name).filter(Boolean);

  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#ffe3c7] text-ink">
        <ClipboardList aria-hidden className="h-5 w-5" />
      </span>
      <button
        className="min-w-0 flex-1 rounded-lg text-left transition hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 active:scale-[0.995]"
        onClick={onOpen}
        type="button"
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
            {item.prepLabel}
          </span>
        </div>
        <p className="mt-1 truncate text-sm text-muted">
          {relativeDateLabel(item.date)} - {item.tripTitle}
          {tripPets.length ? ` - ${tripPets.join(", ")}` : ""}
        </p>
      </button>
    </div>
  );
}

function HomeTaskSection({
  emptyText,
  onLogForDate,
  onPrimary,
  pets,
  tasks,
  title,
}: {
  emptyText?: string;
  onLogForDate: (task: Task) => void;
  onPrimary: (task: Task) => void;
  pets: Pet[];
  tasks: Task[];
  title: string;
}) {
  return (
    <section className="space-y-3">
      <SectionTitle title={title} />
      {tasks.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-4 text-sm leading-6 text-muted">
          {emptyText ?? "No care items here."}
        </p>
      ) : (
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          {tasks.map((task) => {
            const pet = pets.find((item) => item.id === task.petId) ?? pets[0];

            return (
              <HomeTaskCard
                key={task.id}
                onLogForDate={onLogForDate}
                onPrimary={onPrimary}
                pet={pet}
                task={task}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function HomeTaskCard({
  onLogForDate,
  onPrimary,
  pet,
  task,
}: {
  onLogForDate: (task: Task) => void;
  onPrimary: (task: Task) => void;
  pet: Pet;
  task: Task;
}) {
  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-white/70 bg-surface p-4 shadow-[0_14px_36px_rgba(68,52,42,0.07)]">
      <div className="flex items-center gap-3">
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", taskTone(task).icon)}>
          <TaskIcon task={task} />
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <PetAvatar pet={pet} size="xs" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {pet.name}&apos;s {task.title.toLowerCase()}
            </p>
            <p className="mt-1 truncate text-sm text-muted">
              {homeDueStatus(task)} - {task.dueLabel}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {task.type === "vaccine" ? null : (
            <CompactAction
              icon={CalendarCheck}
              label={`Log ${pet.name}'s ${task.title} for another date`}
              onClick={() => onLogForDate(task)}
            />
          )}
          <CompactAction
            icon={task.type === "vaccine" ? Eye : Check}
            label={taskActionLabel(task)}
            onClick={() => onPrimary(task)}
            primary
          />
        </div>
      </div>
    </article>
  );
}

function HomeRecentLogRow({
  log,
  onUndo,
  pets,
}: {
  log: LogEntry;
  onUndo: (logId: string) => void;
  pets: Pet[];
}) {
  const pet = pets.find((item) => item.id === log.petId);

  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", logTone(log.recordType))}>
        <Check aria-hidden className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">
          {pet?.name ? `${pet.name}'s ` : ""}{log.title}
        </p>
        <p className="mt-1 truncate text-xs text-muted">
          {log.createdLabel}{log.completedTiming ? ` - ${completionTimingLabel(log)}` : ""}
        </p>
      </div>
      <button
        className="min-h-10 rounded-lg px-3 text-sm font-semibold text-primary"
        onClick={() => onUndo(log.id)}
        type="button"
      >
        Undo
      </button>
    </div>
  );
}

function HomeAttentionRow({ onOpen, pet, task }: { onOpen: () => void; pet: Pet; task: Task }) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", taskTone(task).icon)}>
        <TaskIcon task={task} />
      </span>
      <button
        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left transition hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 active:scale-[0.995]"
        onClick={onOpen}
        type="button"
      >
        <PetAvatar pet={pet} size="xs" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-ink">
              {pet.name}&apos;s {task.title.toLowerCase()}
            </p>
            <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
              {reminderKindLabel(task.reminderKind)}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-muted">
            {relativeDateLabel(task.dueDate)} - {task.dueLabel}
          </p>
        </div>
      </button>
    </div>
  );
}

function homeDueStatus(task: Task) {
  if (task.dueDate === todayValue) return "Due today";
  const daysLate = daysBetween(task.dueDate, todayValue);
  if (daysLate === 1) return "1 day overdue";
  if (daysLate > 1) return `${daysLate} days overdue`;
  return relativeDateLabel(task.dueDate);
}

function getHomeAttentionTasks(scheduledTasks: Task[], vaccines: VaccineRecord[]) {
  const attentionEndDate = addDays(todayValue, 28);
  const healthTypes: Task["type"][] = ["medication", "refill", "vaccine", "measurement", "vet"];
  const upcomingTasks = scheduledTasks.filter(
    (task) =>
      healthTypes.includes(task.type) &&
      task.dueDate > todayValue &&
      task.dueDate <= attentionEndDate,
  );
  const vaccineTasks: Task[] = vaccines
    .filter((vaccine) => vaccine.status === "due-soon")
    .map((vaccine) => ({
      id: `vaccine-attention-${vaccine.id}`,
      title: `${vaccine.name} vaccine`,
      dueLabel: `Expires ${vaccine.expires}`,
      type: "vaccine" as const,
      dueDate: dateValueFromDisplay(vaccine.expires) || todayValue,
      petId: vaccine.petId,
      actionLabel: "Review",
      cadence: "once" as const,
      reminderKind: "vaccine" as const,
      notes: vaccine.protectsAgainst,
    }))
    .filter((task) => task.dueDate > todayValue && task.dueDate <= attentionEndDate);
  const uniqueTasks = new Map<string, Task>();

  [...upcomingTasks, ...vaccineTasks].forEach((task) => {
    const key = `${task.petId}:${task.title.toLowerCase()}:${task.dueDate}`;
    if (!uniqueTasks.has(key)) uniqueTasks.set(key, task);
  });

  return Array.from(uniqueTasks.values()).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

type CalendarItem = {
  actionLabel?: string;
  id: string;
  date: string;
  detail: string;
  icon?: typeof MoreHorizontal;
  meta: string;
  onAction?: () => void;
  onEditSchedule?: () => void;
  onSecondary?: () => void;
  secondaryLabel?: string;
  task?: Task;
  tone: string;
  title: string;
  type: "completed" | "due" | "observation" | "travel" | "visit";
};

type CalendarPlanItem = {
  action?: () => void;
  actionLabel?: string;
  date: string;
  dateLabel: string;
  detail: string;
  editSchedule?: () => void;
  icon?: typeof MoreHorizontal;
  id: string;
  secondaryAction?: () => void;
  task?: Task;
  title: string;
  tone: string;
  typeLabel: string;
};

function CalendarView({
  logs,
  observations,
  onEditSchedule,
  onLogForDate,
  onManageSchedule,
  onPrimary,
  onSchedule,
  openTasks,
  pets,
  selectedPet,
  selectedPetId,
  setSelectedPetId,
  petKits,
  vetProviders,
  vetVisits,
  vaccines,
}: {
  logs: LogEntry[];
  observations: ObservationRecord[];
  onEditSchedule: (task: Task) => void;
  onLogForDate: (task: Task) => void;
  onManageSchedule: () => void;
  onPrimary: (task: Task) => void;
  onSchedule: (initialDueDate?: string) => void;
  openTasks: Task[];
  pets: Pet[];
  selectedPet: Pet;
  selectedPetId: string;
  setSelectedPetId: (petId: string) => void;
  petKits: PetKit[];
  vetProviders: VetProvider[];
  vetVisits: VetVisit[];
  vaccines: VaccineRecord[];
}) {
  const [selectedDate, setSelectedDate] = useState(todayValue);
  const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
  const [visibleMonth, setVisibleMonth] = useState(todayValue.slice(0, 7));
  const weekDays = getWeekDays(selectedDate);
  const monthDays = getMonthDays(visibleMonth);
  const monthLabel = formatMonthLabel(visibleMonth);
  const petLogs = logs.filter((log) => log.petId === selectedPet.id);
  const petTasks = openTasks.filter((task) => task.petId === selectedPet.id);
  const petObservations = observations.filter((observation) => observation.petId === selectedPet.id);
  const petVetVisits = vetVisits.filter((visit) => visit.petId === selectedPet.id);
  const petVaccines = vaccines.filter((vaccine) => vaccine.petId === selectedPet.id);
  const petKitPrepItems = getKitPrepItems(petKits).filter((item) => item.petIds.includes(selectedPet.id));

  const calendarItems: CalendarItem[] = [
    ...petTasks.map((task) => ({
      actionLabel: taskActionLabel(task),
      id: `due-${task.id}`,
      date: task.dueDate,
      detail: task.dueLabel,
      meta: "Due item",
      onAction: () => onPrimary(task),
      onEditSchedule: () => onEditSchedule(task),
      onSecondary: task.type === "vaccine" ? undefined : () => onLogForDate(task),
      secondaryLabel: "Log for another date",
      task,
      title: task.title,
      tone: taskTone(task).icon,
      type: "due" as const,
    })),
    ...petLogs.map((log) => ({
      id: `log-${log.id}`,
      date: log.occurredOn,
      detail: [log.createdLabel, log.details || log.value].filter(Boolean).join(" - "),
      meta: "Logged",
      icon: Check,
      title: log.title,
      tone: logTone(log.recordType),
      type: "completed" as const,
    })),
    ...petObservations.map((observation) => ({
      id: `observation-${observation.id}`,
      date: observation.observedOn,
      detail: [
        capitalize(observation.category),
        `${capitalize(observation.severity)} severity`,
        observation.trigger ? `Trigger: ${observation.trigger}` : "",
        observation.notes,
      ].filter(Boolean).join(" - "),
      meta: "Observation",
      icon: ClipboardList,
      title: observation.title,
      tone: severityTone(observation.severity).icon,
      type: "observation" as const,
    })),
    ...petVetVisits.map((visit) => {
      const provider = vetProviders.find((item) => item.id === visit.vetProviderId);
      return {
        id: `visit-${visit.id}`,
        date: visit.visitedOn,
        detail: [provider?.name, visit.totalCost ? formatCurrency(visit.totalCost, visit.currency) : ""].filter(Boolean).join(" - "),
        meta: "Vet visit",
        icon: HeartPulse,
        title: visit.reason,
        tone: "bg-[#f7d5ef] text-ink",
        type: "visit" as const,
      };
    }),
    ...petKitPrepItems.map((item) => ({
      id: `travel-${item.id}`,
      date: item.date,
      detail: [item.tripTitle, item.destination].filter(Boolean).join(" - "),
      meta: item.prepLabel,
      icon: ClipboardList,
      title: item.title,
      tone: "bg-[#ffe3c7] text-ink",
      type: "travel" as const,
    })),
  ];

  const selectedItems = calendarItems.filter((item) => item.date === selectedDate);
  const planningEndDate = addDays(todayValue, 28);
  const planningItems: CalendarPlanItem[] = [
    ...petTasks.map((task) => ({
      action: () => onPrimary(task),
      actionLabel: taskActionLabel(task),
      date: task.dueDate,
      dateLabel: relativeDateLabel(task.dueDate),
      detail: [task.dueLabel, cadenceLabel(task.cadence), task.refillByDate ? `Refill by ${formatDateForDisplay(task.refillByDate)}` : ""].filter(Boolean).join(" - "),
      id: `plan-task-${task.id}`,
      editSchedule: () => onEditSchedule(task),
      secondaryAction: task.type === "vaccine" ? undefined : () => onLogForDate(task),
      task,
      title: task.title,
      tone: taskTone(task).icon,
      typeLabel: reminderKindLabel(task.reminderKind),
    })),
    ...petVaccines
      .map((vaccine) => ({
        date: dateValueFromDisplay(vaccine.expires),
        vaccine,
      }))
      .filter((item): item is { date: string; vaccine: VaccineRecord } => Boolean(item.date))
      .map(({ date, vaccine }) => ({
        date,
        dateLabel: relativeDateLabel(date),
        detail: `Expires ${vaccine.expires}`,
        id: `plan-vaccine-${vaccine.id}`,
        icon: ShieldCheck,
        title: `${vaccine.name} vaccine`,
        tone: "bg-[#d7f9c4] text-ink",
        typeLabel: "Vaccine",
      })),
    ...petVetVisits
      .filter((visit) => Boolean(visit.followUpDate))
      .map((visit) => {
        const provider = vetProviders.find((item) => item.id === visit.vetProviderId);

        return {
          date: visit.followUpDate,
          dateLabel: relativeDateLabel(visit.followUpDate),
          detail: provider ? `Follow up with ${provider.name}` : "Follow-up date set",
          id: `plan-follow-up-${visit.id}`,
          icon: HeartPulse,
          title: `${visit.reason} follow-up`,
          tone: "bg-[#f7d5ef] text-ink",
          typeLabel: "Vet follow-up",
        };
      }),
    ...petKitPrepItems.map((item) => ({
      date: item.date,
      dateLabel: relativeDateLabel(item.date),
      detail: [item.tripTitle, item.destination].filter(Boolean).join(" - "),
      id: `plan-travel-${item.id}`,
      icon: ClipboardList,
      title: item.title,
      tone: "bg-[#ffe3c7] text-ink",
      typeLabel: item.prepLabel,
    })),
  ]
    .filter((item) => isDateInRange(item.date, todayValue, planningEndDate))
    .sort((a, b) => a.date.localeCompare(b.date));
  const thisWeekItems = planningItems.filter((item) => isDateInRange(item.date, todayValue, addDays(todayValue, 6)));
  const laterItems = planningItems.filter((item) => item.date > addDays(todayValue, 6));
  const selectCalendarDate = (value: string) => {
    setSelectedDate(value);
    setVisibleMonth(value.slice(0, 7));
  };

  return (
    <div className="space-y-6">
      <PetSwitcher pets={pets} selectedPetId={selectedPetId} setSelectedPetId={setSelectedPetId} />

      <section className="rounded-lg border border-white/70 bg-surface/85 p-5 shadow-[0_18px_60px_rgba(68,52,42,0.08)] backdrop-blur lg:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">{formatLongDate(selectedDate)}</p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-ink">{selectedPet.name}&apos;s Calendar</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              className="hidden min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink sm:inline-flex sm:items-center"
              onClick={onManageSchedule}
              type="button"
            >
              Edit routines
            </button>
            <button
              className="hidden min-h-10 rounded-lg bg-ink px-3 text-sm font-semibold text-white sm:inline-flex sm:items-center"
              onClick={() => onSchedule()}
              type="button"
            >
              Add care routine
            </button>
            <PetAvatar pet={selectedPet} size="sm" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
          <button
            className="min-h-11 rounded-lg border border-line bg-white px-2 text-xs font-semibold text-ink"
            onClick={onManageSchedule}
            type="button"
          >
            Edit routine
          </button>
          <button
            className="min-h-11 rounded-lg bg-ink px-2 text-xs font-semibold text-white"
            onClick={() => onSchedule()}
            type="button"
          >
            Add routine
          </button>
        </div>

        {calendarMode === "week" ? (
          <div className="mt-6 grid grid-cols-7 gap-1.5 sm:gap-2">
            {weekDays.map((day) => {
              const count = calendarItems.filter((item) => item.date === day.value).length;
              const selected = selectedDate === day.value;

              return (
                <button
                  aria-label={`${formatLongDate(day.value)}${count ? `, ${count} item${count === 1 ? "" : "s"}` : ""}`}
                  className={cn(
                    "min-w-0 rounded-full p-1.5 text-center transition active:scale-[0.98]",
                    selected ? "bg-ink text-white" : "bg-white text-ink",
                  )}
                  key={day.value}
                  onClick={() => selectCalendarDate(day.value)}
                  type="button"
                >
                  <span className={cn("block text-[10px] font-semibold", selected ? "text-white/70" : "text-muted")}>{day.day}</span>
                  <span className="mt-1 block text-sm font-semibold">{day.date}</span>
                  <span className={cn("mx-auto mt-1 block h-1.5 w-1.5 rounded-full", count ? (selected ? "bg-white" : "bg-ink") : "bg-transparent")} />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="flex min-h-11 items-center justify-between gap-3">
              <button
                aria-label="Previous month"
                className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-white text-ink"
                onClick={() => setVisibleMonth((current) => addMonthsToMonth(current, -1))}
                type="button"
              >
                <ChevronLeft aria-hidden className="h-5 w-5" />
              </button>
              <p className="text-sm font-semibold text-ink">{monthLabel}</p>
              <button
                aria-label="Next month"
                className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-white text-ink"
                onClick={() => setVisibleMonth((current) => addMonthsToMonth(current, 1))}
                type="button"
              >
                <ChevronRight aria-hidden className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <p className="text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-muted" key={day}>
                  {day}
                </p>
              ))}
              {monthDays.map((day) => {
                const count = calendarItems.filter((item) => item.date === day.value).length;
                const selected = selectedDate === day.value;

                return (
                  <button
                    aria-label={`${formatLongDate(day.value)}${count ? `, ${count} item${count === 1 ? "" : "s"}` : ""}`}
                    className={cn(
                      "min-w-0 rounded-lg p-1.5 text-center transition active:scale-[0.98]",
                      selected ? "bg-ink text-white" : "bg-white text-ink",
                      !day.inCurrentMonth && !selected ? "opacity-45" : "",
                    )}
                    key={day.value}
                    onClick={() => selectCalendarDate(day.value)}
                    type="button"
                  >
                    <span className="block text-sm font-semibold">{day.date}</span>
                    <span className={cn("mx-auto mt-1 block h-1.5 w-1.5 rounded-full", count ? (selected ? "bg-white" : "bg-ink") : "bg-transparent")} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <button
          className="mx-auto mt-4 flex min-h-11 items-center justify-center gap-1 px-3 text-sm font-semibold text-primary transition active:scale-[0.98]"
          onClick={() => setCalendarMode((current) => (current === "week" ? "month" : "week"))}
          type="button"
        >
          {calendarMode === "week" ? (
            <>
              Month view
              <ChevronDown aria-hidden className="h-4 w-4" />
            </>
          ) : (
            <>
              Week view
              <ChevronUp aria-hidden className="h-4 w-4" />
            </>
          )}
        </button>
      </section>

      <section className="space-y-3">
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Selected day activity</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
              {selectedItems.length} {selectedItems.length === 1 ? "item" : "items"}
            </span>
            <button
              className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-primary"
              onClick={() => onSchedule(selectedDate)}
              type="button"
            >
              Add to this date
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-4 shadow-sm">
          {selectedItems.length === 0 ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-ink">No activity for {selectedPet.name}.</p>
              <p className="text-sm leading-6 text-muted">
                Care, logs, observations, vet visits, and list prep for this date will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {selectedItems.map((item) => (
                <CalendarActivityRow item={item} key={item.id} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle title="Next 4 weeks" />
        <div className="rounded-lg border border-line bg-surface p-4 shadow-sm">
          {planningItems.length === 0 ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-ink">No upcoming care scheduled.</p>
              <p className="text-sm leading-6 text-muted">
                Medication refills, vaccine expirations, vet follow-ups, and care dates will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <CalendarPlanGroup items={thisWeekItems} title="This week" />
              <CalendarPlanGroup items={laterItems} title="Later" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CalendarPlanGroup({ items, title }: { items: CalendarPlanItem[]; title: string }) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">{title}</p>
      <div className="divide-y divide-line">
        {items.map((item) => (
          <CalendarPlanRow item={item} key={item.id} />
        ))}
      </div>
    </div>
  );
}

function CalendarPlanRow({ item }: { item: CalendarPlanItem }) {
  const Icon = item.icon ?? CalendarCheck;

  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", item.tone)}>
        {item.task ? <TaskIcon task={item.task} /> : <Icon aria-hidden className="h-5 w-5" />}
      </span>
      <button
        className={cn(
          "min-w-0 flex-1 rounded-lg text-left transition",
          item.editSchedule ? "focus:outline-none focus:ring-2 focus:ring-primary/30 active:scale-[0.995]" : "",
        )}
        disabled={!item.editSchedule}
        onClick={item.editSchedule}
        type="button"
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="break-words text-sm font-semibold text-ink">{item.title}</p>
          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
            {item.typeLabel}
          </span>
        </div>
        <p className="mt-1 break-words text-sm leading-5 text-muted">
          {item.dateLabel} - {item.detail}
        </p>
      </button>
      {item.action ? (
        <div className="flex shrink-0 gap-2">
          {item.secondaryAction ? (
            <CompactAction icon={CalendarCheck} label="Log for another date" onClick={item.secondaryAction} />
          ) : null}
          <CompactAction
            icon={item.actionLabel === "Review" ? Eye : Check}
            label={item.actionLabel ?? "Done"}
            onClick={item.action}
            primary
          />
        </div>
      ) : null}
    </div>
  );
}

function CalendarActivityRow({ item }: { item: CalendarItem }) {
  const Icon = item.icon ?? CalendarCheck;

  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", item.tone)}>
        {item.task ? <TaskIcon task={item.task} /> : <Icon aria-hidden className="h-5 w-5" />}
      </span>
      <button
        className={cn(
          "min-w-0 flex-1 rounded-lg text-left transition",
          item.onEditSchedule ? "focus:outline-none focus:ring-2 focus:ring-primary/30 active:scale-[0.995]" : "",
        )}
        disabled={!item.onEditSchedule}
        onClick={item.onEditSchedule}
        type="button"
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="break-words text-sm font-semibold text-ink">{item.title}</p>
          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
            {item.meta}
          </span>
        </div>
        <p className="mt-1 break-words text-sm leading-5 text-muted">{item.detail}</p>
      </button>
      {item.onAction ? (
        <div className="flex shrink-0 gap-2">
          {item.onSecondary ? (
            <CompactAction icon={CalendarCheck} label={item.secondaryLabel ?? "Log for another date"} onClick={item.onSecondary} />
          ) : null}
          <CompactAction
            icon={item.actionLabel === "Review" ? Eye : Check}
            label={item.actionLabel ?? "Done"}
            onClick={item.onAction}
            primary
          />
        </div>
      ) : null}
    </div>
  );
}

function ManageScheduleList({
  onDelete,
  onEdit,
  tasks,
}: {
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
  tasks: Task[];
}) {
  const sortedTasks = [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="space-y-3">
      {sortedTasks.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-4 text-sm leading-6 text-muted">
          No care routines yet.
        </p>
      ) : (
        <div className="divide-y divide-line rounded-lg border border-line bg-surface px-4">
          {sortedTasks.map((task) => (
            <div className="flex items-center gap-3 py-3" key={task.id}>
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", taskTone(task).icon)}>
                <TaskIcon task={task} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-words text-sm font-semibold text-ink">{task.title}</p>
                  <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                    {reminderKindLabel(task.reminderKind)}
                  </span>
                </div>
                <p className="mt-1 break-words text-sm leading-5 text-muted">
                  {relativeDateLabel(task.dueDate)} - {cadenceLabel(task.cadence)}
                  {task.doseLabel ? ` - ${task.doseLabel}` : ""}
                  {task.refillByDate ? ` - Refill by ${formatDateForDisplay(task.refillByDate)}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <IconButton icon={Pencil} label="Edit routine" onClick={() => onEdit(task)} />
                <IconButton icon={Trash2} label="Delete routine" onClick={() => onDelete(task)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PetsView({
  carryVetPrepItem,
  dismissVetPrepItem,
  markVetPrepAddressed,
  measurements,
  onAddPet,
  onAddVetNote,
  onChangeVet,
  onEditPet,
  onEditProfiles,
  onManageSharing,
  onPhotoChange,
  onViewTrainingCues,
  onViewMeasurements,
  petAccessMembers,
  pets,
  selectedPet,
  selectedPetId,
  setSelectedPetId,
  shareLinks,
  vetProviders,
  vetPrepItems,
}: {
  carryVetPrepItem: (itemId: string) => void;
  dismissVetPrepItem: (itemId: string) => void;
  markVetPrepAddressed: (itemId: string) => void;
  measurements: MeasurementSnapshot[];
  onAddPet: () => void;
  onAddVetNote: () => void;
  onChangeVet: () => void;
  onEditPet: (section: PetEditSection) => void;
  onEditProfiles: () => void;
  onManageSharing: () => void;
  onPhotoChange: (petId: string, file: File | null) => void;
  onViewTrainingCues: () => void;
  onViewMeasurements: () => void;
  petAccessMembers: PetAccessMember[];
  pets: Pet[];
  selectedPet: Pet;
  selectedPetId: string;
  setSelectedPetId: (petId: string) => void;
  shareLinks: ShareLink[];
  vetProviders: VetProvider[];
  vetPrepItems: VetPrepItem[];
}) {
  const latestMeasurement = measurements[0];
  const openVetPrepItems = vetPrepItems.filter((item) => item.status === "open");
  const primaryVet = vetProviders.find((provider) => provider.id === selectedPet.primaryVetId);
  const secondaryVet = vetProviders.find((provider) => provider.id === selectedPet.secondaryVetId);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-end">
          <button className="min-h-8 text-sm font-semibold text-primary underline-offset-4 hover:underline" onClick={onEditProfiles} type="button">
            Edit profiles
          </button>
        </div>
        <PetSwitcher
          actionLabel="Add pet"
          onAction={onAddPet}
          pets={pets}
          selectedPetId={selectedPetId}
          setSelectedPetId={setSelectedPetId}
          showTitle={false}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <article className="overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
          <div className="relative h-64">
            <Image
              alt={`${selectedPet.name}, ${selectedPet.breed}`}
              className="h-full w-full object-cover"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 360px"
              src={selectedPet.photo}
            />
            <label className="absolute right-3 top-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-white/95 px-3 text-xs font-semibold text-ink shadow-sm transition hover:bg-white">
              <Upload aria-hidden className="h-4 w-4" />
              {isDefaultPetPhoto(selectedPet.photo) ? "Upload photo" : "Change photo"}
              <input
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  onPhotoChange(selectedPet.id, event.currentTarget.files?.[0] ?? null);
                  event.currentTarget.value = "";
                }}
                type="file"
              />
            </label>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm capitalize text-white/80">{selectedPet.species}</p>
                  <h2 className="truncate text-4xl font-semibold leading-none">{selectedPet.name}</h2>
                </div>
                <span className="shrink-0 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary">
                  {selectedPet.status}
                </span>
              </div>
            </div>
          </div>
        </article>

        <div className="grid gap-4">
          <ProfileSection action="Edit" onAction={() => onEditPet("profile")} title="Profile snapshot">
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
              <FactRow label="Breed" value={selectedPet.breed} />
              <FactRow label="Age" value={selectedPet.ageLabel} />
              <FactRow label="Weight" value={selectedPet.weight} />
              <FactRow label="Sex" value={capitalize(selectedPet.sex)} />
              {selectedPet.dynamicFields.map((field) => (
                <FactRow key={field.label} label={field.label} value={field.value} />
              ))}
            </div>
            <button
              className="mt-3 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 text-left text-sm font-semibold text-ink transition hover:bg-background active:scale-[0.99]"
              onClick={onViewMeasurements}
              type="button"
            >
              <span className="min-w-0">
                <span className="block">Measurements</span>
                <span className="block truncate text-xs font-medium text-muted">
                  {latestMeasurement
                    ? `${measurementSnapshotSummary(latestMeasurement)} - ${latestMeasurement.createdLabel}`
                    : "View body measurement history"}
                </span>
              </span>
              <CalendarCheck aria-hidden className="h-5 w-5 shrink-0 text-primary" />
            </button>
          </ProfileSection>

          <ProfileSection action="Edit" onAction={() => onEditPet("background")} title="Background">
            <BackgroundDetails background={selectedPet.background} />
          </ProfileSection>

          {selectedPet.species === "dog" ? (
            <ProfileSection action="Edit" onAction={() => onEditPet("training")} title="Training cues">
              <TrainingCueList
                cues={selectedPet.trainingCues ?? []}
                emptyText="No training cues yet."
                onViewAll={onViewTrainingCues}
              />
            </ProfileSection>
          ) : null}

          <ProfileSection action="Edit" onAction={() => onEditPet("behavior")} title="Behavior">
            <p className="text-sm leading-6 text-ink">{selectedPet.behaviorNotes || "No behavior notes yet."}</p>
          </ProfileSection>

          <ProfileSection action="Edit" onAction={() => onEditPet("food")} title="Food preferences">
            <FoodPreferencesDetails preferences={selectedPet.foodPreferences} />
          </ProfileSection>

          <ProfileSection action="Edit" onAction={() => onEditPet("care")} title="Care preferences">
            <p className="text-sm leading-6 text-ink">{selectedPet.careNotes || "No care preferences yet."}</p>
          </ProfileSection>

          <ProfileSection action="Edit" onAction={() => onEditPet("medical")} title="Medical notes">
            <p className="text-sm leading-6 text-ink">{selectedPet.medicalNotes || "No medical notes yet."}</p>
          </ProfileSection>

          <ProfileSection action="Manage care team" onAction={onChangeVet} title="Care team">
            <CareTeamCard
              primaryProvider={primaryVet}
              secondaryProvider={secondaryVet}
              secondaryRole={selectedPet.secondaryVetRole}
            />
          </ProfileSection>

          <ProfileSection title="Sharing and access">
            <PetSharingAccess
              activeLinkCount={shareLinks.filter((link) => link.status === "Active").length}
              memberCount={petAccessMembers.filter((member) => member.status === "Active").length}
              onManage={onManageSharing}
              pet={selectedPet}
            />
          </ProfileSection>

          <ProfileSection action="Add vet note" onAction={onAddVetNote} title="Ask the vet">
            <VetPrepCard
              items={openVetPrepItems}
              onAddressed={markVetPrepAddressed}
              onCarryForward={carryVetPrepItem}
              onDismiss={dismissVetPrepItem}
            />
          </ProfileSection>
        </div>
      </div>
    </div>
  );
}

function RecordsView({
  deleteVaccine,
  documents,
  logs,
  observations,
  onAddObservation,
  onAddVaccine,
  onAddVetVisit,
  onAttachDocuments,
  onDeleteVetVisit,
  onEditVaccine,
  onLogMedication,
  onPreviewDocument,
  onRecordDetail,
  onUndo,
  onViewDocuments,
  pets,
  selectedPet,
  setSelectedPetId,
  vetProviders,
  vetVisits,
  vaccines,
}: {
  deleteVaccine: (vaccineId: string) => void;
  documents: RecordDocument[];
  logs: LogEntry[];
  observations: ObservationRecord[];
  onAddObservation: () => void;
  onAddVaccine: () => void;
  onAddVetVisit: () => void;
  onAttachDocuments: (input: {
    files: FileList | null;
    petId: string;
    recordId: string;
    recordType: DocumentRecordType;
  }) => void;
  onDeleteVetVisit: (visit: VetVisit) => void;
  onEditVaccine: (vaccine: VaccineRecord) => void;
  onLogMedication: () => void;
  onPreviewDocument: (document: RecordDocument) => void;
  onRecordDetail: (titleText: string, body: string) => void;
  onUndo: (logId: string) => void;
  onViewDocuments: () => void;
  pets: Pet[];
  selectedPet: Pet;
  setSelectedPetId: (petId: string) => void;
  vetProviders: VetProvider[];
  vetVisits: VetVisit[];
  vaccines: VaccineRecord[];
}) {
  const [showFullHistory, setShowFullHistory] = useState(false);
  const petVaccines = vaccines.filter((vaccine) => vaccine.petId === selectedPet.id);
  const petVetVisits = vetVisits.filter((visit) => visit.petId === selectedPet.id);
  const petDocuments = documents.filter((document) => document.petId === selectedPet.id);
  const petLogs = logs.filter((log) => log.petId === selectedPet.id);
  const petObservations = observations.filter((observation) => observation.petId === selectedPet.id);

  return (
    <div className="space-y-6">
      <PetSwitcher
        pets={pets}
        selectedPetId={selectedPet.id}
        setSelectedPetId={setSelectedPetId}
      />

      {showFullHistory ? (
        <TimelineView logs={petLogs} onBack={() => setShowFullHistory(false)} onUndo={onUndo} />
      ) : (
        <HealthView
          deleteVaccine={deleteVaccine}
          documents={petDocuments}
          logs={petLogs}
          observations={petObservations}
          onAddObservation={onAddObservation}
          onAddVaccine={onAddVaccine}
          onAddMedication={onLogMedication}
          onAttachDocuments={onAttachDocuments}
          onDeleteVetVisit={onDeleteVetVisit}
          onEditVaccine={onEditVaccine}
          onLogVetVisit={onAddVetVisit}
          onPreviewDocument={onPreviewDocument}
          onRecordDetail={onRecordDetail}
          onViewDocuments={onViewDocuments}
          onViewFullHistory={() => setShowFullHistory(true)}
          onUndo={onUndo}
          selectedPet={selectedPet}
          vetProviders={vetProviders}
          vetVisits={petVetVisits}
          vaccines={petVaccines}
        />
      )}
    </div>
  );
}

type HistoryFilterId = "all" | LogEntry["recordType"];

const historyFilters: { emptyText: string; id: HistoryFilterId; label: string }[] = [
  { emptyText: "No history yet.", id: "all", label: "All" },
  { emptyText: "No care history yet.", id: "care", label: "Care" },
  { emptyText: "No medication history yet.", id: "medication", label: "Meds" },
  { emptyText: "No vaccine history yet.", id: "vaccine", label: "Vaccines" },
  { emptyText: "No measurement history yet.", id: "measurement", label: "Measurements" },
  { emptyText: "No vet history yet.", id: "vet_visit", label: "Vet" },
  { emptyText: "No observation history yet.", id: "observation", label: "Observations" },
];

function TimelineView({
  logs,
  onBack,
  onUndo,
}: {
  logs: LogEntry[];
  onBack: () => void;
  onUndo: (logId: string) => void;
}) {
  const [selectedType, setSelectedType] = useState<HistoryFilterId>("all");
  const [selectedItemKey, setSelectedItemKey] = useState("all");
  const sortedLogs = [...logs].sort((a, b) => b.occurredOn.localeCompare(a.occurredOn));
  const typeLogs = selectedType === "all" ? sortedLogs : sortedLogs.filter((log) => log.recordType === selectedType);
  const itemFilters = uniqueHistoryItems(typeLogs);
  const activeItemKey = itemFilters.some((item) => item.key === selectedItemKey) ? selectedItemKey : "all";
  const visibleLogs =
    activeItemKey === "all" ? typeLogs : typeLogs.filter((log) => historyItemKey(log) === activeItemKey);
  const activeFilter = historyFilters.find((filter) => filter.id === selectedType) ?? historyFilters[0];

  return (
    <section className="space-y-3">
      <div className="flex min-h-11 items-center gap-3">
        <button
          className="inline-flex min-h-10 items-center gap-1 rounded-lg px-1 text-sm font-semibold text-ink"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Back
        </button>
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Full history</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {historyFilters.map((filter) => {
          const active = selectedType === filter.id;

          return (
            <button
              className={cn(
                "min-h-10 shrink-0 rounded-full px-3 text-sm font-semibold transition",
                active ? "bg-ink text-white" : "border border-line bg-white text-ink",
              )}
              key={filter.id}
              onClick={() => {
                setSelectedType(filter.id);
                setSelectedItemKey("all");
              }}
              type="button"
            >
              {filter.label}
            </button>
          );
        })}
      </div>
      {selectedType !== "all" && itemFilters.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <button
            className={cn(
              "min-h-10 shrink-0 rounded-full px-3 text-sm font-semibold transition",
              activeItemKey === "all" ? "bg-primary text-white" : "border border-line bg-white text-ink",
            )}
            onClick={() => setSelectedItemKey("all")}
            type="button"
          >
            All {activeFilter.label.toLowerCase()}
          </button>
          {itemFilters.map((item) => (
            <button
              className={cn(
                "min-h-10 shrink-0 rounded-full px-3 text-sm font-semibold transition",
                activeItemKey === item.key ? "bg-primary text-white" : "border border-line bg-white text-ink",
              )}
              key={item.key}
              onClick={() => setSelectedItemKey(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="rounded-lg border border-line bg-surface p-4">
        {visibleLogs.length === 0 ? (
          <p className="text-sm leading-6 text-muted">
            {activeItemKey === "all" ? activeFilter.emptyText : "No history for this item yet."}
          </p>
        ) : (
          <div className="space-y-3">
            {visibleLogs.map((log) => (
              <TimelineRow key={log.id} log={log} onUndo={onUndo} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function historyItemKey(log: LogEntry) {
  return `${log.recordType}:${log.recordId ?? log.taskId ?? slugify(log.title)}`;
}

function uniqueHistoryItems(logs: LogEntry[]) {
  const items = new Map<string, string>();

  logs.forEach((log) => {
    const key = historyItemKey(log);
    if (!items.has(key)) items.set(key, log.title);
  });

  return Array.from(items, ([key, label]) => ({ key, label }));
}

function HealthView({
  deleteVaccine,
  documents,
  logs,
  observations,
  onAddObservation,
  onAddVaccine,
  onAddMedication,
  onAttachDocuments,
  onDeleteVetVisit,
  onEditVaccine,
  onLogVetVisit,
  onPreviewDocument,
  onRecordDetail,
  onUndo,
  onViewDocuments,
  onViewFullHistory,
  selectedPet,
  vetProviders,
  vetVisits,
  vaccines,
}: {
  deleteVaccine: (vaccineId: string) => void;
  documents: RecordDocument[];
  logs: LogEntry[];
  observations: ObservationRecord[];
  onAddObservation: () => void;
  onAddVaccine: () => void;
  onAddMedication: () => void;
  onAttachDocuments: (input: {
    files: FileList | null;
    petId: string;
    recordId: string;
    recordType: DocumentRecordType;
  }) => void;
  onDeleteVetVisit: (visit: VetVisit) => void;
  onEditVaccine: (vaccine: VaccineRecord) => void;
  onLogVetVisit: () => void;
  onPreviewDocument: (document: RecordDocument) => void;
  onRecordDetail: (titleText: string, body: string) => void;
  onUndo: (logId: string) => void;
  onViewDocuments: () => void;
  onViewFullHistory: () => void;
  selectedPet: Pet;
  vetProviders: VetProvider[];
  vetVisits: VetVisit[];
  vaccines: VaccineRecord[];
}) {
  const spend = totalVetSpend(vetVisits);
  const medicationLogs = logs.filter((log) => log.recordType === "medication");
  const recentHealthLogs = logs
    .filter((log) => ["medication", "vaccine", "measurement", "vet_visit", "observation"].includes(log.recordType))
    .slice(0, 4);
  return (
    <section className="space-y-6">
      <section className="space-y-3">
        <SectionTitle title="Health shortcuts" />
        <HealthShortcutStrip onViewDocuments={onViewDocuments} />
      </section>

      <section className="scroll-mt-36 space-y-3" id="health-vaccines">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Vaccines</h2>
          <button className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-primary" onClick={onAddVaccine} type="button">
            Add vaccine
          </button>
        </div>
        <div className="grid gap-3">
          {vaccines.length === 0 ? (
            <p className="rounded-lg border border-line bg-surface p-4 text-sm leading-6 text-muted">No vaccine records yet.</p>
          ) : (
            vaccines.map((vaccine) => {
              const attachedDocuments = documents.filter(
                (document) =>
                  document.recordType === "vaccine_record" && document.recordId === vaccine.id,
              );
              const latestProof = latestDocument(attachedDocuments);
              const olderProofFiles = latestProof
                ? attachedDocuments.filter((document) => document.id !== latestProof.id)
                : [];

              return (
                <article className="rounded-lg border border-line bg-surface p-4 shadow-sm" key={vaccine.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <ShieldCheck aria-hidden className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-base font-semibold text-ink">{vaccine.name}</h3>
                          <StatusPill status={vaccine.status === "current" ? "Current" : "Due soon"} />
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <AttachDocumentButton iconOnly label="Add proof" onAttach={(files) =>
                        onAttachDocuments({
                          files,
                          petId: selectedPet.id,
                          recordId: vaccine.id,
                          recordType: "vaccine_record",
                        })
                      } />
                      <IconButton icon={Pencil} label="Edit vaccine" onClick={() => onEditVaccine(vaccine)} />
                      <IconButton icon={Trash2} label="Delete vaccine" onClick={() => deleteVaccine(vaccine.id)} />
                    </div>
                  </div>
                  <p className="mt-3 break-words text-sm leading-5 text-muted">{vaccine.protectsAgainst}</p>
                  <p className="mt-2 break-words text-xs font-medium leading-5 text-muted">
                    Given {vaccine.dateGiven} - Expires {vaccine.expires} - {vaccine.provider}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    Add proof uploads a new file. Older files stay saved.
                  </p>
                  {latestProof ? (
                    <VaccineProofFiles
                      latestDocument={latestProof}
                      olderDocuments={olderProofFiles}
                      onPreview={onPreviewDocument}
                    />
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="scroll-mt-36 space-y-3" id="health-meds">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Medications</h2>
          <button className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-primary" onClick={onAddMedication} type="button">
            Add medication
          </button>
        </div>
        <div className="rounded-lg border border-line bg-surface p-4">
          {medicationLogs.length === 0 ? (
            <p className="text-sm leading-6 text-muted">No medication history yet.</p>
          ) : (
            <div className="space-y-3">
              {medicationLogs.slice(0, 3).map((log) => (
                <TimelineRow key={log.id} log={log} onUndo={onUndo} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="scroll-mt-36 space-y-3" id="health-vet-care">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Vet care</h2>
          <button className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-primary" onClick={onLogVetVisit} type="button">
            Log vet visit
          </button>
        </div>
      <VetSpendSummary
        recentCost={vetVisits[0]?.totalCost ? formatCurrency(vetVisits[0].totalCost, vetVisits[0].currency) : "None yet"}
        totalSpend={formatCurrency(String(spend)) || "$0.00"}
        visitCount={vetVisits.length}
      />
        <div className="grid gap-3">
          {vetVisits.length === 0 ? (
            <p className="rounded-lg border border-line bg-surface p-4 text-sm leading-6 text-muted">No vet visits logged yet.</p>
          ) : (
            vetVisits.map((visit) => {
              const provider = vetProviders.find((item) => item.id === visit.vetProviderId);
              const visitDocuments = documents.filter(
                (document) =>
                  document.recordType === "vet_visit" && document.recordId === visit.id,
              );
              return (
                <article className="min-w-0 overflow-hidden rounded-lg border border-line bg-surface p-4 shadow-sm lg:p-5" key={visit.id}>
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <HeartPulse aria-hidden className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-base font-semibold text-ink">{visit.reason}</h3>
                      <p className="mt-1 text-sm text-muted">{provider?.name ?? "Vet not set"} - {visit.createdLabel}</p>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <PetFact
                          label="Total cost"
                          value={visit.totalCost ? formatCurrency(visit.totalCost, visit.currency) : "Not logged"}
                        />
                        <PetFact label="Services" value={`${visit.servicesPerformed.length}`} />
                      </div>
                      {visit.servicesPerformed.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {visit.servicesPerformed.map((service) => (
                            <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-ink" key={service}>
                              {service}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {visit.notes ? <p className="mt-3 break-words text-sm leading-6 text-muted">{visit.notes}</p> : null}
                      {visit.followUpDate ? (
                        <p className="mt-3 rounded-lg bg-background px-3 py-2 text-sm font-semibold text-ink">
                          Follow up: {formatDateForDisplay(visit.followUpDate)}
                        </p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <AttachDocumentButton iconOnly label="Attach bill" onAttach={(files) =>
                          onAttachDocuments({
                            files,
                            petId: selectedPet.id,
                            recordId: visit.id,
                            recordType: "vet_visit",
                          })
                        } />
                        <SmallButton icon={Pencil} label="Edit" onClick={() => onRecordDetail("Edit vet visit", "Vet visit editing will update services, total cost, bill attachments, reason, notes, provider, and follow-up date.")} />
                        <SmallButton icon={Trash2} label="Delete" onClick={() => onDeleteVetVisit(visit)} />
                      </div>
                      {visitDocuments.length > 0 ? (
                        <div className="mt-3">
                          <DocumentList
                            documents={visitDocuments}
                            emptyText="No bill attached."
                            onPreview={onPreviewDocument}
                            compact
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="scroll-mt-36 space-y-3" id="health-observations">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Observations</h2>
          <button className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-primary" onClick={onAddObservation} type="button">
            Log observation
          </button>
        </div>
        <div className="mt-3 grid gap-3">
          {observations.length === 0 ? (
            <p className="rounded-lg border border-line bg-surface p-4 text-sm leading-6 text-muted">No observations logged yet.</p>
          ) : (
            observations.map((observation) => (
              <article className="rounded-lg border border-line bg-surface p-4 shadow-sm lg:p-5" key={observation.id}>
                <div className="flex items-start gap-3">
                  <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-lg", severityTone(observation.severity).icon)}>
                    <ClipboardList aria-hidden className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="break-words text-base font-semibold text-ink">{observation.title}</h3>
                        <p className="mt-1 text-sm text-muted">
                          {capitalize(observation.category)} - {observation.createdLabel}
                        </p>
                      </div>
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", severityTone(observation.severity).pill)}>
                        {capitalize(observation.severity)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <FactRow label="Trigger" value={observation.trigger || "Not set"} />
                      <FactRow label="Duration" value={observation.duration || "Not set"} />
                    </div>
                    {observation.medicationStatus ? (
                      <p className="mt-3 rounded-lg bg-background px-3 py-2 text-sm font-semibold text-ink">
                        {observation.medicationStatus}
                      </p>
                    ) : null}
                    {observation.notes ? <p className="mt-3 break-words text-sm leading-6 text-muted">{observation.notes}</p> : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="scroll-mt-36 space-y-3" id="health-history">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Recent history</h2>
          <div className="flex shrink-0 gap-2">
            <button className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-primary" onClick={onViewDocuments} type="button">
              All documents
            </button>
            <button className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-primary" onClick={onViewFullHistory} type="button">
              Full history
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-4">
          {recentHealthLogs.length === 0 ? (
            <p className="text-sm leading-6 text-muted">No health history yet.</p>
          ) : (
            <div className="space-y-3">
              {recentHealthLogs.map((log) => (
                <TimelineRow key={log.id} log={log} onUndo={onUndo} />
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

function TimelineRow({ log, onUndo }: { log: LogEntry; onUndo: (logId: string) => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-background p-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Check aria-hidden className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{log.title}</p>
        <p className="mt-1 text-sm text-muted">
          {log.createdLabel}
          {log.value ? ` - ${log.value}` : ""}
        </p>
        {log.dueDate && log.completedTiming ? (
          <p className="mt-1 text-xs font-semibold text-muted">{completionTimingLabel(log)}</p>
        ) : null}
        {log.details ? <p className="mt-1 text-sm text-muted">{log.details}</p> : null}
      </div>
      <button
        className="min-h-10 rounded-lg px-2 text-sm font-semibold text-primary"
        onClick={() => onUndo(log.id)}
        type="button"
      >
        Undo
      </button>
    </div>
  );
}

function PetSwitcher({
  actionLabel,
  onAction,
  pets,
  selectedPetId,
  setSelectedPetId,
  showTitle = true,
}: {
  actionLabel?: string;
  onAction?: () => void;
  pets: Pet[];
  selectedPetId: string;
  setSelectedPetId: (petId: string) => void;
  showTitle?: boolean;
}) {
  if (pets.length <= 1 && showTitle) {
    if (!onAction) return null;

    return (
      <section className="flex min-h-11 items-center justify-between gap-3">
        <SectionTitle title="Pets" />
        <button
          className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-primary"
          onClick={onAction}
          type="button"
        >
          Add more +
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {showTitle ? <SectionTitle title="Pets" /> : null}
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
        {pets.map((pet) => {
          const selected = pet.id === selectedPetId;
          return (
            <button
              aria-current={selected ? "true" : undefined}
              className={cn(
                "flex min-h-16 min-w-[148px] items-center gap-3 rounded-lg border px-3 text-left transition lg:min-w-48",
                selected
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-line bg-surface active:bg-primary/5",
              )}
              key={pet.id}
              onClick={() => setSelectedPetId(pet.id)}
              type="button"
            >
              <PetAvatar pet={pet} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{pet.name}</span>
                <span className="block truncate text-xs capitalize text-muted">{pet.species}</span>
              </span>
            </button>
          );
        })}
        {onAction ? (
          <button
            aria-label={actionLabel}
            className="grid h-16 min-w-16 place-items-center rounded-lg border border-dashed border-primary/50 bg-primary/5 text-primary"
            onClick={onAction}
            type="button"
          >
            <Plus aria-hidden className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </section>
  );
}

function AppModal({ children, modal, onClose }: { children: React.ReactNode; modal: ModalState; onClose: () => void }) {
  if (!modal) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/30 p-0 sm:items-center sm:justify-center sm:p-6"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-lg bg-surface p-5 shadow-xl sm:max-w-lg sm:rounded-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 -mx-5 -mt-5 mb-4 flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-4">
          <p className="text-lg font-semibold text-ink">{modal.title}</p>
          <button aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white" onClick={onClose} type="button">
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        <div className="pt-2">{children}</div>
      </div>
    </div>
  );
}

function AddPetForm({
  onSubmit,
}: {
  onSubmit: (input: PetFormSubmitInput) => void;
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const photoInput = event.currentTarget.elements.namedItem("petPhoto") as HTMLInputElement | null;
      onSubmit({
        name: String(form.get("name") || ""),
        species: String(form.get("species") || "dog") as PetSpecies,
        breed: String(form.get("breed") || ""),
        ageLabel: String(form.get("ageLabel") || ""),
        dateOfBirth: String(form.get("dateOfBirth") || ""),
        weight: formatWeightDisplay(String(form.get("weightValue") || ""), String(form.get("weightUnit") || "lb") === "kg" ? "kg" : "lb"),
        weightUnit: String(form.get("weightUnit") || "lb") === "kg" ? "kg" : "lb",
        weightValue: String(form.get("weightValue") || ""),
        behaviorNotes: String(form.get("behaviorNotes") || ""),
        photoFile: photoInput?.files?.[0] ?? null,
      });
    }}>
      <FormField label="Pet name" name="name" placeholder="Milo" required />
      <label className="block text-sm font-semibold text-ink">
        Species
        <select className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3" name="species">
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
        </select>
      </label>
      <FormField label="Breed" name="breed" placeholder="Domestic shorthair" />
      <FormField label="Birth date" name="dateOfBirth" type="date" />
      <WeightInputFields label="Weight" />
      <PhotoFileField label="Pet photo" name="petPhoto" />
      <TextAreaField label="Behavior notes" name="behaviorNotes" placeholder="Temperament, triggers, leash behavior, routines" />
      <SubmitButton label="Add pet" />
    </form>
  );
}

function ArchivePetForm({
  onCancel,
  onSubmit,
  pet,
}: {
  onCancel: () => void;
  onSubmit: (input: ArchivePetInput) => void;
  pet: Pet;
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit({
        notes: String(form.get("notes") || ""),
        reason: String(form.get("reason") || "other") as ArchivePetInput["reason"],
      });
    }}>
      <div className="rounded-lg bg-background p-3 text-sm leading-6 text-muted">
        Archive {pet.name} if this pet is no longer active in your household. Records, documents, measurements, and history stay saved.
      </div>
      <SelectField defaultValue="no-longer-owned" label="Reason" name="reason">
        <option value="passed-away">Passed away</option>
        <option value="no-longer-owned">No longer in my care</option>
        <option value="other">Other</option>
      </SelectField>
      <TextAreaField label="Notes" name="notes" placeholder="Optional context for this archive" />
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          className="min-h-11 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button className="min-h-11 rounded-lg bg-ink px-4 text-sm font-semibold text-white" type="submit">
          Archive pet
        </button>
      </div>
    </form>
  );
}

function EditProfilesPanel({
  archivedPets,
  onArchive,
  onDelete,
  onRestore,
  onViewArchived,
  pets,
}: {
  archivedPets: Pet[];
  onArchive: (pet: Pet) => void;
  onDelete: (pet: Pet) => void;
  onRestore: (pet: Pet) => void;
  onViewArchived: (pet: Pet) => void;
  pets: Pet[];
}) {
  return (
    <div className="space-y-5">
      <p className="rounded-lg bg-background px-3 py-2 text-sm leading-6 text-muted">
        Archive hides a pet from daily care but keeps it restorable. Delete removes the profile from the app and is not shown again.
      </p>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Active profiles</p>
        {pets.length === 0 ? (
          <p className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-muted">No active pet profiles.</p>
        ) : (
          pets.map((pet) => (
            <PetProfileManagerRow
              actions={
                <>
                  <button className="min-h-10 px-2 text-sm font-semibold text-muted" onClick={() => onArchive(pet)} type="button">
                    Archive
                  </button>
                  <button className="min-h-10 px-2 text-sm font-semibold text-red-600" onClick={() => onDelete(pet)} type="button">
                    Delete
                  </button>
                </>
              }
              key={pet.id}
              meta={pet.createdLabel ? `Added ${pet.createdLabel}` : undefined}
              pet={pet}
            />
          ))
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Archived profiles</p>
        {archivedPets.length === 0 ? (
          <p className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-muted">No archived pet profiles.</p>
        ) : (
          archivedPets.map((pet) => (
            <PetProfileManagerRow
              actions={
                <>
                  <button className="min-h-10 px-2 text-sm font-semibold text-primary" onClick={() => onViewArchived(pet)} type="button">
                    View
                  </button>
                  <button className="min-h-10 px-2 text-sm font-semibold text-primary" onClick={() => onRestore(pet)} type="button">
                    Restore
                  </button>
                </>
              }
              key={pet.id}
              meta={archivedPetProfileMeta(pet)}
              pet={pet}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PetProfileManagerRow({
  actions,
  meta,
  pet,
}: {
  actions: React.ReactNode;
  meta?: string;
  pet: Pet;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-line bg-white p-3">
      <div className="flex min-w-0 items-center gap-3">
        <PetAvatar pet={pet} size="xs" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{pet.name}</p>
          <p className="truncate text-xs capitalize text-muted">{meta ?? pet.species}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">{actions}</div>
    </div>
  );
}

function ArchivedPetDetail({
  documents,
  measurements,
  onBack,
  pet,
}: {
  documents: RecordDocument[];
  measurements: MeasurementSnapshot[];
  onBack: () => void;
  pet: Pet;
}) {
  const latestMeasurement = measurements[0];

  return (
    <div className="space-y-4">
      <button className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary" onClick={onBack} type="button">
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Back
      </button>
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <div className="relative h-44">
          <Image alt={`${pet.name}, ${pet.breed}`} className="h-full w-full object-cover" fill sizes="(max-width: 640px) 100vw, 480px" src={pet.photo} />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
            <p className="text-sm capitalize text-white/80">{pet.species}</p>
            <h2 className="truncate text-3xl font-semibold leading-none">{pet.name}</h2>
          </div>
        </div>
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-2">
            <FactRow label="Breed" value={pet.breed} />
            <FactRow label="Age" value={pet.ageLabel} />
            <FactRow label="Weight" value={pet.weight} />
            <FactRow label="Sex" value={capitalize(pet.sex)} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Archived</p>
            <p className="mt-1 text-sm text-ink">
              {archiveReasonLabel(pet.archivedReason)}{pet.archivedAt ? ` - ${formatDateForDisplay(pet.archivedAt.slice(0, 10))}` : ""}
            </p>
            {pet.archivedNotes ? <p className="mt-2 text-sm leading-6 text-muted">{pet.archivedNotes}</p> : null}
          </div>
        </div>
      </div>

      <ProfileSection title="Background">
        <BackgroundDetails background={pet.background} />
      </ProfileSection>

      <ProfileSection title="Measurements">
        {latestMeasurement ? (
          <div className="rounded-lg bg-background p-3">
            <p className="text-sm font-semibold text-ink">{measurementSnapshotSummary(latestMeasurement)}</p>
            <p className="mt-1 text-xs text-muted">{latestMeasurement.createdLabel}</p>
            <MeasurementValueGrid measurement={latestMeasurement} />
          </div>
        ) : (
          <p className="rounded-lg bg-background px-3 py-2 text-sm text-muted">No measurements saved.</p>
        )}
      </ProfileSection>

      <ProfileSection title="Documents">
        <DocumentList compact documents={documents} emptyText="No documents saved for this pet." />
      </ProfileSection>

      <ProfileSection title="Notes">
        <div className="space-y-3 text-sm leading-6 text-muted">
          <p>{pet.behaviorNotes || "No behavior notes saved."}</p>
          <p>{pet.careNotes || "No care notes saved."}</p>
          <p>{pet.medicalNotes || "No medical notes saved."}</p>
        </div>
      </ProfileSection>
    </div>
  );
}

function EditPetSectionForm({
  onSubmit,
  pet,
  section,
}: {
  onSubmit: (pet: Pet, photoFile?: File | null) => void;
  pet: Pet;
  section: PetEditSection;
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const next = { ...pet };

      if (section === "profile") {
        const weightUnit = String(form.get("weightUnit") || pet.weightUnit || "lb") === "kg" ? "kg" : "lb";
        const weightValue = String(form.get("weightValue") || "");
        const dateOfBirth = String(form.get("dateOfBirth") || "");
        next.name = String(form.get("name") || pet.name);
        next.breed = String(form.get("breed") || pet.breed);
        next.dateOfBirth = dateOfBirth || undefined;
        next.ageLabel = dateOfBirth ? calculateAgeLabelFromBirthDate(dateOfBirth) : pet.ageLabel;
        next.ageEstimated = !dateOfBirth;
        next.weightValue = weightValue || undefined;
        next.weightUnit = weightUnit;
        next.weight = formatWeightDisplay(weightValue, weightUnit, pet.weight);
        next.sex = String(form.get("sex") || pet.sex) === "female" ? "female" : "male";
        next.dynamicFields = pet.dynamicFields.map((field) => ({
          label: field.label,
          value: String(form.get(`field-${field.label}`) || field.value),
        }));
      }

      if (section === "training") {
        next.trainingCues = (pet.trainingCues ?? []).map((cue) => ({
          id: cue.id,
          cue: String(form.get(`cue-${cue.id}`) || cue.cue),
          action: String(form.get(`action-${cue.id}`) || cue.action),
        }));
      }

      if (section === "background") {
        next.background = {
          adoptionPlace: String(form.get("adoptionPlace") || ""),
          adoptionDate: String(form.get("adoptionDate") || ""),
          spayedNeutered: form.get("spayedNeutered") === "on",
          microchipped: form.get("microchipped") === "on",
          microchipNumber: String(form.get("microchipNumber") || ""),
          knownHistory: String(form.get("knownHistory") || ""),
        };
      }

      if (section === "food") {
        next.foodPreferences = {
          favorites: splitPreferenceList(String(form.get("favorites") || "")),
          dislikes: splitPreferenceList(String(form.get("dislikes") || "")),
          rules: splitPreferenceList(String(form.get("rules") || "")),
        };
      }

      if (section === "behavior") next.behaviorNotes = String(form.get("behaviorNotes") || "");
      if (section === "care") next.careNotes = String(form.get("careNotes") || "");
      if (section === "medical") next.medicalNotes = String(form.get("medicalNotes") || "");
      const photoInput = event.currentTarget.elements.namedItem("petPhoto") as HTMLInputElement | null;
      onSubmit(next, section === "profile" ? (photoInput?.files?.[0] ?? null) : null);
    }}>
      {section === "profile" ? (
        <>
          <FormField defaultValue={pet.name} label="Pet name" name="name" required />
          <PhotoFileField currentUrl={pet.photo} label="Change photo" name="petPhoto" />
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField defaultValue={pet.breed} label="Breed" name="breed" />
            <FormField defaultValue={pet.dateOfBirth} label="Birth date" name="dateOfBirth" type="date" />
            <WeightInputFields defaultUnit={pet.weightUnit ?? "lb"} defaultValue={pet.weightValue ?? ""} label="Weight" />
            <SelectField defaultValue={pet.sex} label="Sex" name="sex">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </SelectField>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {pet.dynamicFields.map((field) => (
              <FormField defaultValue={field.value} key={field.label} label={field.label} name={`field-${field.label}`} />
            ))}
          </div>
        </>
      ) : null}
      {section === "background" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField defaultValue={pet.background.adoptionPlace} label="Adoption place" name="adoptionPlace" />
            <FormField defaultValue={pet.background.adoptionDate} label="Adoption date" name="adoptionDate" type="date" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <CheckboxField defaultChecked={pet.background.spayedNeutered} label="Spayed/neutered" name="spayedNeutered" />
            <CheckboxField defaultChecked={pet.background.microchipped} label="Microchipped" name="microchipped" />
          </div>
          <FormField defaultValue={pet.background.microchipNumber} label="Microchip number" name="microchipNumber" />
          <TextAreaField defaultValue={pet.background.knownHistory} label="Known history" name="knownHistory" />
        </>
      ) : null}
      {section === "training" ? (
        <div className="grid gap-4">
          {(pet.trainingCues ?? []).map((cue) => (
            <div className="grid gap-3 rounded-lg bg-background p-3 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]" key={cue.id}>
              <FormField defaultValue={cue.cue} label="Cue word" name={`cue-${cue.id}`} />
              <FormField defaultValue={cue.action} label="Meaning / action" name={`action-${cue.id}`} />
            </div>
          ))}
          {(pet.trainingCues ?? []).length === 0 ? (
            <p className="rounded-lg bg-background px-3 py-2 text-sm text-muted">No training cues yet.</p>
          ) : null}
        </div>
      ) : null}
      {section === "food" ? (
        <>
          <TextAreaField defaultValue={pet.foodPreferences.favorites.join(", ")} label="Favorites" name="favorites" placeholder="Dried lamb treats, Greek yogurt, sweet potato" />
          <TextAreaField defaultValue={pet.foodPreferences.dislikes.join(", ")} label="Not a fan" name="dislikes" placeholder="Bananas" />
          <TextAreaField defaultValue={pet.foodPreferences.rules.join(", ")} label="House rules" name="rules" placeholder="No regular table food to reduce begging" />
        </>
      ) : null}
      {section === "behavior" ? <TextAreaField defaultValue={pet.behaviorNotes} label="Behavior" name="behaviorNotes" /> : null}
      {section === "care" ? <TextAreaField defaultValue={pet.careNotes} label="Care preferences" name="careNotes" /> : null}
      {section === "medical" ? <TextAreaField defaultValue={pet.medicalNotes} label="Medical notes" name="medicalNotes" /> : null}
      <SubmitButton label="Save changes" />
    </form>
  );
}

function VetPrepItemForm({
  onSubmit,
}: {
  onSubmit: (input: { title: string; details: string; observedOn: string }) => void;
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit({
        title: String(form.get("title") || ""),
        details: String(form.get("details") || ""),
        observedOn: String(form.get("observedOn") || todayValue),
      });
    }}>
      <FormField label="What did you notice?" name="title" placeholder="Licking paws after walks" required />
      <TextAreaField label="Details" name="details" placeholder="When it happens, how often, what changed, or what you want to ask." />
      <FormField defaultValue={todayValue} label="Observed on" name="observedOn" type="date" />
      <SubmitButton label="Add vet note" />
    </form>
  );
}

function ManageCareTeamForm({
  onAddProvider,
  onEditProvider,
  onSubmit,
  pet,
  providers,
}: {
  onAddProvider: () => void;
  onEditProvider: (provider: VetProvider) => void;
  onSubmit: (input: { primaryVetId: string; secondaryVetId: string; secondaryVetRole: string }) => void;
  pet: Pet;
  providers: VetProvider[];
}) {
  const [primaryVetId, setPrimaryVetId] = useState(pet.primaryVetId ?? "");
  const showSecondary = providers.length > 1 || Boolean(pet.secondaryVetId);
  const secondaryOptions = providers.filter((provider) => provider.id !== primaryVetId);

  return (
    <div className="space-y-5">
      <form className="space-y-4" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onSubmit({
          primaryVetId,
          secondaryVetId: String(form.get("secondaryVetId") || ""),
          secondaryVetRole: String(form.get("secondaryVetRole") || ""),
        });
      }}>
        <label className="block text-sm font-semibold text-ink">
          Primary vet
          <select
            className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3"
            name="primaryVetId"
            onChange={(event) => setPrimaryVetId(event.target.value)}
            value={primaryVetId}
          >
          <option value="">No primary vet</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
          </select>
        </label>
        {showSecondary ? (
          <>
            <SelectField defaultValue={pet.secondaryVetId === primaryVetId ? "" : pet.secondaryVetId ?? ""} label="Secondary vet" name="secondaryVetId">
              <option value="">No secondary vet</option>
              {secondaryOptions.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </SelectField>
            <FormField defaultValue={pet.secondaryVetRole ?? ""} label="Secondary role" name="secondaryVetRole" placeholder="Behavior vet" />
          </>
        ) : null}
        <SubmitButton label="Save care team" />
      </form>

      <section className="space-y-3 rounded-lg border border-line bg-background p-3">
        <div className="flex min-h-10 items-center justify-between gap-2">
          <h3 className="min-w-0 text-xs font-semibold uppercase tracking-[0.1em] text-muted">Saved vets and clinics</h3>
          <button
            className="min-h-10 shrink-0 whitespace-nowrap rounded-lg px-2 text-sm font-semibold text-primary"
            onClick={onAddProvider}
            type="button"
          >
            + Add Provider
          </button>
        </div>
        <div className="divide-y divide-line rounded-lg border border-line bg-surface px-3">
          {providers.map((provider) => {
            const details = [
              formatProviderAddress(provider.address),
              formatProviderPhone(provider.phone),
              formatProviderLinkLabel(provider.website),
            ].filter(Boolean);
            return (
              <div className="flex min-w-0 items-center gap-3 py-3" key={provider.id}>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-ink">{provider.name}</p>
                  {details.length > 0 ? (
                    <div className="mt-1 space-y-0.5">
                      {details.map((detail) => (
                        <p className="break-words text-xs leading-5 text-muted" key={detail}>{detail}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs leading-5 text-muted">No contact details yet.</p>
                  )}
                </div>
                <IconButton icon={Pencil} label={`Edit ${provider.name}`} onClick={() => onEditProvider(provider)} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function VetProviderForm({
  onBack,
  onSubmit,
  provider,
}: {
  onBack?: () => void;
  onSubmit: (provider: VetProviderFormInput) => void;
  provider?: VetProvider;
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit({
        name: String(form.get("name") || provider?.name || ""),
        phone: String(form.get("phone") || ""),
        address: String(form.get("address") || ""),
        website: String(form.get("website") || ""),
        notes: String(form.get("notes") || ""),
      });
    }}>
      {onBack ? (
        <button className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary" onClick={onBack} type="button">
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Back to care team
        </button>
      ) : null}
      <FormField defaultValue={provider?.name} label="Clinic or vet name" name="name" required />
      <FormField defaultValue={provider?.phone} label="Phone" name="phone" inputMode="tel" />
      <FormField defaultValue={provider?.address} label="Address" name="address" />
      <FormField defaultValue={provider?.website} label="Website" name="website" inputMode="url" />
      <TextAreaField defaultValue={provider?.notes} label="Notes" name="notes" />
      <SubmitButton label={provider ? "Save vet" : "Add vet or clinic"} />
    </form>
  );
}

function OwnerProfileForm({
  appMode,
  authEmail,
  isAuthenticated,
  onSubmit,
  ownerProfile,
}: {
  appMode: PawChartDataMode;
  authEmail: string | null;
  isAuthenticated: boolean;
  onSubmit: (ownerProfile: OwnerProfile) => void;
  ownerProfile: OwnerProfile;
}) {
  const isLocalDemo = appMode === "local-demo";

  return (
    <div className="space-y-4">
      <form className="space-y-4" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onSubmit({
          ...ownerProfile,
          firstName: String(form.get("firstName") || ""),
          lastName: String(form.get("lastName") || ""),
          email: String(form.get("email") || ""),
          phone: String(form.get("phone") || ""),
          city: String(form.get("city") || ""),
        });
      }}>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField defaultValue={ownerProfile.firstName} label="First name" name="firstName" required />
          <FormField defaultValue={ownerProfile.lastName} label="Last name" name="lastName" />
        </div>
        <FormField defaultValue={ownerProfile.email} label="Email" name="email" inputMode="email" type="email" />
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField defaultValue={ownerProfile.phone} label="Phone" name="phone" inputMode="tel" />
          <FormField defaultValue={ownerProfile.city} label="City" name="city" />
        </div>
        <p className="rounded-lg bg-background p-3 text-sm leading-6 text-muted">
          {isLocalDemo
            ? isAuthenticated
              ? `Signed in with Google${authEmail ? ` as ${authEmail}` : ""}. Local demo records remain active in development.`
              : "Local demo profile only. Sign in with Google to test the auth session."
            : `Signed in with Google${authEmail ? ` as ${authEmail}` : ""}.`}
        </p>
        <SubmitButton label="Save your info" />
      </form>
      <p className="rounded-lg bg-background p-3 text-sm leading-6 text-muted">
        {isLocalDemo
          ? "Email and identity come from Google OAuth. Editable fields are still local demo profile state until profile persistence is wired."
          : "Email and identity come from Google OAuth. Profile details are ready to map to Supabase profile persistence."}
      </p>
      {isAuthenticated ? (
        <form action={signOut}>
          <button className="min-h-11 w-full rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink" type="submit">
            Sign out
          </button>
        </form>
      ) : null}
    </div>
  );
}

function VetVisitForm({
  onPrepAction,
  onSubmit,
  prepItems,
  providers,
  selectedProviderId,
}: {
  onPrepAction: (action: "addressed" | "carry" | "dismissed", itemId: string) => void;
  onSubmit: (input: {
    vetProviderId: string;
    visitedOn: string;
    reason: string;
    notes: string;
    followUpDate: string;
    totalCost: string;
    servicesPerformed: string[];
    billDocument?: {
      title: string;
      fileType: "pdf" | "image";
      sizeLabel: string;
    };
  }) => void;
  prepItems: VetPrepItem[];
  providers: VetProvider[];
  selectedProviderId?: string;
}) {
  return (
    <form className="space-y-5" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const billFile = form.get("billFile");
      const billDocument =
        billFile instanceof File && billFile.size > 0
          ? {
              title: billFile.name,
              fileType: billFile.type === "application/pdf" ? ("pdf" as const) : ("image" as const),
              sizeLabel: formatFileSize(billFile.size),
            }
          : undefined;
      onSubmit({
        vetProviderId: String(form.get("vetProviderId") || selectedProviderId || providers[0]?.id || ""),
        visitedOn: String(form.get("visitedOn") || todayValue),
        reason: String(form.get("reason") || ""),
        notes: String(form.get("notes") || ""),
        followUpDate: String(form.get("followUpDate") || ""),
        totalCost: String(form.get("totalCost") || ""),
        servicesPerformed: String(form.get("servicesPerformed") || "")
          .split(",")
          .map((service) => service.trim())
          .filter(Boolean),
        billDocument,
      });
    }}>
      <FormField defaultValue={todayValue} label="Visit date" name="visitedOn" type="date" />
      <SelectField defaultValue={selectedProviderId ?? providers[0]?.id ?? ""} label="Vet / provider" name="vetProviderId">
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
          </option>
        ))}
      </SelectField>
      <FormField label="Reason" name="reason" placeholder="Skin check, annual exam, follow-up" required />
      <FormField inputMode="decimal" label="Total cost" name="totalCost" placeholder="186.40" />
      <TextAreaField
        label="Services performed"
        name="servicesPerformed"
        placeholder="Wellness exam, Rabies vaccine, Fecal test, Ear medication"
      />
      <FileField label="Attach final bill" name="billFile" />
      <TextAreaField label="Notes" name="notes" placeholder="What the vet said, treatment plan, or next steps" />
      <FormField label="Follow-up date" name="followUpDate" type="date" />
      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Ask the vet card</p>
        <VetPrepCard
          items={prepItems}
          onAddressed={(itemId) => onPrepAction("addressed", itemId)}
          onCarryForward={(itemId) => onPrepAction("carry", itemId)}
          onDismiss={(itemId) => onPrepAction("dismissed", itemId)}
        />
      </div>
      <SubmitButton label="Save vet visit" />
    </form>
  );
}

function AddVaccineForm({
  onSubmit,
  vaccine,
}: {
  onSubmit: (input: {
    name: string;
    protectsAgainst: string;
    dateGiven: string;
    expires: string;
    provider: string;
  }) => void;
  vaccine?: VaccineRecord;
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit({
        name: String(form.get("name") || ""),
        protectsAgainst: String(form.get("protectsAgainst") || ""),
        dateGiven: String(form.get("dateGiven") || todayValue),
        expires: String(form.get("expires") || todayValue),
        provider: String(form.get("provider") || ""),
      });
    }}>
      <FormField defaultValue={vaccine?.name} label="Vaccine name" name="name" placeholder="Rabies" required />
      <FormField defaultValue={vaccine?.protectsAgainst} label="Protects against" name="protectsAgainst" placeholder="Rabies virus" />
      <FormField label="Date given" name="dateGiven" type="date" defaultValue={todayValue} />
      <FormField label="Expiration date" name="expires" type="date" defaultValue={todayValue} />
      <FormField defaultValue={vaccine?.provider} label="Provider" name="provider" placeholder="Parkside Vet" />
      <SubmitButton label={vaccine ? "Save vaccine" : "Add vaccine"} />
    </form>
  );
}

function CareTypeForm({
  careEvent,
  onSubmit,
}: {
  careEvent?: CareEvent;
  onSubmit: (input: { label: string; defaultAction: string }) => void;
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit({
        label: String(form.get("label") || ""),
        defaultAction: careEvent?.defaultAction || "Log today",
      });
    }}>
      <FormField defaultValue={careEvent?.label} label="Care type" name="label" placeholder="Ear cleaning" required />
      <SubmitButton label={careEvent ? "Save care type" : "Add care type"} />
    </form>
  );
}

function ConfirmDeleteForm({
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted">{body}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          className="min-h-11 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="min-h-11 rounded-lg bg-ink px-4 text-sm font-semibold text-white"
          onClick={onConfirm}
          type="button"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

function ScheduleCareForm({
  initialDueDate,
  onSubmit,
  pets,
  providers,
  selectedPetId,
  task,
}: {
  initialDueDate?: string;
  onSubmit: (input: {
    actionLabel: string;
    cadence: Task["cadence"];
    doseLabel: string;
    dueDate: string;
    notes: string;
    petId: string;
    providerId: string;
    refillByDate: string;
    reminderKind: Task["reminderKind"];
    title: string;
    type: Task["type"];
  }) => void;
  pets: Pet[];
  providers: VetProvider[];
  selectedPetId: string;
  task?: Task;
}) {
  const defaultDueDate =
    task?.reminderKind === "refill"
      ? task.refillByDate ?? task.dueDate ?? initialDueDate ?? todayValue
      : task?.dueDate ?? initialDueDate ?? todayValue;
  const [selectedReminderKind, setSelectedReminderKind] = useState<Task["reminderKind"]>(
    task?.reminderKind ?? "care",
  );
  const showDoseField = selectedReminderKind === "medication";
  const showProviderField =
    providers.length > 0 &&
    (selectedReminderKind === "vaccine" ||
      selectedReminderKind === "vet-appointment" ||
      selectedReminderKind === "vet-follow-up");
  const dateLabel = routineDateLabel(selectedReminderKind);
  const titleLabel = routineTitleLabel(selectedReminderKind);
  const titlePlaceholder = routineTitlePlaceholder(selectedReminderKind);
  const notesPlaceholder = routineNotesPlaceholder(selectedReminderKind);

  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const reminderKind = String(form.get("reminderKind") || "care") as Task["reminderKind"];
      const type = taskTypeFromReminderKind(reminderKind);
      const title = String(form.get("title") || defaultScheduleTitle(reminderKind));
      const dueDate = String(form.get("dueDate") || defaultDueDate);

      onSubmit({
        actionLabel: prescribedRoutineActionLabel(reminderKind),
        cadence: String(form.get("cadence") || "once") as Task["cadence"],
        doseLabel: String(form.get("doseLabel") || ""),
        dueDate,
        notes: String(form.get("notes") || ""),
        petId: String(form.get("petId") || selectedPetId),
        providerId: String(form.get("providerId") || ""),
        refillByDate: reminderKind === "refill" ? dueDate : "",
        reminderKind,
        title,
        type,
      });
    }}>
      {pets.length > 1 ? (
        <SelectField defaultValue={task?.petId ?? selectedPetId} label="Pet" name="petId">
          {pets.map((pet) => (
            <option key={pet.id} value={pet.id}>
              {pet.name}
            </option>
          ))}
        </SelectField>
      ) : null}
      <SelectField
        defaultValue={selectedReminderKind}
        label="Routine type"
        name="reminderKind"
        onChange={(event) => setSelectedReminderKind(event.currentTarget.value as Task["reminderKind"])}
      >
        <option value="medication">Medication dose</option>
        <option value="refill">Medication refill</option>
        <option value="care">Routine care</option>
        <option value="vaccine">Vaccine</option>
        <option value="measurement">Measurement</option>
        <option value="vet-appointment">Vet appointment</option>
        <option value="vet-follow-up">Vet follow-up</option>
      </SelectField>
      <FormField defaultValue={task?.title ?? ""} label={titleLabel} name="title" placeholder={titlePlaceholder} />
      <FormField defaultValue={defaultDueDate} label={dateLabel} name="dueDate" type="date" />
      <SelectField defaultValue={task?.cadence ?? "once"} label="Cadence" name="cadence">
        <option value="once">One time</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="every-8-weeks">Every 8 weeks</option>
        <option value="yearly">Yearly</option>
      </SelectField>
      {showDoseField ? (
        <FormField
          defaultValue={task?.doseLabel ?? ""}
          label="Dose or label"
          name="doseLabel"
          placeholder="One monthly chew, 11-22 lb"
        />
      ) : null}
      {showProviderField ? (
        <SelectField defaultValue={task?.providerId ?? ""} label="Vet or clinic" name="providerId">
          <option value="">Not set</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </SelectField>
      ) : null}
      <p className="rounded-lg bg-background px-3 py-2 text-xs font-semibold text-muted">
        Action button: {prescribedRoutineActionLabel(selectedReminderKind)}
      </p>
      <TextAreaField defaultValue={task?.notes ?? ""} label="Notes" name="notes" placeholder={notesPlaceholder} />
      <SubmitButton label="Save routine" />
    </form>
  );
}

function LogTaskForm({
  mode,
  onSubmit,
  task,
}: {
  mode: "today" | "change-date";
  onSubmit: (input: { occurredOn: string; details: string }) => void;
  task: Task;
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit({
        occurredOn: String(form.get("occurredOn") || todayValue),
        details: String(form.get("details") || ""),
      });
    }}>
      <p className="text-sm leading-6 text-muted">
        {mode === "change-date" ? "Log a different date for" : "Log"} {task.title}.
      </p>
      <FormField label="Date" name="occurredOn" type="date" defaultValue={todayValue} />
      <TextAreaField label="Notes" name="details" placeholder="Anything important to remember" />
      <SubmitButton label="Save log" />
    </form>
  );
}

function HealthDocumentsModal({
  deleteDocument,
  documents,
  onEditDocument,
  onPreviewDocument,
  onUploadDocument,
}: {
  deleteDocument: (documentId: string) => void;
  documents: RecordDocument[];
  onEditDocument: (document: RecordDocument) => void;
  onPreviewDocument: (document: RecordDocument) => void;
  onUploadDocument: () => void;
}) {
  return (
    <div className="space-y-4">
      <button
        className="min-h-11 w-full rounded-lg bg-ink px-4 text-sm font-semibold text-white"
        onClick={onUploadDocument}
        type="button"
      >
        Upload file
      </button>
      {documents.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-4 text-sm leading-6 text-muted">
          No documents yet.
        </p>
      ) : (
        <div className="grid gap-3">
          {documents.map((document) => (
            <DocumentCard
              document={document}
              key={document.id}
              onDelete={() => deleteDocument(document.id)}
              onPreview={() => onPreviewDocument(document)}
              onRename={() => onEditDocument(document)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MeasurementHistoryModal({
  measurements,
  onLogMeasurements,
}: {
  measurements: MeasurementSnapshot[];
  onLogMeasurements: () => void;
}) {
  const latestMeasurement = measurements[0];

  return (
    <div className="space-y-3">
      <button
        className="min-h-11 w-full rounded-lg bg-ink px-4 text-sm font-semibold text-white"
        onClick={onLogMeasurements}
        type="button"
      >
        Log measurements
      </button>
      {measurements.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-4 text-sm leading-6 text-muted">
          No measurements logged yet.
        </p>
      ) : (
        <>
          {latestMeasurement ? (
            <div className="rounded-lg border border-line bg-surface p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Latest snapshot</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{latestMeasurement.createdLabel}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-muted">
                  {measurementValueParts(latestMeasurement).length} values
                </span>
              </div>
              <MeasurementValueGrid measurement={latestMeasurement} />
              {latestMeasurement.notes ? (
                <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm leading-6 text-muted">{latestMeasurement.notes}</p>
              ) : null}
            </div>
          ) : null}
          <div className="rounded-lg border border-line bg-surface">
            {measurements.map((measurement, index) => (
              <div
                className={cn("flex items-center justify-between gap-3 p-3", index > 0 ? "border-t border-line" : "")}
                key={measurement.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{measurementSnapshotSummary(measurement)}</p>
                  <p className="mt-1 truncate text-xs text-muted">{measurement.createdLabel}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MeasurementValueGrid({ measurement }: { measurement: MeasurementSnapshot }) {
  const values = measurementValuePairs(measurement);

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {values.map((item) => (
        <div className="rounded-lg bg-white px-3 py-2" key={item.label}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{item.label}</p>
          <p className="mt-1 text-sm font-semibold text-ink">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function MeasurementForm({ onSubmit, task }: { onSubmit: (input: MeasurementFormInput) => void; task: Task }) {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const measuredOn = String(form.get("measuredOn") || todayValue);
        const measurement: MeasurementSnapshot = {
          id: `measurement-${task.petId}-${Date.now()}`,
          petId: task.petId,
          measuredOn,
          weightValue: normalizeMeasurementValue(form.get("weightValue")),
          weightUnit: String(form.get("weightUnit") || "lb") === "kg" ? "kg" : "lb",
          bodyLengthValue: normalizeMeasurementValue(form.get("bodyLengthValue")),
          bodyLengthUnit: normalizeMeasurementUnit(form.get("bodyLengthUnit")),
          heightValue: normalizeMeasurementValue(form.get("heightValue")),
          heightUnit: normalizeMeasurementUnit(form.get("heightUnit")),
          collarCircumferenceValue: normalizeMeasurementValue(form.get("collarCircumferenceValue")),
          collarCircumferenceUnit: normalizeMeasurementUnit(form.get("collarCircumferenceUnit")),
          chestCircumferenceValue: normalizeMeasurementValue(form.get("chestCircumferenceValue")),
          chestCircumferenceUnit: normalizeMeasurementUnit(form.get("chestCircumferenceUnit")),
          notes: String(form.get("notes") || ""),
          createdLabel: formatDateForDisplay(measuredOn),
        };

        if (!hasMeasurementValue(measurement)) {
          window.alert("Add at least one measurement before saving.");
          return;
        }

        onSubmit({
          details: measurement.notes || "",
          measurement,
          occurredOn: measuredOn,
          value: measurementSnapshotSummary(measurement),
        });
      }}
    >
      <p className="text-sm leading-6 text-muted">Log a dated body snapshot for weight trends and gear sizing.</p>
      <FormField label="Measured on" name="measuredOn" type="date" defaultValue={todayValue} />
      <div className="grid grid-cols-[1fr_92px] gap-3">
        <FormField inputMode="decimal" label="Weight" name="weightValue" placeholder="22" />
        <MeasurementUnitSelect defaultValue="lb" label="Unit" name="weightUnit" options={["lb", "kg"]} />
      </div>
      <MeasurementDimensionField label="Body length" name="bodyLengthValue" unitName="bodyLengthUnit" />
      <MeasurementDimensionField label="Height" name="heightValue" unitName="heightUnit" />
      <MeasurementDimensionField label="Collar circumference" name="collarCircumferenceValue" unitName="collarCircumferenceUnit" />
      <MeasurementDimensionField label="Chest circumference" name="chestCircumferenceValue" unitName="chestCircumferenceUnit" />
      <TextAreaField label="Notes" name="notes" placeholder="Harness size, body condition, or measuring context" />
      <SubmitButton label="Log measurements" />
    </form>
  );
}

function MeasurementDimensionField({ label, name, unitName }: { label: string; name: string; unitName: string }) {
  return (
    <div className="grid grid-cols-[1fr_92px] gap-3">
      <FormField inputMode="decimal" label={label} name={name} placeholder="18" />
      <MeasurementUnitSelect defaultValue="in" label="Unit" name={unitName} options={["in", "cm"]} />
    </div>
  );
}

function MeasurementUnitSelect({
  defaultValue,
  label,
  name,
  options,
}: {
  defaultValue: string;
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <select
        className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink"
        defaultValue={defaultValue}
        name={name}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function MedicationForm({
  documents,
  onAttachDocuments,
  onPreviewDocument,
  onSubmit,
  task,
}: {
  documents: RecordDocument[];
  onAttachDocuments: (files: FileList | null) => void;
  onPreviewDocument: (document: RecordDocument) => void;
  onSubmit: (input: { occurredOn: string; details: string; medication: string }) => void;
  task?: Task;
}) {
  return (
    <form className="space-y-4" onSubmit={(event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const medication = String(form.get("medication") || task?.title || "Medication");
      const dose = String(form.get("dose") || "");
      const notes = String(form.get("details") || "");
      onSubmit({
        occurredOn: String(form.get("occurredOn") || todayValue),
        medication,
        details: [medication, dose, notes].filter(Boolean).join(" - "),
      });
    }}>
      <p className="text-sm leading-6 text-muted">Add medication details once, then future doses can stay one tap.</p>
      <FormField label="Medication" name="medication" defaultValue={task?.title ?? ""} />
      <FormField label="Dose or label" name="dose" placeholder="One monthly chew, 11-22 lb" />
      <FormField label="Date given" name="occurredOn" type="date" defaultValue={todayValue} />
      <TextAreaField label="Notes" name="details" placeholder="Prescription, vet, reaction, or reminder context" />
      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Prescription labels</p>
        <DocumentList documents={documents} emptyText="No labels attached." onPreview={onPreviewDocument} compact />
        <AttachDocumentButton label="Attach label" onAttach={onAttachDocuments} />
      </div>
      <SubmitButton label={task ? "Log dose" : "Add medication"} />
    </form>
  );
}

function UploadDocumentForm({
  onSubmit,
}: {
  onSubmit: (input: { title: string; documentType: string; file: File | null }) => void;
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const file = form.get("file");
      const selectedFile = file instanceof File && file.size > 0 ? file : null;
      onSubmit({
        documentType: String(form.get("documentType") || "general"),
        file: selectedFile,
        title: String(form.get("title") || selectedFile?.name || ""),
      });
    }}>
      <FormField label="File name" name="title" placeholder="Vet visit summary.pdf" required />
      <FileField label="PDF or image" name="file" />
      <label className="block text-sm font-semibold text-ink">
        Type
        <select className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3" name="documentType">
          <option value="general">General</option>
          <option value="vaccine">Vaccine proof</option>
          <option value="vet">Vet visit</option>
          <option value="prescription">Prescription</option>
        </select>
      </label>
      <p className="rounded-lg bg-background p-3 text-sm leading-6 text-muted">
        Files are private by default. You can upload records now; AI extraction comes later and will ask before saving anything.
      </p>
      <SubmitButton label="Upload file" />
    </form>
  );
}

function RenameDocumentForm({ document, onSubmit }: { document: RecordDocument; onSubmit: (title: string) => void }) {
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit(String(form.get("title") || document.title));
    }}>
      <FormField defaultValue={document.title} label="Document name" name="title" required />
      <SubmitButton label="Rename document" />
    </form>
  );
}

function RecordDetail({ body, titleText }: { body: string; titleText: string }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-ink">{titleText}</h2>
      <p className="text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}

function ProfileSection({
  action,
  children,
  onAction,
  title,
}: {
  action?: string;
  children: React.ReactNode;
  onAction?: () => void;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-3 flex min-h-10 items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">{title}</h2>
        {action ? (
          <button className="min-h-10 rounded-lg px-3 text-sm font-semibold text-primary" onClick={onAction} type="button">
            {action}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function BackgroundDetails({ background }: { background: Pet["background"] }) {
  const hasDetails =
    background.adoptionPlace ||
    background.adoptionDate ||
    background.spayedNeutered ||
    background.microchipped ||
    background.microchipNumber ||
    background.knownHistory;

  if (!hasDetails) {
    return (
      <p className="rounded-lg bg-background px-3 py-3 text-sm leading-6 text-muted">
        Add adoption details and known history for this pet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
        <FactRow label="Adoption place" value={background.adoptionPlace || "Not set"} />
        <FactRow label="Adoption date" value={background.adoptionDate ? formatDateForDisplay(background.adoptionDate) : "Not set"} />
        <FactRow label="Spayed/neutered" value={background.spayedNeutered ? "Yes" : "No"} />
        <MicrochipFactRow background={background} />
      </div>
      {background.knownHistory ? (
        <div className="rounded-lg bg-background p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Known history</p>
          <p className="mt-2 break-words text-sm leading-6 text-ink">{background.knownHistory}</p>
        </div>
      ) : null}
    </div>
  );
}

function FoodPreferencesDetails({ preferences }: { preferences: Pet["foodPreferences"] }) {
  const hasPreferences = preferences.favorites.length > 0 || preferences.dislikes.length > 0 || preferences.rules.length > 0;

  if (!hasPreferences) {
    return (
      <p className="rounded-lg bg-background px-3 py-3 text-sm leading-6 text-muted">
        Add favorite treats, foods to avoid, and feeding rules.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <PreferenceGroup items={preferences.favorites} title="Favorites" />
      <PreferenceGroup items={preferences.dislikes} title="Not a fan" />
      <PreferenceGroup items={preferences.rules} title="House rules" />
    </div>
  );
}

function PreferenceGroup({ items, title }: { items: string[]; title: string }) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span className="max-w-full break-words rounded-full bg-background px-3 py-1.5 text-sm font-semibold text-ink" key={item}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function TrainingCueList({
  cues,
  emptyText,
  onViewAll,
}: {
  cues: NonNullable<Pet["trainingCues"]>;
  emptyText: string;
  onViewAll: () => void;
}) {
  const shouldCollapse = cues.length > 3;
  const visibleCues = shouldCollapse ? cues.slice(0, 3) : cues;
  const hiddenCount = cues.length - visibleCues.length;

  if (cues.length === 0) {
    return <p className="rounded-lg bg-background px-3 py-2 text-sm text-muted">{emptyText}</p>;
  }

  return (
    <div className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-background">
      {visibleCues.map((cue) => (
        <div className="grid gap-1 px-3 py-3 sm:grid-cols-[minmax(0,140px)_minmax(0,1fr)] sm:gap-4" key={cue.id}>
          <p className="break-words text-sm font-semibold text-ink">{cue.cue}</p>
          <p className="break-words text-sm leading-5 text-muted">{cue.action}</p>
        </div>
      ))}
      {shouldCollapse ? (
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <p className="text-xs font-medium text-muted">
            +{hiddenCount} more
          </p>
          <button
            className="min-h-10 rounded-lg px-2 text-sm font-semibold text-primary"
            onClick={onViewAll}
            type="button"
          >
            View all cues
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TrainingCueDetails({
  cues,
  petName,
}: {
  cues: NonNullable<Pet["trainingCues"]>;
  petName: string;
}) {
  if (cues.length === 0) {
    return <p className="rounded-lg bg-background px-3 py-3 text-sm leading-6 text-muted">No training cues yet.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-muted">
        All saved cues for {petName}. Keep the first three as the profile summary for now.
      </p>
      <div className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-background">
        {cues.map((cue) => (
          <div className="grid gap-1 px-3 py-3 sm:grid-cols-[minmax(0,140px)_minmax(0,1fr)] sm:gap-4" key={cue.id}>
            <p className="break-words text-sm font-semibold text-ink">{cue.cue}</p>
            <p className="break-words text-sm leading-5 text-muted">{cue.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListsKitsModal({
  allPets,
  documents,
  focusedKitId,
  onAddChecklistItem,
  onAttachItemDocument,
  onAttachExistingDocument,
  onCreateTrip,
  onDeleteKit,
  onEditKit,
  onPreviewDocument,
  onRemoveChecklistItem,
  onResetKit,
  onToggleChecklistItem,
  onUploadItemDocument,
  onUploadDocument,
  pets,
  selectedPet,
  templates,
  trips,
}: {
  allPets?: boolean;
  documents: RecordDocument[];
  focusedKitId?: string;
  onAddChecklistItem: (input: KitChecklistItemInput & { tripId: string }) => void;
  onAttachItemDocument: (trip: PetKit, item: KitChecklistItem) => void;
  onAttachExistingDocument: (trip: PetKit, link: KitDocumentLink) => void;
  onCreateTrip: (templateId?: string) => void;
  onDeleteKit: (trip: PetKit) => void;
  onEditKit: (trip: PetKit) => void;
  onPreviewDocument: (document: RecordDocument) => void;
  onRemoveChecklistItem: (trip: PetKit, item: KitUnifiedItem) => void;
  onResetKit: (trip: PetKit) => void;
  onToggleChecklistItem: (tripId: string, itemId: string) => void;
  onUploadItemDocument: (tripId: string, itemId: string, files: FileList | null) => void;
  onUploadDocument: (tripId: string, documentLinkId: string, files: FileList | null) => void;
  pets: Pet[];
  selectedPet: Pet;
  templates: KitTemplate[];
  trips: PetKit[];
}) {
  return (
    <div className="space-y-5">
      <p className="rounded-lg bg-background p-3 text-sm leading-6 text-muted">
        Create packing, travel, picnic, boarding, grooming, and custom prep lists. Travel document rows are suggestions;
        confirm current requirements with your airline, destination country, and veterinarian.
      </p>

      <section className="space-y-3">
        <div className="flex min-h-10 items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Saved lists</h2>
          <button className="min-h-10 rounded-lg bg-ink px-3 text-sm font-semibold text-white" onClick={() => onCreateTrip()} type="button">
            Create list
          </button>
        </div>
        {trips.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface p-4 text-sm leading-6 text-muted">
            {allPets
              ? "No lists yet. Start blank or use a reusable template below."
              : `No lists yet for ${selectedPet.name}. Start blank or use a reusable template below.`}
          </p>
        ) : (
          <div className="space-y-3">
            {[...trips].sort((a, b) => (a.id === focusedKitId ? -1 : b.id === focusedKitId ? 1 : 0)).map((trip) => (
              <PetKitCard
                documents={documents}
                focused={trip.id === focusedKitId}
                key={trip.id}
                onAddChecklistItem={onAddChecklistItem}
                onAttachItemDocument={onAttachItemDocument}
                onAttachExistingDocument={onAttachExistingDocument}
                onDeleteKit={onDeleteKit}
                onEditKit={onEditKit}
                onPreviewDocument={onPreviewDocument}
                onRemoveChecklistItem={onRemoveChecklistItem}
                onResetKit={onResetKit}
                onToggleChecklistItem={onToggleChecklistItem}
                onUploadItemDocument={onUploadItemDocument}
                onUploadDocument={onUploadDocument}
                pets={pets}
                trip={trip}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Reusable templates</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {templates.map((template) => (
            <div className="rounded-lg border border-line bg-background p-3" key={template.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{template.name}</p>
                  <p className="mt-1 text-xs capitalize text-muted">{template.category}</p>
                </div>
                <button
                  className="min-h-10 shrink-0 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-primary"
                  onClick={() => onCreateTrip(template.id)}
                  type="button"
                >
                  Use
                </button>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">
                {template.checklistItems.map((item) => item.label).join(", ")}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PetKitCard({
  documents,
  focused,
  onAddChecklistItem,
  onAttachItemDocument,
  onAttachExistingDocument,
  onDeleteKit,
  onEditKit,
  onPreviewDocument,
  onRemoveChecklistItem,
  onResetKit,
  onToggleChecklistItem,
  onUploadItemDocument,
  onUploadDocument,
  pets,
  trip,
}: {
  documents: RecordDocument[];
  focused?: boolean;
  onAddChecklistItem: (input: KitChecklistItemInput & { tripId: string }) => void;
  onAttachItemDocument: (trip: PetKit, item: KitChecklistItem) => void;
  onAttachExistingDocument: (trip: PetKit, link: KitDocumentLink) => void;
  onDeleteKit: (trip: PetKit) => void;
  onEditKit: (trip: PetKit) => void;
  onPreviewDocument: (document: RecordDocument) => void;
  onRemoveChecklistItem: (trip: PetKit, item: KitUnifiedItem) => void;
  onResetKit: (trip: PetKit) => void;
  onToggleChecklistItem: (tripId: string, itemId: string) => void;
  onUploadItemDocument: (tripId: string, itemId: string, files: FileList | null) => void;
  onUploadDocument: (tripId: string, documentLinkId: string, files: FileList | null) => void;
  pets: Pet[];
  trip: PetKit;
}) {
  const tripPets = trip.petIds.map((petId) => pets.find((pet) => pet.id === petId)).filter(Boolean) as Pet[];
  const unifiedItems = kitUnifiedItems(trip);
  const attachedDocumentIds = new Set(unifiedItems.map((item) => item.documentId).filter((id): id is string => Boolean(id)));
  const tripDocuments = documents.filter((document) => trip.petIds.includes(document.petId) || attachedDocumentIds.has(document.id));
  const progress = kitProgressParts(trip);
  const [showNotes, setShowNotes] = useState(false);

  return (
    <article className={cn("space-y-4 rounded-lg border bg-surface p-4", focused ? "border-primary shadow-[0_0_0_3px_rgba(42,125,111,0.12)]" : "border-line")}>
      <div className="min-w-0 space-y-2">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="break-words text-base font-semibold text-ink">{trip.title}</h3>
              <p className="mt-1 break-words text-sm text-muted">
                {kitContextLabel(trip)}
              </p>
            </div>
            <div className="ml-auto flex shrink-0 items-center justify-end gap-1">
              <KitProgressChips progress={progress} />
              <IconButton icon={Pencil} label="Edit list" onClick={() => onEditKit(trip)} />
              <IconButton icon={Trash2} label="Delete list" onClick={() => onDeleteKit(trip)} />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <CompactPetStack pets={tripPets} />
              <span className="truncate text-xs font-semibold text-muted">{compactPetNames(tripPets)}</span>
            </div>
            {trip.notes ? (
              <button
                className="min-h-9 shrink-0 rounded-lg px-2 text-xs font-semibold text-primary"
                onClick={() => setShowNotes((current) => !current)}
                type="button"
              >
                Notes
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {showNotes && trip.notes ? (
        <p className="rounded-lg bg-background p-3 text-sm leading-6 text-muted">{trip.notes}</p>
      ) : null}

      <section className="space-y-2">
        <div className="flex min-h-10 items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Items</p>
          {unifiedItems.length > 0 ? (
            <button
              className="min-h-10 rounded-lg px-2 text-sm font-semibold text-primary"
              onClick={() => onResetKit(trip)}
              type="button"
            >
              Reset list
            </button>
          ) : null}
        </div>
        <div className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-background">
          {unifiedItems.length === 0 ? (
            <p className="px-3 py-3 text-sm leading-6 text-muted">Add task, document, or link items to this list.</p>
          ) : null}
          {unifiedItems.map((item) => {
            const attachedDocument = item.documentId ? tripDocuments.find((document) => document.id === item.documentId) : undefined;
            return (
              <KitChecklistRow
                attachedDocument={attachedDocument}
                item={item}
                key={item.id}
                onAttachExisting={() => {
                  if (item.source === "document-link") {
                    const link = trip.documentLinks.find((documentLink) => documentLink.id === item.id);
                    if (link) onAttachExistingDocument(trip, link);
                    return;
                  }
                  onAttachItemDocument(trip, item);
                }}
                onPreviewDocument={onPreviewDocument}
                onRemove={() => onRemoveChecklistItem(trip, item)}
                onToggle={() => onToggleChecklistItem(trip.id, item.id)}
                onUpload={(files) => {
                  if (item.source === "document-link") {
                    onUploadDocument(trip.id, item.id, files);
                    return;
                  }
                  onUploadItemDocument(trip.id, item.id, files);
                }}
                pet={pets.find((pet) => pet.id === item.petId)}
              />
            );
          })}
        </div>
        <KitChecklistItemForm pets={tripPets} onSubmit={(input) => onAddChecklistItem({ ...input, tripId: trip.id })} />
      </section>

    </article>
  );
}

function KitChecklistRow({
  attachedDocument,
  item,
  onAttachExisting,
  onPreviewDocument,
  onRemove,
  onToggle,
  onUpload,
  pet,
}: {
  attachedDocument?: RecordDocument;
  item: KitUnifiedItem;
  onAttachExisting: () => void;
  onPreviewDocument: (document: RecordDocument) => void;
  onRemove: () => void;
  onToggle: () => void;
  onUpload: (files: FileList | null) => void;
  pet?: Pet;
}) {
  const meta = [pet?.name, kitItemMeta(item)].filter(Boolean).join(" · ");
  const showTypePill = item.itemType === "document" || item.itemType === "link";

  return (
    <div className="flex min-w-0 items-center gap-3 px-3 py-2">
      <button
        aria-label={item.completed ? `Mark ${item.label} incomplete` : `Mark ${item.label} complete`}
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-lg border transition active:scale-[0.98]",
          item.completed ? "border-primary bg-primary text-white" : "border-line bg-white text-muted",
        )}
        onClick={onToggle}
        type="button"
      >
        <Check aria-hidden className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className={cn("break-words text-sm font-semibold", item.completed ? "text-muted line-through" : "text-ink")}>
            {item.label}
          </p>
          {showTypePill ? (
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
              {item.itemType}
            </span>
          ) : null}
        </div>
        {meta ? <p className="mt-0.5 truncate text-xs leading-5 text-muted">{meta}</p> : null}
        {attachedDocument ? (
          <button
            className="mt-1 max-w-full truncate text-left text-xs font-semibold text-primary"
            onClick={() => onPreviewDocument(attachedDocument)}
            type="button"
          >
            {attachedDocument.title}
          </button>
        ) : null}
        {item.resourceUrl ? (
          <a
            className="mt-1 inline-flex min-h-8 max-w-full items-center gap-1 truncate rounded-lg px-0 text-xs font-semibold text-primary"
            href={item.resourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            <Link2 aria-hidden className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{item.resourceLabel || compactUrlLabel(item.resourceUrl)}</span>
          </a>
        ) : null}
      </div>
      {item.itemType === "document" ? (
        <div className="flex shrink-0 gap-1">
          <IconButton icon={Paperclip} label="Attach existing" onClick={onAttachExisting} />
          <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-lg border border-line bg-white text-ink transition active:scale-[0.98]" title="Upload document">
            <Upload aria-hidden className="h-5 w-5" />
            <span className="sr-only">Upload document</span>
            <input
              accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="sr-only"
              onChange={(event) => {
                onUpload(event.target.files);
                event.target.value = "";
              }}
              type="file"
            />
          </label>
          <IconButton icon={Trash2} label="Remove item" onClick={onRemove} />
        </div>
      ) : (
        <IconButton icon={Trash2} label="Remove item" onClick={onRemove} />
      )}
    </div>
  );
}

function KitChecklistItemForm({
  onSubmit,
  pets,
}: {
  onSubmit: (input: KitChecklistItemInput) => void;
  pets: Pet[];
}) {
  const [itemType, setItemType] = useState<NonNullable<KitChecklistItem["itemType"]>>("task");
  const showPetSelect = itemType === "document" && pets.length > 1;

  return (
    <form className="rounded-lg border border-dashed border-line bg-background/70 p-3" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit({
        documentType: String(form.get("documentType") || "custom") as KitChecklistItem["documentType"],
        itemType: String(form.get("itemType") || "task") as NonNullable<KitChecklistItem["itemType"]>,
        label: String(form.get("label") || ""),
        petId: String(form.get("petId") || pets[0]?.id || ""),
        resourceLabel: String(form.get("resourceLabel") || ""),
        resourceUrl: String(form.get("resourceUrl") || ""),
      });
      event.currentTarget.reset();
      setItemType("task");
    }}>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_auto]">
        <select
          className="h-11 rounded-lg border border-line bg-white px-3 text-sm"
          name="itemType"
          onChange={(event) => setItemType(event.target.value as NonNullable<KitChecklistItem["itemType"]>)}
          value={itemType}
        >
          <option value="task">Task</option>
          <option value="document">Document</option>
          <option value="link">Link</option>
        </select>
        <input className="h-11 rounded-lg border border-line bg-white px-3 text-sm" name="label" placeholder="Add item" />
        <button className="min-h-11 rounded-lg bg-ink px-3 text-sm font-semibold text-white" type="submit">
          Add
        </button>
      </div>
      {itemType === "document" ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {showPetSelect ? (
            <select className="h-11 rounded-lg border border-line bg-white px-3 text-sm" name="petId">
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>{pet.name}</option>
              ))}
            </select>
          ) : (
            <input name="petId" type="hidden" value={pets[0]?.id ?? ""} />
          )}
          <select className="h-11 rounded-lg border border-line bg-white px-3 text-sm" defaultValue="custom" name="documentType">
            <option value="custom">Custom document</option>
            <option value="rabies-proof">Rabies proof</option>
            <option value="vaccination-records">Vaccination records</option>
            <option value="registration">Registration</option>
            <option value="microchip-info">Microchip info</option>
            <option value="health-certificate">Health certificate</option>
            <option value="airline-forms">Airline forms</option>
            <option value="insurance">Insurance</option>
          </select>
        </div>
      ) : null}
      {itemType === "link" ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input className="h-11 rounded-lg border border-line bg-white px-3 text-sm" name="resourceLabel" placeholder="Link label" />
          <input className="h-11 rounded-lg border border-line bg-white px-3 text-sm" name="resourceUrl" placeholder="https://..." />
        </div>
      ) : null}
    </form>
  );
}

function KitAttachChecklistDocumentForm({
  documents,
  item,
  onSubmit,
}: {
  documents: RecordDocument[];
  item: KitChecklistItem;
  onSubmit: (documentId: string) => void;
}) {
  const sortedDocuments = sortDocumentsByCreatedAt(documents);

  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit(String(form.get("documentId") || ""));
    }}>
      <p className="text-sm leading-6 text-muted">
        Attach an existing private document to {item.label}. Uploading a new PDF or image is available directly from the list row.
      </p>
      <SelectField defaultValue={item.documentId ?? ""} label="Document" name="documentId">
        <option value="">Choose a document</option>
        {sortedDocuments.map((document) => (
          <option key={document.id} value={document.id}>
            {document.title} {document.versionLabel ? `(${document.versionLabel})` : ""}
          </option>
        ))}
      </SelectField>
      {sortedDocuments.length === 0 ? (
        <p className="rounded-lg bg-background p-3 text-sm leading-6 text-muted">
          No documents are saved for this pet yet. Use Upload on the list row to add one.
        </p>
      ) : null}
      <SubmitButton label="Attach document" />
    </form>
  );
}

function KitAttachDocumentForm({
  documents,
  link,
  onSubmit,
}: {
  documents: RecordDocument[];
  link: KitDocumentLink;
  onSubmit: (documentId: string) => void;
}) {
  const sortedDocuments = sortDocumentsByCreatedAt(documents);

  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit(String(form.get("documentId") || ""));
    }}>
      <p className="text-sm leading-6 text-muted">
        Attach an existing private document to {link.label}. Uploading a new file is available directly from the list row.
      </p>
      <SelectField defaultValue={link.documentId ?? ""} label="Document" name="documentId">
        <option value="">Choose a document</option>
        {sortedDocuments.map((document) => (
          <option key={document.id} value={document.id}>
            {document.title} {document.versionLabel ? `(${document.versionLabel})` : ""}
          </option>
        ))}
      </SelectField>
      {sortedDocuments.length === 0 ? (
        <p className="rounded-lg bg-background p-3 text-sm leading-6 text-muted">
          No documents are saved for this pet yet. Use Upload on the list row to add one.
        </p>
      ) : null}
      <SubmitButton label="Attach document" />
    </form>
  );
}

function KitDocumentItemForm({
  link,
  onSubmit,
  pets,
}: {
  link?: KitDocumentLink;
  onSubmit: (input: KitDocumentItemInput) => void;
  pets: Pet[];
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit({
        documentType: String(form.get("documentType") || "custom") as KitDocumentLink["documentType"],
        expiresOn: String(form.get("expiresOn") || ""),
        label: String(form.get("label") || ""),
        petId: String(form.get("petId") || pets[0]?.id || link?.petId || ""),
      });
    }}>
      <FormField defaultValue={link?.label} label="Label" name="label" placeholder="Airline form, health certificate, city registration" required />
      <SelectField defaultValue={link?.petId ?? pets[0]?.id ?? ""} label="Pet" name="petId">
        {pets.map((pet) => (
          <option key={pet.id} value={pet.id}>
            {pet.name}
          </option>
        ))}
      </SelectField>
      <SelectField defaultValue={link?.documentType ?? "custom"} label="Document type" name="documentType">
        <option value="custom">Custom</option>
        <option value="rabies-proof">Rabies proof</option>
        <option value="vaccination-records">Vaccination records</option>
        <option value="registration">Registration</option>
        <option value="microchip-info">Microchip info</option>
        <option value="health-certificate">Health certificate</option>
        <option value="airline-forms">Airline forms</option>
        <option value="insurance">Insurance</option>
      </SelectField>
      <FormField defaultValue={link?.expiresOn} label="Expires on" name="expiresOn" type="date" />
      <SubmitButton label={link ? "Save document item" : "Add document item"} />
    </form>
  );
}

function CreatePetKitForm({
  kit,
  onSubmit,
  pets,
  selectedPetId,
  templateId,
  templates,
}: {
  onSubmit: (input: {
    destination: string;
    endDate: string;
    notes: string;
    petIds: string[];
    startDate: string;
    templateId: string;
    title: string;
  }) => void;
  kit?: PetKit;
  pets: Pet[];
  selectedPetId: string;
  templateId?: string;
  templates: KitTemplate[];
}) {
  const isEditing = Boolean(kit);
  const defaultTemplateId =
    kit?.sourceTemplateId ?? templateId ?? templates.find((template) => template.id === "template-blank")?.id ?? templates[0]?.id ?? "";

  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit({
        destination: String(form.get("destination") || ""),
        endDate: String(form.get("endDate") || ""),
        notes: String(form.get("notes") || ""),
        petIds: form.getAll("petIds").map(String),
        startDate: String(form.get("startDate") || todayValue),
        templateId: String(form.get("templateId") || defaultTemplateId),
        title: String(form.get("title") || ""),
      });
    }}>
      {isEditing ? (
        <input name="templateId" type="hidden" value={defaultTemplateId} />
      ) : (
        <SelectField defaultValue={defaultTemplateId} label="Template" name="templateId">
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </SelectField>
      )}
      <FormField defaultValue={kit?.title} label="List name" name="title" placeholder="Plane packing list, boarding checklist, picnic day" required />
      <FormField defaultValue={kit?.destination} label="Destination or context" name="destination" placeholder="Mexico City, groomer visit, beach day" />
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField defaultValue={kit?.startDate} label="Start date" name="startDate" type="date" />
        <FormField defaultValue={kit?.endDate} label="End date" name="endDate" type="date" />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-ink">Pets</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {pets.map((pet) => (
            <label className="flex min-h-11 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink" key={pet.id}>
              <input defaultChecked={kit ? kit.petIds.includes(pet.id) : pet.id === selectedPetId} name="petIds" type="checkbox" value={pet.id} />
              {pet.name}
            </label>
          ))}
        </div>
      </fieldset>
      <TextAreaField defaultValue={kit?.notes} label="Notes" name="notes" placeholder="Instructions, rules, packing context, or handoff notes." />
      <SubmitButton label={isEditing ? "Save list" : "Create list"} />
    </form>
  );
}

function PetSharingAccess({
  activeLinkCount,
  memberCount,
  onManage,
  pet,
}: {
  activeLinkCount: number;
  memberCount: number;
  onManage: () => void;
  pet: Pet;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-background p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#e7f6f1] text-ink">
          <Users aria-hidden className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">
            Shared with {Math.max(memberCount - 1, 0)} {Math.max(memberCount - 1, 0) === 1 ? "member" : "members"}
          </p>
          <p className="mt-1 truncate text-xs text-muted">
            {activeLinkCount} public {activeLinkCount === 1 ? "link" : "links"} active for {pet.name}
          </p>
        </div>
      </div>
      <button className="min-h-10 shrink-0 rounded-lg bg-ink px-3 text-sm font-semibold text-white" onClick={onManage} type="button">
        Manage
      </button>
    </div>
  );
}

function SharingAccessDetails({
  copiedShareLinkId,
  documents,
  members,
  onCopyShareLink,
  onCreateSharePacket,
  onInviteMember,
  onRemoveMember,
  onRevokeShareLink,
  onShowQr,
  onUpdateMemberRole,
  pet,
  shareLinks,
}: {
  copiedShareLinkId: string | null;
  documents: RecordDocument[];
  members: PetAccessMember[];
  onCopyShareLink: (linkId: string) => void;
  onCreateSharePacket: () => void;
  onInviteMember: () => void;
  onRemoveMember: (member: PetAccessMember) => void;
  onRevokeShareLink: (link: ShareLink) => void;
  onShowQr: (link: ShareLink) => void;
  onUpdateMemberRole: (memberId: string, role: PetAccessMember["role"]) => void;
  pet: Pet;
  shareLinks: ShareLink[];
}) {
  const activeLinks = shareLinks.filter((link) => link.status === "Active");

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <div className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <h2 className="min-w-0 text-xs font-semibold uppercase tracking-[0.1em] text-muted">Household access</h2>
          <button className="min-h-10 shrink-0 whitespace-nowrap rounded-lg bg-ink px-3 text-sm font-semibold text-white" onClick={onInviteMember} type="button">
            Invite member
          </button>
        </div>
        <div className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-background">
          {members.map((member) => (
            <PetAccessMemberRow
              key={member.id}
              member={member}
              onRemove={() => onRemoveMember(member)}
              onUpdateRole={(role) => onUpdateMemberRole(member.id, role)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <h2 className="min-w-0 text-xs font-semibold uppercase tracking-[0.1em] text-muted">Public links</h2>
          <button className="min-h-10 shrink-0 whitespace-nowrap rounded-lg bg-primary px-3 text-sm font-semibold text-white" onClick={onCreateSharePacket} type="button">
            Create packet
          </button>
        </div>
        <p className="rounded-lg bg-background px-3 py-2 text-xs font-medium leading-5 text-muted">
          Create named packets from selected documents. Anyone with the link can view only the documents you include.
        </p>
        {documents.length === 0 ? (
          <p className="rounded-lg bg-background px-3 py-2 text-xs font-medium leading-5 text-muted">
            Upload documents first before creating a packet.
          </p>
        ) : null}
        {activeLinks.length === 0 ? (
          <p className="rounded-lg border border-line bg-background p-3 text-sm leading-6 text-muted">
            No public links are active for {pet.name}.
          </p>
        ) : (
          <div className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-background">
            {activeLinks.map((link) => (
              <ShareLinkRow
                copied={copiedShareLinkId === link.id}
                key={link.id}
                link={link}
                onCopy={() => onCopyShareLink(link.id)}
                onRevoke={() => onRevokeShareLink(link)}
                onShowQr={() => onShowQr(link)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PetAccessMemberRow({
  member,
  onRemove,
  onUpdateRole,
}: {
  member: PetAccessMember;
  onRemove: () => void;
  onUpdateRole: (role: PetAccessMember["role"]) => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-3 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#e7f6f1] text-xs font-bold text-ink">
        {member.name.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="break-words text-sm font-semibold text-ink">{member.name}</p>
          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
            {member.status}
          </span>
        </div>
        <p className="mt-1 break-all text-xs leading-5 text-muted">{member.email}</p>
      </div>
      <select
        aria-label={`Role for ${member.name}`}
        className="h-10 shrink-0 rounded-lg border border-line bg-white px-2 text-xs font-semibold text-ink"
        disabled={!member.removable}
        onChange={(event) => onUpdateRole(event.target.value as PetAccessMember["role"])}
        value={member.role}
      >
        <option value="Admin">Admin</option>
        <option value="Editor">Editor</option>
        <option value="Viewer">Viewer</option>
      </select>
      {member.removable ? (
        <IconButton icon={Trash2} label={`Remove ${member.name}`} onClick={onRemove} />
      ) : null}
    </div>
  );
}

function ShareLinkRow({
  copied,
  link,
  onCopy,
  onRevoke,
  onShowQr,
}: {
  copied: boolean;
  link: ShareLink;
  onCopy: () => void;
  onRevoke: () => void;
  onShowQr: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-3 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#d7f9c4] text-ink">
        <Link2 aria-hidden className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-semibold text-ink">{link.label}</p>
        <p className="mt-1 truncate text-xs leading-5 text-muted">
          {link.type} - {link.createdLabel}
        </p>
        {copied ? <p className="mt-1 text-xs font-semibold text-primary">Copied</p> : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <IconButton icon={Link2} label="Copy link" onClick={onCopy} />
        <IconButton icon={QrCode} label="Show QR" onClick={onShowQr} />
        <IconButton icon={Trash2} label="Revoke link" onClick={onRevoke} />
      </div>
    </div>
  );
}

function SharePacketForm({
  documents,
  onSubmit,
  pet,
}: {
  documents: RecordDocument[];
  onSubmit: (input: { documentIds: string[]; includeOwnerContact: boolean; label: string }) => void;
  pet: Pet;
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit({
        documentIds: form.getAll("documentIds").map(String).filter(Boolean),
        includeOwnerContact: form.get("includeOwnerContact") === "on",
        label: String(form.get("label") || ""),
      });
    }}>
      <FormField defaultValue={`${pet.name} document packet`} label="Packet name" name="label" required />
      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink">Documents</p>
        {documents.length === 0 ? (
          <p className="rounded-lg border border-line bg-background p-3 text-sm leading-6 text-muted">
            No documents are saved for {pet.name} yet. Upload documents from Health or All documents first.
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-line bg-background">
            {documents.map((document) => (
              <label className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-line px-3 py-2 last:border-b-0" key={document.id}>
                <input className="h-4 w-4 accent-primary" name="documentIds" type="checkbox" value={document.id} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{document.title}</span>
                  <span className="block truncate text-xs text-muted">{document.documentType || document.recordType} · {document.addedLabel}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
      <CheckboxField label="Include owner contact if available" name="includeOwnerContact" />
      <SubmitButton label="Create packet" />
    </form>
  );
}

function InviteMemberForm({
  onSubmit,
  pet,
}: {
  onSubmit: (input: { email: string; role: PetAccessMember["role"] }) => void;
  pet: Pet;
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit({
        email: String(form.get("email") || ""),
        role: String(form.get("role") || "Viewer") as PetAccessMember["role"],
      });
    }}>
      <p className="text-sm leading-6 text-muted">
        Invite someone to see or help manage {pet.name}&apos;s profile.
      </p>
      <FormField label="Email" name="email" inputMode="email" type="email" required />
      <SelectField defaultValue="Viewer" label="Role" name="role">
        <option value="Viewer">Viewer</option>
        <option value="Editor">Editor</option>
        <option value="Admin">Admin</option>
      </SelectField>
      <SubmitButton label="Send invite" />
    </form>
  );
}

function ShareLinkQrDetails({ link }: { link: ShareLink }) {
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(link.url, { margin: 1, width: 240 }).then((url) => {
      if (active) setQrUrl(url);
    });
    return () => {
      active = false;
    };
  }, [link.url]);

  return (
    <div className="space-y-4">
      <div className="mx-auto grid h-52 w-52 place-items-center rounded-lg border border-line bg-white p-3">
        {qrUrl ? (
          <Image
            alt={`QR code for ${link.label}`}
            className="h-full w-full"
            height={208}
            src={qrUrl}
            unoptimized
            width={208}
          />
        ) : (
          <QrCode aria-hidden className="h-12 w-12 text-muted" />
        )}
      </div>
      <div className="rounded-lg bg-background p-3">
        <p className="text-sm font-semibold text-ink">{link.label}</p>
        <p className="mt-1 break-all text-xs leading-5 text-muted">{link.url}</p>
      </div>
      <p className="text-sm leading-6 text-muted">Scan this QR code to open the public read-only packet link.</p>
    </div>
  );
}

function CareTeamCard({
  primaryProvider,
  secondaryProvider,
  secondaryRole,
}: {
  primaryProvider?: VetProvider;
  secondaryProvider?: VetProvider;
  secondaryRole?: string;
}) {
  return (
    <div className="divide-y divide-line rounded-lg border border-line bg-background px-3">
      <div className="py-3">
        <VetProviderSummary label="Primary vet" provider={primaryProvider} />
      </div>
      {secondaryProvider ? (
        <div className="py-3">
          <VetProviderSummary label={secondaryRole || "Secondary vet"} provider={secondaryProvider} />
        </div>
      ) : null}
    </div>
  );
}

function VetProviderSummary({ emptyText = "Not set", label, provider }: { emptyText?: string; label: string; provider?: VetProvider }) {
  if (!provider) {
    return (
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
        <p className="mt-1 text-sm leading-5 text-muted">{emptyText}</p>
      </div>
    );
  }

  const phoneHref = providerPhoneHref(provider.phone);
  const linkHref = providerLinkHref(provider.website);
  const address = formatProviderAddress(provider.address);

  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
        <h3 className="mt-1 break-words text-sm font-semibold text-ink">{provider.name}</h3>
        {address ? <p className="mt-1 break-words text-xs leading-5 text-muted">{address}</p> : null}
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-2">
        {phoneHref ? (
          <a className="inline-flex min-h-11 items-center rounded-lg bg-white px-4 text-sm font-semibold text-primary" href={phoneHref}>
            Call
          </a>
        ) : null}
        {linkHref ? (
          <a className="inline-flex min-h-11 items-center rounded-lg bg-white px-4 text-sm font-semibold text-primary" href={linkHref} rel="noreferrer" target="_blank">
            Link
          </a>
        ) : null}
      </div>
    </div>
  );
}

function VetPrepCard({
  items,
  onAddressed,
  onCarryForward,
  onDismiss,
}: {
  items: VetPrepItem[];
  onAddressed: (itemId: string) => void;
  onCarryForward: (itemId: string) => void;
  onDismiss: (itemId: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg bg-background px-3 py-3 text-sm leading-6 text-muted">
        Capture questions or observations before the next visit.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-line bg-background">
        {items.map((item, index) => (
          <div className={cn("p-3", index > 0 ? "border-t border-line" : "")} key={item.id}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <HeartPulse aria-hidden className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="break-words text-sm font-semibold text-ink">{item.title}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-muted">
                    {item.createdLabel}
                  </span>
                </div>
                {item.details ? (
                  <p className="mt-1 break-words text-sm leading-5 text-muted">{item.details}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="min-h-10 rounded-lg bg-primary px-3 text-sm font-semibold text-white" onClick={() => onAddressed(item.id)} type="button">
                    <Check aria-hidden className="mr-1 inline h-4 w-4" />
                    Addressed
                  </button>
                  <button className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink" onClick={() => onCarryForward(item.id)} type="button">
                    <Undo2 aria-hidden className="mr-1 inline h-4 w-4" />
                    Carry forward
                  </button>
                  <button className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-muted" onClick={() => onDismiss(item.id)} type="button">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VetSpendSummary({
  recentCost,
  totalSpend,
  visitCount,
}: {
  recentCost: string;
  totalSpend: string;
  visitCount: number;
}) {
  const metrics = [
    { label: "Vet spend", value: totalSpend },
    { label: "Visits", value: String(visitCount) },
    { label: "Recent", value: recentCost },
  ];

  return (
    <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-line bg-surface">
      {metrics.map((metric, index) => (
        <div
          className={cn(
            "min-w-0 px-3 py-2.5 sm:px-4",
            index > 0 ? "border-l border-line" : "",
          )}
          key={metric.label}
        >
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">{metric.label}</p>
          <p className="mt-0.5 truncate text-sm font-semibold leading-5 text-ink sm:text-base">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}

function HealthShortcutStrip({ onViewDocuments }: { onViewDocuments: () => void }) {
  const shortcuts = [
    { icon: ShieldCheck, label: "Vaccines", onClick: () => scrollToSection("health-vaccines") },
    { icon: Pill, label: "Meds", onClick: () => scrollToSection("health-meds") },
    { icon: HeartPulse, label: "Vet", onClick: () => scrollToSection("health-vet-care") },
    { icon: Eye, label: "Observations", onClick: () => scrollToSection("health-observations") },
    { icon: FileText, label: "Docs", onClick: onViewDocuments },
    { icon: CalendarCheck, label: "History", onClick: () => scrollToSection("health-history") },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {shortcuts.map((shortcut) => {
        const Icon = shortcut.icon;

        return (
          <button
            className="flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-1.5 py-2 text-[11px] font-semibold text-ink shadow-sm transition hover:border-primary/30 hover:bg-background active:scale-[0.99] min-[390px]:text-xs sm:px-2 sm:text-sm"
            key={shortcut.label}
            onClick={shortcut.onClick}
            type="button"
          >
            <Icon aria-hidden className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{shortcut.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function CompactAction({
  icon: Icon,
  label,
  onClick,
  primary,
}: {
  icon: typeof MoreHorizontal;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "grid h-11 w-11 place-items-center rounded-lg border text-sm font-semibold transition active:scale-[0.98]",
        primary ? "border-ink bg-ink text-white" : "border-line bg-white text-ink",
      )}
      title={label}
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden className="h-5 w-5" />
    </button>
  );
}

function DocumentList({
  compact,
  documents,
  emptyText,
  onPreview,
}: {
  compact?: boolean;
  documents: RecordDocument[];
  emptyText: string;
  onPreview?: (document: RecordDocument) => void;
}) {
  if (documents.length === 0) {
    return <p className="rounded-lg bg-background px-3 py-2 text-sm text-muted">{emptyText}</p>;
  }

  return (
    <div className="min-w-0 space-y-2">
      {sortDocumentsByCreatedAt(documents).map((document) => (
        <DocumentRow
          compact={compact}
          document={document}
          key={document.id}
          onPreview={onPreview ? () => onPreview(document) : undefined}
        />
      ))}
    </div>
  );
}

function VaccineProofFiles({
  latestDocument,
  olderDocuments,
  onPreview,
}: {
  latestDocument: RecordDocument;
  olderDocuments: RecordDocument[];
  onPreview: (document: RecordDocument) => void;
}) {
  return (
    <div className="mt-3 space-y-2">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Latest proof</p>
        <DocumentRow compact document={latestDocument} onPreview={() => onPreview(latestDocument)} />
      </div>
      {olderDocuments.length > 0 ? (
        <details className="overflow-hidden rounded-lg border border-line bg-background">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 text-xs font-semibold text-muted">
            <span>Older files</span>
            <span>{olderDocuments.length}</span>
          </summary>
          <div className="space-y-2 border-t border-line p-3">
            {sortDocumentsByCreatedAt(olderDocuments).map((document) => (
              <DocumentRow
                compact
                document={document}
                key={document.id}
                onPreview={() => onPreview(document)}
              />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function DocumentCard({
  document,
  onDelete,
  onPreview,
  onRename,
}: {
  document: RecordDocument;
  onDelete: () => void;
  onPreview: () => void;
  onRename: () => void;
}) {
  return (
    <article className="rounded-lg border border-line bg-surface p-2">
      <div className="flex min-w-0 items-center gap-2">
        <DocumentRow compact document={document} onPreview={onPreview} />
        <div className="flex shrink-0 gap-2">
          <IconButton icon={Pencil} label="Rename document" onClick={onRename} />
          <IconButton icon={Trash2} label="Remove document" onClick={onDelete} />
        </div>
      </div>
    </article>
  );
}

function DocumentRow({
  compact,
  document,
  onPreview,
}: {
  compact?: boolean;
  document: RecordDocument;
  onPreview?: () => void;
}) {
  const Icon = document.fileType === "pdf" ? FileText : FileImage;
  const content = (
    <>
      <span className={cn("grid shrink-0 place-items-center rounded-lg bg-primary/10 text-primary", compact ? "h-8 w-8" : "h-10 w-10")}>
        <Icon aria-hidden className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-semibold text-ink">{document.title}</p>
        <p className="mt-1 truncate text-xs text-muted">
          {document.sizeLabel} - {document.addedLabel} - Private
        </p>
      </div>
    </>
  );

  if (onPreview) {
    return (
      <button
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-lg border border-line bg-white transition hover:bg-background active:scale-[0.99]",
          compact ? "px-3 py-2" : "p-4",
        )}
        onClick={onPreview}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-3 overflow-hidden rounded-lg border border-line bg-white", compact ? "px-3 py-2" : "p-4")}>
      {content}
    </div>
  );
}

function AttachDocumentButton({
  iconOnly,
  label,
  onAttach,
}: {
  iconOnly?: boolean;
  label: string;
  onAttach: (files: FileList | null) => void;
}) {
  return (
    <label className={cn(
      "inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink transition active:scale-[0.99]",
      !iconOnly && "mt-4 min-h-11 px-4",
    )}>
      <Paperclip aria-hidden className={cn("h-4 w-4", !iconOnly && "mr-2")} />
      <span className={cn(iconOnly && "sr-only")}>{label}</span>
      <input
        accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        multiple
        onChange={(event) => {
          onAttach(event.target.files);
          event.target.value = "";
        }}
        type="file"
      />
    </label>
  );
}

function SmallButton({ icon: Icon, label, onClick }: { icon?: typeof MoreHorizontal; label: string; onClick: () => void }) {
  return (
    <button
      className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink"
      onClick={onClick}
      type="button"
    >
      {Icon ? <Icon aria-hidden className="mr-1 inline h-4 w-4" /> : null}
      {label}
    </button>
  );
}

function IconButton({ icon: Icon, label, onClick }: { icon: typeof MoreHorizontal; label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      className="grid h-10 min-h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-white text-ink transition active:scale-[0.98]"
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon aria-hidden className="h-4 w-4" />
    </button>
  );
}

function FormField({
  defaultValue,
  inputMode,
  label,
  name,
  placeholder,
  required,
  type = "text",
}: {
  defaultValue?: string;
  inputMode?: "decimal" | "email" | "numeric" | "search" | "tel" | "text" | "url";
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <input
        className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink outline-none focus:border-primary"
        defaultValue={defaultValue}
        inputMode={inputMode}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}

function FileField({ label, name }: { label: string; name: string }) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <input
        accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-3 text-sm font-medium text-ink file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary"
        name={name}
        type="file"
      />
      <span className="mt-2 block text-xs font-medium text-muted">Private by default. AI extraction comes later and will ask before saving.</span>
    </label>
  );
}

function WeightInputFields({
  defaultUnit = "lb",
  defaultValue = "",
  label,
}: {
  defaultUnit?: "lb" | "kg";
  defaultValue?: string;
  label: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{label}</p>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_88px] gap-2">
        <input
          className="h-11 min-w-0 rounded-lg border border-line bg-white px-3 text-ink"
          defaultValue={defaultValue}
          inputMode="decimal"
          name="weightValue"
          placeholder="22"
        />
        <select className="h-11 rounded-lg border border-line bg-white px-2 text-sm font-semibold text-ink" defaultValue={defaultUnit} name="weightUnit">
          <option value="lb">lb/lbs</option>
          <option value="kg">kg</option>
        </select>
      </div>
    </div>
  );
}

function PhotoFileField({ currentUrl, label, name }: { currentUrl?: string; label: string; name: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const visibleUrl = previewUrl ?? currentUrl;

  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <div className="mt-2 grid gap-3 rounded-lg border border-line bg-background p-3 sm:grid-cols-[96px_minmax(0,1fr)]">
        <div
          aria-hidden
          className="h-24 w-24 rounded-lg border border-line bg-white bg-cover bg-center"
          style={visibleUrl ? { backgroundImage: `url(${visibleUrl})` } : undefined}
        />
        <div className="min-w-0">
          <input
            accept="image/jpeg,image/png,image/webp"
            className="block w-full rounded-lg border border-line bg-white px-3 py-3 text-sm font-medium text-ink file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary"
            name={name}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              setPreviewUrl(file ? URL.createObjectURL(file) : null);
            }}
            type="file"
          />
          <span className="mt-2 block text-xs font-medium text-muted">JPG, PNG, or WebP. 5 MB max.</span>
        </div>
      </div>
    </label>
  );
}

function TextAreaField({
  defaultValue,
  label,
  name,
  placeholder,
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <textarea
        className="mt-2 min-h-24 w-full rounded-lg border border-line bg-white px-3 py-3 text-sm font-medium text-ink outline-none focus:border-primary"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
      />
    </label>
  );
}

function CheckboxField({
  defaultChecked,
  label,
  name,
}: {
  defaultChecked?: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink">
      <input
        className="h-4 w-4 accent-primary"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function SelectField({
  children,
  defaultValue,
  label,
  name,
  onChange,
}: {
  children: React.ReactNode;
  defaultValue?: string;
  label: string;
  name: string;
  onChange?: (event: FormEvent<HTMLSelectElement>) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <select
        className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink outline-none focus:border-primary"
        defaultValue={defaultValue}
        name={name}
        onChange={onChange}
      >
        {children}
      </select>
    </label>
  );
}

function GlobalAddMenu({
  onSelect,
  pet,
}: {
  onSelect: (type: "care" | "observation" | "vet" | "measurement" | "document") => void;
  pet: Pet;
}) {
  const items = [
    { description: "Bath, nails, ears, grooming", icon: Check, label: "Log care", type: "care" as const },
    { description: "Behavior, symptom, appetite", icon: ClipboardList, label: "Log observation", type: "observation" as const },
    { description: "Visit, cost, services, bill", icon: HeartPulse, label: "Log vet visit", type: "vet" as const },
    { description: "Weight, length, height, collar, chest", icon: CalendarCheck, label: "Log measurements", type: "measurement" as const },
    { description: "PDF, record, certificate, image", icon: Upload, label: "Upload file", type: "document" as const },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-background p-3">
        <p className="text-sm font-semibold text-ink">Logging for {pet.name}</p>
        <p className="mt-1 text-sm leading-6 text-muted">Record something that happened or add a file.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className="flex min-h-20 items-center gap-3 rounded-lg border border-line bg-white p-3 text-left transition active:scale-[0.99]"
              key={item.type}
              onClick={() => onSelect(item.type)}
              type="button"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#e7f6f1] text-ink">
                <Icon aria-hidden className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{item.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">{item.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ObservationForm({
  onSubmit,
}: {
  onSubmit: (input: {
    category: ObservationRecord["category"];
    title: string;
    severity: ObservationRecord["severity"];
    trigger: string;
    duration: string;
    medicationStatus: string;
    notes: string;
    observedOn: string;
  }) => void;
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit({
        category: String(form.get("category") || "behavior") as ObservationRecord["category"],
        title: String(form.get("title") || ""),
        severity: String(form.get("severity") || "moderate") as ObservationRecord["severity"],
        trigger: String(form.get("trigger") || ""),
        duration: String(form.get("duration") || ""),
        medicationStatus: String(form.get("medicationStatus") || ""),
        notes: String(form.get("notes") || ""),
        observedOn: String(form.get("observedOn") || todayValue),
      });
    }}>
      <FormField defaultValue={todayValue} label="Observed on" name="observedOn" type="date" />
      <SelectField defaultValue="behavior" label="Category" name="category">
        <option value="behavior">Behavior</option>
        <option value="symptom">Symptom</option>
        <option value="appetite">Appetite</option>
        <option value="mobility">Mobility</option>
        <option value="other">Other</option>
      </SelectField>
      <FormField label="What changed?" name="title" placeholder="Licking paws, anxious with visitors, low appetite" required />
      <SelectField defaultValue="moderate" label="Severity" name="severity">
        <option value="low">Low</option>
        <option value="moderate">Moderate</option>
        <option value="high">High</option>
      </SelectField>
      <FormField label="Trigger" name="trigger" placeholder="Visitors, walk, grass, food, unknown" />
      <FormField label="Duration" name="duration" placeholder="10 minutes, all morning, intermittent" />
      <FormField label="Medication status" name="medicationStatus" placeholder="Medication given, no change, missed dose" />
      <TextAreaField label="Notes" name="notes" placeholder="Add context that may help you spot a pattern later." />
      <SubmitButton label="Save observation" />
    </form>
  );
}

function QuickCareForm({
  careEvents,
  onSubmit,
}: {
  careEvents: CareEvent[];
  onSubmit: (input: { careEventId: string; label: string; occurredOn: string; details: string }) => void;
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit({
        careEventId: String(form.get("careEventId") || ""),
        label: String(form.get("label") || ""),
        occurredOn: String(form.get("occurredOn") || todayValue),
        details: String(form.get("details") || ""),
      });
    }}>
      <FormField defaultValue={todayValue} label="Date" name="occurredOn" type="date" />
      {careEvents.length > 0 ? (
        <SelectField defaultValue={careEvents[0]?.id ?? ""} label="Care type" name="careEventId">
          {careEvents.map((event) => (
            <option key={event.id} value={event.id}>
              {event.label}
            </option>
          ))}
        </SelectField>
      ) : (
        <FormField label="Care type" name="label" placeholder="Bath, nail trim, brushing" required />
      )}
      <TextAreaField label="Details" name="details" placeholder="Optional note" />
      <SubmitButton label="Save care log" />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  return (
    <button className="min-h-11 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-white" type="submit">
      {label}
    </button>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">{title}</h2>
    </div>
  );
}

function PetFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-ink">{value}</p>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-background p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function MicrochipFactRow({ background }: { background: Pet["background"] }) {
  const value = background.microchipped
    ? background.microchipNumber || "Yes, number not set"
    : "No";

  return (
    <div className="min-w-0 rounded-lg bg-background p-3">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Microchipped</p>
        {background.microchipped ? (
          <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <Check aria-hidden className="h-3 w-3" strokeWidth={3} />
          </span>
        ) : null}
      </div>
      <p className="mt-1 break-words text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
      {status}
    </span>
  );
}

function PetAvatar({ pet, size }: { pet: Pet; size: "xs" | "sm" }) {
  const Icon = pet.species === "dog" ? Dog : Cat;
  return (
    <span className={cn("relative block shrink-0 overflow-hidden rounded-full bg-primary/10", size === "xs" ? "h-10 w-10" : "h-12 w-12")}>
      <Image alt="" className="h-full w-full object-cover" height={48} src={pet.photo} width={48} />
      <span className="absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-full bg-surface text-primary">
        <Icon aria-hidden className="h-3.5 w-3.5" />
      </span>
    </span>
  );
}

function getWeekDays(anchorValue: string) {
  const anchor = new Date(`${anchorValue}T00:00:00Z`);
  const dayIndex = anchor.getUTCDay();
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(anchor);
    date.setUTCDate(anchor.getUTCDate() + mondayOffset + index);
    return {
      date: String(date.getUTCDate()),
      day: new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(date),
      value: date.toISOString().slice(0, 10),
    };
  });
}

function getMonthDays(monthValue: string) {
  const first = new Date(`${monthValue}-01T00:00:00Z`);
  const dayIndex = first.getUTCDay();
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
  const start = new Date(first);
  start.setUTCDate(first.getUTCDate() + mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const value = date.toISOString().slice(0, 10);

    return {
      date: String(date.getUTCDate()),
      inCurrentMonth: value.slice(0, 7) === monthValue,
      value,
    };
  });
}

function addMonthsToMonth(monthValue: string, months: number) {
  return addMonths(`${monthValue}-01`, months).slice(0, 7);
}

function formatMonthLabel(monthValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${monthValue}-01T00:00:00Z`));
}

type TaskVisualKind = Task["type"] | "bath" | "nails" | "grooming";

function TaskIcon({ task, type }: { task?: Task; type?: Task["type"] }) {
  const visualKind = task ? taskVisualKind(task) : type;

  if (visualKind === "medication" || visualKind === "refill") return <Pill aria-hidden className="h-5 w-5" />;
  if (visualKind === "bath") return <Droplets aria-hidden className="h-5 w-5" />;
  if (visualKind === "nails" || visualKind === "grooming") return <Scissors aria-hidden className="h-5 w-5" />;
  if (visualKind === "vaccine") return <ShieldCheck aria-hidden className="h-5 w-5" />;
  if (visualKind === "vet") return <HeartPulse aria-hidden className="h-5 w-5" />;
  if (visualKind === "measurement") return <ClipboardList aria-hidden className="h-5 w-5" />;
  return <Check aria-hidden className="h-5 w-5" />;
}

function taskTone(taskOrType: Task | Task["type"]) {
  const visualKind = typeof taskOrType === "string" ? taskOrType : taskVisualKind(taskOrType);

  if (visualKind === "medication") return { hero: "bg-[#bfeffa]", icon: "bg-[#bfeffa] text-ink" };
  if (visualKind === "refill") return { hero: "bg-[#cfe7ff]", icon: "bg-[#cfe7ff] text-ink" };
  if (visualKind === "bath") return { hero: "bg-[#d8f5ed]", icon: "bg-[#d8f5ed] text-ink" };
  if (visualKind === "nails") return { hero: "bg-[#f7d5ef]", icon: "bg-[#f7d5ef] text-ink" };
  if (visualKind === "grooming") return { hero: "bg-[#ffe7c7]", icon: "bg-[#ffe7c7] text-ink" };
  if (visualKind === "vaccine") return { hero: "bg-[#d7f9c4]", icon: "bg-[#d7f9c4] text-ink" };
  if (visualKind === "vet") return { hero: "bg-[#ffd8c7]", icon: "bg-[#ffd8c7] text-ink" };
  if (visualKind === "measurement") return { hero: "bg-[#e7ddff]", icon: "bg-[#e7ddff] text-ink" };
  return { hero: "bg-[#ffe7a7]", icon: "bg-[#ffe7a7] text-ink" };
}

function taskVisualKind(task: Task): TaskVisualKind {
  if (task.type !== "care") return task.type;

  const label = `${task.title} ${task.notes}`.toLowerCase();
  if (label.includes("bath") || label.includes("wash")) return "bath";
  if (label.includes("nail") || label.includes("trim")) return "nails";
  if (label.includes("groom")) return "grooming";
  return "care";
}

function measurementValuePairs(measurement: MeasurementSnapshot) {
  return [
    measurementValuePair("Weight", measurement.weightValue, measurement.weightUnit),
    measurementValuePair("Length", measurement.bodyLengthValue, measurement.bodyLengthUnit),
    measurementValuePair("Height", measurement.heightValue, measurement.heightUnit),
    measurementValuePair("Collar", measurement.collarCircumferenceValue, measurement.collarCircumferenceUnit),
    measurementValuePair("Chest", measurement.chestCircumferenceValue, measurement.chestCircumferenceUnit),
  ].filter(Boolean) as Array<{ label: string; value: string }>;
}

function measurementValueParts(measurement: MeasurementSnapshot) {
  return measurementValuePairs(measurement).map((item) => `${item.label} ${item.value}`);
}

function measurementSnapshotSummary(measurement: MeasurementSnapshot) {
  return measurementValueParts(measurement).join(" · ") || "Measurements logged";
}

function measurementWeightLabel(measurement: MeasurementSnapshot) {
  return measurement.weightValue ? `${measurement.weightValue} ${measurement.weightUnit}` : undefined;
}

function hasMeasurementValue(measurement: MeasurementSnapshot) {
  return measurementValuePairs(measurement).length > 0;
}

function measurementValuePair(label: string, value: string | undefined, unit: string | undefined) {
  return value ? { label, value: `${value} ${unit}` } : null;
}

function normalizeMeasurementValue(value: FormDataEntryValue | null) {
  const normalized = String(value || "").trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? normalized : undefined;
}

function normalizeMeasurementUnit(value: FormDataEntryValue | null): "in" | "cm" {
  return value === "cm" ? "cm" : "in";
}

function taskTypeLabel(type: Task["type"]) {
  if (type === "medication") return "Medication";
  if (type === "refill") return "Refill";
  if (type === "vaccine") return "Vaccine";
  if (type === "measurement") return "Measurement";
  if (type === "vet") return "Vet";
  return "Care";
}

function taskTypeFromReminderKind(kind: Task["reminderKind"]): Task["type"] {
  if (kind === "medication") return "medication";
  if (kind === "refill") return "refill";
  if (kind === "vaccine") return "vaccine";
  if (kind === "measurement") return "measurement";
  if (kind === "vet-appointment" || kind === "vet-follow-up") return "vet";
  return "care";
}

function defaultActionLabel(type: Task["type"]) {
  if (type === "medication") return "Log dose";
  if (type === "refill") return "Refilled";
  if (type === "vaccine") return "Review";
  if (type === "measurement") return "Log measurements";
  return "Done";
}

function taskActionLabel(task: Task) {
  if (task.type === "medication") return "Log dose";
  if (task.type === "refill") return "Refilled";
  if (task.type === "vaccine") return "Review";
  if (task.type === "measurement") return "Log measurements";
  return "Done";
}

function prescribedRoutineActionLabel(kind: Task["reminderKind"]) {
  if (kind === "medication") return "Log dose";
  if (kind === "refill") return "Refilled";
  if (kind === "vaccine") return "Review";
  if (kind === "measurement") return "Log measurements";
  return "Done";
}

function routineDateLabel(kind: Task["reminderKind"]) {
  if (kind === "refill") return "Refill by date";
  if (kind === "vaccine") return "Due / review date";
  if (kind === "measurement") return "Next measurement";
  if (kind === "vet-appointment") return "Appointment date";
  if (kind === "vet-follow-up") return "Follow-up date";
  return "Next due date";
}

function routineTitleLabel(kind: Task["reminderKind"]) {
  if (kind === "medication") return "Medication / brand";
  if (kind === "refill") return "Medication / prescription";
  if (kind === "vaccine") return "Vaccine";
  if (kind === "measurement") return "Measurement";
  if (kind === "vet-appointment" || kind === "vet-follow-up") return "Reason";
  return "Title";
}

function routineTitlePlaceholder(kind: Task["reminderKind"]) {
  if (kind === "medication") return "NexGard";
  if (kind === "refill") return "Heartgard prescription";
  if (kind === "vaccine") return "Rabies";
  if (kind === "measurement") return "Body measurements check";
  if (kind === "vet-appointment") return "Annual wellness exam";
  if (kind === "vet-follow-up") return "Skin follow-up";
  return "Bath";
}

function routineNotesPlaceholder(kind: Task["reminderKind"]) {
  if (kind === "medication") return "When to give it, with food, or side effects to watch for";
  if (kind === "refill") return "Where to order it, prescription details, or pharmacy notes";
  if (kind === "vaccine") return "Requirement, clinic, or proof details";
  if (kind === "measurement") return "Scale used, goal, or body condition notes";
  if (kind === "vet-appointment") return "Questions to ask, prep instructions, or appointment context";
  if (kind === "vet-follow-up") return "What needs to be rechecked or discussed";
  return "What should the owner know before this is due?";
}

function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  const offset = window.innerWidth >= 1024 ? 96 : 112;
  const scroller = findScrollParent(target);

  if (scroller === document.documentElement) {
    window.scrollTo({
      behavior: "smooth",
      top: target.getBoundingClientRect().top + window.scrollY - offset,
    });
    return;
  }

  scroller.scrollTo({
    behavior: "smooth",
    top: scroller.scrollTop + target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - offset,
  });
}

function findScrollParent(element: HTMLElement) {
  let parent = element.parentElement;

  while (parent) {
    if (parent.scrollHeight > parent.clientHeight) return parent;
    parent = parent.parentElement;
  }

  return document.documentElement;
}

function defaultScheduleTitle(kind: Task["reminderKind"]) {
  if (kind === "medication") return "Medication dose";
  if (kind === "refill") return "Medication refill";
  if (kind === "vaccine") return "Vaccine reminder";
  if (kind === "measurement") return "Body measurements check";
  if (kind === "vet-appointment") return "Vet appointment";
  if (kind === "vet-follow-up") return "Vet follow-up";
  return "Routine care";
}

function cadenceLabel(cadence: Task["cadence"]) {
  if (cadence === "once") return "One time";
  if (cadence === "daily") return "Daily";
  if (cadence === "weekly") return "Weekly";
  if (cadence === "monthly") return "Monthly";
  if (cadence === "every-8-weeks") return "Every 8 weeks";
  return "Yearly";
}

function reminderKindLabel(kind: Task["reminderKind"]) {
  if (kind === "medication") return "Medication";
  if (kind === "refill") return "Refill";
  if (kind === "vaccine") return "Vaccine";
  if (kind === "measurement") return "Measurement";
  if (kind === "vet-appointment") return "Vet appointment";
  if (kind === "vet-follow-up") return "Vet follow-up";
  return "Care";
}

function createMeasurementTask(petId: string): Task {
  return {
    id: `measurement-${petId}`,
    petId,
    title: "Body measurements check",
    type: "measurement",
    dueDate: todayValue,
    dueLabel: "Ready",
    actionLabel: "Log measurements",
    cadence: "once",
    reminderKind: "measurement",
    notes: "Log weight, length, height, collar, and chest dimensions.",
  };
}

function recordTypeForTask(task: Task): LogEntry["recordType"] {
  if (task.type === "refill") return "medication";
  if (task.type === "vet") return "vet_visit";
  return task.type;
}

function getNextDueDate(task: Task, completedOn: string) {
  if (task.cadence === "once") return "";
  if (task.cadence === "daily") return addDays(completedOn, 1);
  if (task.cadence === "weekly") return addDays(completedOn, 7);
  if (task.cadence === "monthly") return addMonths(completedOn, 1);
  if (task.cadence === "every-8-weeks") return addDays(completedOn, 56);
  if (task.cadence === "yearly") return addMonths(completedOn, 12);
  return "";
}

function severityTone(severity: ObservationRecord["severity"]) {
  if (severity === "high") return { icon: "bg-[#f7d5ef] text-ink", pill: "bg-[#f7d5ef] text-ink" };
  if (severity === "moderate") return { icon: "bg-[#bfeffa] text-ink", pill: "bg-[#bfeffa] text-ink" };
  return { icon: "bg-[#d7f9c4] text-ink", pill: "bg-[#d7f9c4] text-ink" };
}

function logTone(type: LogEntry["recordType"]) {
  if (type === "medication") return "bg-[#bfeffa] text-ink";
  if (type === "vaccine") return "bg-[#d7f9c4] text-ink";
  if (type === "measurement") return "bg-[#f7d5ef] text-ink";
  if (type === "vet_visit") return "bg-[#f7d5ef] text-ink";
  if (type === "observation") return "bg-[#ffe7a7] text-ink";
  return "bg-[#ffe7a7] text-ink";
}

function sortDocumentsByCreatedAt(documents: RecordDocument[]) {
  return [...documents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function latestDocument(documents: RecordDocument[]) {
  return sortDocumentsByCreatedAt(documents)[0] ?? null;
}

function findLatestDocumentForKitType(
  documents: RecordDocument[],
  petId: string,
  documentType: KitDocumentLink["documentType"],
) {
  const petDocuments = documents.filter((document) => document.petId === petId);
  const candidates = petDocuments.filter((document) => {
    const title = document.title.toLowerCase();

    if (documentType === "rabies-proof") {
      return document.recordType === "vaccine_record" && title.includes("rabies");
    }

    if (documentType === "vaccination-records") {
      return document.recordType === "vaccine_record";
    }

    if (documentType === "registration") {
      return title.includes("registration") || title.includes("license");
    }

    if (documentType === "microchip-info") {
      return title.includes("microchip") || title.includes("chip");
    }

    if (documentType === "health-certificate") {
      return title.includes("health certificate") || title.includes("certificate");
    }

    if (documentType === "airline-forms") {
      return title.includes("airline") || title.includes("flight") || title.includes("usda");
    }

    if (documentType === "insurance") {
      return title.includes("insurance");
    }

    return false;
  });

  return latestDocument(candidates);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatCurrency(value: string, currency: "USD" = "USD") {
  const amount = Number(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return new Intl.NumberFormat("en-US", { currency, style: "currency" }).format(amount);
}

function totalVetSpend(visits: VetVisit[]) {
  return visits.reduce((sum, visit) => {
    const amount = Number((visit.totalCost || "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);
}

function completionTiming(dueDate: string, occurredOn: string): LogEntry["completedTiming"] {
  if (occurredOn < dueDate) return "early";
  if (occurredOn > dueDate) return "late";
  return "on-time";
}

function completionTimingLabel(log: LogEntry) {
  if (!log.dueDate || !log.completedTiming) return "";
  const days = Math.abs(daysBetween(log.dueDate, log.occurredOn));
  if (log.completedTiming === "on-time") return "On time";
  if (log.completedTiming === "late") return days === 1 ? "Completed 1 day late" : `Completed ${days} days late`;
  return days === 1 ? "Completed 1 day early" : `Completed ${days} days early`;
}

function getKitPrepItems(trips: PetKit[]): KitPrepItem[] {
  return trips.flatMap((trip) => {
    if (!trip.startDate) return [];
    const endDate = trip.endDate || trip.startDate;
    const prepLabel = kitPrepLabel(trip);

    return [
      {
        endDate,
        id: `${trip.id}-review`,
        date: addDays(trip.startDate, -90),
        destination: trip.destination || "",
        petIds: trip.petIds,
        prepLabel,
        title: "Review travel requirements",
        tripId: trip.id,
        tripTitle: trip.title,
      },
      {
        endDate,
        id: `${trip.id}-documents`,
        date: addDays(trip.startDate, -30),
        destination: trip.destination || "",
        petIds: trip.petIds,
        prepLabel,
        title: "Check travel documents",
        tripId: trip.id,
        tripTitle: trip.title,
      },
      {
        endDate,
        id: `${trip.id}-final-pack`,
        date: addDays(trip.startDate, -7),
        destination: trip.destination || "",
        petIds: trip.petIds,
        prepLabel,
        title: "Final pack check",
        tripId: trip.id,
        tripTitle: trip.title,
      },
    ].filter((item) => item.date <= endDate);
  });
}

function kitPrepLabel(kit: PetKit): KitPrepItem["prepLabel"] {
  return kit.sourceTemplateId.includes("flight") || kit.sourceTemplateId.includes("road") ? "Trip prep" : "List prep";
}

function kitContextLabel(kit: PetKit) {
  const dateLabel = kit.startDate
    ? kit.endDate && kit.endDate !== kit.startDate
      ? `${formatDateForDisplay(kit.startDate)} to ${formatDateForDisplay(kit.endDate)}`
      : formatDateForDisplay(kit.startDate)
    : "No date set";
  return [kit.destination, dateLabel].filter(Boolean).join(" - ");
}

function kitProgressParts(trip: PetKit) {
  const items = kitUnifiedItems(trip);
  const completed = items.filter((item) => item.completed).length;
  const documentIssues = items.filter(
    (item) =>
      item.itemType === "document" &&
      (!item.completed || item.status === "expires-before-trip" || item.status === "renewal-recommended"),
  ).length;

  return {
    done: items.length === 0 ? "0/0" : `${completed}/${items.length}`,
    documentIssues: documentIssues > 0 ? `${documentIssues} ${documentIssues === 1 ? "doc" : "docs"}` : "",
  };
}

function kitDocumentResolved(link: KitDocumentLink) {
  return Boolean(link.completed || link.documentId || link.status === "attached" || link.status === "current");
}

function kitUnifiedItems(kit: PetKit): KitUnifiedItem[] {
  const checklistItems = kit.checklistItems.map((item) => ({
    ...item,
    itemType: item.itemType ?? (item.resourceUrl ? ("link" as const) : ("task" as const)),
    source: "checklist" as const,
  }));
  const documentItems = kit.documentLinks.map((link) => ({
    completed: kitDocumentResolved(link),
    documentId: link.documentId,
    documentType: link.documentType,
    expiresOn: link.expiresOn,
    id: link.id,
    itemType: "document" as const,
    label: link.label,
    petId: link.petId,
    recordId: link.recordId,
    recordType: link.recordType,
    source: "document-link" as const,
    status: link.status,
  }));

  return [...checklistItems, ...documentItems];
}

function kitItemMeta(item: KitUnifiedItem) {
  if (item.itemType === "document") {
    if (item.documentId) return item.expiresOn ? `Document attached - expires ${formatDateForDisplay(item.expiresOn)}` : "Document attached";
    if (item.status) return kitDocumentStatusLabel(item.status);
    return item.documentType ? kitDocumentTypeLabel(item.documentType) : "Document needed";
  }

  if (item.itemType === "link") return item.resourceLabel || (item.resourceUrl ? compactUrlLabel(item.resourceUrl) : "Saved link");
  return "";
}

function kitDocumentStatusLabel(status: KitDocumentLink["status"]) {
  const labels: Record<KitDocumentLink["status"], string> = {
    attached: "Attached",
    current: "Current",
    "expires-before-trip": "Expires before trip",
    missing: "Missing",
    "renewal-recommended": "Renewal recommended",
  };
  return labels[status];
}

function kitDocumentTypeLabel(type: KitDocumentLink["documentType"]) {
  const labels: Record<KitDocumentLink["documentType"], string> = {
    "airline-forms": "Airline forms",
    custom: "Custom document",
    "health-certificate": "Health certificate",
    insurance: "Insurance",
    "microchip-info": "Microchip info",
    "rabies-proof": "Rabies proof",
    registration: "Registration",
    "vaccination-records": "Vaccination records",
  };
  return labels[type];
}

function defaultKitRenewalLeadDays(type: KitDocumentLink["documentType"]) {
  if (type === "health-certificate" || type === "airline-forms") return 14;
  if (type === "rabies-proof" || type === "vaccination-records") return 30;
  return 21;
}

function kitResolvedStatus(link: KitDocumentLink, trip: PetKit): KitDocumentStatus {
  if (link.expiresOn && trip.startDate && link.expiresOn < trip.startDate) return "expires-before-trip";
  if (link.expiresOn && link.renewalLeadDays && daysBetween(todayValue, link.expiresOn) <= link.renewalLeadDays) {
    return "renewal-recommended";
  }
  return link.expiresOn ? "current" : "attached";
}

function completeRelatedKitChecklistItem(items: KitChecklistItem[], link?: KitDocumentLink) {
  if (!link) return items;

  const terms = relatedDocumentTerms(link).map((term) => term.toLowerCase());
  let completedOne = false;

  return items.map((item) => {
    if (item.completed || completedOne) return item;
    const label = item.label.toLowerCase();
    const matches = terms.some((term) => term && label.includes(term));
    if (!matches) return item;

    completedOne = true;
    return { ...item, completed: true };
  });
}

function relatedDocumentTerms(link: KitDocumentLink) {
  const typeLabel = kitDocumentTypeLabel(link.documentType);

  if (link.documentType === "airline-forms") return [link.label, typeLabel, "airline", "form", "paperwork", "usda"];
  if (link.documentType === "health-certificate") return [link.label, typeLabel, "health certificate", "certificate"];
  if (link.documentType === "rabies-proof") return [link.label, typeLabel, "rabies"];
  if (link.documentType === "vaccination-records") return [link.label, typeLabel, "vaccine", "vaccination", "immunization"];
  if (link.documentType === "registration") return [link.label, typeLabel, "registration", "license"];
  if (link.documentType === "microchip-info") return [link.label, typeLabel, "microchip", "chip"];
  if (link.documentType === "insurance") return [link.label, typeLabel, "insurance"];
  return [link.label, typeLabel];
}

function compactUrlLabel(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Open link";
  }
}

function daysBetween(startValue: string, endValue: string) {
  const start = new Date(`${startValue}T00:00:00Z`);
  const end = new Date(`${endValue}T00:00:00Z`);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function addMonths(value: string, months: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

function dateValueFromDisplay(value: string) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(`${value} UTC`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function formatDateForDisplay(value: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

function isDateInRange(value: string, startValue: string, endValue: string) {
  return value >= startValue && value <= endValue;
}

function relativeDateLabel(value: string) {
  if (value === todayValue) return "Today";
  if (value === addDays(todayValue, 1)) return "Tomorrow";

  const date = new Date(`${value}T00:00:00Z`);
  const today = new Date(`${todayValue}T00:00:00Z`);
  const daysAway = Math.round((date.getTime() - today.getTime()) / 86400000);
  const formatted = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);

  if (daysAway > 1 && daysAway <= 28) return `${formatted}, in ${daysAway} days`;
  return formatted;
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `pet-${Date.now()}`
  );
}

function uniqueId(base: string, existingIds: string[]) {
  if (!existingIds.includes(base)) return base;
  return `${base}-${Date.now()}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function archiveReasonLabel(reason: Pet["archivedReason"]) {
  if (reason === "passed-away") return "Passed away";
  if (reason === "no-longer-owned") return "No longer in my care";
  return "Archived";
}

function archivedPetProfileMeta(pet: Pet) {
  const added = pet.createdLabel ? `Added ${pet.createdLabel}` : "";
  const archived = pet.archivedAt
    ? `Archived ${formatDateForDisplay(pet.archivedAt.slice(0, 10))}${pet.archivedReason ? ` (${archiveReasonLabel(pet.archivedReason)})` : ""}`
    : archiveReasonLabel(pet.archivedReason);

  return [added, archived].filter(Boolean).join(" · ") || pet.species;
}

function isDefaultPetPhoto(value: string) {
  return value.includes("images.unsplash.com/photo-1548199973") || value.includes("images.unsplash.com/photo-1574158622682");
}

function splitPreferenceList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
