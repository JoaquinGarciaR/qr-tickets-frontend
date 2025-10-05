import React from "react";
import { useAuth } from "./AuthContext";
import { Link } from "react-router-dom";

export default function RequirePerm({ perm, children }) {
    const { loading, token, perms } = useAuth();

    if (loading) {
        return (
            <div className="mx-auto mt-12 w-[90%] max-w-2xl rounded-2xl border border-slate-700/60 bg-slate-900 p-6 text-center shadow-xl sm:p-8 lg:max-w-3xl">
                <p className="text-base text-slate-300 animate-pulse sm:text-lg lg:text-xl">
                    Cargando sesión…
                </p>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="mx-auto mt-12 w-[90%] max-w-2xl rounded-2xl border border-slate-700/60 bg-slate-900 p-6 text-center shadow-xl sm:p-8 lg:max-w-3xl">
                <p className="mb-4 text-base text-slate-300 sm:text-lg lg:text-xl">
                    Necesitas iniciar sesión.
                </p>
                <Link
                    className="inline-flex rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-600 sm:text-base lg:text-lg"
                    to="/login"
                >
                    Ir a login
                </Link>
            </div>
        );
    }

    if (!perms.includes(perm)) {
        return (
            <div className="mx-auto mt-12 w-[90%] max-w-2xl rounded-2xl border border-red-600/40 bg-red-500/10 p-6 text-center shadow-xl sm:p-8 lg:max-w-3xl">
                <p className="text-base text-red-300 sm:text-lg lg:text-xl">
                    🚫 No tienes permiso para acceder a esta sección.
                </p>
                <code className="mt-3 block rounded bg-red-500/20 px-3 py-2 text-sm text-red-200 sm:text-base lg:text-lg">
                    {perm}
                </code>
            </div>
        );
    }

    return children;
}
