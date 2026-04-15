import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export async function logAudit(action: string, entity?: string, entityId?: string, payload?: Json) {
  try {
    await supabase.from("audit_logs").insert([{
      action,
      entity: entity ?? null,
      entity_id: entityId ?? null,
      payload: payload ?? {},
    }]);
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}
