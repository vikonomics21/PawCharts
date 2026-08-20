# PawChart Decisions

This file tracks important product and technical decisions so the project does not lose context as the app evolves.

## Project Memory System

- `symbolic-space.md` defines why PawChart should feel and behave a certain way.
- `product-principles.md` defines reusable product rules for evaluating changes.
- `ux-patterns.md` defines reusable interaction patterns for the app.
- `mvp-scope.md` defines what is in scope now versus later.
- `decision.md` remains the place for concrete product and technical decisions already made.
- Meaningful product, backend, sharing, or scope changes should check the relevant memory files before implementation.
- Small fixes like layout bugs, broken buttons, copy tweaks, or visual polish do not need memory-file updates unless they change the product model.

## Product Direction

- PawChart is a placeholder name and may change later.
- Branding should stay centralized so app name, tagline, colors, and share-page identity can be changed easily.
- The app should work well on both mobile and desktop.
- Mobile should feel native and use bottom navigation.
- Desktop should be a first-class responsive experience with wider dashboard-style layouts.
- The product should favor low-friction logging over heavy data entry.
- Care actions that only need a date should support one-tap logging, with an option to manually adjust the date afterward.
- The first screen is called `Home`.
- Home greeting should be owner-level, not pet-level; use `Hello` until auth provides the owner's first name.
- Home summaries should acknowledge when due items span multiple pets while keeping individual due cards pet-specific.
- User-facing language should say `pets`, not family or companions.
- The revised information architecture should evolve toward `Home`, `Calendar`, `Health`, `Pets`, and a global `Add` action.
- Keep the destination name `Pets`; do not rename it to `Profile`, even though each pet detail page functions as that pet's profile.
- `Records` should be reframed toward `Health` and `Calendar` over time instead of remaining a broad top-level destination.
- Calendar is now a primary destination and should show pet-specific date-based activity and upcoming care using the same underlying logs, tasks, observations, visits, and vaccines.
- Calendar should make the selected pet's week scannable with day markers and selected-day detail, not standalone activity count cards.
- Calendar can expand from week view to month view so owners can navigate months and select dates without changing the default compact view.
- Calendar's week/month view toggle belongs with the date picker below the visible dates, not in the routine action cluster.
- Calendar should show the selected-day detail before the broader `Next 4 weeks` planning section.
- Calendar date selection can prefill care routine creation; it creates scheduled due items, not completed logs.
- Calendar due items should reuse Home's low-friction actions: done/log dose/review, plus log for another date when the owner completed care earlier but is recording it later.
- Calendar is a planning surface, not only a daily log. It should show the next few weeks of upcoming care so owners can anticipate medication refills, vet appointments, follow-ups, vaccines, and measurements.
- Calendar should avoid summary highlight strips that repeat Home attention; selected-day and next-four-weeks views provide the planning context.
- Mock care tasks should carry structured due dates, not only human labels, so Calendar can place them on future dates.
- Care routines are part of the mock MVP: users can create future routines, edit routine details, log backdated completion, and complete scheduled items.
- Care routine v1 reuses the local `Task` model instead of introducing a separate scheduler table before Supabase.
- Care routine add/edit forms should use progressive disclosure by routine type so owners only see relevant fields.
- Care routine action labels are prescribed by routine type, not user-entered, so completion cards stay consistent.
- Calendar should include an `Edit routines` surface where users can see every active scheduled item for the selected pet and edit each one.
- Recurring care routines advance their next due date when marked done; one-time routines leave active planning after completion and remain visible through logs/history.
- Completion logs store both the original due date and the actual completion date so the app can show whether care was early, on time, or late.
- Due cards should not directly reschedule care. Cadence, dose, brand, refill timing, and next due-date changes belong in the care routine and apply only going forward.
- The global `Log` action is for quick capture only; Calendar owns adding and managing care routines.
- On compact due cards, the backdate/log-date action should sit left of the primary done/check action.
- Due cards should use task-specific icons and colors for known care items such as baths, nail trims, medication, vaccines, measurements, and vet care.
- Calendar due and planning rows should use the same task-specific icons and colors as Home so a bath, medication, vaccine, measurement, or vet item looks consistent across planning and today views.
- The refreshed UI direction should use soft warm surfaces, compact rounded cards, pastel status accents, and black/ink primary actions inspired by modern mobile wellness/task apps.
- The global `Add` action is a core navigation affordance, not a secondary utility.
- Home greeting is owner-level and should use the current owner profile when available, not a pet name.
- Owner profile starts as mock state and should later map to the authenticated user profile.
- Home owns lightweight setup guidance. New or incomplete users should see a compact `Get started` checklist that navigates directly to the page or modal that resolves each missing setup item.
- Manual setup remains the private-beta default. Uploaded records can help onboarding now, but AI parsing should remain later and must use a confirm-before-saving review step.

