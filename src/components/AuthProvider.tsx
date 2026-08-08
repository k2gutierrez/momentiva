"use client";

import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { userAtom, userProfileAtom } from "@/store/authStore";
import { createClient } from "@/lib/supabase/client";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useSetAtom(userAtom);
  const setProfile = useSetAtom(userProfileAtom);

  useEffect(() => {
    const supabase = createClient();

    // Fetch initial user session and profile
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile from Supabase:", error.message);
        } else {
          console.log("Fetched profile directly from DB:", profile);
        }

        setProfile(profile || { full_name: user.email || "", role: "client" });
      } else {
        setProfile(null);
      }
    };

    getInitialUser();

    // Listen to realtime auth changes (Login, Logout, Token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", currentUser.id)
          .single();

        if (error) {
          console.error("Error fetching profile on Auth Change:", error.message);
        } else {
          console.log("Fetched profile on Auth Change:", profile);
        }

        setProfile(profile || { full_name: currentUser.email || "", role: "client" });
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile]);

  return <>{children}</>;
}