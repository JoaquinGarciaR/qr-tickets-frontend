import React, { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Api } from "../api";

export default function Scanner() {
    const videoRef = useRef(null);
    const codeReaderRef = useRef(null);
    const controlsRef = useRef(null);
    const streamRef = useRef(null);

    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [manual, setManual] = useState("");
    const [active, setActive] = useState(false);

    const stopScanner = useCallback(() => {
        try {
            controlsRef.current?.stop();
            controlsRef.current = null;
        } catch {}
        try {
            const video = videoRef.current;
            if (video?.srcObject) {
                video.srcObject.getTracks().forEach((t) => t.stop());
                video.srcObject = null;
            }
        } catch {}
        streamRef.current = null;
        setActive(false);
    }, []);

    const pickBackCamera = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true });
        } catch {}
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!devices || devices.length === 0) return null;
        return (
            devices.find((d) => /back|rear|environment/i.test(d.label)) ||
            devices[devices.length - 1] ||
            devices[0]
        ).deviceId;
    };

    const startScanner = useCallback(async () => {
        if (!videoRef.current) return;
        setError("");
        setResult(null);
        stopScanner();

        try {
            const codeReader =
                codeReaderRef.current || new BrowserMultiFormatReader();
            codeReaderRef.current = codeReader;

            const deviceId = await pickBackCamera();
            if (!deviceId) {
                setError("No se encontró cámara.");
                return;
            }

            setActive(true);

            await codeReader.decodeFromVideoDevice(
                deviceId,
                videoRef.current,
                async (res, err, controls) => {
                    if (controls && !controlsRef.current) {
                        controlsRef.current = controls;
                    }
                    if (videoRef.current && videoRef.current.srcObject && !streamRef.current) {
                        streamRef.current = videoRef.current.srcObject;
                    }

                    if (res) {
                        stopScanner();
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
            setError(e?.message || "No se pudo iniciar el escáner");
            setActive(false);
        }
    }, [stopScanner]);

    useEffect(() => {
        startScanner();
        return () => {
            stopScanner();
            try {
                codeReaderRef.current?.reset();
            } catch {}
        };
    }, [startScanner, stopScanner]);

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
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            </div>

            {!active && (
                <button onClick={startScanner} style={{ marginTop: 8 }}>
                    Reiniciar escáner
                </button>
            )}

            <div className="manual" style={{ marginTop: 12 }}>
                <label>Texto del QR (opcional)</label>
                <textarea
                    rows={3}
                    value={manual}
                    onChange={(e) => setManual(e.target.value)}
                />
                <button onClick={validateManual}>Validar texto</button>
            </div>

            {error && <p className="error">{error}</p>}

            {result && (
                <div className={`result ${result.valid ? "ok" : "bad"}`}>
                    <h3>{result.valid ? "✅ Ticket válido" : "❌ Ticket inválido"}</h3>
                    {result.ticket_id && <p><strong>ID:</strong> {result.ticket_id}</p>}
                    {result.purchaser_name && <p><strong>Invitado:</strong> {result.purchaser_name}</p>}
                    {result.event_id && <p><strong>Evento:</strong> {result.event_id}</p>}
                    {result.used_at && (
                        <p><strong>Usado en:</strong> {new Date(result.used_at).toLocaleString()}</p>
                    )}
                    {result.reason && <p><strong>Motivo:</strong> {result.reason}</p>}
                </div>
            )}
        </div>
    );
}
