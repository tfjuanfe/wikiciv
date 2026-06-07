# WikiCiv — Discord Server Implementation Plan

A full build plan for the WikiCiv community Discord. Everything here mirrors the
app's structure and its guiding principle:

> **"Every telling has a home."** We *document and attribute* lore — we never
> rule on which version is true. Conflicting accounts coexist; disputed records
> are shown side by side, never deleted.

The Discord is the **live community layer** that feeds the archive: people meet,
run civilization events, capture evidence, and discuss — then the verified
results land in the app as Records and Accounts.

---

## 1. Server identity

| Item | Value |
| --- | --- |
| **Name** | WikiCiv |
| **Server icon** | `public/icon.png` (the grass-block icon) |
| **Banner / invite splash** | `public/logo.png` on a stone/parchment background |
| **Description** | "An open, collaborative lore archive for Minecraft civilization events. Every telling has a home." |
| **Vanity URL** (after Lvl 3 boost) | `discord.gg/wikiciv` |
| **Community features** | **Enabled** (unlocks Onboarding, AutoMod, announcement & forum channels, Server Insights) |
| **Verification level** | Medium (verified email + 5 min membership) |
| **Explicit media filter** | Scan from all members |
| **Default notifications** | Only @mentions |

---

## 2. Guiding ethos → server rules

Standard safety rules **plus** three WikiCiv-specific covenants that make this
server different from a normal MC community:

**Community rules**
1. Be civil. No harassment, hate, slurs, NSFW, or doxxing.
2. No spam, raids, or unsolicited advertising/DMs.
3. Keep content in the right channels; use spoilers for graphic build images.
4. English in main channels (add regional channels later if needed).
5. Follow Discord ToS and Minecraft EULA.

**The WikiCiv covenants (the important part)**
6. **We attribute, we don't litigate.** You may disagree with a telling, but you
   may not demand it be deleted. Conflicts are *documented*, not "won."
7. **Records need evidence; Accounts need honesty about whose view it is.** Don't
   pass an in-character (IC) opinion off as verified fact.
8. **Keep IC and OOC separate.** Roleplay belongs in RP channels / Account posts;
   out-of-character disputes stay respectful and in OOC channels.

Pin these in `#rules`, and gate entry behind **Membership Screening** (the rules
checkbox) so new members must accept rule 6–8 explicitly.

---

## 3. Roles & ranks

Two ladders. **Functional roles** grant permissions and map 1:1 to the app's
roles. **Activity ranks** are cosmetic, earned by participation.

### 3a. Functional roles (permission hierarchy, top → bottom)

| Role | Color | Maps to app | What it can do | How you get it |
| --- | --- | --- | --- | --- |
| 👑 **Curator** | gold | Owner | Full admin. Owns server config, final escalation. | Founder(s) |
| 🛡️ **Archivist** | stone grey | `role: archivist` | Mod powers: manage messages/members, run the review queue, mark disputes, rollbacks, approve trust. | Appointed by Curator |
| 🪶 **Trusted Chronicler** | grass green | `trusted: true` contributor | Everything Chronicler can, **plus** Account entries auto-publish; access to `#evidence-vault`; can vouch in trust nominations. | Nominated + approved by Archivists |
| ✍️ **Chronicler** | light green | `role: contributor` | Submit Records/Accounts, post in contribution channels, attach evidence. Submissions go to review. | **Verified** + link a WikiCiv account |
| 🎙️ **Event Host** | amber | (n/a — real-world) | Runs the Minecraft civ events being documented. Can open event channels, ping `@Event Notifs`, schedule via Sesh. | Application + Archivist approval |
| 📖 **Reader / Citizen** | default | `reader` (anon) | Read & discuss published lore, react, join voice. | Default after onboarding |
| ✅ **Verified** | none (utility) | linked account | Passed screening; unlocks contribution channels. | Onboarding / link flow |
| 🤖 **Bots** | dark | — | Bot integrations (kept above human roles they must manage, below staff). | Auto |

> **Design note:** keep `@Bots` positioned **above** the roles a bot must assign
> (e.g. reaction-role bots above Reader/faction roles) but **below** Archivist.

### 3b. Activity ranks (cosmetic, leveling bot — optional but recommended)

Earned by participation, not by buying anything. Tie to a leveling bot
(Lurkr/Arcane — both free) for auto-promotion at XP thresholds:

| Rank | Theme | Earned at |
| --- | --- | --- |
| 🌱 **Wanderer** | just arrived | Level 0 |
| 🪵 **Settler** | getting involved | Level 5 |
| 🏠 **Citizen** | regular | Level 15 |
| 🏛️ **Elder** | pillar of the community | Level 30 |
| 📜 **Legend** | name remembered in the archive | Level 50 |

