// src/components/ShareButtons.jsx
import React from "react";

import {
    shareNativeOrOpen,
    shareWhatsApp,
    shareTelegram,
    shareEmail,
    downloadTicketPng,
} from "../shared/share.jsx";


/** Iconos SVG simples */
const IconShare = (props) => (
    <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
    >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.8 11l6.6-3.3M8.8 13l6.6 3.3" />
    </svg>
);


const IconWA = (props) => (
  <svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true" {...props}>
    <path d="M19.11 17.83c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.87-.86 1.05-.16.18-.32.2-.59.07-.27-.14-1.12-.41-2.13-1.31-.79-.7-1.33-1.56-1.49-1.82-.16-.27-.02-.41.12-.54.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.54-.45-.47-.61-.48l-.52-.01c-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.27s.98 2.63 1.12 2.81c.14.18 1.93 2.95 4.68 4.14.65.28 1.16.45 1.56.58.65.21 1.24.18 1.71.11.52-.08 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32z" fill="currentColor"/>
    <path d="M16.01 3.2c-7.08 0-12.81 5.73-12.81 12.81 0 2.26.6 4.46 1.74 6.4L3 29l6.75-1.77a12.75 12.75 0 0 0 6.26 1.66h.01c7.08 0 12.81-5.73 12.81-12.81S23.09 3.2 16.01 3.2zm7.52 20.33c-1 1-2.17 1.79-3.48 2.33-1.35.57-2.79.86-4.27.86h-.01a10.94 10.94 0 0 1-5.59-1.53l-.4-.23-4 .99 1.06-3.9-.26-.4A10.93 10.93 0 0 1 5.08 9.2c1-1 2.17-1.79 3.48-2.33A10.9 10.9 0 0 1 16 5.99c2.93 0 5.68 1.14 7.75 3.22A10.94 10.94 0 0 1 23.53 23.53z" fill="currentColor"/>
  </svg>
);

const IconTG = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path d="M9.04 15.52 8.86 19c.36 0 .52-.15.71-.34l1.7-1.64 3.53 2.59c.65.36 1.11.17 1.29-.61l2.35-10.98c.21-.95-.34-1.32-.97-1.09L3.73 9.5c-.94.37-.93.9-.16 1.14l4.53 1.41 10.54-6.65-9.6 7.45z" fill="currentColor"/>
  </svg>
);

const IconMail = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path d="M4 6h16a2 2 0 0 1 2 2v.2l-10 6.25L2 8.2V8a2 2 0 0 1 2-2zm16 12H4a2 2 0 0 1-2-2V9.4l10 6.25 10-6.25V16a2 2 0 0 1-2 2z" fill="currentColor"/>
  </svg>
);

const IconDownload = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path d="M12 3v10.59l3.3-3.3 1.4 1.42L12 17.41 7.3 11.7l1.4-1.41 3.3 3.3V3h2zM5 19h14v2H5z" fill="currentColor"/>
  </svg>
);

export default function ShareButtons({ ticket, canvasRef }) {
  const btn = "inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition text-sm";
  const icon = { style: { marginRight: 4 } };

  return (
    <div className="share-row" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button
        className={btn}
        aria-label="Compartir"
        onClick={() => shareNativeOrOpen(ticket, canvasRef?.current)}
        title="Compartir"
      >
        <IconShare {...icon} /> Compartir
      </button>

      <button
        className={btn}
        aria-label="WhatsApp"
        onClick={() => shareWhatsApp(ticket, canvasRef?.current)}
        title="Enviar por WhatsApp"
      >
        <IconWA {...icon} /> WhatsApp
      </button>

      <button
        className={btn}
        aria-label="Telegram"
        onClick={() => shareTelegram(ticket)}
        title="Enviar por Telegram"
      >
        <IconTG {...icon} /> Telegram
      </button>

      <button
        className={btn}
        aria-label="Email"
        onClick={() => shareEmail(ticket)}
        title="Enviar por Email"
      >
        <IconMail {...icon} /> Email
      </button>

      <button
        className={btn}
        aria-label="Descargar PNG"
        onClick={() => downloadTicketPng(ticket, canvasRef?.current)}
        title="Descargar PNG"
      >
        <IconDownload {...icon} /> Descargar
      </button>
    </div>
  );
}
