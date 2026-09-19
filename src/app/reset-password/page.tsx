"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  LockIcon,
  WarningCircleIcon,
  CircleNotchIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

type Estado = "verificando" | "listo" | "invalido";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [estado, setEstado] = useState<Estado>("verificando");
  const router = useRouter();

  /**
   * El enlace del correo no inicia sesión solo: trae un código (`?code=...`) que
   * hay que canjear por una sesión. Antes se guardaba la contraseña sin canjearlo,
   * por eso aparecía el error "Auth session missing!".
   */
  useEffect(() => {
    const supabase = createClient();
    let cancelado = false;

    (async () => {
      const url = new URL(window.location.href);

      // Si el enlace venció, Supabase regresa con un error en la URL
      if (url.searchParams.get("error") || window.location.hash.includes("error")) {
        if (!cancelado) setEstado("invalido");
        return;
      }

      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (!cancelado) setEstado("invalido");
          return;
        }
        // Se quita el código de la barra de direcciones para que al recargar no falle
        url.searchParams.delete("code");
        window.history.replaceState({}, "", url.pathname);
      } else if (window.location.hash.includes("access_token")) {
        // Formato alterno: los tokens vienen en el hash (#access_token=...).
        // El cliente de SSR no los procesa solo, así que se aplican a mano.
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            if (!cancelado) setEstado("invalido");
            return;
          }
          window.history.replaceState({}, "", url.pathname);
        }
      }

      const { data } = await supabase.auth.getSession();
      if (!cancelado) setEstado(data.session ? "listo" : "invalido");
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error(
        error.message.toLowerCase().includes("session")
          ? "El enlace ya caducó o se usó antes. Pide uno nuevo desde MI CUENTA."
          : error.message
      );
      setEstado("invalido");
    } else {
      toast.success("¡Contraseña actualizada! Ya puedes usarla.");
      router.push("/mi-cuenta");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-3xl border border-lilaPastel shadow-xl space-y-6">
        <h2 className="text-3xl font-bold text-berenjena text-center">Nueva Contraseña</h2>

        {estado === "verificando" && (
          <div className="flex flex-col items-center gap-3 py-6 text-gray-500">
            <CircleNotchIcon size={32} className="animate-spin text-terracota" />
            <p className="text-sm">Verificando tu enlace…</p>
          </div>
        )}

        {estado === "invalido" && (
          <div className="space-y-5">
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 flex gap-3">
              <WarningCircleIcon size={22} weight="bold" className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-bold">Este enlace ya no es válido</p>
                <p className="mt-1">
                  Los enlaces de recuperación <strong>caducan en 1 hora</strong> y solo se
                  pueden usar una vez. Pide uno nuevo desde <strong>MI CUENTA</strong>.
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="block text-center w-full bg-terracota text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-opacity-90 transition-all"
            >
              Volver al inicio
            </Link>
          </div>
        )}

        {estado === "listo" && (
          <>
            <p className="text-gray-500 text-sm text-center">
              Ingresa tu nueva clave de acceso.
            </p>

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative flex items-center">
                  <LockIcon size={20} className="absolute left-3 text-sage" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-10 pr-4 py-2.5 border border-lilaPastel rounded-xl focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Al menos 8 caracteres.</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-terracota text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-opacity-90 disabled:opacity-70 transition-all"
              >
                {isLoading ? (
                  "Actualizando..."
                ) : (
                  <>
                    <CheckCircleIcon size={20} weight="bold" /> Guardar Contraseña
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
