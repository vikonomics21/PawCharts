# PawChart Product Principles

This file captures durable product rules for PawChart. Use it to keep feature decisions consistent as the app grows.

## Core Principles

- Pet-first, not form-first. Owners should feel they are caring for Oliver or Luna, not managing rows in a database.
- Low-friction logging. If a care action only needs a date, it should be one tap with an option to adjust details.
- Calm authority. The interface should feel premium, quiet, and trustworthy, closer to a well-designed finance app than a playful pet app.
- Private by default. Records and documents stay private unless the owner clearly chooses to share them.
- Household sync matters. Shared care should be built into product behavior and data models from day one.
- Records create confidence. History, proof files, and reminders should make owners feel more certain, not more burdened.

## Workflow Rules

- `Home` should focus on what needs attention now.
- `Pets` should be the canonical place for profile identity, behavior, care preferences, and medical notes.
- `Records` should be the canonical place for history, proof, health records, care logs, medication logs, and documents.
- `Household` should make roles, access, and shared responsibility understandable.
- Quick actions should either complete immediately or open the smallest necessary form.
- Every important record should support view, edit, delete, and relevant document attachment.
- Empty states should be instructional and useful, not apologetic.

## Change Checklist

Before adding or changing a meaningful feature, check:

- Does this make care easier for the owner?
- Is the selected pet clear?
- Is the action reversible or editable when mistakes are likely?
- Is private information protected by default?
- Does this create duplicate places for the same information?
- Does this work well on both a 390px mobile viewport and desktop?
