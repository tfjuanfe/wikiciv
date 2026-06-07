# WikiCiv

An open, collaborative lore archive for Minecraft **civilization events** — multiplayer RP events where players build civilizations and generate emergent history.

> **Guiding principle: "Every telling has a home."**
> WikiCiv never overwrites or deletes one person's version of history in favor of another's. When accounts conflict, they coexist, attributed to whoever submitted them. The system documents and attributes lore — it never rules on which version is "true."

## The two-layer model

Every **subject** (a civilization, character, war, place, or artifact) has two layers, shown together on one page:

- **Record** — verifiable facts (dates, participants, outcomes, builds). Requires evidence and is reviewed before publishing. When two Record claims conflict, an archivist marks them **disputed** and *both* are shown — neither is deleted.
- **Account** — subjective, in-character lore (motivations, betrayals, propaganda), attributed to a player or faction. Multiple conflicting accounts are allowed and shown side by side.

Record and Account entries that share the same **event + type + name** are automatically grouped onto one subject page.

## Tech stack

- **Next.js 14** (App Router, React Server Components, Server Actions)
- **Prisma** ORM with **SQLite** (zero-setup for the MVP)
- **bcryptjs** + signed JWT cookie sessions (`jose`)
- **react-markdown** + remark-gfm for entry bodies
- Plain CSS design system with light/dark mode

### Moving to Postgres / Supabase later

The SQLite choice is a clean seam. To switch:
1. In `prisma/schema.prisma`, change `provider = "sqlite"` to `"postgresql"`.
2. Point `DATABASE_URL` in `.env` at your Postgres/Supabase instance.
3. (Optional) change `Entry.infobox` to the native `Json` type.

Nothing in the app code reads the database provider directly.

## Running it

```powershell
npm install
npm run setup     # prisma generate + db push + seed
npm run dev       # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run db:seed`, `npm run db:reset`.

## Demo accounts

All seed accounts use the password **`wikiciv123`**:

| Username       | Role        | Notes                                                        |
| -------------- | ----------- | ----------------------------------------------------------- |
| `archivist`    | archivist   | Review queue, mark disputed, roll back, toggle trust         |
| `chronicler`   | contributor | **Trusted** — accounts auto-publish; records still reviewed  |
| `ashen_scribe` | contributor | **Trusted**                                                 |
| `newcomer`     | contributor | **Untrusted** — all submissions go to the review queue       |

Readers need no login to browse and search published entries.

## Seed data

One server (**Stoneholm SMP**), one concluded event (**The Ashen Era**), and a set of entries chosen to show the model immediately:

- **Ardenfall** (civilization) — a Record **plus two conflicting Accounts** ("The Ardenfall Court" vs. "The Ashen Concord").
- **The Ashen War** (war) — **two conflicting Record claims**, both marked **disputed** and shown side by side.
- **General Maric Thorne** (character), **The Silverflow Ford** (place), **The Ashen Crown** (artifact) — Records with evidence.
- A **pending** account submitted by `newcomer`, waiting in the review queue.

## Roles & permissions

- **reader** (no login): browse and search published entries.
- **contributor**: create/edit entries. New/untrusted submissions enter the review queue (`pending`). Trusted contributors auto-publish **Account** entries; **Record** entries always go through review. Track everything you've submitted (drafts, awaiting review, published) on your **My Contributions** (`/me`) page, including any change requests an archivist has sent back.
- **archivist**: review the queue (approve / request changes **with a reason the author sees**), mark conflicting Records as disputed (instead of rejecting), roll back any entry to a previous revision, toggle a contributor's trusted flag, **create/edit servers and events**, and **delete entries, events, or servers** for moderation. Every approval and moderation action is recorded in a durable **Activity log** (`/review/log`) showing what happened, who did it, and when.

## Every edit is non-destructive

Every create and edit writes a full **Revision**. Archivists can roll back to any earlier revision — which itself creates a new revision, so nothing is ever lost.

## Out of scope (MVP)

Comments, votes, maps, real-time collaboration, and cross-event "persistent legacy" linking are intentionally left out, with clean seams to add them later.
