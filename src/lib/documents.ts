import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { loadFromCsvFallback } from "./csvFallback";

export type DocumentType = "quotation" | "invoice" | "quality" | "production" | "rnd";

export type DocumentRow = {
  id: string;
  type: DocumentType;
  external_id: string | null;
  customer: string | null;
  status: string | null;
  total: number | null;
  data: Json;
  markdown?: string | null;
  created_at?: string;
  updated_at?: string | null;
};

export type SaveDocumentInput = {
  type: DocumentType;
  external_id?: string | null;
  customer?: string | null;
  status?: string | null;
  total?: number | null;
  data?: Json;
  markdown?: string | null;
};

export async function fetchDocuments(limit = 10000): Promise<DocumentRow[]> {
  try {
    const [qRes, iRes, qcRes, pRes, rRes] = await Promise.all([
      supabase.from("quotationresult").select("*").limit(limit),
      supabase.from("invoiceresult").select("*").limit(limit),
      supabase.from("qualityresult").select("*").limit(limit),
      supabase.from("productionresult").select("*").limit(limit),
      supabase.from("rndresult").select("*").limit(limit),
    ]);

    const docs: DocumentRow[] = [];

    if (qRes.data) {
      for (const r of qRes.data) {
        docs.push({
          id: String(r.id || crypto.randomUUID()),
          type: "quotation",
          external_id: r.quote_id || null,
          customer: r.customer || null,
          status: null,
          total: Number(r.grand_total) || null,
          data: r as Json,
          created_at: r.created_at,
        });
      }
    }

    if (iRes.data) {
      for (const r of iRes.data) {
        docs.push({
          id: String(r.id || crypto.randomUUID()),
          type: "invoice",
          external_id: r.invoice_number || null,
          customer: r.customer_name || null,
          status: null,
          total: Number(r.grand_total) || null,
          data: r as Json,
          created_at: r.created_at,
        });
      }
    }

    if (qcRes.data) {
      for (const r of qcRes.data) {
        docs.push({
          id: String(r.id || crypto.randomUUID()),
          type: "quality",
          external_id: r.inspection_id || r.batch_id || null,
          customer: null,
          status: r.decision || null,
          total: null,
          data: r as Json,
          created_at: r.created_at,
        });
      }
    }

    if (pRes.data) {
      for (const r of pRes.data) {
        docs.push({
          id: String(r.id || crypto.randomUUID()),
          type: "production",
          external_id: r.order_id || null,
          customer: null,
          status: r.decision || null,
          total: null,
          data: r as Json,
          created_at: r.created_at,
        });
      }
    }

    if (rRes.data) {
      for (const r of rRes.data) {
        docs.push({
          id: String(r.id || crypto.randomUUID()),
          type: "rnd",
          external_id: r.formulation_id || r.request_id || null,
          customer: null,
          status: r.recommendation || null,
          total: Number(r.cost_kg) || null,
          data: r as Json,
          created_at: r.created_at,
        });
      }
    }

    // Attempt to load unified documents just in case there are manual user saves from chat
    try {
      const { data: unified } = await supabase
        .from("documents")
        .select("id,type,external_id,customer,status,total,data,markdown,created_at,updated_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (unified) {
        for (const doc of unified) {
          // Add manually saved documents that don't have numerical IDs (meaning they aren't synced from the specific tables)
          if (doc.id.includes('-')) {
             docs.push(doc as unknown as DocumentRow);
          }
        }
      }
    } catch { /* ignore */ }

    docs.sort((a, b) => {
      const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tB - tA;
    });

    if (docs.length > 0) return docs.slice(0, limit);
  } catch { /* fall through */ }

  // CSV fallback
  return loadFromCsvFallback(limit);
}

export async function syncFromGoogleSheets(): Promise<{ success: boolean; synced?: Record<string, number>; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("sync-sheets");
    if (error) throw error;
    return data as { success: boolean; synced: Record<string, number> };
  } catch (e) {
    console.error("Sync error:", e);
    return { success: false, error: e instanceof Error ? e.message : "Sync failed" };
  }
}

export async function saveDocument(document: SaveDocumentInput): Promise<DocumentRow> {
  const { data, error } = await supabase.functions.invoke("save-document", {
    body: { document },
  });
  if (error) throw error;
  return (data as { document: DocumentRow }).document;
}

