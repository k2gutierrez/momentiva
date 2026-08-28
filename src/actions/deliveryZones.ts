"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createDeliveryZone(formData: FormData) {
  const supabase = await createClient();

  try {
    const zipCode = formData.get("zipCode") as string;
    const municipality = formData.get("municipality") as string;
    const zoneName = formData.get("zoneName") as string;
    const price = parseFloat(formData.get("price") as string);

    if (!zipCode || zipCode.length !== 5) {
      throw new Error("Ingresa un código postal válido de 5 dígitos");
    }

    const { error } = await supabase.from("delivery_zones").insert({
      zip_code: zipCode,
      municipality,
      zone_name: zoneName,
      price,
      is_active: true,
    });

    if (error) {
      if (error.code === "23505") throw new Error("Este código postal ya está registrado");
      throw new Error(error.message);
    }

    revalidatePath("/admin/delivery-zones");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleDeliveryZoneStatus(id: string, currentStatus: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("delivery_zones")
    .update({ is_active: !currentStatus })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/delivery-zones");
  return { success: true };
}

export async function deleteDeliveryZone(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("delivery_zones").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/delivery-zones");
  return { success: true };
}

export async function bulkUpsertDeliveryZones(zones: any[]) {
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
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}