"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Liga a la cuenta los pedidos que se hicieron como invitada.
 *
 * Qué problema resuelve: alguien compra sin cuenta (pagando con tarjeta desde
 * Mercado Pago), después crea su cuenta, entra a "Mi cuenta"... y no aparece su
 * pedido. Ahora, al iniciar sesión, se buscan los pedidos sin dueño cuyo correo de
 * contacto coincide con el de la cuenta y se le asignan.
 *
 * Devuelve cuántos pedidos se ligaron (para poder avisarle a la clienta).
 */
export async function vincularMisPedidos() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) return { ok: false, vinculados: 0 };

    const admin = createAdminClient();
    if (!admin) return { ok: false, vinculados: 0 };

    const correo = user.email.toLowerCase();

    // Solo se miran pedidos SIN dueño (los de invitada). El correo de contacto se
    // guarda dentro de delivery_address desde el checkout.
    const { data, error } = await admin
      .from("orders")
      .select("id, delivery_address")
      .is("client_id", null)
      .limit(300);

    if (error) return { ok: false, vinculados: 0 };

    const mios = (data || []).filter((o) => {
      const direccion = o.delivery_address as Record<string, unknown> | null;
      const guardado = direccion?.["correoContacto"];
      return typeof guardado === "string" && guardado.toLowerCase() === correo;
    });

    if (mios.length === 0) return { ok: true, vinculados: 0 };

    const { error: errorUpdate } = await admin
      .from("orders")
      .update({ client_id: user.id })
      .in(
        "id",
        mios.map((o) => o.id)
      );

    if (errorUpdate) return { ok: false, vinculados: 0 };

    revalidatePath("/mi-cuenta");
    return { ok: true, vinculados: mios.length };
  } catch {
    return { ok: false, vinculados: 0 };
  }
}
