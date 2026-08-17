# PawChart Audit And Revision Plan

This audit maps the current prototype against the revised product direction. The goal is an intentional evolution of the existing app, not a rewrite.

## Executive Summary

PawChart already has strong foundations for the revised direction: multi-pet support, Home quick actions, pet profile sections, vaccines, vet visits, care logs, medications, documents, vet prep, household roles, and private-by-default upload concepts.

The main product gap is information architecture. The current `Records` destination is carrying too much: history, health, care, meds, and documents. The revised product needs clearer mental models:

- `Home` = what needs attention now.
- `Calendar` = what happened when and what is coming up.
- `Health` = medical, behavioral, medication, vaccine, measurement, vet, and appointment-prep understanding.
- `Pets` = identity, reference profile, care instructions, documents, sharing/access.
- `Add` = fastest capture path from anywhere.

Important correction from current direction: keep the destination name `Pets`, not `Profile`. The user-facing concept is still “my pets,” while the content inside each pet can function as the profile.

## A. Current Application Map

Current primary destinations:

| Destination | Current Purpose | Current Notes |
|---|---|---|
| `Home` | Due care items, quick actions, recent logs, notification panel | Mostly aligned with revised direction. |
| `Pets` | Pet switcher, pet identity card, profile snapshot, background, behavior, food, care preferences, medical notes, care team, vet prep, documents | Strong foundation. Should remain `Pets`. |
| `Records` | Pet switcher plus `Timeline`, `Health`, `Care`, `Meds`, `Docs` segments | Useful content, but too broad as a top-level mental model. |
| `Household` | Members, roles, invite link, plan concept | Should move toward pet-specific access/sharing rather than being a broad top-level destination. |

Current modal/global actions:

- Add pet.
- Edit pet sections.
- Add vet note.
- Change/edit vet.
- Log vet visit.
- Add/edit vaccine.
- Add care type.
- Log task.
- Log weight.
- Log medication.
- Upload/rename document.

Current data entities in mock state:

- `Pet`
- `Task`
- `VaccineRecord`
- `CareEvent`
- `RecordDocument`
- `VetPrepItem`
- `VetProvider`
- `VetVisit`
- `LogEntry`

Current Supabase blueprint includes:

- profiles, households, household_members, household_invites
- pets
- vaccine definitions and vaccine records
- medications and medication logs
- vet visits
- care event types and care events
- measurements
- reminder rules and logs
- documents and document links
- share links, share link documents, share accesses

## B. What Is Already Aligned

- Home is already focused on care items and recent activity rather than a general dashboard.
- Multi-pet support exists through shared `selectedPetId` and pet switchers.
- Pet profiles already include identity, background, behavior, food preferences, care preferences, medical notes, training cues, care team, vet prep, and documents.
- Vaccines include education/protection text, expiration status, provider, and proof files.
- Vet visits include provider, reason, notes, follow-up, total cost, services performed, and final bill attachments.
- Medications and weight logging already open focused forms instead of one-tap logging without required details.
- Documents are private by default and can attach to meaningful record types.
- Ask-the-vet items already model appointment preparation without diagnosis.
- The Supabase blueprint is household-first and document-link friendly.

## C. Main Conflicts With Revised Direction

| Conflict | Why It Matters | Recommended Direction |
|---|---|---|
| `Records` is too broad | Users should not need to understand records taxonomy before acting. | Split the concept into `Health` and `Calendar`, while reusing current Records components. |
| No top-level Calendar | The revised product needs a bird's-eye view of past and future care. | Add `Calendar` as a primary destination after IA stabilizes. |
| No global Add | Users currently need to navigate into the right area before recording many things. | Add a persistent Add action for routine care, meds, observations, visits, measurements, notes, and documents. |
| Behavioral tracking is mostly notes/vet prep | Revised direction needs structured observations for longitudinal review. | Add `Observation` as a first-class logging type. |
| Household is too generic | Desired sharing is pet-profile visibility/access, not a general household dashboard. | Move toward per-pet sharing/access management. |
| Current timeline is not calendar-aware | Timeline helps history, but does not answer “what happened on this date?” | Reuse logs for Calendar date detail. |

## D. Proposed Information Architecture

Target navigation:

| New Destination | Meaning | Reuse From Current App |
|---|---|---|
| `Home` | What needs attention now | Existing Home, notification panel, quick logs |
| `Calendar` | What happened when and what is coming next | Current timeline logs, tasks, vaccines, care, meds, vet visits |
| `Health` | Medical and behavioral understanding | Current `Records > Health`, `Meds`, measurements, vet visits, Ask-the-vet, future observations |
| `Pets` | Pet identity, profile, care instructions, sharing/access | Existing Pets |
| Global `Add` | Fast capture from anywhere | Existing forms, reorganized into one entry point |

Household/access model:

- Keep household-level data in the backend.
- In the product UI, make sharing feel pet-specific.
- Admin/owner can invite people to see or help manage a specific pet profile.
- Do not prioritize completion attribution as a near-term requirement. It can remain a future collaboration enhancement only if the product later needs it.

## E. Necessary Data-Model Changes

Immediate prototype changes:

| Entity | Change | Reason |
|---|---|---|
| `LogEntry` | Extend or normalize enough to support calendar display | Calendar needs date-based activity across care, meds, observations, visits, measurements. |
| New `Observation` | Add structured observation records | Behavior/symptom tracking should not be only notes. |
| `Task` | Add stronger due/completion fields later | Home and Calendar need upcoming and completed state. |
| `RecordDocument` | Keep relationship model | Already aligned; no major change needed. |
| Pet sharing/access | Model as per-pet visibility in product UX | Aligns with household sharing goal. |

