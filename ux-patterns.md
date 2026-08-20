# PawChart UX Patterns

This file documents reusable interaction patterns for PawChart so screens stay consistent as features are added.

## Data Modes

- Local demo mode is a founder/design sandbox, not a production user experience.
- Production screens should start from authenticated Supabase data or an auth/onboarding state, never from demo pets, demo records, demo documents, fake share links, or fake access members.
- Starter templates are allowed in production when they are generic product scaffolding rather than user-owned records.

## Navigation

- Evolve the main app toward `Home`, `Calendar`, `Health`, `Pets`, and a global `Add` action.
- Keep `Pets` as the user-facing destination name.
- Mobile should use bottom navigation.
- Mobile should include a prominent floating `Add` action for quick capture.
- Desktop should remain fully functional and can use wider layouts, but should not introduce a separate product model.
- Existing records content should be reframed into `Health` and `Calendar` without duplicating underlying records.
- Home setup checklists should be compact and action-oriented. Each row should explain the next useful setup step briefly and navigate directly to the resolving tab, section, or modal.
- Upload-assisted onboarding can be offered, but AI-extracted values should never be written automatically; owners must review and confirm suggested fields before saving.
- Health should use visible sections instead of a horizontally scrolling records tab control.
- Health shortcuts should be visible in a compact 3-by-2 grid when six destinations are present.
- Health shortcuts should look and behave like tappable icon buttons, with a short label and a clear visual target for each destination.
- Health shortcut taps should scroll sections into a useful reading position near the top of the viewport.
- Calendar should show pet-specific date-based activity first, using existing logs and due items before introducing complex calendar behavior.
- Calendar should use the week strip and selected-day detail for date scanning, with the same compact done/log-date controls used on Home.
- Calendar can expand to a month grid for broader date selection while keeping week view as the default.
- Calendar's week/month toggle should sit centered below the visible date picker as lightweight text with a directional arrow.
- Calendar due and planning rows should reuse the same task-specific icon and color helper as Home.
- Calendar should help owners anticipate care several weeks ahead, including medication refills, vaccine expirations, vet follow-ups, measurements, and care routines.
- Calendar should stay date-first and avoid summary highlight strips that repeat Home attention.
- Calendar should let owners schedule future care directly from the planning surface.
- Selecting a Calendar date can prefill routine creation for that due date; completed logs remain separate.
- Calendar should show the selected-day detail before `Next 4 weeks`.
- Calendar should expose `Edit routines` for the full active scheduled-care list for the selected pet.

## Visual Direction

- Use soft warm backgrounds, off-white surfaces, compact cards, subtle shadows, and pastel accents for status/type cues.
- Use black/ink for primary actions, especially global capture and save actions.
- Keep cards compact and scannable; avoid making summary metrics visually heavier than the records they summarize.
- Compact cards should still give long text room to wrap; avoid forcing descriptions, metadata, documents, and actions into one dense horizontal row.
- Due cards should use specific visual cues when the care item is known, such as droplets for baths and scissors for nail trims or grooming.

## Pet Context

- Home should greet the owner, not a specific pet, because care may span multiple pets.
- Home is the cross-pet daily command center for overdue care, due-today care, upcoming attention, and recently logged actions.
- Home should use grouped action lists instead of numeric summary strips unless counts directly change what the owner does next.
- Home should stay focused on today's care and should not duplicate Calendar's week/date navigation.
- Home's owner-level hero should not use a pet avatar; keep pet identity inside due cards and pet-specific sections.
- When more than one pet exists, Records should show a horizontal pet switcher with photo and name.
- The selected pet should be explicit in section headers, such as `Oliver's Records`.
- Pet sharing/access belongs inside the selected pet's details so admins can invite people to see a specific pet profile.
- Sharing/access should split household member access from public record links.
- Sharing/access modals should use compact rows, not large explanatory cards.
- Sharing/access controls should update mock state or open a clear placeholder, not show dead actions.
- Pet names should be prominent in care prompts, records, and notifications.
- The Pets image card is for identity and presence; structured facts should live in the compact profile snapshot instead of being repeated.
- Profile snapshot fields must be short, stable, and low-scroll; long notes, commands, and situational behavior belong in dedicated sections.
- Profile sections should summarize long lists first and move the full list behind a detail view.
- Training cues should show only the top 3 cues in the profile card, then use `View all cues` for the full list.
- Long-lived pet context such as adoption history, known history, and food preferences belongs in dedicated profile sections, not snapshot tiles.

