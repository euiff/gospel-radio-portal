import { supabase } from "@/integrations/supabase/client";

export async function logAudit(
  action: string,
  entity: string,
  entity_id: string | null,
  meta: Record<string, unknown> = {},
) {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;
    await (supabase as any).from("admin_audit_log").insert({
      user_id: user.id,
      actor_email: user.email ?? null,
      action,
      entity,
      entity_id,
      meta,
    });
  } catch {
    /* audit best-effort */
  }
}