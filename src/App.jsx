import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import CreateTicket from "./components/CreateTicket.jsx";
import TicketCreated from "./components/TicketCreated.jsx";
import Scanner from "./components/Scanner.jsx";
import TicketStatus from "./components/TicketStatus.jsx";
import RequirePerm from "./auth/RequirePerm.jsx";
import Login from "./components/Login.jsx";
import TicketsAdmin from "./components/TicketsAdmin.jsx";

export default function App() {
    return (
        <div className="container">
            <NavBar />
            <Routes>
                <Route path="/" element={<Navigate to="/crear" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/crear" element={
                    <RequirePerm perm="tickets:create">
                        <CreateTicket />
                    </RequirePerm>
                } />
                <Route path="/creado" element={<TicketCreated />} />
                <Route path="/escanear" element={
                    <RequirePerm perm="tickets:validate">
                        <Scanner />
                    </RequirePerm>
                } />
                <Route path="/ticket/:id" element={
                    <RequirePerm perm="tickets:read_status">
                        <TicketStatus />
                    </RequirePerm>
                } />
                <Route path="/admin/tickets" element={
                    <RequirePerm perm="tickets:list">
                        <TicketsAdmin />
                    </RequirePerm>
                } />
                <Route path="*" element={<div className="card">404</div>} />
            </Routes>
        </div>
    );
}
