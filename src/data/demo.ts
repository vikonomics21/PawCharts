export type PetSpecies = "dog" | "cat";

export type OwnerProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
};

export type Pet = {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  sex: "male" | "female";
  photo: string;
  ageLabel: string;
  ageEstimated: boolean;
  weight: string;
  status: string;
  behaviorNotes: string;
  careNotes: string;
  medicalNotes: string;
  background: {
    adoptionPlace: string;
    adoptionDate: string;
    spayedNeutered: boolean;
    microchipped: boolean;
    microchipNumber: string;
    knownHistory: string;
  };
  foodPreferences: {
    favorites: string[];
    dislikes: string[];
    rules: string[];
  };
  dynamicFields: { label: string; value: string }[];
  primaryVetId?: string;
  secondaryVetId?: string;
  secondaryVetRole?: string;
  trainingCues?: { id: string; cue: string; action: string }[];
  archivedAt?: string;
  archivedReason?: "passed-away" | "no-longer-owned" | "other";
  archivedNotes?: string;
  deletedAt?: string;
  deletedReason?: string;
  deletedNotes?: string;
};

export type Task = {
  id: string;
  petId: string;
  title: string;
  type: "medication" | "refill" | "care" | "vaccine" | "measurement" | "vet";
  dueDate: string;
  dueLabel: string;
  actionLabel: string;
  cadence: "once" | "daily" | "weekly" | "monthly" | "every-8-weeks" | "yearly";
  reminderKind:
    | "medication"
    | "refill"
    | "care"
    | "vaccine"
    | "measurement"
    | "vet-appointment"
    | "vet-follow-up";
  notes: string;
  lastCompletedOn?: string;
  refillByDate?: string;
  doseLabel?: string;
  providerId?: string;
  completed?: boolean;
};

export type VaccineRecord = {
  id: string;
  petId: string;
  name: string;
  protectsAgainst: string;
  dateGiven: string;
  expires: string;
  provider: string;
  status: "current" | "due-soon";
};

export type CareEvent = {
  id: string;
  petId: string;
  label: string;
  lastLogged: string;
  defaultAction: string;
  custom?: boolean;
};

export type MeasurementSnapshot = {
  id: string;
  petId: string;
  measuredOn: string;
  weightValue?: string;
  weightUnit: "lb" | "kg";
  bodyLengthValue?: string;
  bodyLengthUnit: "in" | "cm";
  heightValue?: string;
  heightUnit: "in" | "cm";
  collarCircumferenceValue?: string;
  collarCircumferenceUnit: "in" | "cm";
  chestCircumferenceValue?: string;
  chestCircumferenceUnit: "in" | "cm";
  notes?: string;
  createdLabel: string;
};

export type DocumentRecordType =
  | "vaccine_record"
  | "medication"
  | "vet_visit"
  | "care_event"
  | "measurement"
  | "pet";

export type RecordDocument = {
  contentType?: string;
  createdAt: string;
  documentGroupId: string;
  documentType?: string;
  id: string;
  petId: string;
  recordType: DocumentRecordType;
  recordId: string;
  signedUrl?: string;
  storagePath?: string;
  supersededById?: string;
  title: string;
  fileType: "pdf" | "image";
  sizeLabel: string;
  addedLabel: string;
  privateByDefault: boolean;
  versionLabel: string;
};

export type KitChecklistItem = {
  id: string;
  label: string;
  completed: boolean;
  itemType?: "task" | "document" | "link";
  petId?: string;
  documentId?: string;
  recordType?: DocumentRecordType;
  recordId?: string;
  documentType?:
    | "rabies-proof"
    | "vaccination-records"
    | "registration"
    | "microchip-info"
    | "health-certificate"
    | "airline-forms"
    | "insurance"
    | "custom";
  expiresOn?: string;
  resourceLabel?: string;
  resourceUrl?: string;
};

export type KitDocumentStatus =
  | "attached"
  | "missing"
  | "expires-before-trip"
  | "renewal-recommended"
  | "current";

