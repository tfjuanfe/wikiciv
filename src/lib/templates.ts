import type { EntryType } from "./types";

export const ENTRY_TYPES: EntryType[] = [
  "civilization",
  "character",
  "war",
  "place",
  "artifact",
];

export interface InfoboxField {
  key: string;
  label: string;
  placeholder?: string;
}

// Structured infobox fields per entry type. Filling these should feel easier
// than facing a blank page.
export const INFOBOX_FIELDS: Record<EntryType, InfoboxField[]> = {
  civilization: [
    { key: "founded", label: "Founded", placeholder: "e.g. Season 3, Day 12" },
    { key: "leader", label: "Leader", placeholder: "e.g. King Aldric" },
    { key: "allies", label: "Allies", placeholder: "comma-separated" },
    { key: "rivals", label: "Rivals", placeholder: "comma-separated" },
    { key: "fate", label: "Fate", placeholder: "e.g. Collapsed after the Ashen War" },
  ],
  character: [
    { key: "role", label: "Role", placeholder: "e.g. General, Merchant, Spy" },
    { key: "affiliation", label: "Affiliation", placeholder: "faction or nation" },
    { key: "status", label: "Status", placeholder: "alive / fallen" },
    { key: "notableDeeds", label: "Notable deeds", placeholder: "short summary" },
  ],
  war: [
    { key: "belligerents", label: "Belligerents", placeholder: "Side A vs. Side B" },
    { key: "outcome", label: "Outcome", placeholder: "e.g. Decisive victory for ..." },
    { key: "duration", label: "Duration", placeholder: "e.g. Day 40 – Day 58" },
  ],
  place: [
    { key: "location", label: "Location / coords", placeholder: "e.g. X: 1200, Z: -340" },
    { key: "builders", label: "Builders", placeholder: "who built it" },
    { key: "description", label: "Description", placeholder: "one line" },
  ],
  artifact: [
    { key: "owner", label: "Owner", placeholder: "current or last holder" },
    { key: "origin", label: "Origin", placeholder: "how it came to be" },
    { key: "significance", label: "Significance", placeholder: "why it matters" },
  ],
};

export const TYPE_LABELS: Record<EntryType, string> = {
  civilization: "Civilization",
  character: "Character",
  war: "War",
  place: "Place",
  artifact: "Artifact",
};

// Simple voxel/blocky emoji icons per type — light Minecraft flavor.
export const TYPE_ICONS: Record<EntryType, string> = {
  civilization: "🏰",
  character: "🧍",
  war: "⚔️",
  place: "🗺️",
  artifact: "💎",
};

export function isEntryType(value: string): value is EntryType {
  return (ENTRY_TYPES as string[]).includes(value);
}
