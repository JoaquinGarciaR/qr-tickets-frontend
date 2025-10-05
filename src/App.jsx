import NavBar from "./components/NavBar.jsx";
import {Routes, Route, useNavigate} from "react-router-dom";
import Home from "./components/Home.jsx";
import Login from "./components/Login.jsx";
import RequirePerm from "./auth/RequirePerm.jsx";
import TicketCreated from "./components/TicketCreated.jsx";
import Scanner from "./components/Scanner.jsx";
import CreateTicket from "./components/CreateTicket.jsx";
import TicketsAdmin from "./components/TicketsAdmin.jsx";
import TicketStatus from "./components/TicketStatus.jsx";
import {Api} from "./api.js";
import {useAuth} from "./auth/AuthContext.jsx";
import React from "react";
import Dashboard from "./components/Dashboard.jsx";

export default function App() {
    const { login } = useAuth();
    const container = "mx-auto w-full max-w-screen-xl 2xl:max-w-screen-2xl 3xl:max-w-content-3xl 4k:max-w-content-4k";
    const pad = "px-4 sm:px-6 lg:px-8";

    return (
        <div>
            <NavBar />

            <main className="flex-1">
                <div>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <Home
                                    onLogin={async ({ email, password }) => {
                                        try {
                                            // Aquí va tu lógica de login
                                            console.log("Intentando login:", email, password);
                                            await login(email, password); // admin/admin123 (demo)
                                        } catch (err) {
                                            throw new Error("Credenciales inválidas");
                                        }
                                    }}
                                />
                            }
                        />

                        <Route path="/login" element={<Login />} />
                        <Route path="/crear" element={<RequirePerm perm="tickets:create"><CreateTicket /></RequirePerm>} />
                        <Route path="/creado" element={<TicketCreated />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/escanear" element={<RequirePerm perm="tickets:validate"><Scanner /></RequirePerm>} />
                        <Route path="/ticket/:id" element={<RequirePerm perm="tickets:read_status"><TicketStatus /></RequirePerm>} />
                        <Route path="/admin/tickets" element={<RequirePerm perm="tickets:list"><TicketsAdmin /></RequirePerm>} />
                        <Route path="*" element={<div className="text-center py-20">404</div>} />
                        <Route path="*" element={<div className="text-center py-20">404</div>} />
                        <Route path="*" element={<div className="text-center py-20">404</div>} />
                        <Route path="*" element={<div className="text-center py-20">404</div>} />
                    </Routes>
                </div>
            </main>

            <footer className="border-t border-white/10">
                <div className={`${container} ${pad} py-6 text-center text-sm text-slate-400`}>
                    © {new Date().getFullYear()} ScanFlow
                </div>
            </footer>
        </div>
    );
}
