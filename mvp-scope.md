# PawChart MVP Scope

This file keeps the current build focused. It separates what belongs in the present prototype from what should come later.

## In The Current MVP

- Mock-data product workflows before real auth and persistence.
- Dogs and cats.
- Multiple pets per household.
- Mock owner profile for greeting and auth-ready personal info editing.
- Pet profiles with overview, species details, behavior, care preferences, medical notes, and compact sharing/access.
- Training cues profile summary with a full-list detail view.
- Adoption/background and food preference profile sections.
- Compact pet measurements entry point backed by mock measurement logs and direct weight logging.
- Ask-the-vet notes for observations and questions before appointments.
- Shared vet providers, pet primary/secondary vet assignment, and mock vet visit logging.
- Care-team management that combines provider assignment with saved vet/clinic add and edit actions.
- Manual vet bill capture with services performed, total cost, and private bill attachments.
- Home as the cross-pet daily command center for overdue care, due-today care, upcoming attention, quick actions, and recent undo.
- Global Log action for fast mock-data capture.
- Structured observation logging for behavior, symptoms, appetite, mobility, and other changes.
- Calendar v1 with pet-specific selected-day activity, expandable month view, future care routines, date-prefilled routine creation, and next-four-weeks planning.
- Mock care routine creation, manage-routines list, routine editing, backdated completion logging, and recurring cadence behavior.
- Health overview with 3-by-2 shortcuts, vaccines, medications, vet care, observations, all-document access, and recent history.
- Secondary filterable full-history view from Health.
- Completion logs that preserve original due date, actual completion date, and early/on-time/late status.
- Vaccines, medications, care logs, measurements, vet visits, notes, and document attachment concepts.
- Private-by-default document behavior in the product model.
- Household sharing UX model with roles.
- Pet-level sharing/access section inside Pets.
- Mock pet-specific member invites, role changes, access removal, and vaccination share links.
- Public share-link and QR concepts for vaccination proof.
- Mobile-first design that also works well on desktop.
- Supabase project connection and initial RLS-backed schema.
- Supabase Pets data adapter for future authenticated read/write.
- Google OAuth sign-in, callback handling, session refresh middleware, and sign-out.

## Later

- Database persistence and storage.
- Real file upload and preview handling.
- Public share pages backed by live data.
- Stripe subscriptions and paywall behavior.
- Push notifications.
- AI PDF parsing.
- AI-assisted bill extraction and suggested record creation.
- Analytics and error tracking.

## Not Now

- App Store native mobile apps.
- Advanced species beyond dogs and cats.
- Full subscription enforcement.
- Real reminder delivery infrastructure.
- Production security review.
- Heavy process documentation beyond the lean project memory files.

## Open Scope Questions

- Final brand name.
- Final public share page visual design.
- Upload file size and file type limits.
- Exact onboarding flow after auth is introduced.
- Subscription tier enforcement details.