## MVP Scope

- Start with mock/demo data so the product can be tested before Supabase and auth are connected.
- The rich mock dataset is a local-only product/design sandbox. Production must not initialize users with demo pets, demo records, demo documents, demo share links, or fake household access.
- Production signed-out users should see authentication before onboarding. Production signed-in users should load Supabase-backed initial data as each persistence boundary is migrated.
- Generic starter templates can exist in production because they are product scaffolding, not user-owned demo records.
- Private beta production readiness starts with persistent onboarding, owner profile, household creation, Pets, training cues, vet providers, and care-team assignment.
- `/support` is a read-only internal beta support page gated by `ADMIN_EMAILS`; full admin data mutation is intentionally deferred.
- Build the product workflow before implementing auth.
- Support dogs and cats first.
- Support multiple pets per household from day one.
- Household sharing is important and should be included in the data model from day one.
- Household sharing should focus on pet-profile visibility and access: an admin can add people to see a specific pet's profile.
- Household sharing/access should live inside the selected pet's `Pets` detail experience instead of being a separate top-level destination for now.
- Completion attribution such as who completed a task and when is not a near-term requirement unless future shared-care workflows require it.
- Stripe subscriptions can come after the core workflows are usable.
- Push notifications can wait; in-app reminders are acceptable for the first version.
- Google OAuth should be the first auth method added later.
- Google OAuth is the first auth method. Supabase owns auth sessions, Google owns identity, and Vercel only hosts the app/domain.
- Auth callbacks use `/auth/callback`, with production URL `https://pets.vikonomics.com/auth/callback` and local URL `http://localhost:3004/auth/callback`.
- Google OAuth consent may show the Supabase project domain while Auth runs through the default Supabase URL. A fully branded OAuth flow requires a Supabase custom Auth domain such as `auth.vikonomics.com`, plus the matching Google OAuth callback `https://auth.vikonomics.com/auth/v1/callback` and Google Auth Platform branding for PawChart.
- Email magic links may be added later for household members who do not use Google.

## Pet Profiles

