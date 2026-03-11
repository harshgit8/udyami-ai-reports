import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Sheet tab names → document type mapping
const SHEET_TABS: Record<string, { type: string; mapRow: (headers: string[], values: string[]) => Record<string, unknown> }> = {
  "Orders - QuotationResult": {
    type: "quotation",
    mapRow: (h, v) => {
      const r = zip(h, v);
      return {
        external_id: r["Quote ID"] || null,
        customer: r["Customer"] || null,
        status: null,
        total: num(r["Grand Total (₹)"]),
        data: r,
      };
    },
  },
  "Orders - InvoiceResult": {
    type: "invoice",
    mapRow: (h, v) => {
      const r = zip(h, v);
      return {
        external_id: r["Invoice Number"] || null,
        customer: r["Customer Name"] || null,
        status: null,
        total: num(r["Grand Total (₹)"]),
        data: r,
      };
    },
  },
  "Orders - QualityResult": {
    type: "quality",
    mapRow: (h, v) => {
      const r = zip(h, v);
      return {
        external_id: r["Inspection ID"] || r["Batch ID"] || null,
        customer: null,
        status: r["Decision"] || null,
        total: null,
        data: r,
      };
    },
  },
  "Orders - ProductionResult": {
    type: "production",
    mapRow: (h, v) => {
      const r = zip(h, v);
      return {
        external_id: r["Order ID"] || null,
        customer: null,
        status: r["Decision"] || null,
        total: null,
        data: r,
      };
    },
  },
  "Orders - RnDResult": {
    type: "rnd",
    mapRow: (h, v) => {
      const r = zip(h, v);
      return {
        external_id: r["Formulation ID"] || r["Request ID"] || null,
        customer: null,
        status: r["Recommendation"] || null,
        total: num(r["Cost (₹/kg)"]),
        data: r,
      };
    },
  },
};

function zip(headers: string[], values: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
  return obj;
}

function num(val: string | undefined): number | null {
  if (!val) return null;
  const n = Number(val.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

async function generateJWT(sa: any): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: sa.client_email, scope: "https://www.googleapis.com/auth/spreadsheets.readonly", aud: sa.token_uri, iat: now, exp: now + 3600 };
  const enc = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const input = `${enc(JSON.stringify(header))}.${enc(JSON.stringify(payload))}`;
  const pem = sa.private_key.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\n/g, "");
  const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pem), c => c.charCodeAt(0)), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input));
  return `${input}.${btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY")!;
    const saKey = JSON.parse(Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY") || "{}");
    const sheetId = Deno.env.get("GOOGLE_SHEET_ID");

    if (!saKey.private_key || !sheetId) {
      return new Response(JSON.stringify({ error: "Google Sheets not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jwt = await generateJWT(saKey);
    const tokenResp = await fetch(saKey.token_uri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    const { access_token } = await tokenResp.json();
    if (!access_token) throw new Error("Failed to get Google access token");

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const results: Record<string, number> = {};

    for (const [tabName, config] of Object.entries(SHEET_TABS)) {
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tabName)}`;
        const resp = await fetch(url, { headers: { Authorization: `Bearer ${access_token}` } });
        if (!resp.ok) { results[tabName] = -1; continue; }
        
        const data = await resp.json();
        const rows: string[][] = data.values || [];
        if (rows.length < 2) { results[tabName] = 0; continue; }

        const headers = rows[0];
        const docs = rows.slice(1).map(v => {
          const mapped = config.mapRow(headers, v);
          return { type: config.type, ...mapped };
        });

        // Upsert: delete existing of this type, then insert fresh
        await supabase.from("documents").delete().eq("type", config.type);
        
        // Insert in batches of 100
        for (let i = 0; i < docs.length; i += 100) {
          const batch = docs.slice(i, i + 100);
          await supabase.from("documents").insert(batch);
        }

        results[tabName] = docs.length;
      } catch (e) {
        console.error(`Error syncing ${tabName}:`, e);
        results[tabName] = -1;
      }
    }

    return new Response(JSON.stringify({ success: true, synced: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
