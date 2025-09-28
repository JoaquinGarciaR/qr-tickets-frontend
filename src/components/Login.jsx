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
        <div className="card">
            <h2>Iniciar sesión</h2>
            <form onSubmit={onSubmit} className="form">
                <label>Usuario</label>
                <input value={username} onChange={e=>setU(e.target.value)} required />
                <label>Contraseña</label>
                <input type="password" value={password} onChange={e=>setP(e.target.value)} required />
                <button>Entrar</button>
                {err && <p className="error">{err}</p>}
            </form>
            <small>Usuarios demo: admin/admin123 · taquilla/scan2025 · organizador/evento</small>
        </div>
    );
}