function pickNumber(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function pickInt(raw: string | undefined | null): number | null {
  const n = pickNumber(raw);
  if (n === null) return null;
  return Math.trunc(n);
}

function match1(content: string, re: RegExp): string | null {
  const m = content.match(re);
  return m?.[1]?.trim() ? m[1].trim() : null;
}

export function tryParseAiDocument(markdown: string): SaveDocumentInput | null {
  const content = markdown.replace(/\r\n/g, "\n");

  const isQuotation = /\bQUOTATION\b/i.test(content) && /\*\*Quote ID:\*\*/i.test(content);
  const isInvoice = /\bINVOICE\b/i.test(content) && /\*\*Invoice (Number|No):\*\*/i.test(content);
  const isQuality = /\bQuality\b/i.test(content) && /\*\*Inspection ID:\*\*/i.test(content);
  const isProduction = /\bProduction\b/i.test(content) && /\bOrder\b/i.test(content) && /\*\*Decision:\*\*/i.test(content);
  const isRnd = /\bR&D\b/i.test(content) && /\*\*Formulation ID:\*\*/i.test(content);

  if (isQuotation) {
    const quoteId = match1(content, /\*\*Quote ID:\*\*\s*([^\n]+)/i);
    const date = match1(content, /\*\*Date:\*\*\s*([^\n]+)/i);
    const validUntil = match1(content, /\*\*Valid Until:\*\*\s*([^\n]+)/i);
    const customer = match1(content, /-\s*\*\*Customer:\*\*\s*([^\n]+)/i);
    const requestId = match1(content, /-\s*\*\*Request ID:\*\*\s*([^\n]+)/i);
    const product = match1(content, /-\s*\*\*Product:\*\*\s*([^\n]+)/i);
    const quantity = pickInt(match1(content, /-\s*\*\*Quantity:\*\*\s*([0-9][0-9,]*)/i) ?? undefined);
    const unitPrice = pickNumber(match1(content, /-\s*\*\*Unit Price:\*\*\s*₹?\s*([0-9][0-9,]*\.?[0-9]*)/i) ?? undefined);
    const leadTime = pickInt(match1(content, /-\s*\*\*Lead Time:\*\*\s*([0-9][0-9,]*)/i) ?? undefined);
    const grandTotal = pickNumber(match1(content, /-\s*\*\*GRAND TOTAL:\*\*\s*₹?\s*([0-9][0-9,]*\.?[0-9]*)/i) ?? undefined)
      ?? pickNumber(match1(content, /\*\*Total Quoted Value:\*\*\s*₹?\s*([0-9][0-9,]*\.?[0-9]*)/i) ?? undefined);
    const winProbability = match1(content, /-\s*\*\*Win Probability:\*\*\s*(HIGH|MEDIUM|LOW)\b/i);

    if (!quoteId || !customer || grandTotal === null) return null;
    return {
      type: "quotation", external_id: quoteId, customer, status: winProbability ?? null, total: grandTotal, markdown,
      data: { quoteId, date, validUntil, customer, requestId, product, quantity: quantity ?? 0, unitPrice: unitPrice ?? 0, leadTime: leadTime ?? null, grandTotal, winProbability: winProbability?.toUpperCase() ?? null },
    };
  }

  if (isInvoice) {
    const invoiceNumber = match1(content, /\*\*Invoice Number:\*\*\s*([^\n]+)/i) ?? match1(content, /\*\*Invoice No:\*\*\s*([^\n]+)/i);
    const invoiceDate = match1(content, /\*\*Invoice Date:\*\*\s*([^\n]+)/i);
    const dueDate = match1(content, /\*\*Due Date:\*\*\s*([^\n]+)/i);
    const customer = match1(content, /\*\*Customer Details\*\*[\s\S]*?\*\*([^\n]+)\*\*/i);
    const grandTotal = pickNumber(match1(content, /-\s*\*\*GRAND TOTAL:\*\*\s*₹?\s*([0-9][0-9,]*\.?[0-9]*)/i) ?? undefined);
    const balanceDue = pickNumber(match1(content, /-\s*\*\*BALANCE DUE:\*\*\s*₹?\s*([0-9][0-9,]*\.?[0-9]*)/i) ?? undefined);
    const paymentRisk = match1(content, /-\s*\*\*Payment Risk:\*\*\s*(LOW|MEDIUM|HIGH)\b/i);

    if (!invoiceNumber || !customer || grandTotal === null) return null;
    return {
      type: "invoice", external_id: invoiceNumber, customer, status: paymentRisk ?? null, total: grandTotal, markdown,
      data: { invoiceNumber, invoiceDate, dueDate, customer, grandTotal, balanceDue: balanceDue ?? grandTotal, paymentRisk: paymentRisk?.toUpperCase() ?? null },
    };
  }

  if (isQuality) {
    const inspectionId = match1(content, /\*\*Inspection ID:\*\*\s*([^\n]+)/i);
    const batchId = match1(content, /\*\*Batch ID:\*\*\s*([^\n]+)/i);
    const timestamp = match1(content, /\*\*Timestamp:\*\*\s*([^\n]+)/i);
    const productType = match1(content, /-\s*\*\*Product Type:\*\*\s*([^\n]+)/i);
    const quantity = pickInt(match1(content, /-\s*\*\*Quantity:\*\*\s*([0-9][0-9,]*)/i) ?? undefined);
    const defectRate = pickNumber(match1(content, /-\s*\*\*Defect Rate:\*\*\s*([0-9][0-9,]*\.?[0-9]*)%/i) ?? undefined);
    const severityLevel = match1(content, /-\s*\*\*Severity Level:\*\*\s*([^\n]+)/i);
    const decision = match1(content, /Final Decision[\s\S]*?\*\*([A-Z_]+)\*\*/i);

    if (!inspectionId || !batchId) return null;
    return {
      type: "quality", external_id: inspectionId, customer: null, status: decision ?? null, total: null, markdown,
      data: { inspectionId, batchId, timestamp, productType, quantity: quantity ?? 0, defectRate: defectRate ?? 0, severityLevel, decision },
    };
  }

  if (isProduction) {
    const orderId = match1(content, /###\s+(?:✅|⚠️|❌)?\s*Order\s+([A-Z0-9\-_/]+)/i) ?? match1(content, /-\s*\*\*Order ID:\*\*\s*([^\n]+)/i);
    const decision = match1(content, /-\s*\*\*Decision:\*\*\s*(PROCEED|DELAY|REJECT)\b/i);
    const riskScore = pickInt(match1(content, /-\s*\*\*Risk Score:\*\*\s*([0-9]+)/i) ?? undefined);
    const reason = match1(content, /-\s*\*\*Reason:\*\*\s*([^\n]+)/i);
    const machine = match1(content, /-\s*\*\*Machine:\*\*\s*([^\n]+)/i);
    const startTime = match1(content, /-\s*\*\*Start Time:\*\*\s*([^\n]+)/i);
    const endTime = match1(content, /-\s*\*\*End Time:\*\*\s*([^\n]+)/i);

    if (!orderId || !decision) return null;
    return {
      type: "production", external_id: orderId, customer: null, status: decision, total: null, markdown,
      data: { orderId, decision: decision.toUpperCase(), riskScore: riskScore ?? 0, reason, machine, startTime, endTime },
    };
  }

  if (isRnd) {
    const formulationId = match1(content, /\*\*Formulation ID:\*\*\s*([^\n]+)/i);
    const generated = match1(content, /\*\*Generated:\*\*\s*([^\n]+)/i);
    const application = match1(content, /-\s*\*\*Application:\*\*\s*([^\n]+)/i);
    const standards = match1(content, /-\s*\*\*Standards:\*\*\s*([^\n]+)/i);
    const costTarget = pickNumber(match1(content, /-\s*\*\*Cost Target:\*\*\s*₹?\s*([0-9][0-9,]*\.?[0-9]*)/i) ?? undefined);
    const totalCost = pickNumber(match1(content, /\*\*Total Cost:\*\*\s*₹?\s*([0-9][0-9,]*\.?[0-9]*)/i) ?? undefined);
    const ul94Rating = match1(content, /-\s*\*\*UL94 Rating:\*\*\s*([^\n]+)/i);
    const productionReadiness = match1(content, /-\s*\*\*Production Readiness:\*\*\s*([A-Z_]+)/i);
    const finalRecommendation = match1(content, /\*\*Final Recommendation\*\*[\s\S]*?\*\*([^\n]+)\*\*/i);

    if (!formulationId || !application) return null;
    return {
      type: "rnd", external_id: formulationId, customer: null, status: productionReadiness ?? null, total: totalCost, markdown,
      data: { formulationId, generated, application, standards, costTarget, totalCost, ul94Rating, productionReadiness, recommendation: finalRecommendation },
    };
  }

  return null;
}
