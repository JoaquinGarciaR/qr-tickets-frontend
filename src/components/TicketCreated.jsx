import React, { useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import ShareButtons from "./ShareButtons.jsx";

export default function TicketCreated() {
    const { state } = useLocation();
    if (!state) {
        return (
            <section className="bg-slate-950 text-white">
                <div className="mx-auto w-full max-w-screen-md px-4 sm:px-6 lg:px-8 py-12">
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 text-slate-200 shadow-2xl">
                        No hay datos de ticket.
                    </div>
                </div>
            </section>
        );
    }

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
        event_at,
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
        <section className="bg-slate-950 text-white">
            <div className="mx-auto w-full max-w-screen-lg px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
                {/* Card principal */}
                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl font-bold md:text-2xl">
                            {event_id || "Ticket creado"}
                        </h2>
                        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">
                            Listo para compartir
                        </div>
                    </div>

                    {/* Metadatos */}
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Meta label="ID">
                            <span className="break-all text-indigo-300">{ticket_id}</span>
                        </Meta>
                        <Meta label="Invitado">{purchaser_name || "-"}</Meta>
                        <Meta label="Cédula">{national_id || "-"}</Meta>
                        {phone ? <Meta label="Teléfono">{phone}</Meta> : null}
                        {(event_at || event_date) && (
                            <Meta label="Fecha evento">
                                {event_at ? new Date(event_at).toLocaleString() : event_date}
                            </Meta>
                        )}
                        {expires_at && (
                            <Meta label="Vence">
                                {new Date(expires_at).toLocaleString()}
                            </Meta>
                        )}
                    </div>

                    {/* Separador */}
                    <div className="my-6 h-px w-full bg-slate-700/60" />

                    {/* QR + Share */}
                    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
                        {/* QR */}
                        <div className="flex justify-center">
                            <div className="rounded-2xl border border-slate-700/60 bg-slate-950 p-4 shadow-inner">
                                <img
                                    src={qr_png_base64}
                                    alt="QR del ticket"
                                    className="block h-auto w-[min(80vw,320px)] image-pixelated"
                                    style={{ imageRendering: "pixelated" }}
                                />
                            </div>
                        </div>

                        {/* Botones compartir */}
                        <div className="rounded-2xl border border-slate-700/60 bg-slate-900 p-4">
                            <h3 className="mb-3 text-sm font-semibold text-slate-300">
                                Compartir
                            </h3>
                            <ShareButtons ticket={ticket} canvasRef={canvasRef} />

                            {/* canvas oculto para render PNG */}
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Texto cifrado (details estilizado) */}
                            <details className="mt-5 group">
                                <summary className="cursor-pointer list-none rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-slate-800">
                                    Ver texto cifrado
                                </summary>
                                <div className="mt-3">
                  <textarea
                      readOnly
                      rows={3}
                      value={qr_ciphertext}
                      className="h-28 w-full resize-y rounded-xl border border-slate-700/60 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                                </div>
                            </details>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <Link
                            to={`/ticket/${ticket_id}`}
                            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                        >
                            Ver estado
                        </Link>
                        <Link
                            to="/escanear"
                            className="rounded-xl border border-slate-600/70 px-4 py-2 text-sm font-semibold hover:bg-slate-900/50"
                        >
                            Ir a escanear
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

/** Subcomponente para los pares label: valor */
function Meta({ label, children }) {
    return (
        <p className="ticket-meta m-0">
      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
            <span className="text-sm text-slate-200">{children}</span>
        </p>
    );
}
