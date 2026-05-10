// Tiny CSV parser/encoder for product imports. Handles quoted fields with commas
// and escaped double quotes. No external deps.

export type CsvRow = Record<string, string>;

export type ParseResult = {
  headers: string[];
  rows: CsvRow[];
  errors: { row: number; message: string }[];
};

export const PRODUCT_CSV_TEMPLATE = `url,label,sku,category,notes
https://www.amazon.in/example/dp/B0XXXXXXX,Cotton crew tee – navy,SKU-001,t-shirts,
https://www.myntra.com/example,Linen shirt – white,SKU-002,shirts,best-seller
`;

export function parseCsv(text: string): ParseResult {
  const out: ParseResult = { headers: [], rows: [], errors: [] };
  const cleaned = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  if (!cleaned.trim()) return out;

  const lines = splitLines(cleaned);
  if (!lines.length) return out;

  out.headers = parseLine(lines[0]).map((h) => h.trim().toLowerCase());
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;
    const cells = parseLine(raw);
    if (cells.length !== out.headers.length) {
      out.errors.push({
        row: i + 1,
        message: `expected ${out.headers.length} columns, got ${cells.length}`,
      });
      continue;
    }
    const row: CsvRow = {};
    out.headers.forEach((h, idx) => {
      row[h] = (cells[idx] || "").trim();
    });
    out.rows.push(row);
  }
  return out;
}

// Splits on raw newlines outside quoted strings.
function splitLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      current += c;
      continue;
    }
    if (c === "\n" && !inQuotes) {
      lines.push(current);
      current = "";
      continue;
    }
    current += c;
  }
  if (current.length) lines.push(current);
  return lines;
}

function parseLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        cells.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
  }
  cells.push(cur);
  return cells;
}