Optionally, the **custom WikiCiv bot** can award bonus XP for *published entries*
so the people who actually build the archive rise fastest.

### 3c. Self-assignable roles (reaction / Onboarding roles)

Cosmetic and notification opt-ins — set up via Carl-bot reaction roles in
`#roles`:

- **Interests:** `@Builder` · `@Writer/Historian` · `@Cartographer` · `@Warmonger` · `@Diplomat`
- **Pings (opt-in):** `@Announcements` · `@Event Notifs` · `@New Entry` (fires when something publishes) · `@Movie/Game Night`
- **Faction colors:** a small palette of self-assign color roles so members can fly a faction's colors (ties into "attributed to a faction").
- **Region / timezone** (optional): `@NA` `@EU` `@ASIA/OCE` for event scheduling.
- **Pronouns** (optional): `@he/him` `@she/her` `@they/them` `@ask`.

---

## 4. Channel structure

Categories with per-channel descriptions and visibility. Legend:
**[All]** everyone · **[Verified]** verified+ · **[Contrib]** Chronicler+ ·
**[Staff]** Archivist+ · **[RO]** read-only for non-staff.

### 📜 WELCOME & INFO  *(All, mostly RO)*
- **#welcome** [RO] — landing message, what WikiCiv is, the icon/banner.
- **#rules** [RO] — the rules + 3 covenants (screening gate points here).
- **#the-two-layers** [RO] — explains **Record vs Account**, disputes, and "every telling has a home." The server's mission statement.
- **#announcements** [RO, Announcement channel] — official news; members can *Follow* it to other servers.
- **#app-changelog** [RO] — auto-posted updates from the WikiCiv app (webhook from the repo/CI).
- **#roles** [RO + reactions] — self-assign roles (Carl-bot).
- **#start-here** [RO] — how to contribute: link to the app, how to get **Verified**, how to link your account.

### 🏛️ THE GREAT HALL  *(community — All)*
- **#great-hall** — general chat.
- **#introductions** — say hi (Onboarding can route here).
- **#lore-discussion** — talk about civilizations, wars, characters across events.
- **#show-your-builds** — screenshots of builds (image-friendly).
- **#tavern** — off-topic / memes.
- **#starboard** [RO] — Hall of Fame; best posts (⭐ react threshold via Carl-bot).

### ⚔️ CIVILIZATION EVENTS  *(All read; Hosts post)*
- **#event-announcements** [RO] — upcoming/active events.
- **#event-signups** — RSVP via **Sesh/Apollo**; sign up to participate.
- **#events-forum** [Forum channel] — **one post per event** (mirrors an app `Event`). Tags: `ongoing`, `concluded`, by theme. Each thread = that event's hub.
- **#timeline-feed** [RO] — the custom bot posts a card whenever an entry is **published** (Record or Account), linking back to the app. The live pulse of the archive.
- **#live-coordination** — temporary text/voice coordination during an active event (Host-managed).

### 🪶 CONTRIBUTION & REVIEW  *(Verified/Contrib)*
- **#how-to-contribute** [RO, Contrib] — style guide, Record vs Account checklist, how grouping by event+type+name works.
- **#submissions** [Contrib] — share/draft entries, ask for feedback before submitting.
- **#evidence-vault** [Trusted+] — curated screenshots/logs used as Record evidence (image URLs feed the app's evidence fields).
- **#review-queue** [RO for Contrib, write for Staff] — the custom bot mirrors the app's pending queue; Archivists can **Approve / Request changes / Mark disputed** via buttons here.
- **#disputes** [Contrib] — *discuss* conflicting Records. Reminder pinned: this is for documenting the disagreement, **not** deciding a winner.
- **#trust-nominations** [Contrib] — vouch for contributors to become **Trusted Chronicler**.

### 🛡️ ARCHIVIST DESK  *(Staff only — hidden from everyone else)*
- **#archivist-chat** — staff coordination.
- **#review-coordination** — who's reviewing what.
- **#mod-log** [RO] — automated moderation + audit log (Carl-bot/Dyno).
- **#reports-tickets** — Ticket Tool transcripts (reports, host applications, account-link help).
- **#bot-config** — bot dashboards/testing.

### 🔊 VOICE
- **🔊 General VC**
- **🎙️ Event Hall** (Stage channel for big events / AMAs)
- **📖 Storytime VC** (lore readings — Accounts read aloud IC)
- **🛡️ Archivist VC** [Staff]
- **💤 AFK**

