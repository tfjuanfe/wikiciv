import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "wikiciv123"; // shared demo password for all seed accounts

interface EvidenceSeed {
  url: string;
  caption: string;
}

async function makeEntry(opts: {
  eventId: string;
  type: string;
  layer: string;
  name: string;
  infobox?: Record<string, string>;
  body: string;
  authorId: string;
  attributedTo?: string;
  status?: string;
  disputed?: boolean;
  evidence?: EvidenceSeed[];
  extraRevision?: { body: string; infobox: Record<string, string>; note: string };
}) {
  const infoboxJson = JSON.stringify(opts.infobox ?? {});
  const entry = await prisma.entry.create({
    data: {
      eventId: opts.eventId,
      type: opts.type,
      layer: opts.layer,
      name: opts.name,
      infobox: infoboxJson,
      body: opts.body,
      authorId: opts.authorId,
      attributedTo: opts.attributedTo ?? null,
      status: opts.status ?? "published",
      disputed: opts.disputed ?? false,
      evidence: { create: opts.evidence ?? [] },
      revisions: {
        create: {
          body: opts.body,
          infobox: infoboxJson,
          editorId: opts.authorId,
          note: "created",
        },
      },
    },
  });

  if (opts.extraRevision) {
    await prisma.revision.create({
      data: {
        entryId: entry.id,
        body: opts.extraRevision.body,
        infobox: JSON.stringify(opts.extraRevision.infobox),
        editorId: opts.authorId,
        note: opts.extraRevision.note,
      },
    });
    // Make the latest content reflect the extra revision.
    await prisma.entry.update({
      where: { id: entry.id },
      data: {
        body: opts.extraRevision.body,
        infobox: JSON.stringify(opts.extraRevision.infobox),
      },
    });
  }

  return entry;
}

