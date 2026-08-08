"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCategory(formData: FormData) {
  const supabase = await createClient();

  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    
    // Auto-generate a URL-friendly slug (e.g., "Regalos Especiales" -> "regalos-especiales")
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const { error } = await supabase.from("categories").insert({
      name,
      slug,
      description,
    });

    if (error) throw new Error(error.message);

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
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