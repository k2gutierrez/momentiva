"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LockIcon } from "@phosphor-icons/react/dist/ssr";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Contraseña actualizada correctamente.");
      router.push("/");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-3xl border border-lilaPastel shadow-xl space-y-6">
        <h2 className="text-3xl font-bold text-berenjena text-center">Nueva Contraseña</h2>
        <p className="text-gray-500 text-sm text-center">Ingresa tu nueva clave de acceso.</p>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-berenjena mb-1">Nueva Contraseña</label>
            <div className="relative flex items-center">
              <LockIcon size={20} className="absolute left-3 text-sage" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-lilaPastel rounded-xl focus:outline-none focus:ring-2 focus:ring-terracota bg-cream/30 text-berenjena"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-terracota text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-opacity-90 disabled:opacity-70 transition-all"
          >
            {isLoading ? "Actualizando..." : "Guardar Contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}