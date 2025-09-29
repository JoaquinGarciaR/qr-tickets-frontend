const BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

let _token = null;
export function setToken(t) { _token = t || null; }
export function getToken() { return _token; }

async function http(method, path, body) {
    const headers = {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "ok",   // ⬅️ este es el header clave
    };
    if (_token) headers["Authorization"] = `Bearer ${_token}`;

    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const txt = await res.text().catch(() => "");
    let data = null; try { data = txt ? JSON.parse(txt) : null; } catch {}
    if (!res.ok) {
        const err = new Error((data && (data.detail || data.message)) || txt || `HTTP ${res.status}`);
        err.status = res.status; err.body = txt; err.json = data;
        throw err;
    }
    return data;
}

export const Api = {
    // auth
    login: (username, password) => http("POST", "/login", { username, password }),
    logout: () => http("POST", "/logout", null),
    me: () => http("GET", "/me", null),

    // tickets
    createTicket: (payload) => http("POST", "/tickets", payload),
    validate: (qr) => http("POST", "/validate", { qr }),
    validatePeek: (qr) => http("POST", "/validate/peek", { qr }),
    getTicket: (id) => http("GET", `/tickets/${id}`),
    health: () => http("GET", "/health"),
    ticketsSummary: () => http("GET", "/tickets/summary"),
    ticketsList: ({ page = 1, page_size = 50, used = undefined, q = "" } = {}) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", String(page_size));
        if (q) params.set("q", q);
        if (used !== undefined && used !== null) params.set("used", String(!!used));
        return http("GET", `/tickets/list?${params.toString()}`);
    },
};
