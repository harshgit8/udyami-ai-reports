import { supabase } from "@/integrations/supabase/client";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type OrchestratorKind = "quotation" | "invoice" | "production" | "quality" | "rnd";

type GroundingResult = {
  references: string[];
  summary: string;
  records: Record<string, unknown>[];
};

function normalize(value: unknown) {
  return String(value ?? "").toLowerCase();
}

function recordMatchesQuery(record: Record<string, unknown>, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return Object.values(record).some((value) => normalize(value).includes(q));
}

function keywordMatches(record: Record<string, unknown>, query: string) {
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
  if (!terms.length) return false;
  return terms.some((term) => Object.values(record).some((value) => normalize(value).includes(term)));
}

function chooseRecords(records: Record<string, unknown>[], query: string, limit = 4) {
  const exact = records.filter((record) => recordMatchesQuery(record, query));
  if (exact.length > 0) return exact.slice(0, limit);

  const fuzzy = records.filter((record) => keywordMatches(record, query));
  if (fuzzy.length > 0) return fuzzy.slice(0, limit);

  return records.slice(0, limit);
}

function formatRecord(label: string, record: Record<string, unknown>) {
  return `### ${label}\n${Object.entries(record)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n")}`;
}

export async function fetchGrounding(kind: OrchestratorKind, query: string): Promise<GroundingResult> {
  switch (kind) {
    case "quotation": {
      const [requestsRes, resultsRes] = await Promise.all([
        db.from("quotation").select("quote_request_id, customer, product_type, application, quantity, material_formulation, material_cost_kg, weight_per_unit_kg, production_rate, setup_time_hours, machine, compliance, quality_level, risk_level, priority, ul94_rating").order("created_at", { ascending: false }).limit(50),
        db.from("quotationresult").select("quote_id, request_id, customer, product, quantity, unit_price, grand_total, profit_margin, lead_time_days, payment_terms, valid_until").order("created_at", { ascending: false }).limit(50),
      ]);

      const requests = chooseRecords((requestsRes.data ?? []) as Record<string, unknown>[], query);
      const results = chooseRecords((resultsRes.data ?? []) as Record<string, unknown>[], query);
      return {
        references: [
          ...requests.map((r) => String(r.quote_request_id ?? r.customer ?? "quotation-request")),
          ...results.map((r) => String(r.quote_id ?? r.request_id ?? "quotation-result")),
        ],
        summary: [
          ...requests.map((r, index) => formatRecord(`Quotation Request ${index + 1}`, r)),
          ...results.map((r, index) => formatRecord(`Quotation Result ${index + 1}`, r)),
        ].join("\n\n"),
        records: [...requests, ...results],
      };
    }
    case "invoice": {
      const [inputsRes, resultsRes] = await Promise.all([
        db.from("invoice").select("invoice_request_id, order_id, quote_id, customer_name, customer_gstin, product_description, product_type, quantity_ordered, quantity_delivered, subtotal, additional_charges, discount, advance_paid, payment_terms, quality_decision, batch_id, inspection_id, po_number").order("created_at", { ascending: false }).limit(50),
        db.from("invoiceresult").select("invoice_number, request_id, order_id, customer_name, product, quantity, subtotal, total_tax, grand_total, balance_due, payment_terms, tax_type, invoice_date, due_date").order("created_at", { ascending: false }).limit(50),
      ]);

      const inputs = chooseRecords((inputsRes.data ?? []) as Record<string, unknown>[], query);
      const results = chooseRecords((resultsRes.data ?? []) as Record<string, unknown>[], query);
      return {
        references: [
          ...inputs.map((r) => String(r.order_id ?? r.invoice_request_id ?? "invoice-input")),
          ...results.map((r) => String(r.invoice_number ?? r.order_id ?? "invoice-result")),
        ],
        summary: [
          ...inputs.map((r, index) => formatRecord(`Invoice Source ${index + 1}`, r)),
          ...results.map((r, index) => formatRecord(`Invoice Result ${index + 1}`, r)),
        ].join("\n\n"),
        records: [...inputs, ...results],
      };
    }
    case "production": {
      const [ordersRes, scheduleRes] = await Promise.all([
        db.from("production").select("order_id, customer, product_type, quantity, priority, due_date, notes").order("created_at", { ascending: false }).limit(50),
        db.from("productionresult").select("order_id, machine, decision, risk_score, start_time, end_time, reason").order("created_at", { ascending: false }).limit(50),
      ]);

      const orders = chooseRecords((ordersRes.data ?? []) as Record<string, unknown>[], query);
      const schedules = chooseRecords((scheduleRes.data ?? []) as Record<string, unknown>[], query);
      return {
        references: [
          ...orders.map((r) => String(r.order_id ?? "production-order")),
          ...schedules.map((r) => String(r.order_id ?? "production-result")),
        ],
        summary: [
          ...orders.map((r, index) => formatRecord(`Production Order ${index + 1}`, r)),
          ...schedules.map((r, index) => formatRecord(`Production Result ${index + 1}`, r)),
        ].join("\n\n"),
        records: [...orders, ...schedules],
      };
    }
    case "quality": {
      const [inputsRes, resultsRes] = await Promise.all([
        db.from("quality").select("batch_id, product_type, quantity, inspection_standard, visual_inspection, measurements, defects_found, special_requirements").order("created_at", { ascending: false }).limit(50),
        db.from("qualityresult").select("inspection_id, batch_id, product_type, quantity, total_defects, defect_rate, critical, major, minor, decision, severity_level, risk_level, recommendation, confidence").order("created_at", { ascending: false }).limit(50),
      ]);

      const inputs = chooseRecords((inputsRes.data ?? []) as Record<string, unknown>[], query);
      const results = chooseRecords((resultsRes.data ?? []) as Record<string, unknown>[], query);
      return {
        references: [
          ...inputs.map((r) => String(r.batch_id ?? "quality-input")),
          ...results.map((r) => String(r.inspection_id ?? r.batch_id ?? "quality-result")),
        ],
        summary: [
          ...inputs.map((r, index) => formatRecord(`Quality Input ${index + 1}`, r)),
          ...results.map((r, index) => formatRecord(`Quality Result ${index + 1}`, r)),
        ].join("\n\n"),
        records: [...inputs, ...results],
      };
    }
    case "rnd": {
      const [requestsRes, resultsRes] = await Promise.all([
        db.from("rnd").select("request_id, application, standards, cost_target_kg, tensile_min_mpa, chemical_resistance, constraints, special_notes").order("created_at", { ascending: false }).limit(50),
        db.from("rndresult").select("formulation_id, request_id, base_polymer, key_additives, cost_kg, tensile_mpa, ul94_rating, loi, rohs, reach, recommendation, ai_confidence").order("created_at", { ascending: false }).limit(50),
      ]);

      const requests = chooseRecords((requestsRes.data ?? []) as Record<string, unknown>[], query);
      const results = chooseRecords((resultsRes.data ?? []) as Record<string, unknown>[], query);
      return {
        references: [
          ...requests.map((r) => String(r.request_id ?? "rnd-request")),
          ...results.map((r) => String(r.formulation_id ?? r.request_id ?? "rnd-result")),
        ],
        summary: [
          ...requests.map((r, index) => formatRecord(`R&D Request ${index + 1}`, r)),
          ...results.map((r, index) => formatRecord(`R&D Result ${index + 1}`, r)),
        ].join("\n\n"),
        records: [...requests, ...results],
      };
    }
  }
}

