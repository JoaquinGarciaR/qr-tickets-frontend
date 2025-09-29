// src/shared/ticket-canvas.jsx
export function dataUrlToBlob(dataUrl) {
    const [meta, b64] = dataUrl.split(",");
    const mime = (meta.match(/data:(.*?);base64/) || [])[1] || "image/png";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Genera un PNG (dataURL) del ticket usando el QR base64 y metadatos.
 * Reutilizable en cualquier pantalla.
 */
export async function generateTicketPNG({
                                            ticket_id,
                                            qr_png_base64,
                                            purchaser_name,
                                            national_id,
                                            phone,
                                            event_id,
                                            event_date,
                                            event_at,
                                            expires_at,
                                            canvas, // opcional: si quieres inyectar un <canvas> externo
                                        }) {
    const width = 1080;
    const height = 1500;

    const c = canvas || document.createElement("canvas");
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d");

    // Fondo
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const marginX = 64;
    let y = 90;

    // Título
    ctx.fillStyle = "#0f172a";
    ctx.font = "700 64px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    ctx.fillText(event_id ? event_id : "Ticket creado", marginX, y);
    y += 68;

    // Línea separadora
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(marginX, y, width - marginX * 2, 4);
    y += 56;

    // Helper texto
    const label = (t) => {
        ctx.fillStyle = "#0b61d6";
        ctx.font = "700 40px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
        ctx.fillText(t, marginX, y);
    };
    const value = (t, off = 0) => {
        ctx.fillStyle = "#0f172a";
        ctx.font = "400 36px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
        ctx.fillText(t, marginX + off, y);
    };

    // ID
    label("ID:");
    value(ticket_id, 80);
    y += 50;

    if (purchaser_name) {
        label("Invitado:");
        value(purchaser_name, 170);
        y += 50;
    }
    if (national_id) {
        label("Cédula:");
        value(national_id, 140);
        y += 50;
    }
    if (phone) {
        label("Tel:");
        value(phone, 90);
        y += 50;
    }
    if (event_at) {
        label("Fecha evento:");
        value(new Date(event_at).toLocaleString(), 260);
        y += 50;
    } else if (event_date) {
        label("Fecha evento:");
        value(event_date, 260);
        y += 50;
    }
    if (expires_at) {
        label("Vence:");
        ctx.fillStyle = "#0f172a";
        ctx.font = "400 34px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
        ctx.fillText(new Date(expires_at).toLocaleString(), marginX + 140, y);
        y += 56;
    }

    // Caja + QR
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

    return c.toDataURL("image/png");
}
