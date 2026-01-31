import type { DocumentRow, DocumentType } from "./documents";
import type { Json } from "@/integrations/supabase/types";

const base = typeof import.meta.env?.BASE_URL === "string" ? import.meta.env.BASE_URL.replace(/\/$/, "") : "";
function getDatabaseBase(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${base}/database`;
  }
  return `${base}/database`;
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        let cell = "";
        i++;
        while (i < line.length && line[i] !== '"') {
          cell += line[i];
          i++;
        }
        if (line[i] === '"') i++;
        out.push(cell);
        if (line[i] === ",") i++;
        continue;
      }
      let cell = "";
      while (i < line.length && line[i] !== ",") {
        cell += line[i];
        i++;
      }
      out.push(cell.trim());
      if (line[i] === ",") i++;
    }
    return out;
  };

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let r = 1; r < lines.length; r++) {
    const values = parseLine(lines[r]);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    rows.push(row);
  }
  return { headers, rows };
}

function num(val: string | undefined): number | null {
  if (val == null || val === "") return null;
  const n = Number(String(val).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

async function fetchCsv(name: string): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  try {
    const url = `${getDatabaseBase()}/${encodeURIComponent(name)}`;
    const res = await fetch(url);
    if (!res.ok) return { headers: [], rows: [] };
    const text = await res.text();
    return parseCsv(text);
  } catch {
    return { headers: [], rows: [] };
  }
}

function row(
  type: DocumentType,
  id: string,
  external_id: string | null,
  customer: string | null,
  status: string | null,
  total: number | null,
  data: Record<string, unknown>
): DocumentRow {
  return {
    id,
    type,
    external_id,
    customer,
    status,
    total,
    data: data as Json,
  };
}

export async function loadFromCsvFallback(limit = 500): Promise<DocumentRow[]> {
  const out: DocumentRow[] = [];
  try {
  const qRes = await fetchCsv("Orders - QuotationResult.csv");
  for (const r of qRes.rows.slice(0, limit)) {
    const quoteId = r["Quote ID"] ?? "";
    const customer = r["Customer"] ?? "";
    const grandTotal = num(r["Grand Total (₹)"]) ?? num(r["Grand Total"]) ?? null;
    const unitPrice = num(r["Unit Price (₹)"]) ?? num(r["Unit Price"]) ?? grandTotal ?? 0;
    const quantity = num(r["Quantity"]) ?? 0;
    const validUntil = r["Valid Until"] ?? "";
    const product = r["Product"] ?? "";
    out.push(
      row(
        "quotation",
        quoteId || crypto.randomUUID(),
        quoteId || null,
        customer || null,
        null,
        grandTotal,
        { ...r, quoteId, customer, grandTotal, unitPrice, quantity, product, validUntil, leadTime: r["Lead Time (days)"], date: r["Quote ID"]?.slice(0, 10) }
      )
    );
  }

  const invRes = await fetchCsv("Orders - InvoiceResult.csv");
  for (const r of invRes.rows.slice(0, limit)) {
    const invNum = r["Invoice Number"] ?? "";
    const customer = r["Customer Name"] ?? "";
    const grandTotal = num(r["Grand Total (₹)"]) ?? num(r["Grand Total"]) ?? null;
    const balanceDue = num(r["Balance Due (₹)"]) ?? num(r["Balance Due"]) ?? grandTotal ?? 0;
    out.push(
      row(
        "invoice",
        invNum || crypto.randomUUID(),
        invNum || null,
        customer || null,
        null,
        grandTotal,
        { ...r, invoiceNumber: invNum, customer, grandTotal, balanceDue, invoiceDate: r["Invoice Date"], dueDate: r["Due Date"], product: r["Product"] ?? "" }
      )
    );
  }

  const qualRes = await fetchCsv("Orders - QualityResult.csv");
  for (const r of qualRes.rows.slice(0, limit)) {
    const inspectionId = r["Inspection ID"] ?? "";
    const batchId = r["Batch ID"] ?? "";
    const decision = (r["Decision"] ?? null) as string | null;
    const defectRate = num(r["Defect Rate %"]) ?? 0;
    const quantity = num(r["Quantity"]) ?? 0;
    const productType = r["Product Type"] ?? "";
    out.push(
      row(
        "quality",
        inspectionId || batchId || crypto.randomUUID(),
        inspectionId || batchId || null,
        null,
        decision,
        null,
        { ...r, inspectionId, batchId, decision, defectRate, productType, quantity, severityLevel: r["Severity Level"] }
      )
    );
  }

  const prodRes = await fetchCsv("Orders - ProductionResult.csv");
  for (const r of prodRes.rows.slice(0, limit)) {
    const orderId = r["Order ID"] ?? "";
    const decision = r["Decision"] ?? null;
    const riskScore = num(r["Risk Score"]) ?? 0;
    out.push(
      row(
        "production",
        orderId || crypto.randomUUID(),
        orderId || null,
        null,
        decision,
        null,
        { ...r, orderId, decision, riskScore, machine: r["Machine"], startTime: r["Start Time"], endTime: r["End Time"], reason: r["Reason"] }
      )
    );
  }

  const rndRes = await fetchCsv("Orders - RnDResult.csv");
  for (const r of rndRes.rows.slice(0, limit)) {
    const formulationId = r["Formulation ID"] ?? "";
    const requestId = r["Request ID"] ?? "";
    const cost = num(r["Cost (₹/kg)"]) ?? num(r["Cost (â‚¹/kg)"]) ?? null;
    const application = r["Base Polymer"] ?? r["Key Additives"] ?? "";
    out.push(
      row(
        "rnd",
        formulationId || requestId || crypto.randomUUID(),
        formulationId || requestId || null,
        null,
        r["Recommendation"] ?? null,
        cost,
        { ...r, formulationId, requestId, totalCost: cost, costTarget: cost ?? 0, ul94Rating: r["UL94 Rating"], application, productionReadiness: r["Recommendation"], recommendation: r["Recommendation"] }
      )
    );
  }

  return out;
  } catch {
    return [];
  }
}
