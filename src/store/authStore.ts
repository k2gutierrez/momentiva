import { atom } from "jotai";
import { User } from "@supabase/supabase-js";

export const authModalOpenAtom = atom<boolean>(false);

// Global user and profile atoms
export const userAtom = atom<User | null>(null);
export const userProfileAtom = atom<{ full_name: string; role: string } | null>(null);