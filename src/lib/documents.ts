import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

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

// Cast supabase to any to query tables not yet in the generated schema types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export async function fetchDocuments(limit = 1000): Promise<DocumentRow[]> {
  const out: DocumentRow[] = [];

  // Fetch from all 5 result tables in parallel
  const [quotRes, invRes, qualRes, prodRes, rndRes] = await Promise.all([
    db.from("quotationresult").select("*").order("created_at", { ascending: false }).limit(limit),
    db.from("invoiceresult").select("*").order("created_at", { ascending: false }).limit(limit),
    db.from("qualityresult").select("*").order("created_at", { ascending: false }).limit(limit),
    db.from("productionresult").select("*").order("created_at", { ascending: false }).limit(limit),
    db.from("rndresult").select("*").order("created_at", { ascending: false }).limit(limit),
  ]);

  // Map quotationresult
  if (quotRes.data) {
    for (const r of quotRes.data) {
      out.push({
        id: String(r.id),
        type: "quotation",
        external_id: r.quote_id ?? null,
        customer: r.customer ?? null,
        status: null,
        total: r.grand_total ?? null,
        data: {
          quoteId: r.quote_id,
          requestId: r.request_id,
          customer: r.customer,
          product: r.product,
          quantity: r.quantity,
          unitPrice: r.unit_price,
          materialCost: r.material_cost,
          productionCost: r.production_cost,
          qualityCost: r.quality_cost,
          riskPremium: r.risk_premium,
          subtotal: r.subtotal,
          profitMargin: r.profit_margin,
          profitAmount: r.profit_amount,
          totalBeforeTax: r.total_before_tax,
          gst: r.gst,
          grandTotal: r.grand_total,
          leadTime: r.lead_time_days,
          paymentTerms: r.payment_terms,
          validUntil: r.valid_until,
        } as unknown as Json,
        created_at: r.created_at ?? undefined,
      });
    }
  }

  // Map invoiceresult
  if (invRes.data) {
    for (const r of invRes.data) {
      out.push({
        id: String(r.id),
        type: "invoice",
        external_id: r.invoice_number ?? null,
        customer: r.customer_name ?? null,
        status: null,
        total: r.grand_total ?? null,
        data: {
          invoiceNumber: r.invoice_number,
          invoiceDate: r.invoice_date,
          dueDate: r.due_date,
          customer: r.customer_name,
          customerGstin: r.customer_gstin,
          orderId: r.order_id,
          poNumber: r.po_number,
          requestId: r.request_id,
          product: r.product,
          quantity: r.quantity,
          subtotal: r.subtotal,
          taxableAmount: r.taxable_amount,
          taxType: r.tax_type,
          cgst: r.cgst,
          sgst: r.sgst,
          igst: r.igst,
          totalTax: r.total_tax,
          grandTotal: r.grand_total,
          adjustments: r.adjustments,
          advancePaid: r.advance_paid,
          balanceDue: r.balance_due,
          paymentTerms: r.payment_terms,
          deliveryDate: r.delivery_date,
          deliveryChallan: r.delivery_challan,
        } as unknown as Json,
        created_at: r.created_at ?? undefined,
      });
    }
  }

  // Map qualityresult
  if (qualRes.data) {
    for (const r of qualRes.data) {
      out.push({
        id: String(r.id),
        type: "quality",
        external_id: r.inspection_id ?? null,
        customer: null,
        status: r.decision ?? null,
        total: null,
        data: {
          inspectionId: r.inspection_id,
          batchId: r.batch_id,
          productType: r.product_type,
          quantity: r.quantity,
          totalDefects: r.total_defects,
          critical: r.critical,
          major: r.major,
          minor: r.minor,
          defectRate: r.defect_rate,
          confidence: r.confidence,
          decision: r.decision,
          recommendation: r.recommendation,
          riskLevel: r.risk_level,
          severityLevel: r.severity_level,
        } as unknown as Json,
        created_at: r.created_at ?? undefined,
      });
    }
  }

  // Map productionresult
  if (prodRes.data) {
    for (const r of prodRes.data) {
      out.push({
        id: String(r.id),
        type: "production",
        external_id: r.order_id ?? null,
        customer: null,
        status: r.decision ?? null,
        total: null,
        data: {
          orderId: r.order_id,
          decision: r.decision,
          riskScore: r.risk_score,
          reason: r.reason,
          machine: r.machine,
          startTime: r.start_time,
          endTime: r.end_time,
        } as unknown as Json,
        created_at: r.created_at ?? undefined,
      });
    }
  }

  // Map rndresult
  if (rndRes.data) {
    for (const r of rndRes.data) {
      out.push({
        id: String(r.id),
        type: "rnd",
        external_id: r.formulation_id ?? null,
        customer: null,
        status: r.recommendation ?? null,
        total: r.cost_kg ?? null,
        data: {
          formulationId: r.formulation_id,
          requestId: r.request_id,
          application: r.base_polymer,
          basePolymer: r.base_polymer,
          keyAdditives: r.key_additives,
          totalCost: r.cost_kg,
          costTarget: r.cost_kg,
          ul94Rating: r.ul94_rating,
          tensileMpa: r.tensile_mpa,
          loi: r.loi,
          rohs: r.rohs,
          reach: r.reach,
          recommendation: r.recommendation,
          productionReadiness: r.recommendation,
          aiConfidence: r.ai_confidence,
        } as unknown as Json,
        created_at: r.created_at ?? undefined,
      });
    }
  }

  return out;
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

