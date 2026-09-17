"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/slug";

export async function createCategory(formData: FormData) {
  const supabase = await createClient();

  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    
    // Auto-generate a URL-friendly slug (e.g., "Bebé" -> "bebe")
    const slug = slugify(name);

    const { error } = await supabase.from("categories").insert({
      name,
      slug,
      description,
    });

    if (error) throw new Error(error.message);

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
  }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();

  // Note: Because of our foreign key setup in SQL, if a product is linked to this category,
  // deleting it will just set the product's category_id to NULL, preventing database crashes.
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient();

  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name) throw new Error("El nombre es obligatorio");

    const slug = slugify(name);

    const { error } = await supabase
      .from("categories")
      .update({
        name,
        slug,
        description,
      })
      .eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
  }
}