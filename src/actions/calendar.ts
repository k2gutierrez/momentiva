"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function blockDate(formData: FormData) {
  const supabase = await createClient();

  try {
    const blockedDate = formData.get("blockedDate") as string;
    const reason = formData.get("reason") as string;

    if (!blockedDate) throw new Error("Selecciona una fecha válida");

    const { error } = await supabase.from("blocked_dates").insert({
      blocked_date: blockedDate,
      reason,
    });

    if (error) {
      if (error.code === "23505") throw new Error("Esta fecha ya se encuentra bloqueada");
      throw new Error(error.message);
    }

    revalidatePath("/admin/calendar");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function unblockDate(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("blocked_dates").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/calendar");
  return { success: true };
}