## Health

- Health is a medically focused overview for the selected pet.
- Health should show compact section shortcuts, then `Vaccines`, `Medications`, `Vet care`, `Observations`, and `Recent history`.
- Health should not duplicate Home's attention list.
- Health shortcuts are navigation, not dense metrics; avoid counts when labels would overflow.
- Health shortcuts should include Observations and Documents when those areas exist.
- Timeline is secondary and should be opened through `View full history`.
- Full-history views should support type filters and item-level filters for recurring care, medications, measurements, vaccines, vet visits, and observations.
- Use a plain inline arrow/back affordance for secondary history screens rather than bordered card-style back buttons.
- Routine care such as baths and nail trims belongs mainly in Home and Calendar unless it is tied to treatment, wounds, ears, dental, prescribed care, or other medical context.
- Card actions should not duplicate visible card content. Use `View` only when details are intentionally hidden from the card.
- Destructive record actions should ask for confirmation before removing mock data.
- Use `Add medication` when creating a medication record, and `Log dose` or a compact done action when recording a dose given.
- Care editing should focus on name, schedule/cadence, notes, and routine-versus-health relevance instead of a vague default action.

## Forms And Modals

- Modal titles should be specific, such as `Add pet`, `Edit Oliver`, `Add vaccine`, `Add medication`, `Log dose`, `Log weight`, `Add care routine`, `Edit routine`, and `Upload document`.
- Use `Add vet note` for observations or questions intended for the next appointment.
- Prefer section-level edit actions in Pets over one large profile form.
- Add Pet should stay lightweight; deeper profile context should be added through section-level edits.
- Required fields should be limited to what is needed to save a useful record.
- Optional details should be available without slowing down common actions.
- Care team should show primary and secondary vet status compactly, with a single section-level `Manage care team` action.
- Care team management should combine pet-level provider assignment with saved-provider add/edit actions.
- Owner profile should be accessible from the app header and remain separate from pet profiles.

## Logging And Undo

- Global `Log` should provide the fastest capture path from any destination and should not create recurring routines.
- Date-only care actions should support one-tap logging.
- Execution-heavy cards in Home, Calendar, notifications, and Health should use compact 44px icon controls for done/check, log for another date, attach, edit, and delete.
- Put secondary log-date actions to the left and primary done/check actions on the right.
- Actions that need a value, such as weight, should open the smallest necessary form.
- Medication setup should store brand, dose, label, and cadence on the care routine. Medication backfill logging should allow date, notes, and optional prescription-label upload.
- Observation logging should support lightweight structured capture: category, severity, trigger, duration, medication status, notes, and date.
- After quick logging, show an undo affordance during the current interaction.
- Undo should restore the pre-log task/routine state when available so mistaken completions bring due items back.
- Undo actions inside Health history should ask for confirmation before removing a log.
- Destructive delete actions should always open a confirmation modal before removing prototype data.
- Calendar controls should allow logging completion for a different date.
- Calendar routine rows should open routine editing from the row body, not from the compact completion buttons.
- Routine edits apply only going forward and should not rewrite past logs.
- Health documents should open from an All documents modal unless a file is attached directly to a visible record card.
- Pets should not show a redundant standalone Documents section when All documents is already available from Health.
- Calendar selected-day rows should show the item type clearly, such as due item, logged, observation, or vet visit.
- Calendar planning lists should be sorted by date and stay compact enough to scan on mobile.
- Completing recurring care routines should advance the next due date; completing one-time routines should remove them from active planning and preserve the log in history.
- Completion logs should preserve the original due date and the actual completion date so history can show early, on-time, or late completion.

## Documents