### 🤖 BOTS & LOGS
- **#bot-commands** [All] — keep slash-command spam here.
- **#welcome-log / #leave-log** [Staff, RO] — join/leave + greeter messages.

---

## 5. Permissions matrix (summary)

Set `@everyone` as the **baseline = Reader** (read + chat in Great Hall, read
public info, join voice). Then layer overrides:

| Capability | Reader | Chronicler | Trusted | Event Host | Archivist | Curator |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| View public channels | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Contribution channels | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| `#evidence-vault` | — | — | ✅ | ✅ | ✅ | ✅ |
| Open/manage event channels | — | — | — | ✅ | ✅ | ✅ |
| Approve / dispute / rollback (review-queue) | — | — | — | — | ✅ | ✅ |
| Manage messages / timeout / kick | — | — | — | — | ✅ | ✅ |
| Ban / manage roles & channels | — | — | — | — | ✅* | ✅ |
| Server settings / integrations | — | — | — | — | — | ✅ |

\* Give Archivists **Ban** + **Manage Roles** *only for roles below them*; reserve
structural server changes for the Curator.

**Hardening:** deny `@everyone` View on the Archivist Desk category; disable
`@everyone`/`@here` for non-staff; turn off embed/attach perms for brand-new
members via an AutoMod/Onboarding delay to blunt raids.

---

## 6. Onboarding & account linking

1. **Membership Screening** — must accept rules (incl. covenants 6–8).
2. **Discord Onboarding** — ask "What brings you here?" → routes to roles:
   - *I want to read & discuss lore* → Reader (default)
   - *I want to write/contribute* → prompts the **Verify** flow
   - *I host MC civ events* → points to the Event Host application (Ticket Tool)
3. **Get Verified → Chronicler:** member links their **WikiCiv app account**.
   Recommended flow (handled by the custom bot):
   - `/link` in `#bot-commands` → bot DMs a one-time code.
   - Member pastes the code into their WikiCiv account settings (new
     "Connections" section in the app), or signs in via **Discord OAuth2**.
   - On success, bot grants **Verified + Chronicler** and sets their nickname to
     their WikiCiv username.
   - This makes Discord identity ↔ archive authorship trustworthy.

---

## 7. Bots

### Recommended off-the-shelf stack (all have free tiers)
| Bot | Purpose | Why it fits WikiCiv |
| --- | --- | --- |
| **Carl-bot** | Reaction roles, AutoMod, logging, starboard, welcome | One bot covers roles + moderation + Hall of Fame. Free reaction roles (MEE6 paywalls them). |
| **Ticket Tool** | Tickets | Host applications, reports, account-link help, trust appeals. |
| **Sesh** *(or Apollo)** | Event scheduling & RSVP | Slash-command events with reminders for civ-event sign-ups across timezones. |
| **PluralKit** *(or Tupperbox)* | In-character webhook posting | **Perfect for Accounts:** members can speak *as a faction/character* ("as told by the Ashen Concord") in RP channels — the Discord echo of the Account layer. |
| **Lurkr** *(or Arcane)* | Leveling / activity ranks | Free XP + auto-roles for the cosmetic rank ladder (§3b). |
| **Statbot** | Analytics | Growth & channel insights for the Curator. |
| **Dyno** | Backup moderation/automod | Optional redundancy if Carl-bot is down. |

> Keep the bot count lean (Carl-bot + Ticket Tool + Sesh + PluralKit + Lurkr is
> plenty). Every extra bot is attack surface and noise.

### The custom **WikiCiv bot** (the one that makes this special)
A small bot that bridges Discord ↔ the Next.js app. This is what turns a generic
community server into *the archive's* server.

**Features**
- **Timeline feed:** when an entry is published, post a card to `#timeline-feed`
  (name, type, layer, event, author, link). Disputed records get the ⚠ banner.
- **Review queue mirror:** post pending submissions to `#review-queue` with
  **Approve / Request changes / Mark disputed** buttons that call the app's
  actions (Archivist-gated by Discord role *and* app role).
- **Account linking:** `/link`, OAuth2, nickname sync, grants Verified/Chronicler.
- **Lookups:** `/entry <name>`, `/event <name>`, `/subject <name>` → embeds with
  the Record + how many Accounts, link to the subject page.
- **Trust workflow:** `/nominate @user` opens a thread in `#trust-nominations`;
  on approval, flips the app's `trusted` flag *and* grants the Discord role.
- **New-event sync:** when an Archivist creates an Event in the app, auto-create
  the matching post in `#events-forum`.

**Technical approach (fits the existing repo)**
- Build with **discord.js** (TypeScript) — same language as the app.
- The app exposes a few **API routes** (`/api/webhooks/entry-published`,
  `/api/bot/review`, `/api/bot/link`) secured with a shared secret / signed
  requests. Reuse the existing Prisma models and the server actions' logic.