export type KitDocumentLink = {
  id: string;
  petId: string;
  documentId?: string;
  recordType?: DocumentRecordType;
  recordId?: string;
  label: string;
  documentType:
    | "rabies-proof"
    | "vaccination-records"
    | "registration"
    | "microchip-info"
    | "health-certificate"
    | "airline-forms"
    | "insurance"
    | "custom";
  status: KitDocumentStatus;
  completed?: boolean;
  expiresOn?: string;
  renewalLeadDays?: number;
};

export type KitTemplate = {
  id: string;
  name: string;
  category: "custom" | "flight" | "road" | "outing";
  checklistItems: KitChecklistItem[];
  suggestedDocumentTypes: KitDocumentLink["documentType"][];
};

export type PetKit = {
  id: string;
  title: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  petIds: string[];
  sourceTemplateId: string;
  checklistItems: KitChecklistItem[];
  documentLinks: KitDocumentLink[];
  notes: string;
};

export type ObservationRecord = {
  id: string;
  petId: string;
  category: "behavior" | "symptom" | "appetite" | "mobility" | "other";
  title: string;
  severity: "low" | "moderate" | "high";
  trigger: string;
  duration: string;
  medicationStatus: string;
  notes: string;
  observedOn: string;
  createdLabel: string;
};

export type VetPrepItem = {
  id: string;
  petId: string;
  title: string;
  details: string;
  observedOn: string;
  status: "open" | "addressed" | "dismissed";
  createdLabel: string;
};

export type VetProvider = {
  id: string;
  householdId: string;
  name: string;
  phone: string;
  address: string;
  website: string;
  notes: string;
};

export type VetVisit = {
  id: string;
  petId: string;
  vetProviderId: string;
  visitedOn: string;
  reason: string;
  notes: string;
  followUpDate: string;
  totalCost: string;
  currency: "USD";
  servicesPerformed: string[];
  billDocumentId?: string;
  createdLabel: string;
};

export const demoOwnerProfile: OwnerProfile = {
  id: "owner-demo",
  firstName: "Vikram",
  lastName: "",
  email: "vikram@example.com",
  phone: "",
  city: "San Francisco",
};

export const demoPets: Pet[] = [
  {
    id: "oliver",
    name: "Oliver",
    species: "dog",
    breed: "Mini Goldendoodle",
    sex: "male",
    photo:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=640&q=80",
    ageLabel: "About 4 years",
    ageEstimated: true,
    weight: "22 lb",
    status: "2 items due today",
    behaviorNotes:
      "Affectionate and food-motivated. Gets excited near scooters and needs extra distance on busy sidewalks. Leash walks are easiest with a touch cue and extra space near scooters.",
    careNotes:
      "Prefers chicken treats for grooming. Wipe paws after rain. Grooming cadence is usually every 8 weeks.",
    medicalNotes:
      "No known allergies. Monthly flea and tick medication is easiest when given with breakfast.",
    background: {
      adoptionPlace: "Golden Gate Rescue",
      adoptionDate: "2022-08-14",
      spayedNeutered: true,
      microchipped: true,
      microchipNumber: "985112004812347",
      knownHistory:
        "Adopted with limited early-life history. Needs patient introductions and extra space around busy sidewalks.",
    },
    foodPreferences: {
      favorites: [
        "Dried lamb treats",
        "Greek yogurt",
        "Sweet potato",
        "Peanut butter",
        "Chicken on lick mat",
        "Cheese",
        "Salami",
      ],
      dislikes: ["Bananas"],
      rules: ["No regular table food to reduce begging"],
    },
    dynamicFields: [],
    primaryVetId: "parkside",
    secondaryVetId: "bay-behavior",
    secondaryVetRole: "Behavior vet",
    trainingCues: [
      { id: "sit", cue: "Sit", action: "Sits and waits for release" },
      { id: "touch", cue: "Touch", action: "Touches nose to hand" },
      { id: "stay", cue: "Stay", action: "Holds position until released" },
      { id: "leave-it", cue: "Leave it", action: "Stops engaging with food or objects" },
      { id: "place", cue: "Place", action: "Goes to mat and settles" },
    ],
  },
  {
    id: "luna",
    name: "Luna",
    species: "cat",
    breed: "Domestic shorthair",
    sex: "female",
    photo:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=640&q=80",
    ageLabel: "3 years, 2 months",
    ageEstimated: false,
    weight: "10.5 lb",
    status: "All care current",
    behaviorNotes:
      "Slow to warm up to guests. Likes quiet rooms and will come out for treats once the room settles.",
    careNotes:
      "Unscented litter only. Carrier is easier with a towel inside and treats placed near the door.",
    medicalNotes:
      "No known allergies. Monitor weight because appetite changes are easy to miss.",
    background: {
      adoptionPlace: "City Shelter",
      adoptionDate: "2023-04-22",
      spayedNeutered: true,
      microchipped: true,
      microchipNumber: "981020045932118",
      knownHistory:
        "Adopted as a young adult. Slow introductions help her feel settled around guests.",
    },
    foodPreferences: {
      favorites: ["Churu treats", "Chicken pate", "Freeze-dried salmon"],
      dislikes: ["Beef wet food"],
      rules: ["Feed in a quiet room", "Use unscented litter area nearby"],
    },
    dynamicFields: [
      { label: "Lifestyle", value: "Indoor" },
      { label: "Litter", value: "Unscented clumping" },
    ],
    primaryVetId: "mission-cat",
  },
];

