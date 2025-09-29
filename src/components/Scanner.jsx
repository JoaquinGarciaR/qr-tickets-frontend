// src/pages/Scanner.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
// Hints opcionales si tienes @zxing/library instalado (mejor precisión)
// npm i @zxing/library
let ZXHints = null;
try {
    // Carga perezosa para no romper si no está instalada
    // eslint-disable-next-line import/no-extraneous-dependencies
    ZXHints = require("@zxing/library");
} catch {}

import { Api } from "../api";

export default function Scanner() {
    const videoRef = useRef(null);
    const codeReaderRef = useRef(null);
    const controlsRef = useRef(null);
    const streamRef = useRef(null);
    const imageCaptureRef = useRef(null);
    const wakeLockRef = useRef(null);
    const rafScanRef = useRef(null);
    const canvasRef = useRef(null);
    const abortScanLoop = useRef(false);

    const [mode, setMode] = useState("peek"); // "peek" | "validate"
    const modeRef = useRef(mode);

    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [manual, setManual] = useState("");
    const [active, setActive] = useState(false);
    const [busy, setBusy] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // UX extra
    const [torchOn, setTorchOn] = useState(false);
    const [usingNative, setUsingNative] = useState(false);

    // Mantén la ref sincronizada
    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);

    // ---- helpers de cámara/energía ----
    const requestWakeLock = useCallback(async () => {
        try {
            if ("wakeLock" in navigator && navigator.wakeLock?.request) {
                wakeLockRef.current = await navigator.wakeLock.request("screen");
                wakeLockRef.current.addEventListener("release", () => {
                    wakeLockRef.current = null;
                });
            }
        } catch {}
    }, []);

    const releaseWakeLock = useCallback(() => {
        try {
            wakeLockRef.current?.release();
            wakeLockRef.current = null;
        } catch {}
    }, []);

    const stopScanner = useCallback(() => {
        try {
            abortScanLoop.current = true;
            if (rafScanRef.current) {
                cancelAnimationFrame(rafScanRef.current);
                rafScanRef.current = null;
            }
        } catch {}
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
        imageCaptureRef.current = null;
        setActive(false);
        releaseWakeLock();
    }, [releaseWakeLock]);

    const pickBackCamera = useCallback(async () => {
        try {
            // pre-permiso para lograr labels
            await navigator.mediaDevices.getUserMedia({ video: true });
        } catch {}
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!devices || devices.length === 0) return null;
        return (
            devices.find((d) => /back|rear|environment/i.test(d.label)) ||
            devices[devices.length - 1] ||
            devices[0]
        ).deviceId;
    }, []);

    // Encender/apagar torch si existe
    const setTorch = useCallback(
        async (on) => {
            try {
                const stream = streamRef.current;
                if (!stream) return false;
                const track = stream.getVideoTracks()[0];
                if (!track) return false;
                const capabilities = track.getCapabilities?.();
                if (!capabilities || !("torch" in capabilities)) return false;
                await track.applyConstraints({ advanced: [{ torch: !!on }] });
                setTorchOn(!!on);
                return true;
            } catch {
                return false;
            }
        },
        [setTorchOn]
    );

    // ROI centrado (reduce trabajo del detector)
    const getROI = (w, h) => {
        // ventana 70% del menor lado
        const side = Math.floor(Math.min(w, h) * 0.7);
        const x = Math.floor((w - side) / 2);
        const y = Math.floor((h - side) / 2);
        return { x, y, width: side, height: side };
    };

    // ---- NATIVE BARCODEDETECTOR SCAN LOOP ----
    const startNativeLoop = useCallback(async () => {
        if (!("BarcodeDetector" in window)) return false;

        let formats = ["qr_code"];
        try {
            const supported = await window.BarcodeDetector.getSupportedFormats?.();
            if (supported?.length) {
                // usa solo QR si está disponible; sino cae a todo
                formats = supported.includes("qr_code") ? ["qr_code"] : supported;
            }
        } catch {}

        const detector = new window.BarcodeDetector({ formats });
        setUsingNative(true);

        const loop = async () => {
            if (abortScanLoop.current) return;
            const video = videoRef.current;
            if (!video || video.readyState < 2) {
                rafScanRef.current = requestAnimationFrame(loop);
                return;
            }

            try {
                // recorta en canvas para ROI
                const vw = video.videoWidth;
                const vh = video.videoHeight;
                if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
                const canvas = canvasRef.current;
                const ctx = canvas.getContext("2d", { willReadFrequently: true });

                const roi = getROI(vw, vh);
                canvas.width = roi.width;
                canvas.height = roi.height;
                ctx.drawImage(video, roi.x, roi.y, roi.width, roi.height, 0, 0, roi.width, roi.height);

                // Usa ImageBitmap para acelerar en navegadores modernos
                let bitmap = null;
                try {
                    bitmap = await createImageBitmap(canvas);
                } catch {
                    bitmap = canvas; // fallback
                }

                const barcodes = await detector.detect(bitmap);
                if (barcodes?.length) {
                    const text = barcodes[0].rawValue || barcodes[0].displayValue;
                    if (text) {
                        setBusy(true);
                        stopScanner(); // pausa mientras validamos/mostramos
                        try {
                            const r =
                                modeRef.current === "validate"
                                    ? await Api.validate(text)
                                    : await Api.validatePeek(text);
                            setResult(r);
                            setError("");
                            setShowModal(true);
                        } catch (e) {
                            setResult(null);
                            setError(e?.message || "Error validando");
                            setShowModal(true);
                        } finally {
                            setBusy(false);
                        }
                        return; // salimos del loop
                    }
                }
            } catch (err) {
                // errores esporádicos del detector; continua
            }

            rafScanRef.current = requestAnimationFrame(loop);
        };

        abortScanLoop.current = false;
        rafScanRef.current = requestAnimationFrame(loop);
        return true;
    }, [stopScanner]);

    // ---- ZXING LOOP (fallback) ----
    const startZXing = useCallback(async (deviceId) => {
        setUsingNative(false);
        const reader =
            codeReaderRef.current ||
            new BrowserMultiFormatReader(
                ZXHints
                    ? new ZXHints.Hints()
                    : undefined
            );

        // Configura hints si @zxing/library está disponible
        if (ZXHints && reader?.hints) {
            try {
                reader.hints.set(ZXHints.DecodeHintType.TRY_HARDER, true);
                reader.hints.set(ZXHints.DecodeHintType.POSSIBLE_FORMATS, [ZXHints.BarcodeFormat.QR_CODE]);
            } catch {}
        }

        codeReaderRef.current = reader;

        await reader.decodeFromVideoDevice(
            deviceId,
            videoRef.current,
            async (res, err, controls) => {
                if (controls && !controlsRef.current) controlsRef.current = controls;
                const video = videoRef.current;
                if (video?.srcObject && !streamRef.current) {
                    streamRef.current = video.srcObject;
                    // prepara ImageCapture para torch si se puede
                    try {
                        const track = streamRef.current.getVideoTracks()[0];
                        imageCaptureRef.current = new window.ImageCapture(track);
                    } catch {}
                }
                if (!res || busy) return; // back-pressure

                setBusy(true);
                stopScanner();
                try {
                    const text = res.getText();
                    const r =
                        modeRef.current === "validate"
                            ? await Api.validate(text)
                            : await Api.validatePeek(text);
                    setResult(r);
                    setError("");
                    setShowModal(true);
                } catch (e) {
                    setResult(null);
                    setError(e?.message || "Error validando");
                    setShowModal(true);
                } finally {
                    setBusy(false);
                }
            }
        );
    }, [busy, stopScanner]);

    // ---- START SCANNER (elige nativo o ZXing) ----
    const startScanner = useCallback(async () => {
        if (!videoRef.current || busy || active) return;

        setError("");
        setResult(null);
        stopScanner(); // limpia cualquier residuo previo

        try {
            const deviceId = await pickBackCamera();

            // intenta abrir la cámara con buenos constraints
            const constraints = deviceId
                ? {
                    video: {
                        deviceId: { exact: deviceId },
                        facingMode: { ideal: "environment" },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        frameRate: { ideal: 30, max: 60 },
                        focusMode: "continuous",
                        zoom: { ideal: 1 },
                        // reduce consumo en iOS
                        advanced: [{ exposureMode: "continuous" }],
                    },
                    audio: false,
                }
                : {
                    video: {
                        facingMode: { ideal: "environment" },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        frameRate: { ideal: 30, max: 60 },
                        focusMode: "continuous",
                    },
                    audio: false,
                };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = videoRef.current;
            video.srcObject = stream;
            streamRef.current = stream;

            // aplica pequeños ajustes posteriores si son soportados
            try {
                const track = stream.getVideoTracks()[0];
                const caps = track.getCapabilities?.();
                const cons = track.getConstraints?.() || {};
                const advanced = [];
                if (caps?.focusMode?.includes?.("continuous")) advanced.push({ focusMode: "continuous" });
                if (caps?.zoom) advanced.push({ zoom: Math.min(caps.zoom.max || 1, 1.5) });
                if (advanced.length) await track.applyConstraints({ ...cons, advanced });
            } catch {}

            setActive(true);
            await requestWakeLock();

            // Espera a que el video “corra”
            await new Promise((r) => {
                video.onloadeddata = () => r();
            });

            // 1) intento nativo
            const okNative = await startNativeLoop();
            if (!okNative) {
                // 2) fallback ZXing
                await startZXing(deviceId || undefined);
            }
        } catch (e) {
            setError(e?.message || "No se pudo iniciar el escáner");
            setActive(false);
            releaseWakeLock();
        }
    }, [
        pickBackCamera,
        startNativeLoop,
        startZXing,
        busy,
        active,
        stopScanner,
        requestWakeLock,
        releaseWakeLock,
    ]);

    // Auto-start al montar
    useEffect(() => {
        startScanner();
        return () => {
            try {
                codeReaderRef.current?.reset();
            } catch {}
            stopScanner();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Pausa cuando la pestaña no está visible, reanuda al volver
    useEffect(() => {
        const onVis = () => {
            if (document.visibilityState === "hidden") {
                stopScanner();
            } else if (!showModal) {
                startScanner();
            }
        };
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, [startScanner, stopScanner, showModal]);

    // Cierra modal y reinicia cámara
    const closeModalAndRestart = useCallback(() => {
        setShowModal(false);
        setResult(null);
        setError("");
        setTimeout(() => startScanner(), 80);
    }, [startScanner]);

    // Escape para cerrar
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape" && showModal) {
                e.preventDefault();
                closeModalAndRestart();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showModal, closeModalAndRestart]);

    async function validateManual() {
        if (!manual.trim() || busy) return;
        setBusy(true);
        setError("");
        setResult(null);
        try {
            const fn = modeRef.current === "validate" ? Api.validate : Api.validatePeek;
            const r = await fn(manual.trim());
            setResult(r);
            setShowModal(true);
        } catch (e) {
            setResult(null);
            setError(e?.message || "Error validando");
            setShowModal(true);
        } finally {
            setBusy(false);
        }
    }

    // ---- UI helpers ----
    const Switch = ({ checked, onChange }) => (
        <button
            type="button"
            onClick={() => {
                if (busy) return;
                const next = !checked;
                modeRef.current = next ? "validate" : "peek";
                setMode(next ? "validate" : "peek");
            }}
            aria-pressed={checked}
            style={{
                width: 54,
                height: 30,
                borderRadius: 999,
                border: "1px solid #cbd5e1",
                background: checked ? "#22c55e" : "#e2e8f0",
                position: "relative",
                transition: "background .2s",
                opacity: busy ? 0.6 : 1,
                cursor: busy ? "not-allowed" : "pointer",
            }}
            title={checked ? "Validar (consume)" : "Solo verificar"}
        >
      <span
          style={{
              position: "absolute",
              top: 3,
              left: checked ? 28 : 3,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 1px 2px rgba(0,0,0,.15)",
              transition: "left .2s",
          }}
      />
        </button>
    );

    const ModeBadge = () => (
        <div
            style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: mode === "validate" ? "rgba(16,185,129,.9)" : "rgba(59,130,246,.9)",
                color: "#fff",
                padding: "6px 10px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.3,
                display: "flex",
                alignItems: "center",
                gap: 8,
            }}
        >
            <span>{mode === "validate" ? "VALIDAR (consume)" : "SOLO VERIFICAR"}</span>
            <span
                style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 999,
                    background: "rgba(0,0,0,.25)",
                }}
                title={usingNative ? "Usando BarcodeDetector nativo" : "Usando ZXing"}
            >
        {usingNative ? "NATIVE" : "ZXING"}
      </span>
        </div>
    );

    const Modal = ({ open, onClose, children }) => {
        if (!open) return null;
        return (
            <div
                role="dialog"
                aria-modal="true"
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(15,23,42,.5)",
                    display: "grid",
                    placeItems: "center",
                    zIndex: 50,
                    padding: 12,
                }}
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div
                    style={{
                        width: "80vw",
                        maxWidth: "480px",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        background: "#fff",
                        borderRadius: 12,
                        boxShadow: "0 10px 30px rgba(0,0,0,.25)",
                        padding: 16,
                    }}
                >
                    {children}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: 12,
                            gap: 8,
                            flexWrap: "wrap",
                        }}
                    >
                        <button onClick={onClose} style={{ flex: "1 1 auto" }}>
                            {modeRef.current === "validate"
                                ? "Cerrar y seguir validando"
                                : "Cerrar y seguir verificando"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="card">
            <h2>Escanear ticket</h2>

            {/* Switch de modo */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Modo:</span>
                <Switch checked={mode === "validate"} onChange={() => {}} />
                <span style={{ fontSize: 12, color: mode === "validate" ? "#166534" : "#0369a1" }}>
          {mode === "validate" ? "Validar (consume)" : "Solo verificar"}
        </span>
            </div>

            {/* Visor */}
            <div
                className="scanner"
                style={{ position: "relative", aspectRatio: "4/3", background: "#000" }}
            >
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {/* Marco ROI visual */}
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            width: "70%",
                            maxWidth: 480,
                            aspectRatio: "1/1",
                            border: "2px dashed rgba(255,255,255,.75)",
                            borderRadius: 12,
                            boxShadow: "0 0 0 9999px rgba(0,0,0,.35) inset",
                        }}
                    />
                </div>
                <ModeBadge />
            </div>

            {/* Controles */}
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {!active ? (
                    <button onClick={startScanner} disabled={busy}>
                        {mode === "validate" ? "Escanear y validar (consume)" : "Escanear y verificar"}
                    </button>
                ) : (
                    <button onClick={stopScanner} disabled={busy}>
                        Detener escáner
                    </button>
                )}

                <button
                    onClick={async () => {
                        const ok = await setTorch(!torchOn);
                        if (!ok) {
                            setError("Torch no soportado en este dispositivo");
                            setShowModal(true);
                        }
                    }}
                    disabled={!active || busy}
                    title="Linterna (si está disponible)"
                >
                    {torchOn ? "Apagar linterna" : "Encender linterna"}
                </button>
            </div>

            {/* Entrada manual */}
            <div className="manual" style={{ marginTop: 12 }}>
                <label>Texto del QR (opcional)</label>
                <textarea rows={3} value={manual} onChange={(e) => setManual(e.target.value)} />
                <button onClick={validateManual} disabled={busy} style={{ marginTop: 6 }}>
                    {mode === "validate" ? "Validar y consumir texto" : "Verificar texto"}
                </button>
            </div>

            {/* Modal de resultados */}
            <Modal open={showModal} onClose={closeModalAndRestart}>
                {error ? (
                    <div className="result bad">
                        <h3>❌ Error</h3>
                        <p>{error}</p>
                    </div>
                ) : result ? (
                    <div className={`result ${result.valid ? "ok" : "bad"}`}>
                        <h3>{result.valid ? "✅ Ticket válido" : "❌ Ticket inválido"}</h3>
                        {result.ticket_id && (
                            <p>
                                <strong>ID : </strong> {result.ticket_id}
                            </p>
                        )}
                        {result.purchaser_name && (
                            <p>
                                <strong>Invitado : </strong> {result.purchaser_name}
                            </p>
                        )}
                        {result.national_id && (
                            <p>
                                <strong>Cédula : </strong> {result.national_id}
                            </p>
                        )}
                        {result.event_id && (
                            <p>
                                <strong>Evento : </strong> {result.event_id}
                            </p>
                        )}
                        {result.used_at && (
                            <p>
                                <strong>Usado en : </strong>{" "}
                                {new Date(result.used_at).toLocaleString()}
                            </p>
                        )}
                        {result.reason && (
                            <p>
                                <strong>Motivo : </strong> {result.reason}
                            </p>
                        )}
                        {result.valid && (
                            <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                                {modeRef.current === "validate"
                                    ? "Se marcó como usado (consumido)."
                                    : "Solo verificado. El ticket NO fue consumido."}
                            </p>
                        )}
                    </div>
                ) : (
                    <p>Sin datos</p>
                )}
            </Modal>
        </div>
    );
}
