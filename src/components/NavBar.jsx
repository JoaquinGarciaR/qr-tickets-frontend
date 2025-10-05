import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function NavBar() {
    const { user, perms, token, logout } = useAuth();
    const nav = useNavigate();
    const [open, setOpen] = useState(false);

    const canCreate = perms.includes("tickets:create");
    const canScan   = perms.includes("tickets:validate");
    const canList   = perms.includes("tickets:list");
    const canDashboard   = perms.includes("tickets:dashboard");

    const linkBase   = "text-sm text-slate-300 transition-colors hover:text-white";
    const linkActive = "text-white font-semibold";

    return (
        <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/70 backdrop-blur">
            {/* barra a TODO el ancho (sin max-w) */}
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Brand */}
                <button
                    onClick={() => nav("/")}
                    className="flex min-w-0 items-center gap-3"
                    aria-label="Ir al inicio"
                >
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/20 ring-1 ring-indigo-400/40">
                        <svg viewBox="0 0 24 24" className="h-5 w-5 text-indigo-300" fill="currentColor">
                            <rect x="3" y="3" width="6" height="6" rx="1" />
                            <rect x="15" y="3" width="6" height="6" rx="1" />
                            <rect x="3" y="15" width="6" height="6" rx="1" />
                            <rect x="12" y="12" width="3" height="3" />
                            <rect x="16" y="12" width="5" height="3" />
                            <rect x="12" y="16" width="3" height="5" />
                        </svg>
                    </div>
                    <span className="truncate text-lg font-semibold tracking-tight">ScanFlow</span>
                </button>

                {/* Enlaces públicos (siempre visibles) */}
                <nav className="hidden md:flex items-center gap-6">
                    <a href="/#features" className={linkBase}>Características</a>
                    <a href="/#how" className={linkBase}>Cómo funciona</a>
                    <a href="/faq" className={linkBase}>FAQ</a>
                </nav>

                {/* Acciones y enlaces con permisos */}
                <div className="hidden md:flex items-center gap-3">

                    {/* Botón prominente (solo si tiene permiso de validar) */}
                    {canDashboard != true && (
                        <NavLink
                            to="/dashboard"
                            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600"
                        >
                            Dashboard
                        </NavLink>
                    )}
                    {/* Botón prominente (solo si tiene permiso de validar) */}
                    {canScan && (
                        <NavLink
                            to="/escanear"
                            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600"
                        >
                            Abrir Scanner
                        </NavLink>
                    )}

                    {canCreate && (
                        <NavLink to="/crear" className={({isActive}) => `${linkBase} ${isActive ? linkActive : ""}`}>
                            Crear
                        </NavLink>
                    )}
                    {canScan && (
                        <NavLink to="/escanear" className={({isActive}) => `${linkBase} ${isActive ? linkActive : ""}`}>
                            Escanear
                        </NavLink>
                    )}
                    {canList && (
                        <NavLink to="/admin/tickets" className={({isActive}) => `${linkBase} ${isActive ? linkActive : ""}`}>
                            Entradas
                        </NavLink>
                    )}

                    {!token ? (
                        <NavLink to="/login" className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2 text-sm font-semibold hover:border-slate-600 hover:bg-slate-800">
                            Ingresar
                        </NavLink>
                    ) : (
                        <button
                            onClick={() => { logout(); nav("/login"); }}
                            className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2 text-sm font-semibold hover:border-slate-600 hover:bg-slate-800"
                        >
                            Salir
                        </button>
                    )}
                </div>

                {/* Hamburguesa móvil */}
                <button
                    onClick={() => setOpen(v => !v)}
                    className="md:hidden inline-flex items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/60 p-2"
                    aria-label="Abrir menú"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-slate-200">
                        <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            {/* Sheet móvil */}
            {open && (
                <div className="md:hidden border-t border-white/10">
                    <div className="px-4 py-4">
                        <div className="mb-3 text-xs uppercase tracking-wide text-slate-400">Explora</div>
                        <div className="flex flex-col gap-2">
                            <a href="/#features" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5">Características</a>
                            <a href="/#how" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5">Cómo funciona</a>
                            <a href="/faq" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5">FAQ</a>
                        </div>

                        <div className="mt-4 mb-2 text-xs uppercase tracking-wide text-slate-400">Panel</div>
                        <div className="flex flex-col gap-2">
                            {canCreate && <NavLink to="/crear" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5">Crear</NavLink>}
                            {canScan   && <NavLink to="/escanear" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5">Escanear</NavLink>}
                            {canList   && <NavLink to="/admin/tickets" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5">Entradas</NavLink>}
                        </div>

                        <div className="mt-4 flex gap-3">
                            {!token ? (
                                <NavLink to="/login" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-center">
                                    Ingresar
                                </NavLink>
                            ) : (
                                <button
                                    onClick={() => { logout(); setOpen(false); nav("/login"); }}
                                    className="flex-1 rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2 text-sm font-semibold"
                                >
                                    Salir
                                </button>
                            )}

                            {canScan && (
                                <NavLink
                                    to="/escanear"
                                    onClick={() => setOpen(false)}
                                    className="flex-1 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white text-center"
                                >
                                    Abrir Scanner
                                </NavLink>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