export const demoVetProviders: VetProvider[] = [
  {
    id: "parkside",
    householdId: "household-demo",
    name: "Parkside Vet",
    phone: "(415) 555-0198",
    address: "220 Parkside Ave, San Francisco, CA",
    website: "parksidevet.example",
    notes: "Primary clinic for routine care, vaccines, and allergy questions.",
  },
  {
    id: "mission-cat",
    householdId: "household-demo",
    name: "Mission Cat Clinic",
    phone: "(415) 555-0144",
    address: "88 Valencia St, San Francisco, CA",
    website: "missioncat.example",
    notes: "Cat-focused clinic. Luna is calmer in the afternoon appointment slots.",
  },
  {
    id: "bay-behavior",
    householdId: "household-demo",
    name: "Bay Behavior Vet",
    phone: "(415) 555-0132",
    address: "14 Hayes St, San Francisco, CA",
    website: "baybehavior.example",
    notes: "Behavior-focused consults for leash reactivity and anxiety plans.",
  },
];

export const demoTasks: Task[] = [
  {
    id: "flea",
    petId: "oliver",
    title: "Flea and tick treatment",
    type: "medication",
    dueDate: "2026-08-16",
    dueLabel: "Due today",
    actionLabel: "Given today",
    cadence: "monthly",
    reminderKind: "medication",
    notes: "Simparica Trio monthly chew, give with breakfast.",
    doseLabel: "One monthly chew, 11-22 lb",
  },
  {
    id: "bath",
    petId: "oliver",
    title: "Bath",
    type: "care",
    dueDate: "2026-08-16",
    dueLabel: "Suggested today",
    actionLabel: "Bath today",
    cadence: "every-8-weeks",
    reminderKind: "care",
    notes: "Use chicken treats and wipe paws afterward.",
  },
  {
    id: "rabies",
    petId: "luna",
    title: "Rabies vaccine",
    type: "vaccine",
    dueDate: "2026-09-06",
    dueLabel: "Expires in 21 days",
    actionLabel: "Review",
    cadence: "yearly",
    reminderKind: "vaccine",
    notes: "Review vaccine expiration and book booster if needed.",
  },
  {
    id: "weight",
    petId: "luna",
    title: "Body measurements check",
    type: "measurement",
    dueDate: "2026-08-20",
    dueLabel: "This week",
    actionLabel: "Log measurements",
    cadence: "monthly",
    reminderKind: "measurement",
    notes: "Monthly weight and body dimension check.",
  },
  {
    id: "flea-refill",
    petId: "oliver",
    title: "Refill Simparica Trio",
    type: "refill",
    dueDate: "2026-08-30",
    dueLabel: "Refill before next dose",
    actionLabel: "Mark ordered",
    cadence: "monthly",
    reminderKind: "refill",
    notes: "Order before the next monthly dose runs out.",
    refillByDate: "2026-08-30",
    doseLabel: "Simparica Trio, 11-22 lb",
  },
  {
    id: "vet-follow-up-oliver",
    petId: "oliver",
    title: "Allergy follow-up appointment",
    type: "vet",
    dueDate: "2026-08-27",
    dueLabel: "Book follow-up",
    actionLabel: "Mark scheduled",
    cadence: "once",
    reminderKind: "vet-follow-up",
    notes: "Follow up on paw licking and topical treatment plan.",
    providerId: "parkside",
  },
];

