// Central simulated-time state.
// All PHT-reading scene modules import from here so one slider controls everything.

let _simHours: number | null = null;

export function setSimulatedHour(h: number | null): void {
  _simHours = h === null ? null : h % 24;
}

export function isSimulating(): boolean {
  return _simHours !== null;
}

// PHT as fraction of day: 0 = midnight, 0.25 = 6 AM, 0.5 = noon, 1 = midnight.
export function getPHTPhase(): number {
  if (_simHours !== null) return _simHours / 24;
  const now = new Date();
  const sec = (now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds() + 8 * 3600) % 86400;
  return sec / 86400;
}

// PHT as decimal hours: 6.5 = 6:30 AM, 22.25 = 10:15 PM.
export function getPHTHoursDecimal(): number {
  if (_simHours !== null) return _simHours;
  const now = new Date();
  return ((now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds() + 8 * 3600) % 86400) / 3600;
}

// Integer hour 0-23.
export function getPHTHour(): number {
  return Math.floor(getPHTHoursDecimal());
}

// Full PHT data needed by NPC scheduler.
export function getPHTData(): { hour: number; minute: number; dow: number } {
  const h      = getPHTHoursDecimal();
  const hour   = Math.floor(h);
  const minute = Math.floor((h - hour) * 60);
  // Keep real day-of-week even during simulation (affects church Sunday schedule).
  const now  = new Date();
  const phtD = new Date(now.getTime() + 8 * 3600 * 1000);
  return { hour, minute, dow: phtD.getUTCDay() };
}
