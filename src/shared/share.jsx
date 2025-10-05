// src/shared/share.js
import { dataUrlToBlob, generateTicketPNG } from "./ticket-canvas.jsx";

/* ------------------------ helpers de entorno ------------------------ */
const isIOS = () =>
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !window.MSStream;

const isSafari = () =>
    typeof navigator !== "undefined" &&
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/** Abre imagen para guardar en iOS (sin download), o fuerza descarga en otros. */
function openOrDownload(blob, filename) {
    const url = URL.createObjectURL(blob);

    // iOS Safari ignora a.download → abrimos en pestaña nueva para "Guardar imagen"
    if (isIOS() && isSafari()) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
    }

    // Resto: usar descarga directa
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Liberar url poco después
    setTimeout(() => URL.revokeObjectURL(url), 15000);
}

/* ------------------------ generadores base ------------------------ */
export async function buildTicketFile(ticket, canvas) {
    const dataUrl = await generateTicketPNG({ ...ticket, canvas });
    const blob = dataUrlToBlob(dataUrl);
    const filename = `ticket-${ticket.ticket_id}.png`;
    const file = new File([blob], filename, { type: "image/png" });
    return { file, filename, dataUrl, blob };
}

export function buildShareText(ticket) {
    const {
        event_id,
        ticket_id,
        purchaser_name,
        national_id,
        phone,
        event_date,
        event_at,
        expires_at,
    } = ticket;

    return (
        `🎟️ ${event_id || "Ticket"}\n` +
        `ID: ${ticket_id}\n` +
        (purchaser_name ? `Invitado: ${purchaser_name}\n` : "") +
        (national_id ? `Cédula: ${national_id}\n` : "") +
        (phone ? `Tel: ${phone}\n` : "") +
        (event_at
            ? `Fecha evento: ${new Date(event_at).toLocaleString()}\n`
            : event_date
                ? `Fecha evento: ${event_date}\n`
                : "") +
        (expires_at ? `Vence: ${new Date(expires_at).toLocaleString()}\n` : "")
    );
}

/* ------------------------ share helpers ------------------------ */
// Estados posibles:
// "shared"     -> share nativo completó.
// "aborted"    -> usuario canceló; NO hacer fallback molesto.
// "unsupported"-> no hay share nativo disponible.
// "failed"     -> error real; usar fallback.

async function tryNativeShare({ title, text, file }) {
    if (typeof navigator === "undefined" || !navigator.share) {
        return "unsupported";
    }

    const tryWithFilesFirst =
        !!file &&
        (
            (navigator.canShare &&
                (() => {
                    try {
                        return navigator.canShare({ files: [file] });
                    } catch {
                        return false;
                    }
                })()) ||
            !navigator.canShare // iOS share sin canShare
        );

    try {
        if (tryWithFilesFirst) {
            await navigator.share({ title, text, files: [file] });
            return "shared";
        }
    } catch (err) {
        // Si el usuario canceló, NO hagamos fallback
        if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) {
            return "aborted";
        }
        // Si no soporta files, probamos sin ellos
    }

    // Intento sin archivos
    try {
        await navigator.share({ title, text });
        return "shared";
    } catch (err) {
        if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) {
            return "aborted";
        }
        return "failed";
    }
}

/* ------------------------ flujos de compartir ------------------------ */

/**
 * Share general: intenta nativo con archivo; si no, abre o descarga imagen.
 */
export async function shareNativeOrOpen(ticket, canvas) {
    const { file, blob, filename } = await buildTicketFile(ticket, canvas);
    const title = `${ticket.event_id || "Ticket"} ${ticket.ticket_id}`;
    const text = buildShareText(ticket);

    const status = await tryNativeShare({ title, text, file });

    if (status === "shared" || status === "aborted") {
        // shared -> todo bien; aborted -> usuario canceló, no molestamos.
        return status === "shared";
    }

    if (status === "unsupported" || status === "failed") {
        openOrDownload(blob, filename);
        return false;
    }
}

/**
 * WhatsApp: primero intenta nativo; si no, usa deep-link (sin archivo).
 */
export async function shareWhatsApp(ticket, canvas) {
    const { file } = await buildTicketFile(ticket, canvas);
    const title = `${ticket.event_id || "Ticket"}`;
    const text = buildShareText(ticket);

    const status = await tryNativeShare({ title, text, file });

    if (status === "shared" || status === "aborted") return;

    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
}

/**
 * Telegram: usa deep-link directo con texto.
 */
export async function shareTelegram(ticket) {
    const text = buildShareText(ticket);
    const tg = `https://t.me/share/url?url=${encodeURIComponent("")}&text=${encodeURIComponent(
        text
    )}`;
    window.open(tg, "_blank", "noopener,noreferrer");
}

/**
 * Email: primero intenta nativo; si no, mailto con texto.
 */
export async function shareEmail(ticket, canvas) {
    const { file } = await buildTicketFile(ticket, canvas);
    const subject = `${ticket.event_id || "Ticket"} ${ticket.ticket_id}`;
    const body = buildShareText(ticket);

    const status = await tryNativeShare({ title: subject, text: body, file });

    if (status === "shared" || status === "aborted") return;

    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        body
    )}`;
    window.location.href = mailto;
}

/**
 * Descarga directa o abre para guardar en iOS.
 */
export async function downloadTicketPng(ticket, canvas) {
    const { blob, filename } = await buildTicketFile(ticket, canvas);
    openOrDownload(blob, filename);
}