export const demoVetPrepItems: VetPrepItem[] = [
  {
    id: "vet-tail-oliver",
    petId: "oliver",
    title: "Biting tail more often",
    details: "Noticed after evening walks this week. Check for irritation or allergies.",
    observedOn: "2026-06-03",
    status: "open",
    createdLabel: "Jun 3",
  },
  {
    id: "vet-paws-oliver",
    petId: "oliver",
    title: "Licking paws after walks",
    details: "Happens mostly after grass-heavy routes.",
    observedOn: "2026-06-04",
    status: "open",
    createdLabel: "Jun 4",
  },
  {
    id: "vet-appetite-luna",
    petId: "luna",
    title: "Ask about appetite changes",
    details: "Eating breakfast more slowly than usual.",
    observedOn: "2026-06-02",
    status: "open",
    createdLabel: "Jun 2",
  },
];

export const demoVetVisits: VetVisit[] = [
  {
    id: "visit-oliver-allergy",
    petId: "oliver",
    vetProviderId: "parkside",
    visitedOn: "2026-04-18",
    reason: "Skin and allergy check",
    notes: "Discussed paw licking after grass-heavy walks. Vet suggested wiping paws after walks and monitoring redness.",
    followUpDate: "2026-07-18",
    totalCost: "186.40",
    currency: "USD",
    servicesPerformed: ["Exam", "Allergy consult", "Topical treatment plan"],
    billDocumentId: "doc-oliver-allergy-bill",
    createdLabel: "Apr 18",
  },
  {
    id: "visit-luna-wellness",
    petId: "luna",
    vetProviderId: "mission-cat",
    visitedOn: "2026-03-12",
    reason: "Annual wellness exam",
    notes: "Weight steady. Teeth looked good. Continue monitoring appetite changes.",
    followUpDate: "",
    totalCost: "142.00",
    currency: "USD",
    servicesPerformed: ["Wellness exam", "Dental check"],
    billDocumentId: "doc-luna-wellness-bill",
    createdLabel: "Mar 12",
  },
];

export const demoObservations: ObservationRecord[] = [
  {
    id: "obs-oliver-paws",
    petId: "oliver",
    category: "behavior",
    title: "Licking paws after walks",
    severity: "moderate",
    trigger: "Grass-heavy route",
    duration: "10 minutes",
    medicationStatus: "No medication given",
    notes: "Settled after paw wipe. Track if it keeps happening after evening walks.",
    observedOn: "2026-06-04",
    createdLabel: "Jun 4",
  },
  {
    id: "obs-luna-appetite",
    petId: "luna",
    category: "appetite",
    title: "Slower breakfast",
    severity: "low",
    trigger: "Morning meal",
    duration: "This week",
    medicationStatus: "No medication changes",
    notes: "Still eating, just slower than usual.",
    observedOn: "2026-06-02",
    createdLabel: "Jun 2",
  },
];

export const demoVaccines: VaccineRecord[] = [
  {
    id: "v1",
    petId: "oliver",
    name: "Rabies",
    protectsAgainst: "Rabies virus, required for most travel and boarding.",
    dateGiven: "Jan 18, 2025",
    expires: "Jan 18, 2028",
    provider: "Parkside Vet",
    status: "current",
  },
  {
    id: "v2",
    petId: "oliver",
    name: "DHPP",
    protectsAgainst: "Distemper, hepatitis, parainfluenza, and parvovirus.",
    dateGiven: "Mar 04, 2025",
    expires: "Mar 04, 2026",
    provider: "Parkside Vet",
    status: "due-soon",
  },
  {
    id: "v3",
    petId: "luna",
    name: "FVRCP",
    protectsAgainst: "Common respiratory and panleukopenia viruses in cats.",
    dateGiven: "Sep 12, 2025",
    expires: "Sep 12, 2026",
    provider: "Mission Cat Clinic",
    status: "current",
  },
];

export const demoCareEvents: CareEvent[] = [
  {
    id: "nails",
    petId: "oliver",
    label: "Nail trim",
    lastLogged: "Apr 28",
    defaultAction: "Trim today",
  },
  {
    id: "ears",
    petId: "luna",
    label: "Ear cleaning",
    lastLogged: "Custom event",
    defaultAction: "Log today",
    custom: true,
  },
];