- Pet profiles should support exact DOB and approximate age because adopted pets may not have known birthdays.
- Shared pet fields should include name, species, breed, sex, spayed/neutered, color/markings, microchip number, weight, approximate/exact age, and photo.
- Dog-specific profile facts can include size category and groomer info; known commands should live as structured training cues and leash reactivity should live in behavior notes.
- Cat-specific fields can include indoor/outdoor status, litter preference, carrier behavior, and declawed status if relevant.
- Pet profiles should have editable notes for behavior traits, care preferences, and medical notes.
- Pet profiles should treat adoption/background context as first-class private data.
- Sensitive pet history should live in calm private profile context such as `Known history`, not in compact snapshot tiles.
- Food preferences should be structured because they affect daily care and household consistency.
- Pet profiles should include an `Ask the vet` workflow for actionable observations and questions to bring to the next appointment.
- Pet profiles should include a `Care team` section for the selected pet's primary vet or clinic.
- Care team should use one `Manage care team` action for vet assignments instead of multiple similar edit buttons.
- Vet providers should be household-level records so one clinic can be reused across multiple pets.
- Each pet can have one primary vet provider and one optional secondary vet provider in the MVP.
- Secondary vet support covers specialists such as behavior vets without requiring a full provider-role system yet.
- Vet prep items should be separate from long-term profile notes because they are checklist-style questions with statuses.
- Vet prep item statuses should include `open`, `addressed`, and `dismissed`; open items carry forward by default.
- Dog/cat details are structured profile facts; richer freeform context should live in pet notes.
- Overview and dog/cat details should be compacted into one `Profile snapshot` section so the image card can focus on pet identity without repeating facts.
- Profile snapshot should only include compact, immediately useful facts; commands, leash notes, carrier notes, and other longer context should not live in snapshot tiles.
- Dog size and groomer cadence should not live in the compact profile snapshot; weight and care routines cover those needs better.
- Measurements should be accessible from Pets as a compact entry point rather than expanding the profile snapshot.
- Measurement history should allow direct weight logging from the same surface where owners review weight history.
- Background/history and food preference lists should not live in the profile snapshot.
- Dog commands should be stored as structured training cues with both a cue word and the expected pet action.
- Training cues should show the top 3 cues in the profile summary, with the full list behind a dedicated detail view.
- Behavior traits are valuable first-class data, not an afterthought.
- Custom care event types should be supported, but they should not appear as defaults until the user creates them.

## Records And Reminders

- Vaccines should include vaccine name, what the vaccination protects against, date given, expiration date, provider/vet, optional lot number, notes, and optional proof upload.
- Vaccine education should come from reference data where possible, not brittle text matching.
- Use a separate vaccine definition model for name, species, protects-against copy, description, and recommended interval.
- Reminders should be tied to vaccines, medications, care events, and measurements from day one.
- Reminder UX should prioritize simple due-date reminders first.
- Medication, bath, grooming, nail trim, flea/tick treatment, measurements, and similar tasks should be quick to log.
- Structured observations should exist as first-class health records with category, severity, trigger, duration, medication status, notes, and date.
- Home quick actions should not be dead ends; each action must either log immediately or open the smallest necessary form.
- Weight logging must collect an actual weight value and unit.
- Medication logging should allow medication name, dose/label, notes, date, and optional prescription-label uploads.
- Historical logs should be visible from Health through a secondary full-history view.
- Full history should support type filters and item-level filters so owners can inspect histories such as bath dates or flea/tick medication doses without scanning unrelated records.
- Full-history navigation should use a plain inline `Back` affordance, not a boxed card-style button.
- Medication history should have its own visible history section with dates and details.
- Logs created by mistake should be undoable from Home and Records during the current interaction.
- Undoing a log should restore the pre-log due item/routine state when available, not only remove the history row.
- Undo from Health history should require confirmation before removing a log.
- Destructive actions should ask for confirmation before deleting records, documents, routines, or care types.
- Calendar/date buttons on due cards should let users log completion for a different date, not silently move the scheduled due date.
- Adding new record types should be available from Records through custom quick-log types.
- Notification bell should surface due care items and recent activity, even before real push notifications exist.
- Health should show a horizontal pet switcher at the top when there is more than one pet.
- Home should focus on care items that need attention today, not general pet browsing.
- Home stays named `Home`, but its purpose is cross-pet daily execution: overdue items, due-today items, and recently logged actions.
- Home owns cross-pet attention items, including upcoming health-related items that are not due today or overdue.
- Home should not use numeric metric strips for low-volume daily care; grouped action sections are clearer than counts.
- Home should not include a decorative week strip because Calendar owns date navigation and future planning.
- Home's owner-level hero should avoid pet avatars; pet identity belongs in due cards and pet-specific sections.
- Pets is the canonical profile area and should organize profile content into Overview, structured species details, Behavior, Care preferences, Medical notes, and sharing/access.
- Pets care team supports one primary vet and one optional secondary vet/specialist per pet, backed by household-level saved vet providers.
- Care-team management should let owners assign providers to the pet and manage saved provider details from one clear workflow.
- Health should be a medically focused overview, not a tabbed records drawer.
- Health should answer what medical records, proof, observations, vet visits, and history exist for the selected pet.
- Health overview should start with compact shortcuts, not dense metrics.
- Health shortcuts should include Vaccines, Meds, Vet care, Observations, Documents, and History as independent white pill buttons with side-by-side icons and labels.
- Health shortcut scrolling should land the relevant section near the top of the viewport, not leave the heading at the bottom.
- Health overview sections are `Vaccines`, `Medications`, `Vet care`, `Observations`, and `Recent history`.
- Health documents should be available through an All documents modal unless they are attached directly to a record card.
- Pets should not include a standalone Documents section because all-document access already lives in Health.
- Observations in Health should have a section-level `Log observation` action.
- Routine care such as baths and nail trims belongs primarily in Home and Calendar; it should not dominate Health unless medically relevant.
- Timeline remains valuable but secondary; expose it through `View full history` instead of making it the default Health screen.
- Medication creation should say `Add medication`; dose completion should say `Log dose` or use a compact done action.
- Scheduled medication details such as brand and dose live on the care routine; historical logs keep the details captured at the time they were logged.
- `View` actions should be removed when they only repeat information already visible on the card.
- Empty proof, bill, and attachment states should stay compact so cards do not grow just to say no file is attached.
- Vaccine cards should use a stacked compact layout with icon-only proof, edit, and delete actions; do not force long vaccine copy and action buttons into one cramped row.
- Care type deletion should require confirmation before removing the item from mock state.
- Routine care editing should avoid vague fields like `default action`; useful edit fields are name, cadence/schedule, notes, and whether it is routine or health-related.
- Modal titles should be specific to the task instead of using a generic `Update record` title.
- Documents should expose preview, rename, and remove actions in the prototype, with private-by-default status visible.
- Attached document rows should be clickable when preview is available; avoid separate preview buttons inside compact record cards.
- Vet prep items should eventually become their own Supabase table tied to pets and household access, with optional future links to vet visits.
- Vet visits belong in `Records > Health` and should also appear in Timeline as medical history.
- Vet provider persistence should eventually use a household-level `vet_providers` table, a pet-level primary-vet reference, and a provider reference on vet visits.
- Vet visits should capture total cost, services performed, and private final-bill attachments so owners can track care history and spend.
- AI bill extraction should not write records automatically; it should propose services, costs, and related record updates for owner review and approval.

