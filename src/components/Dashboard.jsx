// src/pages/Home.jsx
import React, { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Dashboard() {

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Gradient background wash */}
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-indigo-600/25 blur-3xl" />
                <div className="absolute right-10 top-1/3 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
                <div className="absolute left-1/3 bottom-10 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
            </div>

            En construccion
        </div>
    );
}

function LoginForm({ onSubmit, busy, error }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit?.({ email, password });
            }}
            className="space-y-4"
        >
            <div>
                <label className="text-sm text-slate-300">Correo</label>
                <input
                    // type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700/60 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-slate-500"
                    placeholder="tucorreo@dominio.com"
                />
            </div>
            <div>
                <label className="text-sm text-slate-300">Contraseña</label>
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700/60 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-slate-500"
                    placeholder="••••••••"
                />
            </div>

            {error && (
                <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
                {busy ? "Procesando…" : "Entrar"}
            </button>

            <p className="text-center text-xs text-slate-400">
                ¿No tienes cuenta?{" "}
                <a href="#" className="font-semibold text-indigo-300 hover:text-indigo-200">
                    Crea una gratis
                </a>
            </p>
        </form>
    );
}

const features = [
    { title: "Scanner web sin apps", desc: "Funciona directo en el navegador, sin instalaciones." },
    { title: "Validación segura", desc: "Tokens cifrados y verificación instantánea contra tu API." },
    { title: "Ultrarrápido", desc: "Optimizado para colas: baja latencia y alto rendimiento." },
    { title: "Multi-rol", desc: "Accesos para organizador, staff y taquilla." },
    { title: "Estadísticas en vivo", desc: "Entradas usadas, no usadas y tiempos pico." },
    { title: "Integración flexible", desc: "REST, webhooks y exportación de datos." },
];

const steps = [
    { title: "Crea tu evento", desc: "Configura entradas y genera códigos QR únicos." },
    { title: "Comparte los tickets", desc: "Envía por email/WhatsApp o añade a Wallet." },
    { title: "Escanea y valida", desc: "Usa tu cámara para validar accesos en segundos." },
];
