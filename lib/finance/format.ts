const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

// "€ 1.234,56" in the Dutch style used across the Finance page.
export function formatEuro(amount: number) {
  return euro.format(amount);
}

// Parses an amount typed by the user, accepting "1.234,56", "1234,56", "1234.56", "30.000" and a leading "€".
// Returns the amount as a "1234.56" string for a numeric column, or null when it isn't a valid amount.
export function parseAmountInput(input: string) {
  let value = input.replace(/[€\s]/g, "");
  // A comma is the decimal separator; without one, dots in groups of three are thousands separators.
  if (value.includes(",") || /^\d{1,3}(\.\d{3})+$/.test(value)) value = value.replace(/\./g, "").replace(",", ".");
  return /^\d+(\.\d{1,2})?$/.test(value) ? value : null;
}
