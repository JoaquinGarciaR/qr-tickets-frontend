import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Api } from "../api";

export default function TicketStatus() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [err, setErr] = useState("");

    useEffect(() => {
        let alive = true;
        Api.getTicket(id)
            .then(d => alive && setData(d))
            .catch(e => alive && setErr(e.message));
        return () => { alive = false; };
    }, [id]);

    if (err) return <div className="card"><p className="error">{err}</p></div>;
    if (!data) return <div className="card">Cargando...</div>;

    const {
        ticket_id, valid, is_used, purchaser_name, event_id,event_at,
        created_at, expires_at, used_at
    } = data;

    return (
        <div className="card">
            <h2>Estado del ticket</h2>
            <p><strong>ID:</strong> {ticket_id}</p>
            <p><strong>Válido ahora:</strong> {valid ? "Sí" : "No"}</p>
            <p><strong>Usado:</strong> {is_used ? "Sí" : "No"}</p>
            <p><strong>Invitado:</strong> {purchaser_name}</p>
            <p><strong>Evento:</strong> {event_id}</p>
            <p><strong>Fecha:</strong> {new Date(event_at).toLocaleString()}</p>
            {expires_at && <p><strong>Vence:</strong> {new Date(expires_at).toLocaleString()}</p>}
            {used_at && <p><strong>Usado en:</strong> {new Date(used_at).toLocaleString()}</p>}
            <p ><strong>Creado:</strong> {new Date(created_at).toLocaleString()}</p>
        </div>
    );
}
