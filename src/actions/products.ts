"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  try {
    // 1. MOVIMOS LA CONEXIÓN ADENTRO DEL TRY POR SEGURIDAD
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const categoryId = formData.get("categoryId") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const rawCost = parseFloat(formData.get("rawCost") as string);
    const isStockItem = formData.get("isStockItem") === "true";
    const stockQuantity = parseInt(formData.get("stockQuantity") as string) || 0;
    const anticipationDays = parseInt(formData.get("anticipationDays") as string) || 0;
    const isCustomCup = formData.get("isCustomCup") === "true";
    const customOptions = JSON.parse(formData.get("customOptions") as string || "[]");
    
    const imageFiles = formData
      .getAll("images")
      .filter((f): f is File => f instanceof File && f.size > 0);

    if (imageFiles.length > 8) {
      throw new Error("Máximo 8 imágenes por producto");
    }

    const images: string[] = [];
    for (const imageFile of imageFiles) {
      if (imageFile.size > 5 * 1024 * 1024) {
        throw new Error(`"${imageFile.name}" pesa más de 5MB. Por favor, comprímela.`);
      }
      const fileExt = imageFile.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, imageFile);

      if (uploadError) throw new Error(`Error uploading image: ${uploadError.message}`);

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      images.push(publicUrlData.publicUrl);
    }

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
      images,
    });

    if (insertError) throw new Error(`Error saving product: ${insertError.message}`);

    revalidatePath("/admin/products");
    revalidatePath("/tienda");
    
    return { success: true };
    
  } catch (error: unknown) {
    // AHORA SÍ ATRAPARÁ CUALQUIER FALLA
    console.error("Error real capturado:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido en el servidor" };
  }
}

// NUEVA FUNCIÓN: Actualizar producto existente
export async function updateProduct(id: string, formData: FormData) {
  try {
    // 🛡️ BLINDAJE 1: Conexión dentro de la caja de seguridad (try)
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const categoryId = formData.get("categoryId") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const rawCost = parseFloat(formData.get("rawCost") as string);
    const isStockItem = formData.get("isStockItem") === "true";
    const stockQuantity = parseInt(formData.get("stockQuantity") as string) || 0;
    const anticipationDays = parseInt(formData.get("anticipationDays") as string) || 0;
    const isCustomCup = formData.get("isCustomCup") === "true";
    const customOptions = JSON.parse(formData.get("customOptions") as string || "[]");
    
    // Imágenes existentes (para conservarlas) + nuevas a subir
    const existingImages: string[] = JSON.parse(
      (formData.get("existingImages") as string) || "[]"
    );
    const imageFiles = formData
      .getAll("images")
      .filter((f): f is File => f instanceof File && f.size > 0);

    const newImages: string[] = [];
    for (const imageFile of imageFiles) {
      if (imageFile.size > 5 * 1024 * 1024) {
        throw new Error(`"${imageFile.name}" pesa más de 5MB. Por favor, comprímela.`);
      }
      const fileExt = imageFile.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, imageFile);

      if (uploadError) throw new Error(`Error subiendo imagen: ${uploadError.message}`);

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      newImages.push(publicUrlData.publicUrl);
    }

    const mergedImages = [...existingImages, ...newImages];

    // Armamos el objeto con lo que se va a actualizar
    const payload: Record<string, unknown> = {
      name,
      category_id: categoryId || null,
      description,
      price,
      raw_cost: rawCost,
      is_in_stock_item: isStockItem,
      stock_quantity: stockQuantity,
      anticipation_days: anticipationDays,
      is_custom_cup: isCustomCup,
      custom_options: customOptions,
    };

    // Si hay imágenes (existentes + nuevas), actualizamos el arreglo
    if (mergedImages.length > 0) {
      payload.images = mergedImages;
    }

    const { error: updateError } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id);

    if (updateError) throw new Error(`Error actualizando base de datos: ${updateError.message}`);

    revalidatePath("/admin/products");
    revalidatePath("/tienda");
    revalidatePath(`/product/${id}`); 
    
    return { success: true };
    
  } catch (error: unknown) {
    // 🛡️ BLINDAJE 3: Ahora sí atraparemos y mostraremos cualquier error de Servidor
    console.error("Error real capturado en updateProduct:", error);
    return { success: false, error: error instanceof Error ? error.message : "Falla técnica en el servidor al actualizar" };
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
  revalidatePath("/");
  revalidatePath("/tienda");
  return { success: true };
}