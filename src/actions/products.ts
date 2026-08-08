"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  const supabase = await createClient();

  try {
    // 1. Extract data from FormData
    const name = formData.get("name") as string;
    const categoryId = formData.get("categoryId") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const rawCost = parseFloat(formData.get("rawCost") as string); // For margin tracking[cite: 1]
    const isStockItem = formData.get("isStockItem") === "true";
    const stockQuantity = parseInt(formData.get("stockQuantity") as string) || 0;
    const anticipationDays = parseInt(formData.get("anticipationDays") as string) || 0;
    const isCustomCup = formData.get("isCustomCup") === "true";
    const customOptions = JSON.parse(formData.get("customOptions") as string || "[]"); // Dynamic JSON options[cite: 1]
    
    const imageFile = formData.get("image") as File;
    let imageUrl = "";

    // 2. Upload Image to Supabase Storage (if provided)
    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile);

      if (uploadError) throw new Error(`Error uploading image: ${uploadError.message}`);

      // Get the public URL to save in the database
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
        
      imageUrl = publicUrlData.publicUrl;
    }

    // 3. Insert Product into Database
    // Generate a simple URL-friendly slug based on the name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    const { error: insertError } = await supabase.from("products").insert({
      name,
      slug,
      category_id: categoryId || null,
      description,
      price,
      raw_cost: rawCost,
      is_in_stock_item: isStockItem,
      stock_quantity: stockQuantity,
      anticipation_days: anticipationDays,
      is_custom_cup: isCustomCup,
      custom_options: customOptions,
      images: imageUrl ? [imageUrl] : [],
    });

    if (insertError) throw new Error(`Error saving product: ${insertError.message}`);

    // 4. Refresh the products page cache so the new item appears instantly
    revalidatePath("/admin/products");
    
    return { success: true };
    
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleProductStatus(id: string, currentStatus: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({ is_active: !currentStatus })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/"); // Refresh the public catalog too
  return { success: true };
}