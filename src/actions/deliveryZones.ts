"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function createDeliveryZone(formData: FormData) {
  // Autorización en el servidor: el proxy de /admin NO protege las actions
  await requireAdmin();

  const supabase = await createClient();

  try {
    const zipCode = formData.get("zipCode") as string;
    const municipality = formData.get("municipality") as string;
    const price = parseFloat(formData.get("price") as string);

    if (!zipCode || zipCode.length !== 5) {
      throw new Error("Ingresa un código postal válido de 5 dígitos");
    }

    const { error } = await supabase.from("delivery_zones").insert({
      zip_code: zipCode,
      municipality,
      delivery_cost: price,
      is_available: true,
    });

    if (error) {
      if (error.code === "23505") throw new Error("Este código postal ya está registrado");
      throw new Error(error.message);
    }

    revalidatePath("/admin/delivery-zones");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
  }
}

export async function toggleDeliveryZoneStatus(id: string, currentStatus: boolean) {
  // Autorización en el servidor: el proxy de /admin NO protege las actions
  await requireAdmin();

  const supabase = await createClient();

  const { error } = await supabase
    .from("delivery_zones")
    .update({ is_available: !currentStatus })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/delivery-zones");
  return { success: true };
}

export async function deleteDeliveryZone(id: string) {
  // Autorización en el servidor: el proxy de /admin NO protege las actions
  await requireAdmin();

  const supabase = await createClient();

  const { error } = await supabase.from("delivery_zones").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/delivery-zones");
  return { success: true };
}

export interface DeliveryZoneUpsertRow {
  zip_code: string;
  municipality: string;
  delivery_cost: number;
  is_available: boolean;
}

export async function bulkUpsertDeliveryZones(zones: DeliveryZoneUpsertRow[]) {
  // Autorización en el servidor: el proxy de /admin NO protege las actions
  await requireAdmin();

  const supabase = await createClient();

  try {
    // El upsert insertará los registros nuevos. 
    // onConflict: "zip_code" indica que si el CP ya existe, lo va a actualizar.
    const { error } = await supabase
      .from("delivery_zones")
      .upsert(zones, { onConflict: "zip_code" });

    if (error) throw new Error(error.message);

    revalidatePath("/admin/delivery-zones");
    return { success: true, count: zones.length };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
  }
}