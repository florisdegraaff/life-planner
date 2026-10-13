// How a bank description is matched to a source: case and extra whitespace don't matter.
// Must stay in sync with the backfill in drizzle/0006_smart_demogoblin.sql.
export function sourceKey(description: string) {
  return description.trim().toLowerCase().replace(/\s+/g, " ");
}
