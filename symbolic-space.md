# PawChart Symbolic Space

This file defines the product meaning system for PawChart. It is the guide for how the app should feel, what each area represents, and how product choices should translate into backend structure.

## Definition

PawChart is a calm command center for pet care where each pet feels present, care feels current, and records feel easy to trust.

The app should not feel like a database, filing cabinet, or generic task manager. It should feel like a quiet, reliable care layer that helps owners know what matters today, remember what happened before, and share proof when needed.

## App Areas

- `Home` means attention. It answers: what needs care today?
- `Pets` means identity. It answers: who is this pet?
- `Records` means proof, memory, and history. It answers: what happened, when, and what evidence supports it?
- `Household` means shared responsibility. It answers: who helps care for these pets?
- `Documents` means evidence. It answers: what files support this pet's care history?
- `Notifications` means care prompts. They should help owners act, not create noise.

## Product Principles From This Space

- Lead with the pet, then the record.
- Make common care actions fast enough to use in real life.
- Keep records trustworthy by making dates, authorship, attachments, and history clear.
- Treat documents as private evidence unless the owner explicitly shares them.
- Make household coordination visible without making the app feel administrative.
- Prefer calm, specific language over alerts that feel urgent without reason.

## Backend Guidance

- Pet data should belong to households so shared ownership is built into the system from the beginning.
- Records should support a unified timeline across vaccines, medications, care events, measurements, vet visits, documents, and notes.
- Logs should distinguish when something happened from when it was entered.
- Important records should support attachments without duplicating uploaded files.
- Uploaded documents should be private by default and only become public through explicit share-link attachment.
- Reminders should connect to real records or care types so notifications can offer useful actions like mark done, change date, or view record.
- Quick logs should be reversible through undo or soft-delete behavior so low-friction entry does not reduce trust.
- Household activity should preserve who created or changed records when multiple owners are involved.

## Day-To-Day Use

Use this file before meaningful product or backend changes. Small bug fixes, copy tweaks, and visual polish do not need a symbolic-space update unless they change the product model.

When a change adds a new workflow, data concept, or sharing behavior, confirm that it supports the symbolic space before implementing it.