async function main() {
  console.log("Resetting data…");
  await prisma.revision.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.event.deleteMany();
  await prisma.server.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating users…");
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const archivist = await prisma.user.create({
    data: {
      username: "archivist",
      passwordHash,
      role: "archivist",
      trusted: true,
    },
  });
  const chronicler = await prisma.user.create({
    data: {
      username: "chronicler",
      passwordHash,
      role: "contributor",
      trusted: true,
    },
  });
  const ashenScribe = await prisma.user.create({
    data: {
      username: "ashen_scribe",
      passwordHash,
      role: "contributor",
      trusted: true,
    },
  });
  const newcomer = await prisma.user.create({
    data: {
      username: "newcomer",
      passwordHash,
      role: "contributor",
      trusted: false,
    },
  });

  console.log("Creating server & event…");
  const server = await prisma.server.create({
    data: {
      name: "Stoneholm SMP",
      description:
        "A long-running civilization roleplay server where players found nations, forge alliances, and wage wars that become legend.",
    },
  });

  const event = await prisma.event.create({
    data: {
      serverId: server.id,
      name: "The Ashen Era",
      theme: "Rise & fall of nations",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2025-12-14"),
      status: "concluded",
      description:
        "A three-month season that began with the founding of Ardenfall and ended in the fires of the Ashen War. These are its records — and the many ways it is remembered.",
    },
  });

  console.log("Creating entries…");

  // ---- CIVILIZATION: Ardenfall (1 Record + 2 conflicting Accounts) ----
  await makeEntry({
    eventId: event.id,
    type: "civilization",
    layer: "record",
    name: "Ardenfall",
    authorId: chronicler.id,
    infobox: {
      founded: "Season start, Day 3",
      leader: "Queen Lysa Ardent",
      allies: "The Riverfolk, House Vane",
      rivals: "The Ashen Concord",
      fate: "Capital sacked in the Ashen War; survivors scattered",
    },
    body: `**Ardenfall** was the first great nation founded in the Ashen Era, raised on the green hills above the Silverflow River.

At its height it counted dozens of citizens and controlled the central trade roads. Its capital, **Ardenhold**, was a terraced stone city crowned by the Hall of Banners.

Ardenfall is best known for the trade pacts that kept the early server peaceful — and for its fall, which ended that peace. The verified timeline below is drawn from server logs and screenshots submitted at the time.

## Verified milestones
- **Day 3** — Founding charter laid at the Silverflow ford.
- **Day 21** — Trade pact signed with the Riverfolk.
- **Day 58** — Border skirmishes with the Ashen Concord begin.
- **Day 96** — Ardenhold falls. The era's turning point.`,
    evidence: [
      {
        url: "https://picsum.photos/seed/ardenfall-city/640/400",
        caption: "Ardenhold's terraced capital (screenshot, Day 40)",
      },
      {
        url: "https://picsum.photos/seed/ardenfall-charter/640/400",
        caption: "The founding charter sign post",
      },
    ],
    extraRevision: {
      note: "edited: added Day 96 milestone after corroborating logs",
      infobox: {
        founded: "Season start, Day 3",
        leader: "Queen Lysa Ardent",
        allies: "The Riverfolk, House Vane",
        rivals: "The Ashen Concord",
        fate: "Capital sacked in the Ashen War; survivors scattered",
      },
      body: `**Ardenfall** was the first great nation founded in the Ashen Era, raised on the green hills above the Silverflow River.

At its height it counted dozens of citizens and controlled the central trade roads. Its capital, **Ardenhold**, was a terraced stone city crowned by the Hall of Banners.

Ardenfall is best known for the trade pacts that kept the early server peaceful — and for its fall, which ended that peace. The verified timeline below is drawn from server logs and screenshots submitted at the time.

## Verified milestones
- **Day 3** — Founding charter laid at the Silverflow ford.
- **Day 21** — Trade pact signed with the Riverfolk.
- **Day 58** — Border skirmishes with the Ashen Concord begin.
- **Day 96** — Ardenhold falls. The era's turning point.`,
    },
  });

  await makeEntry({
    eventId: event.id,
    type: "civilization",
    layer: "account",
    name: "Ardenfall",
    authorId: chronicler.id,
    attributedTo: "The Ardenfall Court",
    body: `> *"We did not start the fire. We only refused to kneel before it."*

Ardenfall was a beacon of order in a lawless age. Queen Lysa opened our granaries to every wanderer and asked only peace in return.

When the **Ashen Concord** demanded tribute, we refused — not out of pride, but because tribute to tyrants only buys a crueler tomorrow. They called it arrogance. We called it dignity.

The sack of Ardenhold was not a defeat of arms but a betrayal: the eastern gate was opened from within. Our nation did not fall. It was murdered.`,
  });

  await makeEntry({
    eventId: event.id,
    type: "civilization",
    layer: "account",
    name: "Ardenfall",
    authorId: ashenScribe.id,
    attributedTo: "The Ashen Concord",
    body: `Let the record-keepers gild it however they like. The truth of **Ardenfall** is simpler.

They sat astride every road and called the tolls "trade pacts." They starved three smaller settlements into "alliances." Queen Lysa's famous generosity was a leash.

The Concord did not seek war. We sought the open road. When Ardenhold's own guards opened the eastern gate, it was not betrayal — it was the first honest thing that city ever did. A people freed do not mourn their cage.

*Recorded by a scribe of the Ashen Concord, that there might be another telling.*`,
  });

  // ---- WAR: The Ashen War (two CONFLICTING, disputed Records) ----
  await makeEntry({
    eventId: event.id,
    type: "war",
    layer: "record",
    name: "The Ashen War",
    authorId: chronicler.id,
    disputed: true,
    infobox: {
      belligerents: "Ardenfall & the Riverfolk vs. The Ashen Concord",
      outcome: "Pyrrhic Concord victory; Ardenhold sacked",
      duration: "Day 58 – Day 96",
    },
    body: `The **Ashen War** was the defining conflict of the era. This Record claim holds that the war ended in a **costly Concord victory**: Ardenhold was taken, but the Concord lost most of its standing army doing it and dissolved within weeks.

Evidence: battle-site screenshots showing Concord banners over the ruins, and the server log entry marking Ardenhold's region as captured on Day 96.

> ⚠ This claim conflicts with another submitted Record and has been marked **disputed** by an archivist. Both are preserved.`,
    evidence: [
      {
        url: "https://picsum.photos/seed/ashen-war-ruins/640/400",
        caption: "Concord banners over Ardenhold's ruins (Day 96)",
      },
    ],
  });

  await makeEntry({
    eventId: event.id,
    type: "war",
    layer: "record",
    name: "The Ashen War",
    authorId: ashenScribe.id,
    disputed: true,
    infobox: {
      belligerents: "The Ashen Concord vs. Ardenfall & the Riverfolk",
      outcome: "Inconclusive — both capitals abandoned",
      duration: "Day 58 – Day 101",
    },
    body: `A second Record claim, drawn from a different set of logs.

This account holds the war was **inconclusive**. Yes, Ardenhold was abandoned — but so was the Concord's own stronghold days later, and no faction held the field by season's end. To call it a "victory" for anyone, this claim argues, overstates what the logs actually show.

> ⚠ Marked **disputed**. WikiCiv does not rule on which Record is correct — it shows both, attributed to who submitted them.`,
    evidence: [
      {
        url: "https://picsum.photos/seed/ashen-war-empty/640/400",
        caption: "The abandoned Concord stronghold (Day 101)",
      },
    ],
  });

  // ---- CHARACTER ----
  await makeEntry({
    eventId: event.id,
    type: "character",
    layer: "record",
    name: "General Maric Thorne",
    authorId: chronicler.id,
    infobox: {
      role: "Field commander of Ardenfall",
      affiliation: "Ardenfall",
      status: "fallen",
      notableDeeds: "Held the Silverflow ford for 11 days",
    },
    body: `**General Maric Thorne** commanded Ardenfall's armies during the Ashen War.

He is verifiably credited with the eleven-day defense of the Silverflow ford, recorded in server logs as the longest unbroken hold of the season. He fell during the sack of Ardenhold on Day 96; his death is confirmed by the server death log.`,
    evidence: [
      {
        url: "https://picsum.photos/seed/maric-thorne/640/400",
        caption: "Thorne's memorial cairn at the ford",
      },
    ],
  });

  // ---- PLACE ----
  await makeEntry({
    eventId: event.id,
    type: "place",
    layer: "record",
    name: "The Silverflow Ford",
    authorId: chronicler.id,
    infobox: {
      location: "X: 412, Z: -1180",
      builders: "Ardenfall engineers",
      description: "The river crossing that controlled the central roads",
    },
    body: `The **Silverflow Ford** was the most strategically important crossing of the era. Whoever held it controlled trade between the northern and southern halves of the map.

It was the site of General Thorne's famous eleven-day defense. The original stone causeway and its twin guard towers still stand at the listed coordinates.`,
    evidence: [
      {
        url: "https://picsum.photos/seed/silverflow-ford/640/400",
        caption: "The causeway and guard towers",
      },
    ],
  });

  // ---- ARTIFACT ----
  await makeEntry({
    eventId: event.id,
    type: "artifact",
    layer: "record",
    name: "The Ashen Crown",
    authorId: ashenScribe.id,
    infobox: {
      owner: "Last held by the Ashen Concord",
      origin: "Forged from Ardenhold's melted banners",
      significance: "Symbol of the Concord's contested victory",
    },
    body: `The **Ashen Crown** was forged after the sack of Ardenhold, reputedly from the melted-down banners of the Hall of Banners.

Its current whereabouts are unknown — fitting, perhaps, for a crown whose very victory remains disputed.`,
    evidence: [
      {
        url: "https://picsum.photos/seed/ashen-crown/640/400",
        caption: "The Ashen Crown on display before it vanished",
      },
    ],
  });

  // ---- A PENDING submission, so the review queue isn't empty ----
  await makeEntry({
    eventId: event.id,
    type: "character",
    layer: "account",
    name: "General Maric Thorne",
    authorId: newcomer.id,
    attributedTo: "A Wandering Bard",
    status: "pending",
    body: `*Submitted by an untrusted contributor — awaiting review.*

They say Thorne never truly fell at the ford. They say a hooded figure matching his armor was seen trading at the southern markets a full season later. The logs say he died. The taverns say otherwise. I only set down what is sung.`,
  });

  console.log("Seed complete.");
  console.log("");
  console.log("Demo accounts (password for all: " + PASSWORD + ")");
  console.log("  archivist     — archivist role (review queue, dispute, rollback, trust)");
  console.log("  chronicler    — trusted contributor (auto-publishes accounts)");
  console.log("  ashen_scribe  — trusted contributor");
  console.log("  newcomer      — untrusted contributor (submissions go to review)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
