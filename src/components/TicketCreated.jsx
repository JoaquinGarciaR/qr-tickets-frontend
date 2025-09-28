import React, { useRef } from "react";
import { useLocation, Link } from "react-router-dom";

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function dataUrlToBlob(dataUrl) {
    const [meta, b64] = dataUrl.split(",");
    const mime = (meta.match(/data:(.*?);base64/) || [])[1] || "image/png";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

export default function TicketCreated() {
    const { state } = useLocation();
    if (!state) return <div className="card">No hay datos de ticket.</div>;

    // Nuevos campos devueltos por el backend
    const {
        ticket_id,
        qr_ciphertext,
        qr_png_base64,
        expires_at,          // opcional
        purchaser_name,
        event_id,
        national_id,         // cédula
        phone,               // opcional
        event_date,          // "YYYY-MM-DD"
        event_at
    } = state;

    const canvasRef = useRef(null);

    // Dibuja el ticket y devuelve dataURL PNG
    async function generateTicketPNG() {
        const width = 1080;
        const height = 1500; // un poco más alto para texto extra

        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        // Fondo
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        const marginX = 64;
        let y = 90;

        // Título (evento si existe, si no "Ticket creado")
        ctx.fillStyle = "#0f172a";
        ctx.font = "700 64px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
        ctx.fillText(event_id ? event_id : "Ticket creado", marginX, y);
        y += 40;

        // Línea separadora
        y += 28;
        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(marginX, y, width - marginX * 2, 4);
        y += 56;

        // ID
        ctx.fillStyle = "#0b61d6";
        ctx.font = "700 40px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
        ctx.fillText("ID:", marginX, y);
        ctx.fillStyle = "#0f172a";
        ctx.font = "400 34px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
        ctx.fillText(ticket_id, marginX + 80, y);
        y += 50;

        // Nombre
        if (purchaser_name) {
            ctx.fillStyle = "#0b61d6";
            ctx.font = "700 40px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
            ctx.fillText("Invitado:", marginX, y);
            ctx.fillStyle = "#0f172a";
            ctx.font = "400 36px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
            ctx.fillText(purchaser_name, marginX + 170, y);
            y += 50;
        }

        // Cédula
        if (national_id) {
            ctx.fillStyle = "#0b61d6";
            ctx.font = "700 40px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
            ctx.fillText("Cédula:", marginX, y);
            ctx.fillStyle = "#0f172a";
            ctx.font = "400 36px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
            ctx.fillText(national_id, marginX + 140, y);
            y += 50;
        }

        // Teléfono (opcional)
        if (phone) {
            ctx.fillStyle = "#0b61d6";
            ctx.font = "700 40px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
            ctx.fillText("Tel:", marginX, y);
            ctx.fillStyle = "#0f172a";
            ctx.font = "400 36px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
            ctx.fillText(phone, marginX + 90, y);
            y += 50;
        }

        // Fecha de evento
        if (event_at) {
            ctx.fillStyle = "#0b61d6";
            ctx.font = "700 40px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
            ctx.fillText("Fecha evento:", marginX, y);
            ctx.fillStyle = "#0f172a";
            ctx.font = "400 36px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
            ctx.fillText(event_at, marginX + 260, y);
            y += 50;
        }

        // Vence (opcional)
        if (expires_at) {
            ctx.fillStyle = "#0b61d6";
            ctx.font = "700 40px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
            ctx.fillText("Vence:", marginX, y);
            ctx.fillStyle = "#0f172a";
            ctx.font = "400 34px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
            ctx.fillText(new Date(expires_at).toLocaleString(), marginX + 140, y);
            y += 56;
        }

        // Caja y QR
        const qrBoxSize = 800;
        const qrX = (width - qrBoxSize) / 2;
        const qrY = y + 16;

        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(qrX - 24, qrY - 24, qrBoxSize + 48, qrBoxSize + 48);
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 2;
        ctx.strokeRect(qrX - 24, qrY - 24, qrBoxSize + 48, qrBoxSize + 48);

        const qrImg = await loadImage(qr_png_base64);
        ctx.drawImage(qrImg, qrX, qrY, qrBoxSize, qrBoxSize);

        // Pie
        const footerY = qrY + qrBoxSize + 80;
        ctx.fillStyle = "#64748b";
        ctx.font = "400 28px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
        ctx.fillText("Presenta este código en el ingreso", marginX, footerY);

        return canvas.toDataURL("image/png");
    }

    async function handleDownload() {
        const dataUrl = await generateTicketPNG();
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `ticket-${ticket_id}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    async function handleShare() {
        const dataUrl = await generateTicketPNG();
        const blob = dataUrlToBlob(dataUrl);
        const file = new File([blob], `ticket-${ticket_id}.png`, { type: "image/png" });

        const text =
            `🎟️ ${event_id || "Ticket"}\n` +
            `ID: ${ticket_id}\n` +
            (purchaser_name ? `Invitado: ${purchaser_name}\n` : "") +
            (national_id ? `Cédula: ${national_id}\n` : "") +
            (phone ? `Tel: ${phone}\n` : "") +
            (event_date ? `Fecha evento: ${event_date}\n` : "") +
            (expires_at ? `Vence: ${new Date(expires_at).toLocaleString()}\n` : "");

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ title: `${event_id || "Ticket"} ${ticket_id}`, text, files: [file] });
                return;
            } catch {}
        }
        window.open(dataUrl, "_blank", "noopener,noreferrer");
    }

    async function handleShareWhatsApp() {
        const dataUrl = await generateTicketPNG();
        const blob = dataUrlToBlob(dataUrl);
        const file = new File([blob], `ticket-${ticket_id}.png`, { type: "image/png" });

        const text =
            `🎟️ ${event_id || "Ticket"}\n` +
            `ID: ${ticket_id}\n` +
            (purchaser_name ? `Invitado: ${purchaser_name}\n` : "") +
            (national_id ? `Cédula: ${national_id}\n` : "") +
            (phone ? `Tel: ${phone}\n` : "") +
            (event_date ? `Fecha evento: ${event_date}\n` : "") +
            (expires_at ? `Vence: ${new Date(expires_at).toLocaleString()}\n` : "");

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ title: `${event_id || "Ticket"} ${ticket_id}`, text, files: [file] });
                return;
            } catch {}
        }
        const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(wa, "_blank", "noopener,noreferrer");
    }

    return (
        <div className="ticket-card">
            <h2 className="ticket-title">{event_id || "Ticket creado"}</h2>
            <p className="ticket-meta"><span className="label">ID:</span> <span className="id"
                                                                                style={{wordBreak: "break-all"}}>{ticket_id}</span>
            </p>

            <p className="ticket-meta"><span className="label">Invitado:</span> {purchaser_name || "-"}</p>
            <p className="ticket-meta"><span className="label">Cédula:</span> {national_id || "-"}</p>
            {phone && <p className="ticket-meta"><span className="label">Tel:</span> {phone}</p>}
            {event_date && <p className="ticket-meta"><span
                className="label">Fecha evento:</span> {new Date(event_at).toLocaleString()}</p>}
            {expires_at && (
                <p className="ticket-meta"><span className="label">Vence:</span> {new Date(expires_at).toLocaleString()}
                </p>
            )}

            <div className="qr-wrap" style={{display: "flex", justifyContent: "center", margin: "12px 0"}}>
                <img
                    className="qr-img"
                    src={qr_png_base64}
                    alt="QR del ticket"
                    style={{width: "80vw", maxWidth: 280, height: "auto", imageRendering: "pixelated"}}
                />
            </div>

            <div className="row" style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
                <button onClick={handleDownload}>⬇️ Descargar imagen</button>
                <button onClick={handleShare}>📤 Compartir</button>
                <button onClick={handleShareWhatsApp}>🟢 WhatsApp</button>
            </div>

            {/* canvas oculto para renderizar el PNG */}
            <canvas ref={canvasRef} style={{display: "none"}}/>

            <details style={{marginTop: 12}}>
                <summary>Ver texto cifrado</summary>
                <textarea readOnly rows={3} value={qr_ciphertext} style={{width: "100%"}}/>
            </details>

            <div className="row" style={{marginTop: 12, display: "flex", gap: 8}}>
                <Link className="btn" to={`/ticket/${ticket_id}`}>Ver estado</Link>
                <Link className="btn" to="/escanear">Ir a escanear</Link>
            </div>
        </div>
    );
}
