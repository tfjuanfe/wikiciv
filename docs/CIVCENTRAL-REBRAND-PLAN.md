# CivCentral Rebrand & Feature Plan

Migration of **WikiCiv → CivCentral** (`civcentral.com`): a full rebrand plus a
large feature wave (Discord identity & integrations, media uploads, voting,
moderation, mobile, personalization).

This plan is sequenced so that a handful of **foundations** land first, because
most of the requested features depend on them. Each feature lists the concrete
files/models it touches in the current codebase.

---

## 0. Decisions locked in

| Decision | Choice |
| --- | --- |
| Discord login | **Link + standalone** — existing users can link Discord; new users can sign up with Discord alone. `discordId` stored on `User`. |
| Voting scope | Applies to **Accounts** (lore versions), **Subjects** (whole pages), and **Comments**. Not events (the 1–5 `EventRating` stays). |
| Archivist role | Stays a role, but add an **admin grant UI** + a top-level **owner/admin** who manages roles → multiple archivists. |
| Media storage | **Cloudflare R2** (free tier: 10 GB-month, zero egress), behind a thin `lib/storage.ts` abstraction so it can swap to Vercel Blob later. |
| Owner role | New **`owner`** role held **only by `Danteware`**; the owner alone can grant/revoke the archivist role. |
| Interested delivery | **Channel ping** (role mention in a Discord channel) — not DMs. |
| Rating verification | Done via the **Discord bot** (checks guild role membership), not OAuth `guilds.members.read`. |
| Account deletion | **Anonymize-and-keep** — preserve authored entries/revisions, null PII, release username/email. |
| Video embeds | **Any provider** — broad allowlist, rendered via sandboxed iframe / oEmbed. |

---

## 1. Architecture impact (read first)

The current app is a clean Next.js 14 / Prisma / Postgres monolith with
server-actions and JWT-cookie sessions. Four cross-cutting foundations unlock
almost everything else:

- **F1 — Discord identity (OAuth2):** `discordId` on `User`, OAuth callback
  route, account-linking. Required by: Discord login, Interested pings, rating
  bot verification, profile pictures (Discord avatar option).
- **F2 — Object storage (`lib/storage.ts` → R2):** signed uploads + an upload
  route. Required by: device media import, profile pictures, event banners,
  personalized pages.
- **F3 — Event ownership:** events currently have **no owner**. Add
  `Event.ownerId` (and backfill). Required by: comment/discussion toggles,
  rating open/closed mode, video embeds, page personalization, host tickets.
- **F4 — Moderation & role primitives:** extend `AuditLog` action set, add
  `Report`, `Ticket`, `Vote`, and user-status (`banned`/`suspended`) fields.
  Required by: mod actions, reports, tickets, role-grant UI, automod.

Two services come out of this:
- The existing **Next.js web app** (this repo).
- A **new open-source Discord bot** (separate repo,
  `civcentral-bot`) for rating verification + Interested pings + log
  forwarding. Communicates with the web app over a small signed HTTP API.

---

## 2. Phasing overview

| Phase | Theme | Headline items |
| --- | --- | --- |
| **P0** | Rebrand cut-over | Name, logo, colors, domain, cookie, email-from |
| **P1** | Foundations | Schema migration (F1–F4), R2 storage, Discord OAuth, event ownership |
| **P2** | Accounts & identity | Discord login, profile pictures, change password, delete account |
| **P3** | UI & search polish | Mobile-friendly pass, entry-creation search/typeahead |
| **P4** | Engagement | Up/down voting, comment toggles, device media import, video embeds, Interested button |
| **P5** | Moderation & roles | Role-grant admin UI, expanded mod actions, reports, host-role tickets, automod |
| **P6** | Discord ecosystem | Log → Discord channel, rating-verification bot, Interested ping delivery, server icon/branding |
| **P7** | Personalization | Event hosts personalize their wiki pages |

P0 can ship independently and immediately. P1 is the gate for everything after.

---

## 2.1 Features ranked easiest → hardest

Effort/risk for the **feature itself**. "Needs" = a foundation (§1) it can't ship
without; that foundation's cost is paid once and shared.