## Uploads

- Vaccine records should support uploading PDFs or pictures as proof.
- Vet visits should support uploads for invoices, discharge summaries, lab results, and visit notes.
- Final vet bills are private by default and should be attached to vet visits, not public share links, unless explicitly selected later.
- Medications should support uploads for prescription labels, dosage instructions, and pharmacy receipts.
- General documents should support uploads for insurance, adoption papers, microchip registration, licenses, and boarding forms.
- Measurements may support uploads for weight charts, body condition reports, or lab panels.
- Care events may optionally support photos for grooming, skin issues, dental cleaning, wounds, and before/after images.
- Simple one-tap logs like baths, nail trims, or flea/tick treatment should stay lightweight unless the user chooses to attach something.
- Uploaded documents should be private by default.
- Public share links should never include uploaded files by default.
- Users must explicitly select which uploaded documents are attached to a public share link.
- Documents should be stored once and linked to records through a separate attachment/link table.
- Supported document attachment targets are vaccine records, medications, vet visits, care events, measurements, and pet profiles.
- A document attachment must belong to the same pet as the record it is attached to.

## Household And Roles

- Pets should belong to households, not directly to users.
- Users should access household data through household membership.
- Household roles should exist.
- Roles should include `owner`, `admin`, and `member`.
- Owners manage billing, household deletion, and roles.
- Admins manage pets, records, documents, and invites.
- Members can view household data and log care records.
- MVP household invites can use a copy-invite-link flow.

## Sharing

