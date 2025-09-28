import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Api } from "../api";
import { useAuth } from "../auth/AuthContext";

function Pill({ ok, text }) {
    return (
        <span
            style={{
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                color: ok ? "#065f46" : "#7c2d12",
                background: ok ? "#d1fae5" : "#fee2e2",
                border: `1px solid ${ok ? "#10b981" : "#ef4444"}`,
                whiteSpace: "nowrap",
            }}
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
    const [loading, setLoading] = useState(false);          // ⬅️ arranca en false
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
            setLoading(true);       // estado del botón
            +   setLoadingList(true);   // también muestra "Cargando…" en la tabla
            setErr("");
            await Promise.all([loadSummary(), loadList()]);
        } catch (e) {
            setErr(e.message || "Error cargando datos");
        } finally {
            setLoading(false);
            +   setLoadingList(false);
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
            <div className="card">
                No tienes permiso: <code>tickets:list</code>
            </div>
        );
    }

    const isBusy = loading || loadingList;

    return (
        <div className="card" style={{ overflow: "hidden" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                }}
            >
                <h2 style={{ margin: 0 }}>Entradas</h2>
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        type="button"                    // ⬅️ clave en móvil si hay un <form> arriba
                        onClick={refreshAll}
                        onTouchStart={() => {
                        }}          // ⬅️ opcional: elimina el delay de tap en algunos navegadores
                        disabled={isBusy}
                        title="Volver a cargar"
                    >
                        {isBusy ? "Actualizando…" : "🔄 Actualizar"}
                    </button>


                </div>
            </div>

            {/* Resumen */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 8,
                    marginTop: 12,
                }}
            >
                <div className="kpi">
                    <div className="kpi-title">Total</div>
                    <div className="kpi-value">{summary.total}</div>
                </div>
                <div className="kpi">
                    <div className="kpi-title">Usadas</div>
                    <div className="kpi-value">{summary.used}</div>
                </div>
                <div className="kpi">
                    <div className="kpi-title">No usadas</div>
                    <div className="kpi-value">{summary.unused}</div>
                </div>
            </div>

            {/* Filtros */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginTop: 12,
                    flexWrap: "wrap",
                }}
            >
                <input
                    placeholder="Buscar (nombre, cédula, evento, ID)…"
                    value={qLive}
                    onChange={(e) => {
                        setPage(1);
                        setQLive(e.target.value);
                    }}
                    style={{ flex: "1 1 240px" }}
                />
                <select
                    value={usedFilter}
                    onChange={(e) => {
                        setPage(1);
                        setUsedFilter(e.target.value);
                    }}
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
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>

            {/* Tabla */}
            <div style={{ marginTop: 12, overflowX: "auto" }}>
                <table className="tbl">
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Estado</th>
                        <th>Ticket ID</th>
                        <th>Nombre</th>
                        <th>Cédula</th>
                        <th>Evento</th>
                        <th>Fecha evento</th>
                        <th>Creado por</th>
                        <th>Validado por</th>
                        <th>Creado</th>
                        <th>Usado</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loadingList ? (
                        <tr>
                            <td colSpan={11}>Cargando…</td>
                        </tr>
                    ) : items.length === 0 ? (
                        <tr>
                            <td colSpan={11}>Sin resultados</td>
                        </tr>
                    ) : (
                        items.map((row) => (
                            <tr
                                key={row.ticket_id}
                                onClick={(e) => {
                                    if ((e.target).closest && (e.target).closest("a")) return;
                                    navigate(`/ticket/${row.ticket_id}`);
                                }}
                                style={{ cursor: "pointer" }}
                            >
                                <td>{row.n}</td>
                                <td>
                                    <Pill
                                        ok={row.is_used}
                                        text={row.is_used ? "Usada" : "No usada"}
                                    />
                                </td>
                                <td style={{ wordBreak: "break-all" }}>
                                    <Link
                                        to={`/ticket/${row.ticket_id}`}
                                        style={{ color: "#2563eb", textDecoration: "none" }}
                                    >
                                        {row.ticket_id}
                                    </Link>
                                </td>

                                <td>{row.purchaser_name}</td>
                                <td>{row.national_id}</td>
                                <td>{row.event_id}</td>
                                <td>{row.event_date}</td>
                                <td>{row.created_by}</td>
                                <td>{row.validated_by || "-"}</td>
                                <td>{new Date(row.created_at).toLocaleString()}</td>
                                <td>
                                    {row.used_at
                                        ? new Date(row.used_at).toLocaleString()
                                        : "-"}
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Paginación simple */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    justifyContent: "flex-end",
                    marginTop: 12,
                }}
            >
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Anterior
                </button>
                <span>Página {page}</span>
                <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={items.length < pageSize}
                    title={items.length < pageSize ? "Fin de resultados" : "Siguiente"}
                >
                    Siguiente
                </button>
            </div>

            {err && (
                <p className="error" style={{ marginTop: 8 }}>
                    {err}
                </p>
            )}
        </div>
    );
}
