"use client";

import React, { useState } from "react";
import { EnvelopeIcon, LockIcon, UserIcon, CalendarBlankIcon } from "@phosphor-icons/react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      console.log("Attempting to log in with:", { email, password });
      // TODO: Connect to Supabase Login Server Action
    } else {
      console.log("Attempting to register:", { email, password, fullName, birthDate });
      // TODO: Connect to Supabase Register Server Action
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-lilaPastel">
        
        {/* Header Section */}
        <div className="bg-berenjena p-8 text-center">
          <h1 className="text-3xl font-bold text-cream mb-2">Momentiva</h1>
          <p className="text-lilaPastel font-handwriting text-2xl">
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
              className="w-full bg-terracota hover:bg-opacity-90 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-6"
            >
              {isLogin ? "Entrar" : "Registrarse"}
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
          
        </div>
      </div>
    </main>
  );
}