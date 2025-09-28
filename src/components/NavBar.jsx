import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function NavBar() {
    const { user, perms, token, logout } = useAuth();
    const nav = useNavigate();

    const canCreate = perms.includes("tickets:create");
    const canScan = perms.includes("tickets:validate");
    const canList = perms.includes("tickets:list");

    return (
        <nav className="nav">
            <div className="brand">QR Tickets</div>
            <div className="links">
                {canCreate && <NavLink to="/crear">Crear</NavLink>}
                {canScan && <NavLink to="/escanear">Escanear</NavLink>}
                {canList && <NavLink to="/admin/tickets">Entradas</NavLink>}
                {!token ? (
                    <NavLink to="/login">Login</NavLink>
                ) : (
                    <NavLink onClick={() => { logout(); nav("/login"); }}>Salir</NavLink>
                )}
            </div>
        </nav>
    );
}
