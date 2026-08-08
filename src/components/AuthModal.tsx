"use client";

import React, { useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { authModalOpenAtom, userAtom, userProfileAtom } from "@/store/authStore";
import { XIcon, EnvelopeIcon, LockIcon, UserIcon } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function AuthModal() {
  const [isOpen, setIsOpen] = useAtom(authModalOpenAtom);
  const setUser = useSetAtom(userAtom);
  const setProfile = useSetAtom(userProfileAtom);

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const supabase = createClient();

    try {
      if (isRegistering) {
        // --- REGISTER ---
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          // Create profile record in public.profiles
          const { error: profileError } = await supabase.from("profiles").insert({
            id: authData.user.id,
            full_name: fullName,
            email: email,
            role: "client",
          });

          if (profileError) console.error("Error creating profile:", profileError.message);

          // Update Jotai state instantly
          setUser(authData.user);
          setProfile({ full_name: fullName, role: "client" });
          
          toast.success("¡Registro exitoso! Bienvenido a Momentiva.");
          setIsOpen(false); // Close Modal
        }
      } else {
        // --- LOGIN ---
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (authData.user) {
          // Fetch user profile immediately
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", authData.user.id)
            .single();

          // Update Jotai state instantly
          setUser(authData.user);
          setProfile(profile || { full_name: authData.user.email || "", role: "client" });

          toast.success("Sesión iniciada correctamente");
          setIsOpen(false); // Close Modal
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Error de autenticación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-berenjena/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-lilaPastel relative animate-fade-in-up">
        
        {/* Close Button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-berenjena hover:bg-cream rounded-full transition-colors"
        >
          <XIcon size={20} weight="bold" />
        </button>

        {/* Modal Header */}
        <div className="p-8 pb-4 text-center">
          <h3 className="text-3xl font-bold text-berenjena">
            {isRegistering ? "Crear Cuenta" : "¡Hola de nuevo!"}
          </h3>
          <p className="text-sage font-handwriting text-xl mt-1">
            {isRegistering ? "Empieza a crear momentos inolvidables" : "Ingresa para gestionar tus pedidos"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="p-8 pt-2 space-y-4">
          
          {isRegistering && (
            <div>
              <label className="block text-sm font-bold text-berenjena mb-1">Nombre Completo</label>
              <div className="relative flex items-center">
                <UserIcon size={20} className="absolute left-3 text-sage" />
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full pl-10 pr-4 py-2.5 border border-lilaPastel rounded-xl focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-berenjena mb-1">Correo Electrónico</label>
            <div className="relative flex items-center">
              <EnvelopeIcon size={20} className="absolute left-3 text-sage" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full pl-10 pr-4 py-2.5 border border-lilaPastel rounded-xl focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-berenjena mb-1">Contraseña</label>
            <div className="relative flex items-center">
              <LockIcon size={20} className="absolute left-3 text-sage" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-lilaPastel rounded-xl focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-terracota hover:bg-opacity-90 disabled:opacity-70 text-white font-bold py-3.5 rounded-xl shadow-md transition-all duration-300 mt-2"
          >
            {isLoading ? "Cargando..." : isRegistering ? "Registrarme" : "Iniciar Sesión"}
          </button>
        </form>

        {/* Modal Footer Toggle */}
        <div className="bg-cream/50 p-4 border-t border-lilaPastel text-center text-sm">
          {isRegistering ? (
            <p className="text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <button 
                type="button"
                onClick={() => setIsRegistering(false)} 
                className="font-bold text-terracota hover:underline"
              >
                Inicia Sesión
              </button>
            </p>
          ) : (
            <p className="text-gray-600">
              ¿Aún no tienes cuenta?{" "}
              <button 
                type="button"
                onClick={() => setIsRegistering(true)} 
                className="font-bold text-terracota hover:underline"
              >
                Regístrate aquí
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}