export async function runGroundedAi(params: {
  orchestrator: string;
  userQuery: string;
  instructions: string;
  grounding: GroundingResult;
  upstreamOutput?: string;
}) {
  const { orchestrator, userQuery, instructions, grounding, upstreamOutput } = params;

  const prompt = [
    `Orchestrator: ${orchestrator}`,
    `User query: ${userQuery}`,
    `Instructions: ${instructions}`,
    grounding.references.length ? `Reference IDs: ${grounding.references.join(", ")}` : "Reference IDs: none available",
    "Grounded project data:",
    grounding.summary || "No matching records found in the database.",
    upstreamOutput ? `Upstream agent output:\n${upstreamOutput}` : "",
    "Requirements:",
    "- Answer in English only.",
    "- Use only the grounded data above; if data is missing, say so clearly.",
    "- Formulate the result to best match the user query.",
    "- Include a Sources / Reference IDs section at the end.",
  ].filter(Boolean).join("\n\n");

  const response = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `Request failed with ${response.status}` }));
    throw new Error(error.error || `Request failed with ${response.status}`);
  }

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";
  let done = false;

  while (!done) {
    const { done: streamDone, value } = await reader.read();
    if (streamDone) break;
    buffer += decoder.decode(value, { stream: true });

    let index = -1;
    while ((index = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;

      const json = line.slice(6).trim();
      if (json === "[DONE]") {
        done = true;
        break;
      }

      try {
        const parsed = JSON.parse(json);
        const chunk = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (chunk) output += chunk;
      } catch {
        buffer = `${line}\n${buffer}`;
        break;
      }
    }
  }

  return output.trim();
}
