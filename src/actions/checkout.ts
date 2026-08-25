"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function processCheckoutOrder(orderData: {
  deliveryZipCode: string;
  deliveryAddress: any;
  deliveryDate: string;
  couponCode?: string;
  discountAmount: number;
  deliveryFee: number;
  subtotal: number;
  totalAmount: number;
  totalCost: number;
  cartItems: any[];
}) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Insert order record
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id || null,
        status: "placed",
        total_amount: orderData.totalAmount,
        total_cost: orderData.totalCost,
        delivery_fee: orderData.deliveryFee,
        delivery_date: orderData.deliveryDate,
        payment_method: "stripe", // Default gateway placeholder
        payment_status: "paid",
        delivery_address: {
          ...orderData.deliveryAddress,
          zip_code: orderData.deliveryZipCode,
        },
        coupon_code: orderData.couponCode || null,
        discount_amount: orderData.discountAmount,
        is_offline_sale: false,
      })
      .select()
      .single();

    if (orderError) throw new Error(orderError.message);

    // 2. Insert order items
    const itemsToInsert = orderData.cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      selected_options: item.selectedOptions || {},
      custom_cup_image_url: item.customCupImage || null,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) throw new Error(itemsError.message);

    // 3. Send Pushover Notification to Owners
    const pushoverUserKey = process.env.PUSHOVER_USER_KEY;
    const pushoverAppToken = process.env.PUSHOVER_APP_TOKEN;

    if (pushoverUserKey && pushoverAppToken) {
      try {
        await fetch("https://api.pushover.net/1/messages.json", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: pushoverAppToken,
            user: pushoverUserKey,
            title: "🎉 ¡Nuevo Pedido en Momentiva!",
            message: `Cliente: ${orderData.deliveryAddress.fullName}\nTotal: $${orderData.totalAmount.toFixed(2)} MXN\nEntrega: ${orderData.deliveryDate}\nC.P.: ${orderData.deliveryZipCode}`,
          }),
        });
      } catch (pErr) {
        console.error("Error sending Pushover notification:", pErr);
      }
    }

    revalidatePath("/admin/orders");
    return { success: true, orderId: order.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Action to validate dynamic coupon code
export async function validateCoupon(code: string, subtotal: number) {
  const supabase = await createClient();

  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .single();

  if (error || !coupon) {
    return { valid: false, error: "Código de cupón inválido o expirado" };
  }

  if (coupon.min_spend && subtotal < coupon.min_spend) {
    return { valid: false, error: `Se requiere una compra mínima de $${coupon.min_spend.toFixed(2)}` };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, error: "Este cupón ha expirado" };
  }

  let discount = 0;
  if (coupon.discount_type === "percentage") {
    discount = (subtotal * coupon.discount_value) / 100;
  } else {
    discount = coupon.discount_value;
  }

  return { valid: true, discount: Math.min(discount, subtotal), code: coupon.code };
}