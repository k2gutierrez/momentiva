"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createInstagramPost(formData: FormData) {
  const supabase = await createClient();

  try {
    const postUrl = formData.get("postUrl") as string;
    const orderIndex = parseInt(formData.get("orderIndex") as string) || 0;
    const isVideo = formData.get("isVideo") === "on"; // Checkbox value
    const imageFile = formData.get("image") as File;

    if (!imageFile || imageFile.size === 0) {
      throw new Error("La imagen es obligatoria.");
    }
    if (!postUrl) {
      throw new Error("La URL de la publicación es obligatoria.");
    }

    // Usaremos el mismo bucket "product-images" para mantenerlo simple
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `insta-${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, imageFile);

    if (uploadError) throw new Error("Error al subir la imagen.");

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(uploadData.path);

    // Insertar en la tabla instagram_feed
    const { error } = await supabase.from("instagram_feed").insert({
      post_url: postUrl,
      image_url: publicUrlData.publicUrl,
      order_index: orderIndex,
      is_video: isVideo,
      is_active: true,
    });

    if (error) throw new Error(error.message);

    revalidatePath("/admin/instagram");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleInstagramPost(id: string, currentStatus: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("instagram_feed")
    .update({ is_active: !currentStatus })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/instagram");
  revalidatePath("/");
  return { success: true };
}

export async function deleteInstagramPost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("instagram_feed").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/instagram");
  revalidatePath("/");
  return { success: true };
}