- App → Discord: fire a webhook on publish (hook into the existing
  `revalidatePath` spots in `src/app/actions/`).
- Discord → App: slash-command/button handlers call the secured API routes.
- Host the bot as a tiny always-on Node process (Railway/Fly/again your box);
  it shares `DATABASE_URL` or talks over HTTP to the app.

*(I can scaffold this bot in the repo — say the word.)*

---

## 8. Cosmetics

**Custom emojis** (upload under Server Settings → Emoji):
- `:record:` 📜  `:account:` 💬  `:disputed:` ⚠  `:grassblock:` (from `icon.png`)
- `:published:` ✅  `:pending:` ⏳  `:trusted:` ✦
- Faction crest emojis as factions emerge (great Booster perk).

**Stickers / banner:** use the `logo.png` wordmark; seasonal banners per major event.

**Booster perks:** extra emoji/sticker slots, a `@Patron` color role, access to a
`#boosters` lounge, and first dibs on faction-color roles.

---

## 9. Moderation & safety

- **AutoMod** (native + Carl-bot): block invite links, mass-mention, slur
  wordlist, zalgo, and raid-style join spikes (raid mode / verification gate).
- **Logging:** message edits/deletes, joins/leaves, role & nickname changes → `#mod-log`.
- **Tickets over DMs:** all reports/appeals via Ticket Tool for transparency.
- **Escalation ladder:** warn → timeout → kick → ban, logged by Archivists.
- **Covenant enforcement:** "delete my rival's account" requests are themselves a
  rule-6 violation — redirect to `#disputes` and (if it's a Record conflict)
  the app's *disputed* flag instead.

---

## 10. Event lifecycle (Discord ↔ app)

How a single civ event flows through both systems:

1. **Host** applies (Ticket Tool) → gets **Event Host** role.
2. Archivist creates the **Event** in the app → bot opens an **#events-forum**
   post + posts to **#event-announcements**.
3. **#event-signups** RSVP via Sesh; coordination in **#live-coordination** / Event Hall VC.
4. During play, members drop screenshots in **#show-your-builds** /
   **#evidence-vault** → these become **Record evidence** URLs.
5. After the event, Chroniclers file **Records** (facts + evidence) and
   **Accounts** (their faction's telling) in the app.
6. Archivists review via **#review-queue**; conflicts → **disputed**, both kept.
7. Published entries broadcast to **#timeline-feed**; event post tagged
   **concluded**.

---

## 11. Implementation checklist (phased)

**Phase 0 — Foundations**
- [ ] Create server; set name, icon (`icon.png`), banner (`logo.png`).
- [ ] Enable **Community**; set verification/notification/media settings.

**Phase 1 — Roles**
- [ ] Create functional roles (§3a) in hierarchy order; set colors & permissions.
- [ ] Create activity ranks (§3b) and self-assign roles (§3c).
- [ ] Position `@Bots` correctly relative to assignable roles.

**Phase 2 — Channels & permissions**
- [ ] Build the 7 categories and channels (§4) with descriptions.
- [ ] Apply the permission matrix (§5); hide the Archivist Desk; lock RO channels.

**Phase 3 — Bots**
- [ ] Add Carl-bot, Ticket Tool, Sesh, PluralKit, Lurkr; configure each.
- [ ] Set reaction roles in `#roles`; starboard → `#starboard`; logging → `#mod-log`.

**Phase 4 — Onboarding & rules**
- [ ] Write `#rules` (incl. covenants) + Membership Screening.
- [ ] Configure Discord Onboarding question → role routing.
- [ ] Set up AutoMod rules.

**Phase 5 — Custom integration**
- [ ] Build/deploy the WikiCiv bot; add API routes + publish webhook in the app.
- [ ] Wire `#timeline-feed`, `#review-queue` buttons, `/link` account linking.

**Phase 6 — Content & launch**
- [ ] Upload custom emojis; pin `#the-two-layers`.
- [ ] Seed `#announcements`, a sample event in `#events-forum`.
- [ ] Soft-launch with a few trusted members; stress-test review flow; then open invites.

---

## 12. Growth & maintenance
- Recap recent published lore in `#announcements` weekly (the bot can auto-draft).
- Rotate a featured **"Telling of the Week"** to the Hall of Fame.
- Recruit Archivists from active Trusted Chroniclers as volume grows
  (target ~1 Archivist per ~300 active members).
- Review channel structure quarterly; archive concluded-event channels rather
  than deleting them — *every telling has a home*, in Discord too.
