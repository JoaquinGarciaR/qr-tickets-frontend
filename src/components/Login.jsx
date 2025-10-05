import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
    const [username, setU] = useState("");
    const [password, setP] = useState("");
    const [err, setErr] = useState("");
    const { login } = useAuth();
    const nav = useNavigate();

    async function onSubmit(e) {
        e.preventDefault();
        setErr("");
        try {
            await login(username, password); // admin/admin123 (demo)
            nav("/crear");
        } catch (e) {
            setErr(e.message || "Error de autenticación");
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
            <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    Iniciar sesión
                </h2>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm text-slate-300">Usuario</label>
                        <input
                            value={username}
                            onChange={(e) => setU(e.target.value)}
                            required
                            className="mt-1 w-full rounded-xl border border-slate-700/60 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                            placeholder="Tu usuario"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-300">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setP(e.target.value)}
                            required
                            className="mt-1 w-full rounded-xl border border-slate-700/60 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                            placeholder="••••••••"
                        />
                    </div>

                    {err && (
                        <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                            {err}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
                    >
                        Entrar
                    </button>
                </form>

                <p className="mt-4 text-center text-xs text-slate-400">
                    ¿No tienes cuenta?{" "}
                    <a
                        href="#"
                        className="font-semibold text-indigo-300 hover:text-indigo-200"
                    >
                        Crea una gratis
                    </a>
                </p>
            </div>
        </div>
    );
}