- Public vaccination links should be viewable without logging in.
- Public links should remain active until revoked.
- Share links should use unguessable tokens.
- Owner contact information should be shown by default but be optional per share link.
- Public share pages should focus on the pet, with subtle app branding.
- QR codes should be generated inside the owner app for public share links.
- Documents should be manually attached to share links for safety and clarity.
- Public share data should be exposed through a controlled payload rather than broad public table access.
- Private beta document uploads use Supabase Storage bucket `pet-documents`, with one persistent `documents` row per uploaded PDF/image.
- Production document uploads are private by default, limited to 10 MB, and support PDF, JPG, PNG, WebP, HEIC, and HEIF.
- AI parsing is not part of document upload v1; future parsing must show a review screen before writing extracted data.
- Sharing/access should separate household member access from public record links.
- Visible sharing/access actions should be functional in mock state, not static placeholders.
- Household access is pet-specific in the prototype, with Admin, Editor, and Viewer roles.

## Lists And Kits

- Lists & kits belongs primarily on Home because it is a frequent reference workflow; Pets should stay profile-oriented.
- Travel is one use case, not the boundary of the feature; users can create blank/custom lists.
- Dated lists can surface prep tasks in Home and Calendar; undated lists stay in Home/Lists & kits but do not create calendar items.
- Kit document bundles link to existing records/documents instead of duplicating files.
- Kit documents remain private by default and are not added to public share links automatically.
- Resource links on checklist items should store a short label and URL separately so long URLs do not break mobile layouts.
- PawChart should use language like `suggested documents` and remind owners to confirm current airline, destination, and veterinarian requirements; v1 is not official travel-compliance advice.
- Home attention rows should be actionable navigation rows that take the owner to the relevant Health, Calendar, or Lists & kits workflow.
- Record documents are append-only/versioned in the product model. New vaccine proof creates a newer version, surfaces as latest proof, and keeps older files accessible.
- Lists & kits should use one unified item list. Documents are checklist item types alongside tasks and links, not a separate packet UI with its own controls.
- Reusable lists can be reset by clearing completion state only; attached documents, links, notes, and list structure stay saved.
- First-time onboarding should be manual-first and quick: owner basics, pet basics, and optional mocked record upload after the pet exists. AI parsing remains a later enhancement.
- Single-pet households should not see pet switchers where there is only one possible selection.
- Lists & kits task rows should not repeat `Task` labels; task is the default row type and can stay visually quiet.
- Lists & kits progress copy should stay compact, such as `1/5` and `1 doc`, instead of long badges that force title wrapping.
- Created lists are user-owned and editable; reusable templates are immutable starters and are not changed after list creation.
- Deleting a list or list item removes only that list structure. Attached documents, source records, pet records, and logs stay saved.

## Technical Direction

- Use Next.js 14 App Router.
- Use Tailwind CSS.
- Use Shadcn-style local UI components and Lucide icons.
- Use Supabase for database, auth, storage, and edge functions.
- Supabase credentials belong only in local or hosted environment variables, never tracked source files.
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` is server-only and may be used only after authenticated server-side checks, such as onboarding bootstrap or allowlisted read-only support.
- The initial Supabase schema has been pushed from `supabase/migrations/0001_initial_schema.sql`.
- Use Supabase migration files as the source of truth for database structure.
- Use row-level security for household data isolation.
- Keep the UI on mock data initially and connect real persistence screen by screen.
- Pets are the first persistence boundary: Supabase read/write helpers map database rows into the current `Pet` UI model, and production can receive real pets while other workflows are migrated screen by screen.
- Google sign-in establishes a real Supabase session. Local development may still use mock pet data, but production must not use mock data as the active product data.
- Service worker registration should run in production only during development to avoid stale local caches.
- Keep architecture simple for a solo founder project.

## Open Questions

- Actual pet data is pending.
- Subscription enforcement details are pending.
- Larger/resumable upload needs are pending after private beta usage is observed.
- Public share page visual design is pending.
- Auth and onboarding flow details are pending.