| # | Feature | Tier | Why / dependency |
| --- | --- | --- | --- |
| 1 | Big Discord server icon + invite branding | Trivial | An asset + a link in header/footer. |
| 2 | Change password | Trivial | One server action + `/me` form; bcrypt already present. |
| 3 | Logs → Discord channel | Easy | Hook `logAudit` to a webhook POST. No bot, no schema. |
| 4 | Owner role (Danteware) | Easy | Add `owner` role + gate; seed/grant to `Danteware`. |
| 5 | Rebrand UI + logo | Easy* | Mechanical find/replace + assets + CSS tokens + domain. *Logo art is the variable. |
| 6 | Comment/discussion toggles | Easy | 2 booleans + gate in `social.ts` + toggle UI. *Needs F3 (event ownership) for "who can toggle".* |
| 7 | Delete account (anonymize) | Easy–Mod | Careful server action across relations; keep authored history. |
| 8 | Entry-creation search/typeahead | Moderate | New search API + debounced component in `EntryForm`. |
| 9 | Role-grant admin UI + better role icons | Moderate | Admin page + owner/archivist gating + audit + icons. |
| 10 | Report system | Moderate | `Report` model + report UI + `/review/reports` queue. *Needs F4.* |
| 11 | Ticket system (host-role requests) | Moderate | `Ticket` model + form + queue; reuses request-review pattern. *Needs F4.* |
| 12 | Profile pictures | Moderate | Upload + render + Discord-avatar option. *Needs F2 (storage).* |
| 13 | Device media/image import | Moderate | Upload route + editor drag/drop/paste. *Needs F2.* |
| 14 | Expanded mod actions (ban/suspend/hide/lock) | Moderate | Enforce in `permissions.ts` + audit + UI. *Needs F4.* |
| 15 | Up/down voting | Moderate | `Vote` model + three surfaces (accounts/subjects/comments) + UI. *Needs F4.* |
| 16 | Event video embeds | Moderate | Safe iframe/oEmbed + allowlist + host UI. *Needs F3.* |
| 17 | Mobile-friendly UI | Moderate | Low conceptual difficulty, high tedium: responsive pass over a 1,943-line CSS + cross-page testing. |
| 18 | Discord log-in | Hard | OAuth2 flow + callback + account linking/edge cases. **Foundation F1.** |
| 19 | "Interested" button + channel-ping delivery | Hard | Button is trivial; delivery needs the bot + stored Discord IDs + notify pipeline. *Needs F1 + F3 + bot.* |
| 20 | Event-host page personalization | Hard | Constrained block editor + sanitization + per-event theming. *Needs F2 + F3.* |
| 21 | Rating-verification Discord bot | Hard | Separate hosted open-source service: discord.js, guild role checks, HMAC-signed API, deploy. *Needs F1 + F3.* |
| 22 | Auto mod (optional) | Hard | Open-ended heuristics/keyword/spam + flag pipeline + tuning. Ship last. |

**Read it two ways:** by *difficulty* (this table) for estimating, or by *phase*
(§2) for sequencing — note the cheap wins #1–#5 are all in P0/early P1 and need
no foundations, so they can land first while F1–F4 are being built.

---

## 3. P0 — Rebrand cut-over

**Scope:** 31 `wikiciv` references across 15 files + assets + infra.

- **Text/brand:** replace "WikiCiv" → "CivCentral" in `layout.tsx` (metadata),
  `Header.tsx`, `page.tsx`, `faq/page.tsx`, `info/page.tsx`,
  `VerifyEmailBanner.tsx`, `ThemeToggle.tsx`, `users/[username]/page.tsx`,
  `entries/[entryId]/export/route.ts`, `upcoming`, `popular`, `ratings`.
- **Logo/assets:** DONE. The Blockwork wordmark ships as `public/logo.svg` /
  `logo-dark.svg` / `icon.svg` (vector masters) plus the rasterised
  `logo.png`, `logo-dark.png`, `icon.png`, `icon-192.png`,
  `brand/discord-server-icon.*`, and `src/app/icon.png` (favicon, picked up
  automatically by the App Router). Regenerate all of them with
  `node scripts/make-brand-assets.cjs`; the letterforms live in
  `scripts/make-brand-concepts.cjs`. The old `make-logo.cjs` was removed.
- **Color system:** rework brand tokens at the top of `globals.css` (CSS custom
  properties for both light/dark). Keep the same variable names so the 1,900
  lines below inherit automatically.
- **Session cookie:** rename `wikiciv_session` → `civcentral_session` in
  `lib/auth.ts`. ⚠️ This logs everyone out on deploy — acceptable, or read both
  names for one release for a soft cut-over.
- **Email:** `EMAIL_FROM` → `"CivCentral <noreply@civcentral.com>"`; verify the
  domain in Resend; update copy in `lib/email.ts`.
