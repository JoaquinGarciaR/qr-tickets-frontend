// src/shared/share.js
import { dataUrlToBlob, generateTicketPNG } from "./ticket-canvas.jsx";

/** Crea File del ticket listo para compartir/descargar */
export async function buildTicketFile(ticket, canvas) {
    const dataUrl = await generateTicketPNG({ ...ticket, canvas });
    const blob = dataUrlToBlob(dataUrl);
    const filename = `ticket-${ticket.ticket_id}.png`;
    const file = new File([blob], filename, { type: "image/png" });
    return { file, filename, dataUrl, blob };
}

/** Texto estándar del ticket para compartir */
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

/** ¿El navegador puede compartir archivos con Web Share API? */
export function canNativeShareFiles(file) {
    return typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: file ? [file] : [] });
}

/** Compartir nativo (si se puede), si no, fallback a abrir PNG en nueva pestaña */
export async function shareNativeOrOpen(ticket, canvas) {
    const { file, dataUrl } = await buildTicketFile(ticket, canvas);
    const text = buildShareText(ticket);
    const title = `${ticket.event_id || "Ticket"} ${ticket.ticket_id}`;

    if (canNativeShareFiles(file)) {
        try {
            await navigator.share({ title, text, files: [file] });
            return true;
        } catch {
            // usuario canceló o error → seguiremos al fallback
        }
    }
    window.open(dataUrl, "_blank", "noopener,noreferrer");
    return false;
}

/** WhatsApp con texto (deep-link). Si soporta share nativo, lo usa primero. */
export async function shareWhatsApp(ticket, canvas) {
    const { file } = await buildTicketFile(ticket, canvas);
    const text = buildShareText(ticket);

    if (canNativeShareFiles(file)) {
        try {
            await navigator.share({ title: `${ticket.event_id || "Ticket"}`, text, files: [file] });
            return;
        } catch {}
    }
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
}

/** Telegram */
export async function shareTelegram(ticket) {
    const text = buildShareText(ticket);
    const tg = `https://t.me/share/url?url=${encodeURIComponent("")}&text=${encodeURIComponent(text)}`;
    window.open(tg, "_blank", "noopener,noreferrer");
}

/** Email */
export async function shareEmail(ticket) {
    const subject = `${ticket.event_id || "Ticket"} ${ticket.ticket_id}`;
    const body = buildShareText(ticket);
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
}

/** Descargar imagen localmente */
export async function downloadTicketPng(ticket, canvas) {
    const { dataUrl, filename } = await buildTicketFile(ticket, canvas);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
}
