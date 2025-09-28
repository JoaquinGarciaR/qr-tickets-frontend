import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Api } from "../api";

function two(n){ return String(n).padStart(2,"0"); }

function getHalloweenDefaults() {
    const now = new Date();
    const Y = now.getFullYear();   // año actual
    const MM_EVENT = 10;           // octubre (1-12)
    const DD_EVENT = 25;
    const HH = 20;                 // 8 pm
    const min = 0;

    const eventLocal = new Date(Y, MM_EVENT - 1, DD_EVENT, HH, min, 0); // hora local
    const expireLocal = new Date(eventLocal.getTime() + 24*60*60*1000); // +1 día

    const toLocalInput = (d) =>
        `${d.getFullYear()}-${two(d.getMonth()+1)}-${two(d.getDate())}T${two(d.getHours())}:${two(d.getMinutes())}`;

    return {
        eventDate: `${Y}-${two(MM_EVENT)}-${two(DD_EVENT)}`, // "YYYY-MM-DD" (compat backend)
        eventAtLocal: toLocalInput(eventLocal),              // "YYYY-MM-DDTHH:mm"
        expiresAtLocal: toLocalInput(expireLocal),           // "YYYY-MM-DDTHH:mm"
    };
}

export default function CreateTicket() {
    const nav = useNavigate();
    const defaults = useMemo(() => getHalloweenDefaults(), []);

    const [purchaser_name, setName] = useState("");
    const [event_id, setEvent] = useState("Halloween Batara");
    const [national_id, setCedula] = useState("");
    const [phone, setPhone] = useState("");

    // Nuevo: fecha+hora del evento
    const [event_at, setEventAt] = useState(defaults.eventAtLocal);

    // Aún enviamos event_date por compat (el backend lo usa y también guarda event_at)
    const [event_date, setEventDate] = useState(defaults.eventDate);

    // Expiración opcional (por defecto, +24h del evento)
    const [expires_at, setExpires] = useState(defaults.expiresAtLocal);

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // Si cambia event_at, proponemos expires_at = event_at + 24h
    useEffect(() => {
        if (!event_at) return;
        const d = new Date(event_at);
        if (isNaN(d)) return;
        const plus1day = new Date(d.getTime() + 24*60*60*1000);
        const toLocalInput = (x) =>
            `${x.getFullYear()}-${two(x.getMonth()+1)}-${two(x.getDate())}T${two(x.getHours())}:${two(x.getMinutes())}`;
        setExpires(toLocalInput(plus1day));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event_at]);

    const canSubmit = useMemo(
        () =>
            purchaser_name.trim().length > 1 &&
            event_id.trim().length > 0 &&
            national_id.trim().length > 4 &&
            event_date.trim().length === 10 &&
            event_at.trim().length >= 16, // necesitamos fecha y hora
        [purchaser_name, event_id, national_id, event_date, event_at]
    );

    const toIsoOrNull = (local) => {
        if (!local) return null;
        const d = new Date(local);              // interpreta en zona local del navegador
        if (isNaN(d.getTime())) return null;
        return d.toISOString();                 // envía en UTC ISO8601 (el backend normaliza a UTC)
    };

    async function onSubmit(e) {
        e.preventDefault();
        setErr("");
        if (!canSubmit) {
            setErr("Revisa los campos obligatorios.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                purchaser_name: purchaser_name.trim(),
                event_id: event_id.trim(),
                national_id: national_id.trim(),
                phone: phone.trim() || null,
                event_date,                      // "YYYY-MM-DD" (compat)
                event_at: toIsoOrNull(event_at), // NUEVO: fecha+hora del evento → UTC ISO
                expires_at: toIsoOrNull(expires_at), // opcional
            };

            const ticket = await Api.createTicket(payload);
            nav("/creado", { state: ticket });
        } catch (e) {
            setErr(e.message || "Error creando ticket");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="card">
            <h2>Crear ticket</h2>
            <form onSubmit={onSubmit} className="form" noValidate>
                <label>Nombre del invitado *</label>
                <input
                    value={purchaser_name}
                    onChange={(e)=>setName(e.target.value)}
                    required
                    placeholder="Ej: Juan Pérez"
                />

                <label>Cédula *</label>
                <input
                    value={national_id}
                    onChange={(e)=>setCedula(e.target.value)}
                    required
                    placeholder="Ej: 1-2345-6789"
                />

                <label>Teléfono (opcional)</label>
                <input
                    value={phone}
                    onChange={(e)=>setPhone(e.target.value)}
                    inputMode="tel"
                    placeholder="Ej: 88888888"
                />

                <label>ID de evento *</label>
                <input
                    value={event_id}
                    onChange={(e)=>setEvent(e.target.value)}
                    required
                    placeholder="Ej: Halloween Batara"
                />

                {/* Compat: solo fecha (backend aún la usa) */}
                <label>Fecha del evento *</label>
                <input
                    type="date"
                    value={event_date}
                    onChange={(e)=>setEventDate(e.target.value)}
                    required
                />

                {/* NUEVO: fecha y hora exacta del evento */}
                <label>Fecha y hora del evento *</label>
                <input
                    type="datetime-local"
                    value={event_at}
                    onChange={(e)=>setEventAt(e.target.value)}
                    required
                />
                <small>Se enviará en UTC automático al backend.</small>

                <label>Vence (opcional)</label>
                <input
                    type="datetime-local"
                    value={expires_at}
                    onChange={(e)=>setExpires(e.target.value)}
                />
                <small>Por defecto: 24 horas después del evento.</small>

                <button disabled={loading || !canSubmit}>
                    {loading ? "Creando..." : "Crear"}
                </button>
                {err && <p className="error">{err}</p>}
            </form>
        </div>
    );
}
