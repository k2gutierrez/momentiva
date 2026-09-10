"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCarouselSlide(formData: FormData) {
  const supabase = await createClient();

  try {
    const title = formData.get("title") as string;
    const orderIndex = parseInt(formData.get("orderIndex") as string) || 0;
    const imageFile = formData.get("image") as File;
    const mobileImageFile = formData.get("mobileImage") as File;

    if (!imageFile || imageFile.size === 0) {
      throw new Error("La imagen del banner es obligatoria.");
    }

    // Subir imagen a Supabase Storage (con validación de peso)
    const uploadImage = async (file: File, prefix: string): Promise<string> => {
      if (!file || file.size === 0) return "";
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`"${file.name}" pesa más de 5MB. Por favor, comprímela o expórtala en menor resolución.`);
      }
      const fileExt = file.name.split(".").pop() || "png";
      const fileName = `${prefix}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw new Error(`Error al subir "${file.name}": ${uploadError.message}`);

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(uploadData.path);

      return publicUrlData.publicUrl;
    };

    const imageUrl = await uploadImage(imageFile, "carousel");
    const mobileImageUrl = await uploadImage(mobileImageFile, "carousel-mobile");

    // Insert en homepage_carousel. Si la columna mobile_image_url aún no existe
    // en la BD (pendiente de agregar en Supabase), reintentamos sin ella para
    // que la subida del banner de escritorio nunca se trabe.
    const insertPayload: Record<string, unknown> = {
      title,
      image_url: imageUrl,
      mobile_image_url: mobileImageUrl || null,
      order_index: orderIndex,
      is_active: true,
    };

    const { error } = await supabase.from("homepage_carousel").insert(insertPayload);

    if (error && error.code === "42703" && insertPayload.mobile_image_url) {
      // La columna no existe todavía: guardamos sin la versión móvil
      const { error: retryError } = await supabase
        .from("homepage_carousel")
        .insert({
          title,
          image_url: imageUrl,
          order_index: orderIndex,
          is_active: true,
        });
      if (retryError) throw new Error(retryError.message);

      revalidatePath("/admin/carousels");
      revalidatePath("/");
      return {
        success: true,
        note: "Banner guardado. Para activar la versión móvil, agrega la columna mobile_image_url (text, Nullable) a la tabla homepage_carousel en Supabase.",
      };
    }

    if (error) throw new Error(error.message);

    revalidatePath("/admin/carousels");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
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

// Actualizar las imágenes de un slide existente (desktop y/o móvil)
export async function updateCarouselSlideImages(id: string, formData: FormData) {
  const supabase = await createClient();

  try {
    const imageFile = formData.get("image") as File;
    const mobileImageFile = formData.get("mobileImage") as File;

    const uploadImage = async (file: File, prefix: string): Promise<string> => {
      if (!file || file.size === 0) return "";
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`"${file.name}" pesa más de 5MB. Por favor, comprímela o expórtala en menor resolución.`);
      }
      const fileExt = file.name.split(".").pop() || "png";
      const fileName = `${prefix}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw new Error(`Error al subir "${file.name}": ${uploadError.message}`);

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(uploadData.path);

      return publicUrlData.publicUrl;
    };

    const newImageUrl = await uploadImage(imageFile, "carousel");
    const newMobileUrl = await uploadImage(mobileImageFile, "carousel-mobile");

    if (!newImageUrl && !newMobileUrl) {
      throw new Error("Selecciona al menos una imagen para actualizar.");
    }

    const payload: Record<string, unknown> = {};
    if (newImageUrl) payload.image_url = newImageUrl;
    if (newMobileUrl) payload.mobile_image_url = newMobileUrl;

    const { error } = await supabase
      .from("homepage_carousel")
      .update(payload)
      .eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/admin/carousels");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
  }
}

export async function deleteCarouselSlide(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("homepage_carousel").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/carousels");
  revalidatePath("/");
  return { success: true };
}