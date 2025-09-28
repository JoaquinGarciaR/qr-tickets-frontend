import React from "react";
import { useAuth } from "./AuthContext";
import { Link } from "react-router-dom";

export default function RequirePerm({ perm, children }) {
    const { loading, token, perms } = useAuth();
    if (loading) return <div className="card">Cargando sesión…</div>;
    if (!token) return (
        <div className="card">
            <p>Necesitas iniciar sesión.</p>
            <Link className="btn" to="/login">Ir a login</Link>
        </div>
    );
    if (!perms.includes(perm)) return <div className="card">No tienes permiso: <code>{perm}</code></div>;
    return children;
}
