"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EnvelopeIcon, LockIcon, UserIcon, CalendarBlankIcon, ArrowLeftIcon } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Sesión iniciada correctamente");
        router.push("/mi-cuenta");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              birth_date: birthDate || null,
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("¡Registro exitoso! Bienvenido a Momentiva.");
          router.push("/mi-cuenta");
        } else {
          toast.success("Revisa tu correo para confirmar tu cuenta.");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error de autenticación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-cream p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">

        {/* Header Section con Logo */}
        <div className="bg-berenjena p-8 text-center">
          <Link href="/" className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logo-blanco.png"
              alt="Momentiva"
              className="h-16 md:h-20 w-auto mx-auto object-contain"
            />
          </Link>
          <p className="text-lilaPastel font-handwriting text-2xl mt-3">
            cada regalo, un momento inolvidable
          </p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-berenjena mb-6 text-center">
            {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Conditional Fields for Registration */}
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-bold text-berenjena mb-1">Nombre Completo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon size={20} className="text-sage" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                      placeholder="Juan Pérez"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-berenjena mb-1">Fecha de Nacimiento</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarBlankIcon size={20} className="text-sage" />
                    </div>
                    <input
                      type="date"
                      required
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Field (Always visible) */}
            <div>
              <label className="block text-sm font-bold text-berenjena mb-1">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon size={20} className="text-sage" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            {/* Password Field (Always visible) */}
            <div>
              <label className="block text-sm font-bold text-berenjena mb-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon size={20} className="text-sage" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-lilaPastel rounded-lg focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-terracota hover:bg-opacity-90 disabled:opacity-70 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-6"
            >
              {isLoading ? "Cargando..." : isLogin ? "Entrar" : "Registrarse"}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-sage hover:text-terracota transition-colors"
            >
              {isLogin
                ? "¿No tienes cuenta? Regístrate aquí"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-terracota transition-colors">
              <ArrowLeftIcon size={14} /> Volver al inicio
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
