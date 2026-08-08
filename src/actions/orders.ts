"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Update order status: placed -> work_in_progress -> finish -> delivered
export async function updateOrderStatus(orderId: string, status: 'placed' | 'work_in_progress' | 'finish' | 'delivered') {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/orders");
  return { success: true };
}

// Register an offline/external sale to form part of the database and margin tracking[cite: 1]
export async function createOfflineSale(formData: FormData) {
  const supabase = await createClient();

  try {
    const customerName = formData.get("customerName") as string;
    const totalAmount = parseFloat(formData.get("totalAmount") as string);
    const totalCost = parseFloat(formData.get("totalCost") as string);
    const deliveryDate = formData.get("deliveryDate") as string;
    const notes = formData.get("notes") as string;

    const { error } = await supabase.from("orders").insert({
      is_offline_sale: true,
      status: 'delivered', // Offline sales are logged as completed
      total_amount: totalAmount,
      total_cost: totalCost,
      delivery_fee: 0,
      delivery_date: deliveryDate,
      payment_method: 'offline',
      payment_status: 'paid',
      delivery_address: { customer_name: customerName, notes: notes || "Venta externa registrada manualmente" }
    });

    if (error) throw new Error(error.message);

    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}