- Vaccine proof should appear as a compact `Proof files` row with an add action.
- Vaccine proof should show the latest proof first and keep older proof versions in a compact disclosure.
- Documents should support preview placeholder, rename, remove, attach, and detach actions.
- Documents are private by default.
- In all-documents lists, the file row itself should open preview; do not add a separate Preview button.
- Attached file rows in compact record cards should also open preview when preview behavior is available.
- Document privacy should be stated once, not repeated in both metadata and card copy.
- Empty attachment states should stay compact; show an attach icon instead of a large empty file row.
- Upload actions should accept PDFs and images, create private documents, and immediately show the new row in All documents or the attached record.
- Document rows with a stored file should open the file through a signed URL; do not add a separate preview button.
- Rename and delete should work from All documents, with delete requiring confirmation.
- Public share links should include documents only when explicitly selected.

## Notifications

- The notification bell should surface due care items and recent activity.
- Notification items should reuse Home actions where possible: mark done, change date, and view record.
- Notification text should use the pet's name and a clear action.

## Vet Prep

- `Ask the vet` belongs in Pets near Medical notes.
- Vet prep items should be lightweight observations or questions, not diagnosis.
- The active vet visit card should show open items only.
- Each item should support `Addressed`, `Carry forward`, and `Dismiss`.
- Addressed and dismissed items leave the active card; carry forward keeps the item open.

## Vet Care

- `Care team` belongs in Pets near Medical notes and Ask the vet.
- Vet providers are shared household resources that can be assigned to individual pets.
- Pet care teams can show a primary vet and one optional secondary vet for specialist care in the MVP.
- Care team should expose one `Manage care team` action for assignments; provider-detail editing can come later.
- Vet visits belong in `Records > Health`, with logged visits also appearing in Timeline.
- `Log vet visit` should expose the selected pet's open Ask the vet items so they can be addressed during the visit.
- Vet visit logging should allow total cost, services performed, and a private final-bill attachment.
- Bill extraction AI, when added later, should use a confirm-before-saving review step.

## Profile Context

- `Background` belongs in Pets after Profile snapshot.
- Use calm labels like `Known history` for adoption or rescue context.
- `Food preferences` belongs near Care preferences.
- Food preferences should render as scannable chips or compact rows.
- Measurements should be accessible from Pets through a compact entry point, not by expanding the profile snapshot.
- Measurement history should include a direct `Log weight` action.
- Sharing/access should summarize first and move detailed member/share-link controls behind one manage action.

## Lists And Kits

- Lists & kits should live as a Home workflow, then open a detail modal for templates, dated lists, packing items, resource links, and document readiness.
- Pets should avoid becoming a catch-all for active workflows; keep it focused on identity, care context, notes, care team, sharing, and measurements.
- Dated list prep appears in Home and Calendar as prep tasks only; Calendar should not render full trip/list spans.
- Undated custom lists stay in Lists & kits and should not create Calendar attention items.
- Checklist resource links should display short labels with a link icon, never raw long URLs in list rows.
- Lists should use a unified `Items` list with task, document, and link item types.
- Document list items should attach existing records/documents or upload a new PDF/image directly from the row; attached files remain available in All documents.
- Suggested documents from templates should become editable checklist items, not a separate document packet section.
- Home list cards should show compact pet context and up to three actionable checklist items before sending users to the full list.
- Reusable lists should expose `Reset list` with confirmation and reset completion state only.
- Single-pet views should hide horizontal pet switchers and use compact `Add more +` entry points where relevant.
- Onboarding should ask for the few details needed to make the app useful quickly, then create a Complete later checklist for richer context.
- Lists & kits item rows should use compact row density; hide the `Task` pill for normal task rows and show type pills only for document/link rows.
- Add-item forms should progressively reveal fields based on selected type instead of showing task, document, and link fields at once.
- List progress should use short chips so status never competes with the list title.
- List management actions should stay compact: edit/delete list actions live in the list header, item removal lives on the row, and destructive actions require confirmation.
- Travel guidance copy should avoid presenting suggested document lists as official legal or airline requirements.
- Home attention rows should be clickable when they lead to a relevant follow-up surface; the row body navigates while compact completion/log actions remain separate.
- Calendar selected-day sections should present broad activity: due items, completed logs, observations, vet visits, and list prep.
