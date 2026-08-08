"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCoupon(formData: FormData) {
  const supabase = await createClient();

  try {
    const code = (formData.get("code") as string).toUpperCase().trim();
    const discountType = formData.get("discountType") as 'percentage' | 'fixed';
    const discountValue = parseFloat(formData.get("discountValue") as string);
    const minSpend = parseFloat(formData.get("minSpend") as string) || 0;
    const maxUses = parseInt(formData.get("maxUses") as string) || null;
    const expiresAt = formData.get("expiresAt") as string || null;

    if (!code) throw new Error("El código de cupón es obligatorio.");

    const { error } = await supabase.from("coupons").insert({
      code,
      discount_type: discountType,
      discount_value: discountValue,
      min_spend: minSpend,
      max_uses: maxUses,
      expires_at: expiresAt,
      is_active: true,
    });

    if (error) {
      if (error.code === "23505") throw new Error("Este código de cupón ya existe.");
      throw new Error(error.message);
    }

    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleCouponStatus(id: string, currentStatus: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("coupons")
    .update({ is_active: !currentStatus })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function deleteCoupon(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("coupons").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/coupons");
  return { success: true };
}