// src/pages/TicketCreated.jsx
import React, { useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import ShareButtons from "./ShareButtons.jsx";

export default function TicketCreated() {
    const { state } = useLocation();
    if (!state) return <div className="card">No hay datos de ticket.</div>;

    const {
        ticket_id,
        qr_ciphertext,
        qr_png_base64,
        expires_at,
        purchaser_name,
        event_id,
        national_id,
        phone,
        event_date,
        event_at
    } = state;

    const canvasRef = useRef(null);

    const ticket = {
        ticket_id,
        qr_png_base64,
        purchaser_name,
        national_id,
        phone,
        event_id,
        event_date,
        event_at,
        expires_at,
    };

    return (
        <div className="ticket-card">
            <h2 className="ticket-title">{event_id || "Ticket creado"}</h2>

            <p className="ticket-meta"><span className="label">ID:</span>{" "}
                <span className="id" style={{ wordBreak: "break-all" }}>{ticket_id}</span>
            </p>

            <p className="ticket-meta"><span className="label">Invitado:</span> {purchaser_name || "-"}</p>
            <p className="ticket-meta"><span className="label">Cédula:</span> {national_id || "-"}</p>
            {phone && <p className="ticket-meta"><span className="label">Tel:</span> {phone}</p>}
            {(event_at || event_date) && (
                <p className="ticket-meta">
                    <span className="label">Fecha evento:</span>{" "}
                    {event_at ? new Date(event_at).toLocaleString() : event_date}
                </p>
            )}
            {expires_at && (
                <p className="ticket-meta"><span className="label">Vence:</span> {new Date(expires_at).toLocaleString()}</p>
            )}

            <div className="qr-wrap" style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
                <img
                    className="qr-img"
                    src={qr_png_base64}
                    alt="QR del ticket"
                    style={{ width: "80vw", maxWidth: 280, height: "auto", imageRendering: "pixelated" }}
                />
            </div>

            {/* Botones de compartir (utils compartidas + logos) */}
            <ShareButtons ticket={ticket} canvasRef={canvasRef} />

            {/* canvas oculto para renderizar el PNG */}
            <canvas ref={canvasRef} style={{ display: "none" }} />

            <details style={{ marginTop: 12 }}>
                <summary>Ver texto cifrado</summary>
                <textarea readOnly rows={3} value={qr_ciphertext} style={{ width: "100%" }} />
            </details>

            <div className="row" style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <Link className="btn" to={`/ticket/${ticket_id}`}>Ver estado</Link>
                <Link className="btn" to="/escanear">Ir a escanear</Link>
            </div>
        </div>
    );
}