function match1(content: string, re: RegExp): string | null {
  const m = content.match(re);
  return m?.[1]?.trim() ? m[1].trim() : null;
}

function pickInt(raw: string | undefined | null): number | null {
  const n = pickNumber(raw);
  if (n === null) return null;
  return Math.trunc(n);
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
    const grandTotal =
      pickNumber(match1(content, /-\s*\*\*GRAND TOTAL:\*\*\s*₹?\s*([0-9][0-9,]*\.?[0-9]*)/i) ?? undefined) ??
      pickNumber(match1(content, /\*\*Total Quoted Value:\*\*\s*₹?\s*([0-9][0-9,]*\.?[0-9]*)/i) ?? undefined);
    const winProbability = match1(content, /-\s*\*\*Win Probability:\*\*\s*(HIGH|MEDIUM|LOW)\b/i);

    if (!quoteId || !customer || grandTotal === null) return null;
    return {
      type: "quotation",
      external_id: quoteId,
      customer,
      status: winProbability ?? null,
      total: grandTotal,
      markdown,
      data: {
        quoteId,
        date,
        validUntil,
        customer,
        requestId,
        product,
        quantity: quantity ?? 0,
        unitPrice: unitPrice ?? 0,
        leadTime: leadTime ?? null,
        grandTotal,
        winProbability: winProbability?.toUpperCase() ?? null,
      },
    };
  }

  if (isInvoice) {
    const invoiceNumber =
      match1(content, /\*\*Invoice Number:\*\*\s*([^\n]+)/i) ??
      match1(content, /\*\*Invoice No:\*\*\s*([^\n]+)/i);
    const invoiceDate = match1(content, /\*\*Invoice Date:\*\*\s*([^\n]+)/i);
    const dueDate = match1(content, /\*\*Due Date:\*\*\s*([^\n]+)/i);
    const customer = match1(content, /\*\*Customer Details\*\*[\s\S]*?\*\*([^\n]+)\*\*/i);
    const grandTotal = pickNumber(match1(content, /-\s*\*\*GRAND TOTAL:\*\*\s*₹?\s*([0-9][0-9,]*\.?[0-9]*)/i) ?? undefined);
    const balanceDue = pickNumber(match1(content, /-\s*\*\*BALANCE DUE:\*\*\s*₹?\s*([0-9][0-9,]*\.?[0-9]*)/i) ?? undefined);
    const paymentRisk = match1(content, /-\s*\*\*Payment Risk:\*\*\s*(LOW|MEDIUM|HIGH)\b/i);

    if (!invoiceNumber || !customer || grandTotal === null) return null;
    return {
      type: "invoice",
      external_id: invoiceNumber,
      customer,
      status: paymentRisk ?? null,
      total: grandTotal,
      markdown,
      data: {
        invoiceNumber,
        invoiceDate,
        dueDate,
        customer,
        grandTotal,
        balanceDue: balanceDue ?? grandTotal,
        paymentRisk: paymentRisk?.toUpperCase() ?? null,
      },
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
      type: "quality",
      external_id: inspectionId,
      customer: null,
      status: decision ?? null,
      total: null,
      markdown,
      data: { inspectionId, batchId, timestamp, productType, quantity: quantity ?? 0, defectRate: defectRate ?? 0, severityLevel, decision },
    };
  }

  if (isProduction) {
    const orderId =
      match1(content, /###\s+(?:✅|⚠️|❌)?\s*Order\s+([A-Z0-9\-_/]+)/i) ??
      match1(content, /-\s*\*\*Order ID:\*\*\s*([^\n]+)/i);
    const decision = match1(content, /-\s*\*\*Decision:\*\*\s*(PROCEED|DELAY|REJECT)\b/i);
    const riskScore = pickInt(match1(content, /-\s*\*\*Risk Score:\*\*\s*([0-9]+)/i) ?? undefined);
    const reason = match1(content, /-\s*\*\*Reason:\*\*\s*([^\n]+)/i);
    const machine = match1(content, /-\s*\*\*Machine:\*\*\s*([^\n]+)/i);
    const startTime = match1(content, /-\s*\*\*Start Time:\*\*\s*([^\n]+)/i);
    const endTime = match1(content, /-\s*\*\*End Time:\*\*\s*([^\n]+)/i);

    if (!orderId || !decision) return null;
    return {
      type: "production",
      external_id: orderId,
      customer: null,
      status: decision,
      total: null,
      markdown,
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
      type: "rnd",
      external_id: formulationId,
      customer: null,
      status: productionReadiness ?? null,
      total: totalCost ?? null,
      markdown,
      data: { formulationId, generated, application, standards, costTarget, totalCost, ul94Rating, productionReadiness, recommendation: finalRecommendation },
    };
  }

  return null;
}