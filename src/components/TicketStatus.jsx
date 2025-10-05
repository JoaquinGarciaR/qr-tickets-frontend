// src/pages/TicketStatus.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Api } from "../api";
import ShareButtons from "../components/ShareButtons.jsx"; // ruta relativa

export default function TicketStatus() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [err, setErr] = useState("");
    const canvasRef = useRef(null);

    useEffect(() => {
        let alive = true;
        Api.getTicket(id)
            .then((d) => alive && setData(d))
            .catch((e) => alive && setErr(e.message));
        return () => { alive = false; };
    }, [id]);

    if (err) {
        return (
            <div className="rounded-2xl bg-slate-900 p-6 shadow-lg border border-slate-700">
                <p className="text-red-400 font-medium">{err}</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="rounded-2xl bg-slate-900 p-6 shadow-lg border border-slate-700">
                <p className="text-slate-300">Cargando...</p>
            </div>
        );
    }

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
        national_id,
        phone,
        event_date
    } = data;

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
        <div className="rounded-2xl bg-slate-900 p-6 shadow-lg border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">
                Estado del ticket
            </h2>

            <div className="space-y-2 text-slate-300">
                <p><span className="font-semibold text-slate-100">ID:</span>{" "}
                    <span className="break-words">{ticket_id}</span>
                </p>
                <p><span className="font-semibold text-slate-100">Válido ahora:</span>{" "}
                    <span className={valid ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                        {valid ? "Sí" : "No"}
                    </span>
                </p>
                <p><span className="font-semibold text-slate-100">Usado:</span>{" "}
                    <span className={is_used ? "text-yellow-400" : "text-sky-400"}>
                        {is_used ? "Sí" : "No"}
                    </span>
                </p>
                <p><span className="font-semibold text-slate-100">Invitado:</span> {purchaser_name || "-"}</p>
                <p><span className="font-semibold text-slate-100">Evento:</span> {event_id || "-"}</p>
                <p><span className="font-semibold text-slate-100">Fecha:</span>{" "}
                    {event_at ? new Date(event_at).toLocaleString() : (event_date || "-")}
                </p>
                {expires_at && (
                    <p><span className="font-semibold text-slate-100">Vence:</span>{" "}
                        {new Date(expires_at).toLocaleString()}
                    </p>
                )}
                {used_at && (
                    <p><span className="font-semibold text-slate-100">Usado en:</span>{" "}
                        {new Date(used_at).toLocaleString()}
                    </p>
                )}
                <p><span className="font-semibold text-slate-100">Creado:</span>{" "}
                    {new Date(created_at).toLocaleString()}
                </p>
            </div>

            {/*
            <div className="flex justify-center my-6">
                <img
                    className="w-72 max-w-full rounded-xl border border-slate-700 shadow-md"
                    src={qr_png_base64}
                    alt="QR del ticket"
                    style={{ imageRendering: "pixelated" }}
                />
            </div>

            <ShareButtons ticket={ticket} canvasRef={canvasRef} />

            <canvas ref={canvasRef} style={{ display: "none" }} />
            */}
        </div>
    );
}