export const demoDocuments: RecordDocument[] = [
  {
    createdAt: "2025-01-18T12:00:00.000Z",
    documentGroupId: "vaccine_record:v1:rabies-proof",
    id: "doc-rabies-cert",
    petId: "oliver",
    recordType: "vaccine_record",
    recordId: "v1",
    title: "Rabies certificate.pdf",
    fileType: "pdf",
    sizeLabel: "428 KB",
    addedLabel: "Jan 18",
    privateByDefault: true,
    versionLabel: "Latest",
  },
  {
    createdAt: "2025-03-04T12:00:00.000Z",
    documentGroupId: "vaccine_record:v2:dhpp-proof",
    id: "doc-dhpp-photo",
    petId: "oliver",
    recordType: "vaccine_record",
    recordId: "v2",
    title: "DHPP record photo.jpg",
    fileType: "image",
    sizeLabel: "1.2 MB",
    addedLabel: "Mar 04",
    privateByDefault: true,
    versionLabel: "Latest",
  },
  {
    createdAt: "2026-05-15T12:00:00.000Z",
    documentGroupId: "care_event:ears:photos",
    id: "doc-ear-photo",
    petId: "luna",
    recordType: "care_event",
    recordId: "ears",
    title: "Ear check photo.png",
    fileType: "image",
    sizeLabel: "844 KB",
    addedLabel: "Custom event",
    privateByDefault: true,
    versionLabel: "Latest",
  },
  {
    createdAt: "2026-04-18T12:00:00.000Z",
    documentGroupId: "vet_visit:visit-oliver-allergy:bill",
    id: "doc-oliver-allergy-bill",
    petId: "oliver",
    recordType: "vet_visit",
    recordId: "visit-oliver-allergy",
    title: "Parkside Vet bill - allergy check.pdf",
    fileType: "pdf",
    sizeLabel: "612 KB",
    addedLabel: "Apr 18",
    privateByDefault: true,
    versionLabel: "Latest",
  },
  {
    createdAt: "2026-03-12T12:00:00.000Z",
    documentGroupId: "vet_visit:visit-luna-wellness:bill",
    id: "doc-luna-wellness-bill",
    petId: "luna",
    recordType: "vet_visit",
    recordId: "visit-luna-wellness",
    title: "Mission Cat wellness bill.jpg",
    fileType: "image",
    sizeLabel: "1.4 MB",
    addedLabel: "Mar 12",
    privateByDefault: true,
    versionLabel: "Latest",
  },
];

export const demoKitTemplates: KitTemplate[] = [
  {
    id: "template-blank",
    name: "Blank list",
    category: "custom",
    checklistItems: [],
    suggestedDocumentTypes: [],
  },
  {
    id: "template-domestic-flight",
    name: "Domestic flight",
    category: "flight",
    checklistItems: [
      { id: "dom-carrier", label: "Confirm airline carrier dimensions", completed: false },
      { id: "dom-food", label: "Pack labeled meals and treats", completed: false },
      { id: "dom-potty", label: "Pack potty pads and cleanup wipes", completed: false },
    ],
    suggestedDocumentTypes: ["rabies-proof", "vaccination-records", "airline-forms"],
  },
  {
    id: "template-international-flight",
    name: "International flight",
    category: "flight",
    checklistItems: [
      {
        id: "intl-usda",
        label: "Review USDA/export paperwork",
        completed: false,
        resourceLabel: "USDA pet travel",
        resourceUrl: "https://www.aphis.usda.gov/pet-travel",
      },
      { id: "intl-health-cert", label: "Book health certificate appointment", completed: false },
      { id: "intl-airline", label: "Confirm airline pet rules", completed: false },
      { id: "intl-food", label: "Pack food, treats, and medication in carry-on", completed: false },
    ],
    suggestedDocumentTypes: [
      "rabies-proof",
      "vaccination-records",
      "microchip-info",
      "health-certificate",
      "airline-forms",
      "insurance",
    ],
  },
  {
    id: "template-road-trip",
    name: "Road trip",
    category: "road",
    checklistItems: [
      { id: "road-harness", label: "Pack car harness or crate", completed: false },
      { id: "road-water", label: "Pack water bowl and extra water", completed: false },
      { id: "road-meds", label: "Pack medication and refill buffer", completed: false },
    ],
    suggestedDocumentTypes: ["rabies-proof", "vaccination-records", "insurance"],
  },
  {
    id: "template-picnic",
    name: "Picnic day",
    category: "outing",
    checklistItems: [
      { id: "picnic-water", label: "Water bowl and treats", completed: false },
      { id: "picnic-leash", label: "Leash, long line, and cleanup bags", completed: false },
      { id: "picnic-mat", label: "Cooling mat or blanket", completed: false },
    ],
    suggestedDocumentTypes: ["rabies-proof"],
  },
];

