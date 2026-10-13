// A calendar month as used by the Finance page's `?month=YYYY-MM` search param.

export type Month = { year: number; month: number };

const TIME_ZONE = "Europe/Amsterdam";

// Today's month in the user's time zone, so the default doesn't flip early on the 1st.
export function currentMonth(): Month {
  const [year, month] = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit" })
    .format(new Date())
    .split("-")
    .map(Number);
  return { year, month };
}

// Reads a `YYYY-MM` param, falling back to the current month when it's missing or invalid.
export function parseMonth(param: string | string[] | undefined): Month {
  const match = typeof param === "string" ? /^(\d{4})-(\d{2})$/.exec(param) : null;
  const month = match ? Number(match[2]) : 0;
  return match && month >= 1 && month <= 12 ? { year: Number(match[1]), month } : currentMonth();
}

export function addMonths({ year, month }: Month, n: number): Month {
  const index = year * 12 + (month - 1) + n;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function monthParam({ year, month }: Month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function monthLabel({ year, month }: Month) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    Date.UTC(year, month - 1, 1),
  );
}

export function monthShortLabel({ year, month }: Month) {
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(Date.UTC(year, month - 1, 1));
}

// First day of the month and of the next one, as `YYYY-MM-DD` strings for a half-open date range.
export function monthRange(m: Month) {
  return { start: `${monthParam(m)}-01`, end: `${monthParam(addMonths(m, 1))}-01` };
}
