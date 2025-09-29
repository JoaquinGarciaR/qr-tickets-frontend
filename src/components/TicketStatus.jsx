// src/pages/TicketStatus.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Api } from "../api";

// Usa UNO de estos imports según tu proyecto:
// import ShareButtons from "@/components/ShareButtons";         // con alias @ -> src
import ShareButtons from "../components/ShareButtons.jsx";       // ruta relativa

export default function TicketStatus() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [err, setErr] = useState("");
    const canvasRef = useRef(null); // canvas oculto para generar el PNG

    useEffect(() => {
        let alive = true;
        Api.getTicket(id)
            .then((d) => alive && setData(d))
            .catch((e) => alive && setErr(e.message));
        return () => {
            alive = false;
        };
    }, [id]);

    if (err) return <div className="card"><p className="error">{err}</p></div>;
    if (!data) return <div className="card">Cargando...</div>;

    const {
        ticket_id,
        // qr_png_base64,
        valid,
        is_used,
        purchaser_name,
        event_id,
        event_at,
        created_at,
        expires_at,
        used_at,
        // puede que el backend no devuelva national_id/phone/event_date aquí; ajusta si los tienes
        national_id,
        phone,
        event_date
    } = data;

    // Objeto "ticket" que consumen las utils de compartir (buildTicketFile, etc.)
    const ticket = {
        ticket_id,
        // qr_png_base64,
        purchaser_name,
        national_id,
        phone,
        event_id,
        event_date,
        event_at,
        expires_at
    };

    return (
        <div className="card">
            <h2>Estado del ticket</h2>

            <p><strong>ID:</strong> <span style={{ wordBreak: "break-all" }}>{ticket_id}</span></p>
            <p><strong>Válido ahora:</strong> {valid ? "Sí" : "No"}</p>
            <p><strong>Usado:</strong> {is_used ? "Sí" : "No"}</p>
            <p><strong>Invitado:</strong> {purchaser_name || "-"}</p>
            <p><strong>Evento:</strong> {event_id || "-"}</p>
            <p><strong>Fecha:</strong> {event_at ? new Date(event_at).toLocaleString() : (event_date || "-")}</p>
            {expires_at && <p><strong>Vence:</strong> {new Date(expires_at).toLocaleString()}</p>}
            {used_at && <p><strong>Usado en:</strong> {new Date(used_at).toLocaleString()}</p>}
            <p><strong>Creado:</strong> {new Date(created_at).toLocaleString()}</p>

            {/*<div className="qr-wrap" style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>*/}
            {/*    <img*/}
            {/*        className="qr-img"*/}
            {/*        src={qr_png_base64}*/}
            {/*        alt="QR del ticket"*/}
            {/*        style={{ width: "80vw", maxWidth: 280, height: "auto", imageRendering: "pixelated" }}*/}
            {/*    />*/}
            {/*</div>*/}

            {/*/!* Botones de compartir (usa las utils de /shared y genera PNG con canvas) *!/*/}
            {/*<ShareButtons ticket={ticket} canvasRef={canvasRef} />*/}

            {/*/!* canvas oculto para renderizar el PNG del ticket *!/*/}
            {/*<canvas ref={canvasRef} style={{ display: "none" }} />*/}
        </div>
    );
}