export const demoPetKits: PetKit[] = [
  {
    id: "trip-mexico-city",
    title: "Mexico City flight",
    destination: "Mexico City",
    startDate: "2026-09-12",
    endDate: "2026-09-20",
    petIds: ["oliver"],
    sourceTemplateId: "template-international-flight",
    checklistItems: [
      {
        id: "trip-mx-usda",
        label: "Review USDA/export paperwork",
        completed: false,
        resourceLabel: "USDA paperwork",
        resourceUrl: "https://www.aphis.usda.gov/pet-travel",
      },
      { id: "trip-mx-health-cert", label: "Book health certificate appointment", completed: false },
      { id: "trip-mx-carrier", label: "Confirm carrier fits airline dimensions", completed: true },
      { id: "trip-mx-food", label: "Pack food, treats, and NexGard", completed: false },
    ],
    documentLinks: [
      {
        id: "trip-mx-rabies",
        petId: "oliver",
        documentId: "doc-rabies-cert",
        recordType: "vaccine_record",
        recordId: "v1",
        label: "Rabies proof",
        documentType: "rabies-proof",
        status: "current",
        expiresOn: "2028-01-18",
        renewalLeadDays: 30,
      },
      {
        id: "trip-mx-vaccines",
        petId: "oliver",
        documentId: "doc-dhpp-photo",
        recordType: "vaccine_record",
        recordId: "v2",
        label: "Vaccination records",
        documentType: "vaccination-records",
        status: "renewal-recommended",
        expiresOn: "2026-09-12",
        renewalLeadDays: 30,
      },
      {
        id: "trip-mx-health-cert-doc",
        petId: "oliver",
        label: "Health certificate",
        documentType: "health-certificate",
        status: "missing",
        renewalLeadDays: 14,
      },
      {
        id: "trip-mx-airline-forms",
        petId: "oliver",
        label: "Airline forms",
        documentType: "airline-forms",
        status: "missing",
        renewalLeadDays: 14,
      },
    ],
    notes: "Confirm current airline, destination, and veterinarian requirements before booking.",
  },
  {
    id: "trip-golden-gate-picnic",
    title: "Golden Gate picnic",
    destination: "Golden Gate Park",
    startDate: "2026-08-23",
    endDate: "2026-08-23",
    petIds: ["oliver", "luna"],
    sourceTemplateId: "template-picnic",
    checklistItems: [
      { id: "trip-picnic-water", label: "Water bowls for both pets", completed: false },
      { id: "trip-picnic-cleanup", label: "Cleanup bags and wipes", completed: true },
      { id: "trip-picnic-treats", label: "Oliver's dried lamb treats", completed: false },
    ],
    documentLinks: [
      {
        id: "trip-picnic-rabies-oliver",
        petId: "oliver",
        documentId: "doc-rabies-cert",
        recordType: "vaccine_record",
        recordId: "v1",
        label: "Oliver rabies proof",
        documentType: "rabies-proof",
        status: "current",
        expiresOn: "2028-01-18",
        renewalLeadDays: 30,
      },
      {
        id: "trip-picnic-rabies-luna",
        petId: "luna",
        label: "Luna rabies proof",
        documentType: "rabies-proof",
        status: "missing",
        renewalLeadDays: 30,
      },
    ],
    notes: "Keep both pets shaded and bring extra water.",
  },
];

export const householdMembers = [
  { name: "You", role: "Owner", status: "Active" },
  { name: "Invite link", role: "Admin or member", status: "Ready to copy" },
];
