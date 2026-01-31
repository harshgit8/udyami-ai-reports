import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Udyami AI Assistant, an expert in industrial manufacturing operations. You specialize in:

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, contextData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from available data
    let contextMessage = "";
    if (contextData) {
      contextMessage = `\n\nCurrent Dashboard Context:
- Quotations: ${contextData.quotationsCount || 0} documents
- Invoices: ${contextData.invoicesCount || 0} documents  
- Quality Reports: ${contextData.qualityCount || 0} reports
- Production Orders: ${contextData.productionCount || 0} orders
- R&D Formulations: ${contextData.rndCount || 0} formulations`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
