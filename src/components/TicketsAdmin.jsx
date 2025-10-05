import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Api } from "../api";
import { useAuth } from "../auth/AuthContext";

/** Badge pill (ok = usado) */
function Pill({ ok, text }) {
    return (
        <span
            className={[
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                ok
                    ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-300/30"
                    : "bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-300/30",
                "whitespace-nowrap",
            ].join(" ")}
        >
      {text}
    </span>
    );
}

export default function TicketsAdmin() {
    const { perms } = useAuth();
    const canList = perms.includes("tickets:list");
    const navigate = useNavigate();

    const [summary, setSummary] = useState({ total: 0, used: 0, unused: 0 });
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [usedFilter, setUsedFilter] = useState("all"); // all|used|unused
    const [q, setQ] = useState("");
    const [qLive, setQLive] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingList, setLoadingList] = useState(true);
    const [err, setErr] = useState("");

    // Debounce simple para búsqueda
    useEffect(() => {
        const t = setTimeout(() => setQ(qLive.trim()), 300);
        return () => clearTimeout(t);
    }, [qLive]);

    const usedParam = useMemo(() => {
        if (usedFilter === "used") return true;
        if (usedFilter === "unused") return false;
        return undefined;
    }, [usedFilter]);

    async function loadSummary() {
        const s = await Api.ticketsSummary();
        setSummary(s);
    }

    async function loadList() {
        const r = await Api.ticketsList({
            page,
            page_size: pageSize,
            used: usedParam,
            q,
        });
        setItems(r.items || []);
        // opcional: podrías usar r.total/r.used/r.unused para no volver a pedir summary
    }

    async function refreshAll() {
        try {
            setLoading(true);
            setLoadingList(true);
            setErr("");
            await Promise.all([loadSummary(), loadList()]);
        } catch (e) {
            setErr(e.message || "Error cargando datos");
        } finally {
            setLoading(false);
            setLoadingList(false);
        }
    }

    // Carga inicial y cuando cambian filtros/paginación
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoadingList(true);
                setErr("");
                if (mounted && page === 1) await loadSummary();
                if (mounted) await loadList();
            } catch (e) {
                if (mounted) setErr(e.message || "Error cargando");
            } finally {
                if (mounted) setLoadingList(false);
            }
        })();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, usedParam, q]);

    if (!canList) {
        return (
            <section className="bg-slate-950 text-white">
                <div className="mx-auto w-full max-w-screen-xl 2xl:max-w-screen-2xl 3xl:max-w-[1800px] 4k:max-w-[2200px] px-4 sm:px-6 lg:px-8 py-10">
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 text-slate-200 shadow-2xl">
                        No tienes permiso: <code className="text-slate-300">tickets:list</code>
                    </div>
                </div>
            </section>
        );
    }

    const isBusy = loading || loadingList;

    return (
        <section className="bg-slate-950 text-white">
            <div className="mx-auto w-full max-w-screen-xl 2xl:max-w-screen-2xl 3xl:max-w-[1800px] 4k:max-w-[2200px] px-4 sm:px-6 lg:px-8 py-10">
                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="m-0 text-xl font-bold md:text-2xl">Entradas</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={refreshAll}
                                disabled={isBusy}
                                title="Volver a cargar"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-600/70 bg-slate-800/70 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span className={`${isBusy ? "animate-spin" : ""}`}>🔄</span>
                                {isBusy ? "Actualizando…" : "Actualizar"}
                            </button>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-700/60 bg-slate-900 p-4">
                            <div className="text-xs text-slate-400">Total</div>
                            <div className="text-2xl font-bold text-slate-100">{summary.total}</div>
                        </div>
                        <div className="rounded-xl border border-emerald-700/50 bg-emerald-500/5 p-4">
                            <div className="text-xs text-emerald-300/80">Usadas</div>
                            <div className="text-2xl font-bold text-emerald-300">{summary.used}</div>
                        </div>
                        <div className="rounded-xl border border-cyan-700/50 bg-cyan-500/5 p-4">
                            <div className="text-xs text-cyan-300/80">No usadas</div>
                            <div className="text-2xl font-bold text-cyan-300">{summary.unused}</div>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        <input
                            placeholder="Buscar (nombre, cédula, evento, ID)…"
                            value={qLive}
                            onChange={(e) => {
                                setPage(1);
                                setQLive(e.target.value);
                            }}
                            className="min-w-[240px] flex-1 rounded-xl border border-slate-700/60 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                        />
                        <select
                            value={usedFilter}
                            onChange={(e) => {
                                setPage(1);
                                setUsedFilter(e.target.value);
                            }}
                            className="rounded-xl border border-slate-700/60 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                        >
                            <option value="all">Todas</option>
                            <option value="unused">No usadas</option>
                            <option value="used">Usadas</option>
                        </select>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPage(1);
                                setPageSize(parseInt(e.target.value, 10));
                            }}
                            className="rounded-xl border border-slate-700/60 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    {/* Tabla */}
                    <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-slate-700/60">
                        <table className="min-w-[980px] w-full border-collapse text-sm">
                            <thead className="bg-slate-800/70 text-slate-200 sticky top-0">
                            <tr>
                                {[
                                    "#",
                                    "Estado",
                                    "Ticket ID",
                                    "Nombre",
                                    "Cédula",
                                    "Teléfono",
                                    "Evento",
                                    "Fecha evento",
                                    "Creado por",
                                    "Validado por",
                                    "Creado",
                                    "Usado",
                                ].map((h) => (
                                    <th key={h} className="px-3 py-2 text-left font-semibold">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/60">
                            {loadingList ? (
                                <tr>
                                    <td colSpan={12} className="px-3 py-6 text-center text-slate-300">
                                        Cargando…
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className="px-3 py-6 text-center text-slate-300">
                                        Sin resultados
                                    </td>
                                </tr>
                            ) : (
                                items.map((row) => (
                                    <tr
                                        key={row.ticket_id}
                                        className="hover:bg-slate-800/40"
                                        onClick={(e) => {
                                            if (e.target.closest && e.target.closest("a")) return;
                                            navigate(`/ticket/${row.ticket_id}`);
                                        }}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td className="px-3 py-2">{row.n}</td>
                                        <td className="px-3 py-2">
                                            <Pill ok={row.is_used} text={row.is_used ? "Usada" : "No usada"} />
                                        </td>
                                        <td className="px-3 py-2 break-all">
                                            <Link
                                                to={`/ticket/${row.ticket_id}`}
                                                className="text-indigo-300 hover:text-indigo-200"
                                            >
                                                {row.ticket_id}
                                            </Link>
                                        </td>
                                        <td className="px-3 py-2">{row.purchaser_name}</td>
                                        <td className="px-3 py-2">{row.national_id}</td>
                                        <td className="px-3 py-2">{row.phone}</td>
                                        <td className="px-3 py-2">{row.event_id}</td>
                                        <td className="px-3 py-2">{row.event_date}</td>
                                        <td className="px-3 py-2">{row.created_by}</td>
                                        <td className="px-3 py-2">{row.validated_by || "-"}</td>
                                        <td className="px-3 py-2">
                                            {new Date(row.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-3 py-2">
                                            {row.used_at ? new Date(row.used_at).toLocaleString() : "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="rounded-xl border border-slate-600/70 px-3 py-2 text-sm font-semibold hover:bg-slate-900/50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Anterior
                        </button>
                        <span className="text-sm text-slate-300">Página {page}</span>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={items.length < pageSize}
                            title={items.length < pageSize ? "Fin de resultados" : "Siguiente"}
                            className="rounded-xl border border-slate-600/70 px-3 py-2 text-sm font-semibold hover:bg-slate-900/50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Siguiente
                        </button>
                    </div>

                    {err && (
                        <p className="mt-3 rounded-lg border border-rose-300/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                            {err}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
