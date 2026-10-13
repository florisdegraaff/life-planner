// Parser for ING's "Download transactions" CSV export (English, comma-separated).

import { createHash } from "node:crypto";

export const ING_CSV_HEADER = [
  "Date",
  "Name / Description",
  "Account",
  "Counterparty",
  "Code",
  "Debit/credit",
  "Amount (EUR)",
  "Transaction type",
  "Notifications",
];

export type ParsedTransaction = {
  date: string;
  description: string;
  type: "expense" | "income";
  amount: string;
  account: string | null;
  counterparty: string | null;
  code: string | null;
  paymentMethod: string | null;
  notes: string | null;
  importHash: string;
};

export type ParseResult = { ok: true; rows: ParsedTransaction[] } | { ok: false; error: string };

// Splits CSV text into rows of fields, handling quoted fields with commas, "" escapes and newlines.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  // Drop blank lines.
  return rows.filter((r) => r.some((f) => f.trim()));
}

export function parseIngCsv(text: string): ParseResult {
  const [header, ...lines] = parseCsv(text.replace(/^﻿/, ""));

  if (!header || header.length !== ING_CSV_HEADER.length || header.some((h, i) => h.trim() !== ING_CSV_HEADER[i])) {
    return { ok: false, error: "This doesn't look like an ING export. The columns don't match the expected template." };
  }

  const rows: ParsedTransaction[] = [];
  for (const [index, fields] of lines.entries()) {
    const line = index + 2;
    if (fields.length !== ING_CSV_HEADER.length) {
      return { ok: false, error: `Row ${line} has ${fields.length} columns instead of ${ING_CSV_HEADER.length}.` };
    }

    const [rawDate, description, account, counterparty, code, debitCredit, rawAmount, paymentMethod, notes] = fields.map(
      (f) => f.trim(),
    );

    const date = /^(\d{4})(\d{2})(\d{2})$/.exec(rawDate);
    if (!date) return { ok: false, error: `Row ${line} has an invalid date: "${rawDate}".` };

    if (debitCredit !== "Debit" && debitCredit !== "Credit") {
      return { ok: false, error: `Row ${line} should be "Debit" or "Credit", not "${debitCredit}".` };
    }

    // ING writes amounts like "1234,56"; strip any thousands dots just in case.
    const amount = rawAmount.replace(/\./g, "").replace(",", ".");
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
      return { ok: false, error: `Row ${line} has an invalid amount: "${rawAmount}".` };
    }

    rows.push({
      date: `${date[1]}-${date[2]}-${date[3]}`,
      description,
      type: debitCredit === "Debit" ? "expense" : "income",
      amount,
      account: account || null,
      counterparty: counterparty || null,
      code: code || null,
      paymentMethod: paymentMethod || null,
      notes: notes || null,
      importHash: createHash("sha256").update(JSON.stringify(fields)).digest("hex"),
    });
  }

  return { ok: true, rows };
}
