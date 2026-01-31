import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type DocumentType = "quotation" | "invoice" | "quality" | "production" | "rnd";

function isDocumentType(value: unknown): value is DocumentType {
  return (
    value === "quotation" ||
    value === "invoice" ||
    value === "quality" ||
    value === "production" ||
    value === "rnd"
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Server configuration missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    const document = body?.document as
      | {
          type?: unknown;
          external_id?: unknown;
          customer?: unknown;
          status?: unknown;
          total?: unknown;
          data?: unknown;
          markdown?: unknown;
        }
      | undefined;

    if (!document || !isDocumentType(document.type)) {
      return new Response(JSON.stringify({ error: "Invalid document payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const external_id = typeof document.external_id === "string" ? document.external_id : null;
    const customer = typeof document.customer === "string" ? document.customer : null;
    const status = typeof document.status === "string" ? document.status : null;
    const markdown = typeof document.markdown === "string" ? document.markdown : null;
    const total =
      typeof document.total === "number"
        ? document.total
        : typeof document.total === "string" && document.total.trim() !== ""
          ? Number(document.total)
          : null;

    const data = document.data && typeof document.data === "object" ? document.data : {};

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: inserted, error } = await supabase
      .from("documents")
      .insert({
        type: document.type,
        external_id,
        customer,
        status,
        total: Number.isFinite(total as number) ? (total as number) : null,
        data,
        markdown,
      })
      .select("id,type,external_id,customer,status,total,data,markdown,created_at")
      .single();

    if (error) {
      console.error("save-document insert error:", error);
      return new Response(JSON.stringify({ error: "Failed to save document" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("audit_logs").insert({
      action: "create",
      entity: "documents",
      entity_id: inserted.id,
      payload: { type: inserted.type, external_id: inserted.external_id, customer: inserted.customer },
    });

    return new Response(JSON.stringify({ document: inserted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("save-document error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
