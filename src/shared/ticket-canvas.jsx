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
// helpers extra de estilo / nitidez
function px(n) { return Math.round(n); }

function setupCanvasForDPR(canvas, w, h) {
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, dpr };
}

function drawRoundedRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}

function fillRounded(ctx, x, y, w, h, r, fillStyle, strokeStyle, lineWidth=1) {
    drawRoundedRect(ctx, x, y, w, h, r);
    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    if (strokeStyle && lineWidth) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }
}

function drawLabelValue(ctx, x, y, label, value) {
    ctx.fillStyle = "#7dd3fc";            // cyan-300
    ctx.font = "700 36px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    ctx.fillText(label, x, y);
    ctx.fillStyle = "#e2e8f0";            // slate-200
    ctx.font = "400 34px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    ctx.fillText(value, x + 220, y);      // alineación horizontal simple
}

function drawWrap(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text || "").split(/\s+/);
    let line = "";
    let cy = y;
    for (let i = 0; i < words.length; i++) {
        const test = line ? `${line} ${words[i]}` : words[i];
        const w = ctx.measureText(test).width;
        if (w > maxWidth && i) {
            ctx.fillText(line, x, cy);
            line = words[i];
            cy += lineHeight;
        } else {
            line = test;
        }
    }
    if (line) ctx.fillText(line, x, cy);
    return cy;
}

function formatLocal(dt) {
    try {
        const d = new Date(dt);
        if (!isNaN(d)) {
            return d.toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            });
        }
    } catch {}
    return dt || "";
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
                                            canvas, // opcional
                                        }) {
    // Tamaño “social / A6 vertical-like” (se ve bien en pantalla y print)
    const W = 1080;
    const H = 1580;

    const c = canvas || document.createElement("canvas");
    const { ctx } = setupCanvasForDPR(c, W, H);

    // Fondo: gradiente sutil oscuro
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0b1020");   // top
    g.addColorStop(1, "#0f172a");   // bottom (slate-900)
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Tarjeta principal flotante
    const CARD_X = 60;
    const CARD_Y = 60;
    const CARD_W = W - CARD_X * 2;
    const CARD_H = H - CARD_Y * 2;
    fillRounded(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, 36, "rgba(15,23,42,.9)", "rgba(100,116,139,.25)", 2);

    // Header (brand strip)
    const HEADER_H = 140;
    fillRounded(ctx, CARD_X, CARD_Y, CARD_W, HEADER_H, 28, "rgba(99,102,241,.18)"); // indigo-500/18
    // título
    ctx.fillStyle = "#e5edff";
    ctx.font = "800 56px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    ctx.fillText(event_id ? String(event_id) : "Ticket creado", CARD_X + 40, CARD_Y + 90);

    // “logo” QR mini (mismo estilo que tu UI)
    const iconX = CARD_X + CARD_W - 40 - 72;
    const iconY = CARD_Y + 34;
    fillRounded(ctx, iconX, iconY, 72, 72, 16, "rgba(99,102,241,.22)", "rgba(129,140,248,.35)", 1.5);
    // cuadritos
    ctx.fillStyle = "#c7d2fe";
    const s = 12, gap = 6;
    [[0,0],[2,0],[0,2]].forEach(([gx, gy])=>{
        ctx.fillRect(iconX+14 + gx*(s+gap), iconY+14 + gy*(s+gap), s, s);
    });
    ctx.fillRect(iconX+14 + 36, iconY+14 + 36, s, s);

    // padding interior
    const PAD = 48;
    let y = CARD_Y + HEADER_H + PAD;

    // Subtitulo
    ctx.fillStyle = "#a5b4fc";
    ctx.font = "600 34px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    ctx.fillText("Detalles del acceso", CARD_X + PAD, y);
    y += 26;

    // Separador
    ctx.strokeStyle = "rgba(148,163,184,.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(CARD_X + PAD, y + 16);
    ctx.lineTo(CARD_X + CARD_W - PAD, y + 16);
    ctx.stroke();
    y += 48;

    // Labels & values
    const L = CARD_X + PAD;
    const LABEL_GAP = 56;

    drawLabelValue(ctx, L, y, "ID", String(ticket_id || "-"));
    y += LABEL_GAP;

    if (purchaser_name) {
        drawLabelValue(ctx, L, y, "Invitado", String(purchaser_name));
        y += LABEL_GAP;
    }
    if (national_id) {
        drawLabelValue(ctx, L, y, "Cédula", String(national_id));
        y += LABEL_GAP;
    }
    if (phone) {
        drawLabelValue(ctx, L, y, "Teléfono", String(phone));
        y += LABEL_GAP;
    }

    const when = event_at ? formatLocal(event_at) : (event_date || "");
    if (when) {
        drawLabelValue(ctx, L, y, "Fecha evento", when);
        y += LABEL_GAP;
    }
    if (expires_at) {
        drawLabelValue(ctx, L, y, "Vence", formatLocal(expires_at));
        y += LABEL_GAP + 6;
    } else {
        y += 12;
    }

    // Caja QR (card con glow)
    const QR_SIDE = 820;
    const qrX = (W - QR_SIDE) / 2;
    const qrY = y;

    // glow
    const glow = ctx.createRadialGradient(W/2, qrY + QR_SIDE/2, QR_SIDE*0.1, W/2, qrY + QR_SIDE/2, QR_SIDE*0.62);
    glow.addColorStop(0, "rgba(99,102,241,.18)");
    glow.addColorStop(1, "rgba(99,102,241,0)");
    ctx.fillStyle = glow;
    fillRounded(ctx, qrX - 36, qrY - 36, QR_SIDE + 72, QR_SIDE + 72, 32, glow);

    // tarjeta QR
    fillRounded(ctx, qrX - 20, qrY - 20, QR_SIDE + 40, QR_SIDE + 40, 28, "#0b1020", "rgba(148,163,184,.28)", 2);

    // imagen QR
    const qrImg = await loadImage(qr_png_base64);
    ctx.imageSmoothingEnabled = false; // QR nítido
    ctx.drawImage(qrImg, qrX, qrY, QR_SIDE, QR_SIDE);

    // Footer hint
    const footerY = qrY + QR_SIDE + 80;
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "400 30px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    const hint = "Presenta este código en el ingreso";
    drawWrap(ctx, hint, CARD_X + PAD, footerY, CARD_W - PAD*2, 38);

    return c.toDataURL("image/png");
}
