// src/pages/Home.jsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthContext.jsx";
import {useNavigate} from "react-router-dom";

/**
 * Home Pro (Tailwind + Framer Motion)
 * Props:
 *  - onLogin?: ({ email, password }) => Promise<void> | void
 */
export default function Home({ onLogin, }) {
    const [showLogin, setShowLogin] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate(); // ✅
    // Lee estado de autenticación desde tu contexto
    const { user, isAuthenticated } = useAuth() || {};

    // Fallback por si tu contexto aún no expone todo
    const localToken =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    // ¿Hay sesión?
    const isLogged = Boolean(
        (typeof isAuthenticated === "boolean" ? isAuthenticated : null) ??
        user ??
        localToken
    );

    const fadeUp = useMemo(
        () => ({
            hidden: { opacity: 0, y: 16 },
            show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }),
        []
    );

    // No abrir modal si ya hay sesión
    const openLogin = () => {
        if (!isLogged) setShowLogin(true);
    };

    const goDashboard = () => {
        navigate('/dashboard');
    };
    const onOpenScanner = () => {
        navigate('/escanear');
    };


    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Gradient background wash */}
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-indigo-600/25 blur-3xl" />
                <div className="absolute right-10 top-1/3 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
                <div className="absolute left-1/3 bottom-10 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
            </div>

            {/* HERO */}
            <section className="relative overflow-hidden">
                {/* Glows */}
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
                    <div className="absolute right-10 top-40 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
                </div>

                <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-12 sm:px-6 md:grid-cols-2 lg:gap-20 lg:px-8 lg:py-20">
                    <div className="md:pr-8 lg:pr-16">
                        <motion.span
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.4 }}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs"
                        >
                            ⚡ Escanea y valida accesos en segundos
                        </motion.span>

                        <motion.h1
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.4 }}
                            className="mt-6 text-4xl font-extrabold leading-tight md:text-5xl"
                        >
                            Escanea, valida y controla
                            <span className="block bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
                entradas al instante
              </span>
                        </motion.h1>

                        <motion.p
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.4 }}
                            className="mt-4 max-w-prose text-slate-300"
                        >
                            Genera códigos, escanéalos con tu cámara y valida accesos en
                            tiempo real. Inicia sesión para administrar tus eventos o abre el
                            scanner directo desde el navegador.
                        </motion.p>

                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.4 }}
                            className="mt-6 flex flex-wrap gap-3"
                        >
                            {!isLogged ? (
                                <>
                                    <button
                                        onClick={openLogin}
                                        className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                                    >
                                        Ingresar ahora
                                    </button>
                                    <button
                                        onClick={onOpenScanner}
                                        className="rounded-xl border border-slate-600/70 px-5 py-3 text-sm font-semibold hover:bg-slate-900/50"
                                    >
                                        Abrir Scanner
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={goDashboard}
                                        className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                                    >
                                        Ir al panel
                                    </button>
                                    <button
                                        onClick={onOpenScanner}
                                        className="rounded-xl border border-slate-600/70 px-5 py-3 text-sm font-semibold hover:bg-slate-900/50"
                                    >
                                        Abrir Scanner
                                    </button>
                                </>
                            )}
                        </motion.div>

                        <ul className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                            <li>🔒 Cifrado de tokens</li>
                            <li>⚡ Baja latencia</li>
                            <li>📱 Funciona en móvil</li>
                        </ul>
                    </div>

                    {/* Phone mock */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true, amount: 0.3 }}
                        className="w-full md:w-auto md:justify-self-end lg:max-w-sm"
                    >
                        <div className="relative rounded-3xl border border-slate-700/60 bg-slate-900/60 p-3 shadow-2xl">
                            <div className="rounded-2xl border border-slate-700/60 bg-black p-3">
                                <div className="aspect-[9/16] w-full rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 ring-1 ring-inset ring-slate-700/70">
                                    <div className="flex h-full flex-col items-center justify-center gap-6">
                                        <div className="rounded-xl bg-white p-3 text-slate-900">
                                            <svg viewBox="0 0 24 24" className="h-24 w-24" fill="currentColor">
                                                <rect x="3" y="3" width="6" height="6" rx="1" />
                                                <rect x="15" y="3" width="6" height="6" rx="1" />
                                                <rect x="3" y="15" width="6" height="6" rx="1" />
                                                <rect x="12" y="12" width="3" height="3" />
                                                <rect x="16" y="12" width="5" height="3" />
                                                <rect x="12" y="16" width="3" height="5" />
                                            </svg>
                                        </div>
                                        <p className="px-6 text-center text-sm text-slate-300">
                                            Apunta la cámara al código QR para validar tu acceso.
                                        </p>
                                        <button
                                            onClick={onOpenScanner}
                                            className="mb-5 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600"
                                        >
                                            Abrir cámara →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="border-t border-slate-800/70">
                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mb-10 text-left md:text-center">
                        <h2 className="text-2xl font-bold">Todo lo que necesitas para tu control de accesos</h2>
                        <p className="mt-2 text-slate-400">Desde eventos pequeños hasta arenas.</p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, amount: 0.25 }}
                                className="group rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6 transition-colors hover:border-indigo-600/40 hover:bg-slate-900/60"
                            >
                                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80 ring-1 ring-slate-700/60">
                                    <span aria-hidden>🌟</span>
                                </div>
                                <h3 className="text-lg font-semibold">{f.title}</h3>
                                <p className="mt-2 text-sm text-slate-300">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how" className="border-t border-slate-800/70 bg-slate-950/40">
                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mb-10 text-left md:text-center">
                        <h2 className="text-2xl font-bold">¿Cómo funciona?</h2>
                        <p className="mt-2 text-slate-400">Sigue estos pasos y valida entradas en minutos.</p>
                    </div>

                    <ol className="grid gap-6 md:grid-cols-3">
                        {steps.map((s, i) => (
                            <motion.li
                                key={i}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, amount: 0.25 }}
                                className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6"
                            >
                                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-300 ring-1 ring-indigo-400/30">
                                    {i + 1}
                                </div>
                                <h3 className="font-semibold">{s.title}</h3>
                                <p className="mt-1 text-sm text-slate-300">{s.desc}</p>
                            </motion.li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* CTA */}
            <section className="border-t border-slate-800/70">
                <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        className="flex flex-col items-start gap-6 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-cyan-500/10 p-8 ring-1 ring-inset ring-slate-700/70 md:flex-row md:items-center md:justify-between"
                    >
                        <div>
                            <h3 className="text-xl font-semibold">Listo para empezar</h3>
                            <p className="text-sm text-slate-300">
                                {isLogged
                                    ? "Ve a tu panel o abre el scanner y valida ahora."
                                    : "Inicia sesión o abre el scanner y valida ahora."}
                            </p>
                        </div>
                        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                            {!isLogged ? (
                                <>
                                    <button
                                        onClick={openLogin}
                                        className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                                    >
                                        Ingresar
                                    </button>
                                    <button
                                        onClick={onOpenScanner}
                                        className="rounded-xl border border-slate-600/70 px-5 py-3 text-sm font-semibold hover:bg-slate-900/50"
                                    >
                                        Abrir Scanner
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={goDashboard}
                                        className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                                    >
                                        Ir al panel
                                    </button>
                                    <button
                                        onClick={onOpenScanner}
                                        className="rounded-xl border border-slate-600/70 px-5 py-3 text-sm font-semibold hover:bg-slate-900/50"
                                    >
                                        Abrir Scanner
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* LOGIN MODAL — solo si NO hay sesión */}
            <AnimatePresence>
                {!isLogged && showLogin && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="absolute inset-0 bg-black/60"
                            onClick={() => setShowLogin(false)}
                        />
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="relative w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900 p-6 shadow-2xl"
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Iniciar sesión</h3>
                                    <p className="text-sm text-slate-400">Accede a tu panel de eventos.</p>
                                </div>
                                <button
                                    onClick={() => setShowLogin(false)}
                                    className="rounded-lg p-1 hover:bg-slate-800"
                                >
                                    ✕
                                </button>
                            </div>

                            <LoginForm
                                busy={busy}
                                error={error}
                                onSubmit={async (form) => {
                                    setError("");
                                    try {
                                        setBusy(true);
                                        await onLogin?.(form);
                                        setShowLogin(false);
                                    } catch (e) {
                                        setError(e?.message || "No se pudo iniciar sesión");
                                    } finally {
                                        setBusy(false);
                                    }
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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
