import { NextRequest, NextResponse } from "next/server";
import { insertProduct } from "@/lib/db";
import { parseCsv, PRODUCT_CSV_TEMPLATE } from "@/lib/csv";
import { detectPlatform } from "@/lib/platforms";

export const dynamic = "force-dynamic";

export async function GET() {
  return new NextResponse(PRODUCT_CSV_TEMPLATE, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="stockstrike-products-template.csv"',
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const csvText: string | undefined = body?.csv;
  const commit: boolean = Boolean(body?.commit);
  if (!csvText) {
    return NextResponse.json({ error: "csv text required" }, { status: 400 });
  }

  const parsed = parseCsv(csvText);
  if (!parsed.headers.includes("url")) {
    return NextResponse.json(
      {
        error: "csv must include a 'url' column",
        headers: parsed.headers,
      },
      { status: 400 }
    );
  }

  const previews = parsed.rows.map((row, i) => {
    const url = (row.url || "").trim();
    const issues: string[] = [];
    if (!url || !/^https?:\/\//.test(url)) issues.push("invalid url");
    return {
      row: i + 2,
      url,
      label: row.label || row.title || "",
      sku: row.sku || "",
      category: row.category || "",
      notes: row.notes || "",
      platform: url ? detectPlatform(url) : "unknown",
      issues,
    };
  });

  const valid = previews.filter((p) => !p.issues.length);
  const invalid = previews.filter((p) => p.issues.length);

  if (!commit) {
    return NextResponse.json({
      ok: true,
      preview: true,
      total: parsed.rows.length,
      validCount: valid.length,
      invalidCount: invalid.length,
      parseErrors: parsed.errors,
      rows: previews,
    });
  }

  const inserted = [];
  for (const p of valid) {
    const product = await insertProduct({
      url: p.url,
      platform: p.platform,
      title: p.label || null,
      category: p.category || null,
      source: "csv",
    });
    inserted.push(product);
  }

  return NextResponse.json({
    ok: true,
    preview: false,
    insertedCount: inserted.length,
    skippedCount: invalid.length,
    parseErrors: parsed.errors,
    products: inserted,
  });
}
