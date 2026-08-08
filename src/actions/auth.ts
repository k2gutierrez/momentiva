"use server";

import { createClient } from "@/lib/supabase/server";

export async function registerUser(email: string, password: string, fullName: string, birthDate: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        birth_date: birthDate,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function loginUser(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function logoutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}