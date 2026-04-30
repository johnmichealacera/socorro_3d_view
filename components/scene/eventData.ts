// Pure data module — no THREE dependency. Safe to import in React components.

export type EventCategory = "fiesta" | "civic" | "religious" | "cultural";

export interface SocorroEvent {
  id:         string;
  title:      string;
  subtitle:   string;
  month:      number;   // 1–12
  day:        number;   // 1–31
  locationId: string;   // matches LocationData.id
  category:   EventCategory;
  color:      string;
}

export const ANNUAL_EVENTS: SocorroEvent[] = [
  {
    id: "st-joseph-fiesta",
    title: "Kapistahan ni San Jose",
    subtitle: "Town Fiesta — Patron Saint's Day",
    month: 3, day: 19,
    locationId: "church",
    category: "fiesta",
    color: "#F97316",
  },
  {
    id: "holy-week",
    title: "Semana Santa",
    subtitle: "Holy Week Procession & Visita Iglesia",
    month: 4, day: 14,
    locationId: "church",
    category: "religious",
    color: "#8B5CF6",
  },
  {
    id: "labor-day",
    title: "Araw ng Paggawa",
    subtitle: "Labor Day Plaza Rally",
    month: 5, day: 1,
    locationId: "plaza",
    category: "civic",
    color: "#10B981",
  },
  {
    id: "flores-de-mayo",
    title: "Flores de Mayo",
    subtitle: "Santacruzan Procession — End of Month",
    month: 5, day: 31,
    locationId: "church",
    category: "religious",
    color: "#EC4899",
  },
  {
    id: "independence-day",
    title: "Araw ng Kalayaan",
    subtitle: "Independence Day Flag Ceremony",
    month: 6, day: 12,
    locationId: "plaza",
    category: "civic",
    color: "#3B82F6",
  },
  {
    id: "buwan-ng-wika",
    title: "Buwan ng Wika",
    subtitle: "Filipino Language Month Culmination",
    month: 8, day: 25,
    locationId: "elementary-school",
    category: "cultural",
    color: "#F59E0B",
  },
  {
    id: "undas",
    title: "Undas",
    subtitle: "All Saints' & All Souls' Day",
    month: 11, day: 1,
    locationId: "church",
    category: "religious",
    color: "#9CA3AF",
  },
  {
    id: "simbang-gabi",
    title: "Simbang Gabi",
    subtitle: "Nine-Day Dawn Mass Season Begins",
    month: 12, day: 16,
    locationId: "church",
    category: "religious",
    color: "#EF4444",
  },
  {
    id: "christmas",
    title: "Pasko — Midnight Mass",
    subtitle: "Christmas Eve Mass & Celebration",
    month: 12, day: 24,
    locationId: "church",
    category: "religious",
    color: "#22C55E",
  },
];

// Days until the next annual occurrence of the event from right now.
// Returns 0 for today, negative values are impossible (always returns the next future date).
export function daysUntil(ev: SocorroEvent): number {
  const now      = new Date();
  const thisYear = new Date(now.getFullYear(), ev.month - 1, ev.day);
  const diffMs   = thisYear.getTime() - now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(diffMs / 86400000);
  if (diffDays >= 0) return diffDays;
  // Event has passed this year — return days until next year's occurrence
  const nextYear = new Date(now.getFullYear() + 1, ev.month - 1, ev.day);
  return Math.ceil((nextYear.getTime() - Date.now()) / 86400000);
}

export function eventMonthDay(ev: SocorroEvent): string {
  return new Date(2000, ev.month - 1, ev.day).toLocaleDateString("en-PH", {
    month: "short", day: "numeric",
  });
}

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  fiesta:    "#F97316",
  civic:     "#38bdf8",
  religious: "#8B5CF6",
  cultural:  "#F59E0B",
};

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  fiesta:    "Town Fiesta",
  civic:     "Civic",
  religious: "Religious",
  cultural:  "Cultural",
};
