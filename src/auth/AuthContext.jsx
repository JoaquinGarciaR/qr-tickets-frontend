import React, { createContext, useContext, useEffect, useState } from "react";
import { Api, setToken as apiSetToken } from "../api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("qr_token") || "");
    const [user, setUser] = useState(null);     // { user, perms: [] }
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiSetToken(token || null);
        if (!token) { setUser(null); setLoading(false); return; }
        Api.me()
            .then((u) => { setUser(u); setLoading(false); })
            .catch(() => { setUser(null); setToken(""); localStorage.removeItem("qr_token"); setLoading(false); });
    }, [token]);

    async function login(username, password) {
        const r = await Api.login(username, password);
        apiSetToken(r.access_token);
        setToken(r.access_token);
        localStorage.setItem("qr_token", r.access_token);
        const me = await Api.me();
        setUser(me);
    }

    async function logout() {
        try { await Api.logout(); } catch {}
        apiSetToken(null);
        setToken("");
        setUser(null);
        localStorage.removeItem("qr_token");
    }

    const value = { token, user, perms: user?.perms || [], login, logout, loading };
    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
