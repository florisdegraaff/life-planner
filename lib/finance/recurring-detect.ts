// Pure logic for spotting recurring payments in a source's transactions. No database access,
// so it can be tested in isolation; lib/finance/recurring.ts applies it to the stored data.

export type Interval = "weekly" | "monthly" | "quarterly" | "yearly";

export type DetectTx = { id: string; date: string; amount: number };

export type Detected = {
  interval: Interval;
  ids: string[];
  amount: number;
  lastDate: string;
  dayOfMonth: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const INTERVAL_DAYS: Record<Interval, number> = { weekly: 7, monthly: 30.4, quarterly: 91, yearly: 365 };

export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);
}

/** Whether an amount is close enough to the expected one to be the same payment (allows price changes). */
export function amountMatches(expected: number, amount: number) {
  return Math.abs(amount - expected) <= Math.max(1, expected * 0.25);
}

/** Still active if the last payment is no more than 1.5 intervals ago. */
export function isActive(interval: Interval, lastDate: string, today: string) {
  return daysBetween(lastDate, today) <= INTERVAL_DAYS[interval] * 1.5;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Typical day of the month, latest amount and last date of a schedule's payments. */
export function summarise(interval: Interval, txs: DetectTx[]) {
  const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1];
  return {
    amount: last.amount,
    lastDate: last.date,
    dayOfMonth: interval === "weekly" ? null : median(sorted.map((t) => Number(t.date.slice(8, 10)))),
  };
}

/**
 * Whether a new payment belongs to an existing schedule: within 10% of its current amount, and
 * the first payment in its period, unless it's an exact repeat of a fixed amount (a failed
 * collection and its retry). `inPeriod` is how many payments the schedule already has in the
 * new payment's period (see periodIndex).
 */
export function joinsSchedule(expected: number, amount: number, inPeriod: number) {
  if (Math.abs(amount - expected) > Math.max(0.5, expected * 0.1)) return false;
  if (inPeriod === 0) return true;
  return inPeriod === 1 && Math.abs(amount - expected) <= expected * 0.01;
}

// The index of the period (week, month, quarter or year) a date falls in, counted from a fixed
// point so consecutive periods differ by 1.
export function periodIndex(interval: Interval, date: string) {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7)) - 1;
  if (interval === "weekly") return Math.floor(Date.parse(`${date}T00:00:00Z`) / (7 * DAY_MS));
  if (interval === "monthly") return year * 12 + month;
  if (interval === "quarterly") return year * 4 + Math.floor(month / 3);
  return year;
}

// Whether a group of similar-amount payments recurs on this interval. Bank collection days drift,
// so this looks at which periods have a payment rather than at exact gaps: enough periods covered,
// few periods skipped, and not many more payments than periods. A fixed price may come twice in a
// period (a failed collection and its retry); varying amounts must stay within 10% and come about
// once per period, so regular-but-random spending (rides, web shops) doesn't qualify.
function fits(interval: Interval, group: DetectTx[], identical: boolean) {
  const periods = new Set(group.map((t) => periodIndex(interval, t.date)));
  const indices = [...periods].sort((a, b) => a - b);
  const span = indices[indices.length - 1] - indices[0] + 1;
  const covered = periods.size;

  const minPeriods = {
    // Weekly is only trusted for fixed amounts, so groceries don't count.
    weekly: identical ? 4 : Infinity,
    // Two identical payments a month apart is how a new subscription starts; varying amounts
    // (like a monthly visit to the same café) need more evidence.
    monthly: identical ? 2 : 4,
    quarterly: 3,
    yearly: identical ? 2 : 3,
  }[interval];

  const amounts = group.map((t) => t.amount);
  const steady = identical || Math.max(...amounts) <= Math.min(...amounts) * 1.1;
  const perPeriod = group.length / covered;

  return steady && covered >= minPeriods && covered / span >= 0.7 && perPeriod <= (identical ? 2 : 1.25);
}

/**
 * Finds recurring payments among one source's transactions of one type. Transactions are grouped
 * by similar amount first, so a source with several schedules (e.g. two allowances from the tax
 * office) yields several results.
 */
export function detectRecurring(txs: DetectTx[]): Detected[] {
  const byAmount = [...txs].sort((a, b) => a.amount - b.amount);
  const groups: DetectTx[][] = [];
  for (const tx of byAmount) {
    const group = groups[groups.length - 1];
    if (group && amountMatches(group[0].amount, tx.amount)) group.push(tx);
    else groups.push([tx]);
  }

  const results: Detected[] = [];
  for (const group of groups) {
    // If the whole group doesn't fit, retry with its core: the payments within 10% of the median
    // amount. That way a one-off outlier (holiday pay next to a salary) stays one-off instead of
    // disqualifying the schedule.
    const middle = median(group.map((t) => t.amount));
    const core = group.filter((t) => Math.abs(t.amount - middle) <= middle * 0.1);
    const found = detectGroup(group) ?? (core.length < group.length ? detectGroup(core) : null);
    if (found) results.push(found);
  }
  return results;
}

function detectGroup(group: DetectTx[]): Detected | null {
  if (group.length < 2) return null;
  // Within 1%: a fixed price, as opposed to a bill that varies.
  const identical = group.every((t) => Math.abs(t.amount - group[0].amount) <= group[0].amount * 0.01);
  const interval = (["monthly", "weekly", "quarterly", "yearly"] as const).find((i) => fits(i, group, identical));
  if (!interval) return null;

  const sorted = [...group].sort((a, b) => a.date.localeCompare(b.date));
  return { interval, ids: sorted.map((t) => t.id), ...summarise(interval, sorted) };
}
