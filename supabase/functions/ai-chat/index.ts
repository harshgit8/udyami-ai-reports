import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Guardrail: Input Validation ──
interface GuardrailResult { valid: boolean; reason?: string }

function validateInput(text: string): GuardrailResult {
  const lower = text.toLowerCase();

  // Price / amount guardrails
  const priceMatch = text.match(/(?:₹|rs\.?|inr)\s*([0-9]+(?:\.[0-9]+)?)/gi);
  if (priceMatch) {
    for (const m of priceMatch) {
      const val = Number(m.replace(/[^\d.]/g, ""));
      if (val < 1) return { valid: false, reason: "Invalid input: Price value below ₹1 is not feasible. Please enter a realistic amount." };
      if (val > 100_000_000_000) return { valid: false, reason: "Invalid input: Price value exceeds ₹100 billion which is not feasible. Please enter a realistic amount." };
    }
  }

  // Quantity guardrails
  const qtyMatch = text.match(/(\d+)\s*(?:units?|pcs|pieces?|qty|quantity)/gi);
  if (qtyMatch) {
    for (const m of qtyMatch) {
      const val = Number(m.replace(/[^\d]/g, ""));
      if (val <= 0) return { valid: false, reason: "Invalid input: Quantity must be greater than zero." };
      if (val > 10_000_000) return { valid: false, reason: "Invalid input: Quantity exceeds 10 million units which is not feasible for a single order." };
    }
  }

  // Negative margin
  if (/margin.*-\d/i.test(text) || /negative\s*margin/i.test(text)) {
    return { valid: false, reason: "Invalid input: Negative profit margins are not permitted. Please specify a realistic margin (typically 10-50%)." };
  }

  // Impossible timelines
  const leadMatch = text.match(/(\d+)\s*(?:minute|second|hour)s?\s*(?:lead|delivery|timeline)/i);
  if (leadMatch) {
    return { valid: false, reason: "Invalid input: Lead times must be specified in days. Sub-day timelines are not feasible for manufacturing." };
  }

  // Zero-cost requests
  if (/free\s*(?:quotation|invoice|order)/i.test(text) || /cost.*₹?\s*0\b/i.test(text)) {
    return { valid: false, reason: "Invalid input: Zero-cost orders are not supported. Please provide realistic pricing." };
  }

  return { valid: true };
}

// ── Guardrail: Output Sanity Check ──
function validateOutput(output: string, dbContext: DocRow[]): GuardrailResult {
  // Check for hallucinated document IDs
  const quotedIds = output.match(/\b(QT_\w+|INV-[\w-]+|QC_\w+|ORD-\d+|FORM_\w+)\b/g) || [];
  const dbIds = new Set(dbContext.map(d => d.external_id).filter(Boolean));

  // Only flag if the AI references specific existing-format IDs that don't exist (not newly generated ones)
  const suspiciousIds = quotedIds.filter(id => {
    // If it looks like a reference to existing data but doesn't match
    if (dbIds.size > 0 && !dbIds.has(id)) {
      // Check if context has any IDs of the same prefix
      const prefix = id.split("_")[0] || id.split("-")[0];
      const hasPrefix = [...dbIds].some(did => did?.startsWith(prefix));
      return hasPrefix; // Only suspicious if we have data of that type
    }
    return false;
  });

  // Don't block generation of new documents, only flag references to non-existent ones
  if (suspiciousIds.length > 3) {
    return { valid: false, reason: "This output references multiple document IDs that could not be verified against existing records. Please revise your input." };
  }

  return { valid: true };
}

const SYSTEM_PROMPT = `You are Udyami AI Assistant for a real manufacturing business.

CRITICAL RULES (no exceptions):
- You must ground factual answers ONLY in the provided database context in this request.
- If the answer is not present in the context, reply: "I don't have that in the database yet." and ask what data to add.
- Do not invent numbers, customers, dates, totals, inventory, or statuses.
- When you reference a document, include its type and external id (if available).
- NEVER fabricate or approximate data. If no matching records exist, say: "No matching records found."
- When generating new documents (quotations, invoices), base pricing and terms on existing data patterns only.
- If a user requests something with unrealistic parameters, explain why it's not feasible.

You specialize in:
1. **Quotations**: Creating professional quotations with cost breakdowns, profit margins, lead times, and payment terms.
2. **Invoices**: Managing invoices with GST calculations, payment tracking, delivery details.
3. **Quality Inspection**: Analyzing quality reports including defect rates, severity levels, compliance standards.
4. **Production Scheduling**: Production order management, machine scheduling, risk assessment.
5. **R&D Formulations**: Flame retardant formulations, compliance (RoHS, REACH), material properties.

When users ask for documents:
- Provide structured, professional responses suitable for PDF conversion
- Include all relevant fields, calculations, and tables
- Use industry-standard terminology and professional tone
- Base all values on existing database records

Always format responses with clear sections, bold headers, and well-organized tables using markdown.`;

