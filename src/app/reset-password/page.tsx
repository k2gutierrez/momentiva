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
  EnvelopeSimpleIcon,
  KeyIcon,
} from "@phosphor-icons/react/dist/ssr";

type Estado = "verificando" | "listo" | "codigo";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [estado, setEstado] = useState<Estado>("verificando");

  // Formulario alterno: código de 6 dígitos del correo
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [verificandoCodigo, setVerificandoCodigo] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  const router = useRouter();

  /**
   * El enlace del correo trae un código (`?code=`) o tokens en el hash que hay que
   * convertir en sesión. Si el enlace ya se usó o algún escáner de correo lo
   * "gastó" antes de que la clienta lo abriera, se ofrece la vía del código de 6
   * dígitos, que no se consume.
   */
  useEffect(() => {
    const supabase = createClient();
    let cancelado = false;

    (async () => {
      const url = new URL(window.location.href);

      if (url.searchParams.get("error") || window.location.hash.includes("error")) {
        if (!cancelado) setEstado("codigo");
        return;
      }

      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (!cancelado) setEstado("codigo");
          return;
        }
        url.searchParams.delete("code");
        window.history.replaceState({}, "", url.pathname);
      } else if (window.location.hash.includes("access_token")) {
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            if (!cancelado) setEstado("codigo");
            return;
          }
          window.history.replaceState({}, "", url.pathname);
        }
      }

      const { data } = await supabase.auth.getSession();
      if (!cancelado) setEstado(data.session ? "listo" : "codigo");
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
          ? "Tu sesión de recuperación caducó. Vuelve a pedir el correo."
          : error.message
      );
      setEstado("codigo");
    } else {
      toast.success("¡Contraseña actualizada! Ya puedes usarla.");
      router.push("/mi-cuenta");
    }
    setIsLoading(false);
  };

  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || codigo.trim().length < 6) {
      toast.error("Escribe tu correo y el código que te llegó.");
      return;
    }

    setVerificandoCodigo(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: codigo.trim(),
      type: "recovery",
    });

    if (error) {
      toast.error("Código incorrecto o caducado. Pide uno nuevo.");
    } else {
      setEstado("listo");
    }
    setVerificandoCodigo(false);
  };

  const handleReenviar = async () => {
    if (!email.trim()) {
      toast.error("Escribe tu correo para enviarte uno nuevo.");
      return;
    }
    setReenviando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Te enviamos un correo nuevo. Revisa también spam.");
    setReenviando(false);
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

        {estado === "codigo" && (
          <div className="space-y-5">
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 flex gap-3">
              <WarningCircleIcon size={22} weight="bold" className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-bold">El enlace ya no sirvió</p>
                <p className="mt-1">
                  A veces el correo «gasta» la liga antes de que la abras. No pasa nada:
                  usa el <strong>código de 6 dígitos</strong> que viene en el mismo correo.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerificarCodigo} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">Tu correo</label>
                <div className="relative flex items-center">
                  <EnvelopeSimpleIcon size={20} className="absolute left-3 text-sage" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-lilaPastel rounded-xl focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-berenjena mb-1">
                  Código de acceso
                </label>
                <div className="relative flex items-center">
                  <KeyIcon size={20} className="absolute left-3 text-sage" />
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 border border-lilaPastel rounded-xl focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena tracking-[0.3em] font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verificandoCodigo}
                className="w-full bg-terracota text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-opacity-90 disabled:opacity-70 transition-all"
              >
                {verificandoCodigo ? "Verificando..." : "Continuar"}
              </button>
            </form>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleReenviar}
                disabled={reenviando}
                className="text-sm font-bold text-terracota hover:underline disabled:opacity-60"
              >
                {reenviando ? "Enviando…" : "Enviarme un correo nuevo"}
              </button>
              <p className="text-xs text-gray-400">
                Los enlaces y códigos caducan en 1 hora.
              </p>
            </div>
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

        <Link href="/" className="block text-center text-xs text-gray-400 hover:text-terracota">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
