// src/components/Scanner.jsx
import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Api } from "../api";

export default function Scanner() {
    const videoRef = useRef(null);
    const codeReaderRef = useRef(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [manual, setManual] = useState("");
    const [active, setActive] = useState(false);

    useEffect(() => {
        const codeReader = new BrowserMultiFormatReader();
        codeReaderRef.current = codeReader;

        async function start() {
            setError("");
            try {
                // Selecciona la cámara trasera si existe
                const devices = await BrowserMultiFormatReader.listVideoInputDevices();
                const backCam = devices.find(d =>
                    /back|rear|environment/i.test(d.label)
                ) || devices[0];

                if (!backCam) {
                    setError("No se encontró cámara.");
                    return;
                }

                setActive(true);
                await codeReader.decodeFromVideoDevice(
                    backCam.deviceId,
                    videoRef.current,
                    async (res, err, controls) => {
                        if (res) {
                            // Evita múltiples lecturas seguidas
                            controls.stop();
                            setActive(false);
                            try {
                                const r = await Api.validate(res.getText());
                                setResult(r);
                                setError("");
                            } catch (e) {
                                setResult(null);
                                setError(e.message || "Error validando");
                            }
                        }
                    }
                );
            } catch (e) {
                setError(e.message || "No se pudo iniciar el escáner");
            }
        }

        start();

        return () => {
            try {
                codeReader.reset();
            } catch { /* empty */ }
        };
    }, []);

    async function validateManual() {
        if (!manual.trim()) return;
        try {
            const r = await Api.validate(manual.trim());
            setResult(r);
            setError("");
        } catch (e) {
            setResult(null);
            setError(e.message || "Error validando");
        }
    }

    return (
        <div className="card">
            <h2>Escanear y validar</h2>

            <div className="scanner" style={{ aspectRatio: "16/9", background: "#000" }}>
                <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%" }} />
            </div>

            {!active && (
                <button onClick={() => window.location.reload()}>
                    Reiniciar escáner
                </button>
            )}

            <div className="manual">
                <label>Texto del QR (opcional)</label>
                <textarea rows={3} value={manual} onChange={e=>setManual(e.target.value)} />
                <button onClick={validateManual}>Validar texto</button>
            </div>

            {error && <p className="error">{error}</p>}

            {result && (
                <div className={`result ${result.valid ? "ok" : "bad"}`}>
                    <h3>{result.valid ? "✅ Ticket válido" : "❌ Ticket inválido"}</h3>
                    {result.ticket_id && <p><strong>ID:</strong> {result.ticket_id}</p>}
                    {result.purchaser_name && <p><strong>Invitado:</strong> {result.purchaser_name}</p>}
                    {result.event_id && <p><strong>Evento:</strong> {result.event_id}</p>}
                    {result.used_at && <p><strong>Usado en:</strong> {new Date(result.used_at).toLocaleString()}</p>}
                    {result.reason && <p><strong>Motivo:</strong> {result.reason}</p>}
                </div>
            )}
        </div>
    );
}