type DocRow = {
  id: string;
  type: string;
  external_id: string | null;
  customer: string | null;
  status: string | null;
  total: number | null;
  data: unknown;
  created_at: string;
};

function compactJson(value: unknown, maxLen: number): string {
  const str = JSON.stringify(value);
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

function extractIds(text: string): string[] {
  const ids = new Set<string>();
  for (const re of [/\bQT_[A-Z0-9_]+\b/g, /\bINV-[A-Z0-9-]+\b/g, /\bQC_[A-Z0-9_]+\b/g, /\bORD-[0-9]+\b/g, /\bFORM_[A-Z0-9_]+\b/g]) {
    for (const m of text.match(re) || []) ids.add(m);
  }
  return Array.from(ids);
}

async function fetchSupabaseContext(userText: string) {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return { ok: false, summary: "DB not configured.", docs: [] as DocRow[] };

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const ids = extractIds(userText);
  const keywords = userText.toLowerCase();
  const wantedTypes: string[] = [];
  if (keywords.includes("quotation") || keywords.includes("quote")) wantedTypes.push("quotation");
  if (keywords.includes("invoice")) wantedTypes.push("invoice");
  if (keywords.includes("quality") || keywords.includes("inspection")) wantedTypes.push("quality");
  if (keywords.includes("production") || keywords.includes("schedule") || keywords.includes("machine")) wantedTypes.push("production");
  if (keywords.includes("r&d") || keywords.includes("rnd") || keywords.includes("formulation")) wantedTypes.push("rnd");

  const docs: DocRow[] = [];
  try {
    if (ids.length > 0) {
      const { data } = await supabase.from("documents").select("id,type,external_id,customer,status,total,data,created_at").in("external_id", ids).order("created_at", { ascending: false }).limit(25);
      if (data) docs.push(...(data as DocRow[]));
    }
    if (docs.length === 0 && wantedTypes.length > 0) {
      const { data } = await supabase.from("documents").select("id,type,external_id,customer,status,total,data,created_at").in("type", wantedTypes).order("created_at", { ascending: false }).limit(30);
      if (data) docs.push(...(data as DocRow[]));
    }
    if (docs.length === 0) {
      const { data } = await supabase.from("documents").select("id,type,external_id,customer,status,total,data,created_at").order("created_at", { ascending: false }).limit(30);
      if (data) docs.push(...(data as DocRow[]));
    }
    const byType: Record<string, number> = {};
    for (const d of docs) byType[d.type] = (byType[d.type] ?? 0) + 1;
    return { ok: true, summary: `Retrieved ${docs.length} rows. byType=${compactJson(byType, 400)}`, docs };
  } catch (e) {
    console.error("DB context error:", e);
    return { ok: false, summary: "DB query failed.", docs: [] as DocRow[] };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, contextData } = await req.json();
    const AI_API_KEY = Deno.env.get("LOVABLE_API_KEY") || Deno.env.get("AI_API_KEY");
    if (!AI_API_KEY) throw new Error("AI configuration is missing.");

    const lastUser = Array.isArray(messages)
      ? [...messages].reverse().find((m) => m?.role === "user" && typeof m?.content === "string")?.content ?? ""
      : "";

    // ── Input Guardrail ──
    const inputCheck = validateInput(lastUser);
    if (!inputCheck.valid) {
      const blockedResponse = `data: ${JSON.stringify({ choices: [{ delta: { content: `⚠️ **Guardrail Alert**\n\n${inputCheck.reason}` } }] })}\n\ndata: [DONE]\n\n`;
      return new Response(blockedResponse, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const db = await fetchSupabaseContext(lastUser);

    let contextMessage = `\n\nDatabase Context (${db.ok ? "OK" : "NOT_AVAILABLE"}):\n${db.summary}\n\nRows:\n${compactJson(
      db.docs.map(d => ({ type: d.type, external_id: d.external_id, customer: d.customer, status: d.status, total: d.total, created_at: d.created_at, data: d.data })),
      12000
    )}`;

    if (contextData) {
      contextMessage += `\n\nCounts: Quotations: ${contextData.quotationsCount || 0}, Invoices: ${contextData.invoicesCount || 0}, Quality: ${contextData.qualityCount || 0}, Production: ${contextData.productionCount || 0}, R&D: ${contextData.rndCount || 0}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${AI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT + contextMessage }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
