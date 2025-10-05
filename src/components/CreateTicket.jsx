import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Api } from "../api";

function two(n){ return String(n).padStart(2,"0"); }

function getHalloweenDefaults() {
    const now = new Date();
    const Y = now.getFullYear();
    const MM_EVENT = 10;
    const DD_EVENT = 25;
    const HH = 20;
    const min = 0;

    const eventLocal = new Date(Y, MM_EVENT - 1, DD_EVENT, HH, min, 0);
    const expireLocal = new Date(eventLocal.getTime() + 24*60*60*1000);

    const toLocalInput = (d) =>
        `${d.getFullYear()}-${two(d.getMonth()+1)}-${two(d.getDate())}T${two(d.getHours())}:${two(d.getMinutes())}`;

    return {
        eventDate: `${Y}-${two(MM_EVENT)}-${two(DD_EVENT)}`,
        eventAtLocal: toLocalInput(eventLocal),
        expiresAtLocal: toLocalInput(expireLocal),
    };
}

export default function CreateTicket() {
    const nav = useNavigate();
    const defaults = useMemo(() => getHalloweenDefaults(), []);

    const [purchaser_name, setName] = useState("");
    const [event_id, setEvent] = useState("Halloween Party Batara");
    const [national_id, setCedula] = useState("");
    const [phone, setPhone] = useState("");

    // NUEVO: fecha+hora del evento
    const [event_at, setEventAt] = useState(defaults.eventAtLocal);
    // Compat backend
    const [event_date, setEventDate] = useState(defaults.eventDate);
    // Expiración opcional
    const [expires_at, setExpires] = useState(defaults.expiresAtLocal);

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

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
            event_at.trim().length >= 16,
        [purchaser_name, event_id, national_id, event_date, event_at]
    );

    const toIsoOrNull = (local) => {
        if (!local) return null;
        const d = new Date(local);
        if (isNaN(d.getTime())) return null;
        return d.toISOString();
    };

    async function onSubmit(e) {
        e.preventDefault();
        setErr("");
        if (!canSubmit) return setErr("Revisa los campos obligatorios.");

        setLoading(true);
        try {
            const payload = {
                purchaser_name: purchaser_name.trim(),
                event_id: event_id.trim(),
                national_id: national_id.trim(),
                phone: phone.trim() || null,
                event_date,                       // YYYY-MM-DD (compat)
                event_at: toIsoOrNull(event_at),  // UTC ISO
                expires_at: toIsoOrNull(expires_at),
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
        <section className="bg-slate-950 text-white">
            <div className="mx-auto w-full max-w-screen-xl 2xl:max-w-screen-2xl 3xl:max-w-[1800px] 4k:max-w-[2200px] px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
                <div className="mx-auto max-w-2xl">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold md:text-3xl">Crear ticket</h1>
                        <p className="mt-1 text-sm text-slate-400">
                            Completa los datos del invitado y define la fecha del evento.
                        </p>
                    </div>

                    <form onSubmit={onSubmit} noValidate
                          className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* Nombre */}
                            <div className="md:col-span-2">
                                <label className="block text-sm text-slate-300">Nombre del invitado *</label>
                                <input
                                    value={purchaser_name}
                                    onChange={(e)=>setName(e.target.value)}
                                    required
                                    placeholder="Ej: Juan Pérez"
                                    className="mt-1 w-full rounded-xl border border-slate-700/60 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                                />
                            </div>

                            {/* Cédula */}
                            <div>
                                <label className="block text-sm text-slate-300">Cédula *</label>
                                <input
                                    value={national_id}
                                    onChange={(e)=>setCedula(e.target.value)}
                                    required
                                    placeholder="Ej: 1-2345-6789"
                                    className="mt-1 w-full rounded-xl border border-slate-700/60 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                                />
                            </div>

                            {/* Teléfono */}
                            <div>
                                <label className="block text-sm text-slate-300">Teléfono (opcional)</label>
                                <input
                                    value={phone}
                                    onChange={(e)=>setPhone(e.target.value)}
                                    inputMode="tel"
                                    placeholder="Ej: 88888888"
                                    className="mt-1 w-full rounded-xl border border-slate-700/60 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                                />
                            </div>

                            {/* Evento */}
                            <div className="md:col-span-2">
                                <label className="block text-sm text-slate-300">ID de evento *</label>
                                <input
                                    value={event_id}
                                    onChange={(e)=>setEvent(e.target.value)}
                                    required
                                    placeholder="Ej: Halloween Batara"
                                    className="mt-1 w-full rounded-xl border border-slate-700/60 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                                />
                            </div>

                            {/* Fecha compat */}
                            <div>
                                <label className="block text-sm text-slate-300">Fecha del evento *</label>
                                <input
                                    type="date"
                                    value={event_date}
                                    onChange={(e)=>setEventDate(e.target.value)}
                                    required
                                    className="mt-1 w-full rounded-xl border border-slate-700/60 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                                />
                            </div>

                            {/* Fecha+hora exacta */}
                            <div>
                                <label className="block text-sm text-slate-300">Fecha y hora del evento *</label>
                                <input
                                    type="datetime-local"
                                    value={event_at}
                                    onChange={(e)=>setEventAt(e.target.value)}
                                    required
                                    className="mt-1 w-full rounded-xl border border-slate-700/60 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                                />
                                <p className="mt-1 text-xs text-slate-400">Se enviará en UTC automático al backend.</p>
                            </div>

                            {/* Expira */}
                            <div className="md:col-span-2">
                                <label className="block text-sm text-slate-300">Vence (opcional)</label>
                                <input
                                    type="datetime-local"
                                    value={expires_at}
                                    onChange={(e)=>setExpires(e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-slate-700/60 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                                />
                                <p className="mt-1 text-xs text-slate-400">Por defecto: 24 horas después del evento.</p>
                            </div>
                        </div>

                        {err && (
                            <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                                {err}
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={()=>nav(-1)}
                                className="rounded-xl border border-slate-600/70 px-4 py-2 text-sm font-semibold hover:bg-slate-900/50"
                            >
                                Cancelar
                            </button>
                            <button
                                disabled={loading || !canSubmit}
                                className="rounded-xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loading ? "Creando..." : "Crear"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}
