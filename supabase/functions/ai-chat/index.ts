import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Udyami AI Assistant for a real manufacturing business.

CRITICAL RULES (no exceptions):
- You must ground factual answers ONLY in the provided Supabase database context in this request.
- If the answer is not present in the Supabase context, reply: "I don't have that in the database yet." and ask what table/field to add.
- Do not invent numbers, customers, dates, totals, inventory, or statuses.
- When you reference a document, include its type and external id (if available).

You specialize in:

1. **Quotations**: Creating professional quotations with cost breakdowns (material, production, quality, packaging), profit margins, lead times, and payment terms.

2. **Invoices**: Managing invoices with GST calculations, payment tracking, delivery details, and financial health monitoring.

3. **Quality Inspection**: Analyzing quality reports including defect rates, severity levels, compliance standards (IS standards), and corrective actions.

4. **Production Scheduling**: Production order management, machine scheduling, risk assessment, and delay analysis.

5. **R&D Formulations**: Flame retardant formulations, compliance (RoHS, REACH), material properties, and production readiness.

When users ask for requirements or documents:
- Provide highly structured, professional responses suitable for PDF conversion
- Include all relevant fields, calculations, and tables where appropriate
- Format data in a clear, document-like structure with distinct sections
- Use industry-standard terminology and professional tone

Always be helpful, precise, and provide actionable insights. Format responses with clear sections, bold headers, and well-organized lists or tables using markdown. If requested to generate a document (like a quote or report), ensure the response is detailed enough to serve as a standalone document.`;

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
  const patterns = [
    /\bQT_[A-Z0-9_]+\b/g,
    /\bINV-[A-Z0-9-]+\b/g,
    /\bQC_[A-Z0-9_]+\b/g,
    /\bORD-[0-9]+\b/g,
    /\bFORM_[A-Z0-9_]+\b/g,
  ];
  for (const re of patterns) {
    const matches = text.match(re) || [];
    for (const m of matches) ids.add(m);
  }
  return Array.from(ids);
}

async function fetchSupabaseContext(userText: string) {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return { ok: false, summary: "Supabase service role not configured.", docs: [] as DocRow[] };
  }

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
      const { data, error } = await supabase
        .from("documents")
        .select("id,type,external_id,customer,status,total,data,created_at")
        .in("external_id", ids)
        .order("created_at", { ascending: false })
        .limit(25);
      if (!error && data) docs.push(...(data as DocRow[]));
    }

    if (docs.length === 0 && wantedTypes.length > 0) {
      const { data, error } = await supabase
        .from("documents")
        .select("id,type,external_id,customer,status,total,data,created_at")
        .in("type", wantedTypes)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!error && data) docs.push(...(data as DocRow[]));
    }

    if (docs.length === 0) {
      const { data, error } = await supabase
        .from("documents")
        .select("id,type,external_id,customer,status,total,data,created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (!error && data) docs.push(...(data as DocRow[]));
    }

    const byType: Record<string, number> = {};
    for (const d of docs) byType[d.type] = (byType[d.type] ?? 0) + 1;

    return {
      ok: true,
      summary: `Retrieved ${docs.length} rows. byType=${compactJson(byType, 400)}`,
      docs,
    };
  } catch (e) {
    console.error("Supabase context error:", e);
    return { ok: false, summary: "Supabase query failed.", docs: [] as DocRow[] };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, contextData } = await req.json();
    const AI_API_KEY = Deno.env.get("LOVABLE_API_KEY") || Deno.env.get("AI_API_KEY");
    
    if (!AI_API_KEY) {
      throw new Error("AI configuration is missing. Please check your environment variables.");
    }

    const lastUser = Array.isArray(messages)
      ? [...messages].reverse().find((m) => m?.role === "user" && typeof m?.content === "string")?.content ?? ""
      : "";

    const db = await fetchSupabaseContext(lastUser);

    let contextMessage = `\n\nSupabase Database Context (${db.ok ? "OK" : "NOT_AVAILABLE"}):
${db.summary}

Rows (sanitized, recent, limited):
${compactJson(
  db.docs.map((d) => ({
    type: d.type,
    external_id: d.external_id,
    customer: d.customer,
    status: d.status,
    total: d.total,
    created_at: d.created_at,
    data: d.data,
  })),
  12000,
)}`;

    if (contextData) {
      contextMessage += `\n\nClient Context (counts only):
- Quotations: ${contextData.quotationsCount || 0}
- Invoices: ${contextData.invoicesCount || 0}
- Quality: ${contextData.qualityCount || 0}
- Production: ${contextData.productionCount || 0}
- R&D: ${contextData.rndCount || 0}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextMessage },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
