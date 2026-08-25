"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCarouselSlide(formData: FormData) {
  const supabase = await createClient();

  try {
    const title = formData.get("title") as string;
    const orderIndex = parseInt(formData.get("orderIndex") as string) || 0;
    const imageFile = formData.get("image") as File;

    if (!imageFile || imageFile.size === 0) {
      throw new Error("La imagen del carrusel es obligatoria.");
    }

    // Upload image to Supabase Storage
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `carousel-${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, imageFile);

    if (uploadError) throw new Error("Error al subir la imagen.");

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(uploadData.path);

    // Insert into your existing homepage_carousel table
    const { error } = await supabase.from("homepage_carousel").insert({
      title,
      image_url: publicUrlData.publicUrl,
      order_index: orderIndex,
      is_active: true,
    });

    if (error) throw new Error(error.message);

    revalidatePath("/admin/carousels");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleCarouselSlide(id: string, currentStatus: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("homepage_carousel")
    .update({ is_active: !currentStatus })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/carousels");
  revalidatePath("/");
  return { success: true };
}

export async function deleteCarouselSlide(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("homepage_carousel").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/carousels");
  revalidatePath("/");
  return { success: true };
}