Later Supabase blueprint changes:

- Add `observations` table with pet, category, severity, trigger, duration, medication status, notes, occurred_at, created_by.
- Extend reminder/completion records only when real collaboration is implemented.
- Consider pet-level access mapping if household members should have access to only specific pets.

## F. Screen-Level Change List

| Current Screen | Decision | Reason |
|---|---|---|
| Home | KEEP WITH MODIFICATION | Already aligned; add Coming Up and Worth Your Attention only when data supports it. |
| Pets | KEEP WITH MODIFICATION | Keep name `Pets`; improve sharing/access and keep profile/reference content here. |
| Records | MOVE / MERGE | Current Health/Meds/Care content should become `Health`; Timeline should feed `Calendar`. |
| Household | MOVE / REDUCE | Convert broad household concept into pet sharing/access UI, likely inside Pets. |
| Docs segment | MERGE | Keep all-documents archive, but documents should primarily appear attached to relevant health/profile records. |
| Timeline segment | MOVE | Use as Health history and Calendar date-detail source, not necessarily a standalone primary segment. |
| Add flows | NEW TOP-LEVEL ACTION | Needed for low-friction capture from anywhere. |
| Calendar | NEW SCREEN REQUIRED | Core revised requirement. |
| Observation logging | NEW FEATURE REQUIRED | Needed for behavior/symptom tracking and future appointment prep. |

## G. Gap Analysis

| Requirement | Current State | Gap | Recommended Change | Priority | Effort | Risk |
|---|---|---|---|---|---|---|
| Check today's care | Home due items exist | Needs cleaner Today / Coming Up split | Modify Home sections | P0 | Medium | Low |
| One-tap medication/care completion | Partially exists | No full schedule/adherence model | Preserve quick actions, improve task model later | P0 | Medium | Medium |
| Global Add | Missing | Navigation friction | Add persistent Add action and category picker | P0 | Medium | Medium |
| Pet profile/reference | Strong Pets screen | Needs sharing/access framing | Keep Pets, add sharing/access section later | P0 | Medium | Low |
| Health destination | Exists inside Records | Buried under Records | Promote Health as primary destination | P0 | Medium | Medium |
| Structured observations | Missing | Behavior cannot be analyzed over time | Add Observation type and form | P0 | Medium | Medium |
| Calendar | Missing | Cannot see date-based history/upcoming | Add Calendar screen using existing logs/tasks | P1 | High | Medium |
| Documents attached to records | Partially exists | Real upload/storage deferred | Keep attachment model; improve classification later | P1 | Medium | Medium |
| Vet appointment prep | Vet prep exists | No automatic summary from structured data | Keep Ask-the-vet; add summaries later | P1 | High | Medium |
| Pet-specific household access | Broad household UI exists | Not mapped to specific pet profile visibility | Add pet sharing/access model later | P1 | Medium | Medium |
| AI assistant/extraction | Deferred | Needs reliable structured data first | Keep later | P2 | High | High |

## H. Recommended Implementation Order

### Phase 1: IA Foundation

1. Keep `Home` and `Pets`.
2. Rename/reframe `Records` into `Health` in the UI while preserving existing Health, Meds, Care, Docs components.
3. Add a global `Add` action.
4. Reduce or move `Household` into pet sharing/access concepts instead of keeping it as a broad destination.

### Phase 2: Core Capture Model

1. Add `Observation` as a mock data type.
2. Add `Add -> Observation` flow with minimal required fields.
3. Add routine care and medication entries to global Add where useful.
4. Ensure logs created from Add appear in the unified history source.

### Phase 3: Calendar

1. Add Calendar destination.
2. Show simple month/date list or compact date-based view first.
3. Use existing logs, due tasks, vaccine expirations, and vet visits.
4. Avoid complex calendar interactions until date-based data is solid.

### Phase 4: Documents And Sharing

1. Improve document classification and record attachment UX.
2. Add pet-specific sharing/access section in Pets.
3. Keep all uploaded documents private by default.

### Phase 5: Intelligence Later

1. Appointment prep summaries.
2. Behavior trend summaries.
3. AI bill/document extraction.
4. Smart reminder suggestions.

## I. Risks

- **Navigation regression:** Moving too much at once could make existing working flows harder to find.
- **Duplicate models:** Health, Calendar, and Home must surface the same underlying records instead of duplicating data.
- **Over-engineering:** Calendar and observations should start simple.
- **Household ambiguity:** Product should support pet-specific visibility/access; do not overbuild collaboration workflows yet.
- **AI timing:** AI features should wait until structured observations, meds, visits, and documents are reliable.
- **Migration churn:** Supabase schema should not be aggressively rewritten while the app is still mock-state driven.

## Near-Term P0 Plan

The highest-confidence next implementation should be:

1. Update project memory to reflect the revised IA: `Home`, `Calendar`, `Health`, `Pets`, global `Add`.
2. Keep `Pets` as the destination name.
3. Reframe `Records` toward `Health` without deleting working record components.
4. Add global `Add` entry point.
5. Add structured Observation mock type and logging flow.

Do not implement Calendar, AI summaries, or real Supabase changes until the P0 IA and capture model are stable.