- **Infra:** add `civcentral.com` domain in Vercel, set
  `NEXT_PUBLIC_APP_URL=https://civcentral.com`, 301 the old host. Rename repo if
  desired.
- **DB-side strings:** `prisma/seed.ts` brand strings (dev only).

**Risk:** low. Mechanical. Do a find-and-replace PR + a logo PR.

---

## 4. P1 — Foundations (the gate)

One Prisma migration introduces the schema for nearly every later feature. Group
it so later phases only add UI, not migrations.

### F1 — Discord identity
```prisma
model User {
  // ...existing...
  discordId        String?  @unique
  discordUsername  String?
  discordAvatar    String?  // CDN hash or full URL
  avatarUrl        String?  // uploaded profile picture (F2); falls back to Discord/default
}
```
- New route `src/app/api/auth/discord/route.ts` (start) + `.../callback/route.ts`
  using Discord OAuth2 (`identify`, optionally `email`, `guilds.members.read`
  for the bot's role checks later).
- `lib/discord.ts`: token exchange, profile fetch, state/PKCE.
- Reuse existing `createSession(userId)` — Discord is just another way to
  resolve a `User`.

### F2 — Object storage
- `lib/storage.ts`: `putObject`, `getPublicUrl`, `deleteObject` over R2 (S3 API,
  `@aws-sdk/client-s3` or `aws4fetch`). Env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`.
- `src/app/api/upload/route.ts`: authenticated, validates mime/size, returns the
  public URL. Image-only allowlist + size cap + per-user rate limit (reuse
  `lib/ratelimit.ts`).

### F3 — Event ownership
```prisma
model Event {
  // ...existing...
  ownerId            String?
  commentsEnabled    Boolean @default(true)
  discussionEnabled  Boolean @default(true)
  ratingMode         String  @default("open")   // open | verified
  ratingGuildId      String?                     // Discord guild for verified ratings
  ratingRoleId       String?                     // required role id for verified ratings
  bannerUrl          String?                     // P7 personalization
  accentColor        String?
  customBlocks       String  @default("[]")      // JSON, P7
}
model ServerInterest {            // Interested button (P4/P6)
  id        String @id @default(cuid())
  userId    String
  serverId  String
  createdAt DateTime @default(now())
  @@unique([userId, serverId])
}
```
- `EventRequest` approval should set `ownerId = requesterId` so hosts own what
  they proposed. Backfill existing events' `ownerId` to an admin.
- `lib/permissions.ts`: add `canManageEvent(user, event)` (owner or archivist).

### F4 — Moderation & role primitives
```prisma
model User {
  status         String   @default("active")  // active | suspended | banned
  suspendedUntil DateTime?
}
model Vote {                       // P4 voting (accounts/subjects/comments)
  id         String @id @default(cuid())
  userId     String
  targetType String   // account | subject | comment
  targetId   String   // entryId | subjectKey | commentId
  value      Int      // +1 | -1
  createdAt  DateTime @default(now())
  @@unique([userId, targetType, targetId])
  @@index([targetType, targetId])
}
model Report {                     // P5 report system
  id         String @id @default(cuid())
  reporterId String
  targetType String   // entry | comment | user | event
  targetId   String
  reason     String
  details    String   @default("")
  status     String   @default("open") // open | resolved | dismissed
  createdAt  DateTime @default(now())
  @@index([status])
}
model Ticket {                     // P5 host-role + general tickets
  id          String @id @default(cuid())
  userId      String
  type        String   // event_host_request | other
  subject     String
  body        String
  status      String   @default("open") // open | approved | rejected | closed
  reviewNote  String?
  createdAt   DateTime @default(now())
  @@index([status])
}
```
- Extend `AuditLog.action` enum-by-convention with: `banned_user`,
  `suspended_user`, `unbanned_user`, `granted_role`, `revoked_role`,
  `locked_subject`, `hid_entry`, `resolved_report`, `closed_ticket`.

**Deliverable:** one migration + regenerated client + updated `seed.ts`. No UI
yet — later phases consume these tables.

---

## 5. P2 — Accounts & identity

- **Discord login (F1):** "Continue with Discord" button on `login`/`register`;
  link/unlink control on `/me`. On callback: match `discordId` → existing user,
  else create one (username from Discord handle, deduped).
- **Profile pictures (F2):** avatar upload on `/me` → `User.avatarUrl`; option
  to "use Discord avatar". Render avatars in `Header`, `EntryCard`,
  `users/[username]`, comments. Default monogram fallback.
- **Change password:** `actions/profile.ts` → `changePassword(old, new)` with
  bcrypt re-hash + rate limit; form on `/me`. (Discord-only accounts get a
  "set a password" flow instead.)
- **Delete account:** `deleteAccount()` — soft vs hard delete. Recommend
  **anonymize** (keep authored entries/revisions for the "every telling has a
  home" principle; null PII, set `status=deleted`, release username/email).
  Confirm-by-typing UI.

---

## 6. P3 — UI & search polish

- **Mobile-friendly pass:** audit `globals.css` (1,943 lines). Add breakpoints
  for `.site-header` (collapse Row-1/Row-2 into a hamburger), card grids → single
  column, infobox stacking, tables → horizontal scroll, tap targets ≥44px. Test
  the home, entry, event, `/me`, and review pages at 360/768/1024.
- **Entry-creation search/typeahead:** in `EntryForm`, when the author types a
  subject **name**, query existing subjects in the chosen event/type and suggest
  matches so Records + Accounts group correctly under one `subjectKey`. New
  `src/app/api/subjects/search/route.ts` (debounced, returns `(name, type,
  layerCounts)`); show "this will attach to an existing subject" hint. Directly
  improves data quality of the two-layer model.

---

## 7. P4 — Engagement

- **Up/down voting (F4 `Vote`):** `actions/votes.ts` → `castVote(targetType,
  targetId, value)` (toggle/switch). UI:
  - *Accounts* — vote control per Account card on the subject page (surfaces
    community-favored tellings without deleting rivals).
  - *Subjects* — page-level score; can feed/extend `/popular`.
  - *Comments* — vote control in `CommentForm`/comment list; sort by score.
  Requires `canContributeNow` (verified) to vote; show net score to readers.
- **Comment & discussion toggles (F3):** respect `Event.commentsEnabled` /
  `discussionEnabled` in `social.ts` (`addComment` rejects when off) and hide the
  form in the subject page. Owner/archivist toggle on the event page via
  `canManageEvent`.
- **Device media import (F2):** add an image picker to `EntryForm` /
  `Markdown` editor and to `Evidence` (currently URL-only) → uploads via
  `/api/upload`, inserts the returned URL. Drag-drop + paste support.
- **Event video embeds (F3):** hosts attach video URLs (YouTube/Streamable) to
  *their existing* events; store on `Event` (or an `EventMedia` table) and render
  a safe iframe/oEmbed block on the event page. Domain allowlist; no arbitrary
  HTML.
- **Interested button (F3 `ServerInterest`):** toggle on each server page
  ("Get pinged when this server runs a new event"). Stores interest; actual
  Discord ping delivered in P6 when an event is created for that server.

---

## 8. P5 — Moderation & roles

- **Role-grant admin UI (decision #3):** new `/admin/users` page (owner/archivist
  gated). Promote/revoke `archivist`, toggle `trusted`/`eventHost`, with better
  icons (extend `components/Icon.tsx`). Add a top-level **owner** (either a new
  `role` value `owner` or an `isOwner` flag) who alone can grant archivist. All
  changes write `AuditLog` (`granted_role`/`revoked_role`).
- **Expanded mod actions (F4):** beyond delete — **ban/suspend** users
  (`User.status`, `suspendedUntil`; block contributing actions in
  `permissions.ts`), **lock** a subject (no new comments/accounts), **hide** an
  entry without deleting (new `hidden` status, preserves history). All audited.
- **Report system (F4 `Report`):** "Report" control on entries/comments/users →
  `actions/reports.ts`; moderation queue at `/review/reports` with
  resolve/dismiss. Rate-limited; auto-links the target.
- **Host-role tickets (F4 `Ticket`):** `/tickets/new` (type
  `event_host_request`) → archivist queue → approve sets `User.eventHost = true`.
  Reuses the `ServerRequest`/`EventRequest` review UX pattern.
- **Automod (optional):** lightweight, server-side. Keyword/link blocklist +
  spam heuristics on `addComment`/entry submit; borderline content auto-flags
  into the `Report` queue instead of hard-blocking. Config table or env list.
  Ship last; everything above works without it.

---

## 9. P6 — Discord ecosystem

A separate **open-source repo `civcentral-bot`** (Node + discord.js). The web app
exposes a small signed HTTP API (HMAC with a shared secret) the bot calls.

- **Logs → Discord channel:** hook `lib/audit.ts::logAudit` to also POST to a
  Discord **webhook** (`DISCORD_LOG_WEBHOOK_URL`) — no bot needed for this.
  Formats each action into an embed in the `#logs` channel. Make it best-effort
  (never block the action; swallow failures).
- **Rating-verification bot:** for events with `ratingMode = "verified"`, a rating
  is only accepted if the user holds `ratingRoleId` in `ratingGuildId`. Two ways
  to verify, pick one:
  - *OAuth `guilds.members.read`* at vote time (no bot token needed), or
  - *Bot* with `GUILD_MEMBERS` intent checking membership/roles on request.
  `actions/ratings.ts` consults verification when `ratingMode=verified`; hosts
  flip open/verified on their event (F3). Bot repo is MIT, documented, published
  on GitHub.
- **Interested ping delivery (P4 `ServerInterest`):** when an event is created
  for a server (in `createEvent` / `EventRequest` approval), enqueue a
  notification; the bot DMs / channel-pings users who opted in for that server.
  Needs their `discordId` (F1). Prefer a channel ping with role mention over DMs
  (DMs require a shared server and are easily rate-limited).
- **Branding:** big Discord **server icon** + invite asset for the CivCentral
  Discord; surface the invite in `Header`/footer. (Ties to existing
  `docs/DISCORD-SERVER-PLAN.md`.)

---

## 10. P7 — Personalization

Give event hosts freedom over **their** event/wiki pages (gated by
`canManageEvent`):
- **Banner + accent** (`Event.bannerUrl` via F2, `Event.accentColor`) themes the
  event page and its entries.
- **Custom blocks** (`Event.customBlocks` JSON): a constrained block editor
  (headings, markdown, image, video, links) — **not** raw HTML/CSS (XSS).
  Render with the existing sanitized `Markdown` component + a small block
  renderer.
- Optional: per-host featured-entry ordering on the event page.

---

## 11. Cross-cutting concerns

- **Security:** all uploads validated (mime/size/rate); embeds via allowlist +
  iframe sandbox; bot↔web API HMAC-signed; OAuth `state`/PKCE; never trust
  client `subjectKey`/`targetId` (keep the `subjectExists` pattern). Ban/suspend
  must be enforced in `permissions.ts`, not just hidden in UI.
- **Non-destructive principle:** voting, hiding, and account deletion must
  preserve authored history ("every telling has a home"). Prefer hide/anonymize
  over hard delete.
- **Env vars added:** `DISCORD_CLIENT_ID/SECRET/REDIRECT_URI`,
  `DISCORD_LOG_WEBHOOK_URL`, `DISCORD_BOT_TOKEN` (bot repo), `BOT_SHARED_SECRET`,
  `R2_*`. Update `.env.example` + `docs/DEPLOY.md`.
- **Testing:** extend the existing `vitest` suite — `permissions.test.ts` for
  `canManageEvent`/ban gates, new tests for vote toggling, verified-rating
  gating, upload validation.
- **Migrations:** one big P1 migration; backfill `Event.ownerId` and any
  `owner` role before features that read them.

---

## 12. Suggested delivery order (PR-sized chunks)

1. P0 rebrand (text+cookie) · 2. P0 logo/colors · 3. P1 migration + `lib/storage`
+ `lib/discord` · 4. Discord login · 5. Profile pics + password + delete account ·
6. Mobile CSS · 7. Entry typeahead · 8. Voting · 9. Comment toggles + media
import · 10. Video embeds + Interested button · 11. Role-grant UI + ban/suspend ·
12. Reports · 13. Tickets · 14. Log webhook · 15. `civcentral-bot` (ratings +
Interested) · 16. Personalization · 17. Automod (optional).

Each chunk is independently shippable; P1 (#3) blocks 4–16.

---

## 13. Resolved decisions

- **Owner role:** a dedicated **`owner`** role granted **only to `Danteware`**;
  the owner alone grants/revokes archivist. Seed it to that account (or grant on
  first deploy).
- **Interested delivery:** **channel ping** (role mention in a Discord channel).
  No DMs — avoids the shared-server/rate-limit constraints.
- **Rating verification:** via the **Discord bot** (checks guild role
  membership), published open-source on GitHub.
- **Account deletion:** **anonymize-and-keep** — preserve authored
  entries/revisions, null PII, release username/email.
- **Video embeds:** **any provider** is fine — broad allowlist rendered through a
  sandboxed iframe / oEmbed (still no raw HTML).
