import "server-only";

import { createClient } from "@supabase/supabase-js";

// Cliente con SERVICE ROLE: solo para uso en servidor (webhooks y confirmación de pagos).
// NUNCA se expone al navegador. Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
