// src/pages/Scanner.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

// Hints opcionales si tienes @zxing/library instalado (mejor precisión)
// npm i @zxing/library
let ZXHints = null;
try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    ZXHints = require("@zxing/library");
} catch {}

import { Api } from "../api";
import Modal from "../shared/Modal.jsx";

/* =============================
 * Utils de rendimiento / imagen
 * ============================= */

// ROI centrado: ventana ~70% del menor lado
const getROI = (w, h) => {
    const side = Math.floor(Math.min(w, h) * 0.7);
    const x = Math.floor((w - side) / 2);
    const y = Math.floor((h - side) / 2);
    return { x, y, width: side, height: side };
};

// Tamaño máximo del frame a procesar (downscale) para acelerar
const MAX_PROC_SIDE = 512;

// Luma simple (promedio de R,G,B) para decidir auto-torch
const estimateLuma = (ctx, w, h) => {
    const { data } = ctx.getImageData(0, 0, w, h);
    let sum = 0;
    // sampleado cada 4 px para bajar costo
    for (let i = 0; i < data.length; i += 4 * 4) {
        sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    return sum / (data.length / (4 * 4));
};

// rVFC si existe; si no, cae a rAF
const onNextVideoFrame = (video, cb) => {
    if (video?.requestVideoFrameCallback) {
        const id = video.requestVideoFrameCallback(() => cb());
        return () => video.cancelVideoFrameCallback?.(id);
    }
    const id = requestAnimationFrame(cb);
    return () => cancelAnimationFrame(id);
};

/* =============================
 * Componente
 * ============================= */

export default function Scanner() {
    // ---- refs base ----
    const videoRef = useRef(null);
    const codeReaderRef = useRef(null);
    const controlsRef = useRef(null);
    const streamRef = useRef(null);
    const wakeLockRef = useRef(null);
    const canvasRef = useRef(null);
    const offCtxRef = useRef(null);
    const detectorRef = useRef(null);
    const loopStopRef = useRef(false);
    const usingNativeRef = useRef(false);
    const frameCancelRef = useRef(null);

    // ---- estado UI ----
    const [mode, setMode] = useState("peek"); // "peek" | "validate"
    const modeRef = useRef(mode);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [manual, setManual] = useState("");
    const [active, setActive] = useState(false);
    const [busy, setBusy] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const [usingNative, setUsingNative] = useState(false);

    // Mantén la ref sincronizada
    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);

    /* =============================
     * Wake Lock
     * ============================= */
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

    /* =============================
     * Cámara / Torch
     * ============================= */
    const pickBackCamera = useCallback(async () => {
        try {
            // Pre-permiso para obtener labels
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

    /* =============================
     * Ciclo de escaneo — Nativo
     * ============================= */
    const ensureDetector = useCallback(async () => {
        if (!("BarcodeDetector" in window)) return null;
        if (detectorRef.current) return detectorRef.current;
        let formats = ["qr_code"];
        try {
            const supported = await window.BarcodeDetector.getSupportedFormats?.();
            if (supported?.length) {
                formats = supported.includes("qr_code") ? ["qr_code"] : supported;
            }
        } catch {}
        detectorRef.current = new window.BarcodeDetector({ formats });
        return detectorRef.current;
    }, []);

    const doValidation = useCallback(
        async (text) => {
            setBusy(true);
            stopScanner(); // pausamos mientras validamos
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
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const nativeLoop = useCallback(async () => {
        const detector = await ensureDetector();
        if (!detector) return false;

        usingNativeRef.current = true;
        setUsingNative(true);

        const video = videoRef.current;
        if (!video) return false;

        // Canvas y contexto para ROI / luma si se requiere
        if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
        if (!offCtxRef.current)
            offCtxRef.current = canvasRef.current.getContext("2d", {
                willReadFrequently: true,
            });

        const tick = async () => {
            if (loopStopRef.current) return;
            if (!video || video.readyState < 2) {
                frameCancelRef.current = onNextVideoFrame(video, tick);
                return;
            }

            try {
                // Camino rápido: algunos navegadores aceptan <video> directo (sin copiar)
                // Muy rápido si está soportado.
                let barcodes = null;
                let usedDirectVideo = false;
                try {
                    barcodes = await detector.detect(video);
                    usedDirectVideo = true;
                } catch {
                    /* algunos motores no aceptan <video> */
                }

                if (!barcodes) {
                    // ROI + downscale (máximo MAX_PROC_SIDE) para acelerar
                    const vw = video.videoWidth;
                    const vh = video.videoHeight;
                    const roi = getROI(vw, vh);

                    // calculamos escala destino
                    const scale = Math.min(
                        1,
                        MAX_PROC_SIDE / Math.max(roi.width, roi.height)
                    );
                    const dw = Math.max(1, Math.floor(roi.width * scale));
                    const dh = Math.max(1, Math.floor(roi.height * scale));

                    const canvas = canvasRef.current;
                    const ctx = offCtxRef.current;
                    canvas.width = dw;
                    canvas.height = dh;
                    ctx.drawImage(
                        video,
                        roi.x,
                        roi.y,
                        roi.width,
                        roi.height,
                        0,
                        0,
                        dw,
                        dh
                    );

                    // Auto-torch en baja luz si es posible (umbral aprox. < 35/255)
                    try {
                        const luma = estimateLuma(ctx, dw, dh);
                        if (luma < 35 && !torchOn) {
                            await setTorch(true); // si no soporta, simplemente no hace nada
                        }
                    } catch {}

                    // createImageBitmap => suele ser más rápido que leer píxeles del canvas
                    let source = canvas;
                    try {
                        source = await createImageBitmap(canvas);
                    } catch {
                        /* fallback a canvas */
                    }
                    barcodes = await detector.detect(source);
                }

                if (barcodes?.length) {
                    const text = barcodes[0].rawValue || barcodes[0].displayValue;
                    if (text) {
                        await doValidation(text);
                        return;
                    }
                }
            } catch {
                // errores esporádicos del detector; continuar
            }

            frameCancelRef.current = onNextVideoFrame(video, tick);
        };

        loopStopRef.current = false;
        frameCancelRef.current = onNextVideoFrame(video, tick);
        return true;
    }, [ensureDetector, doValidation, setTorch, torchOn]);

    /* =============================
     * ZXing fallback
     * ============================= */
    const startZXing = useCallback(
        async (deviceId) => {
            usingNativeRef.current = false;
            setUsingNative(false);

            const reader =
                codeReaderRef.current ||
                new BrowserMultiFormatReader(ZXHints ? new ZXHints.Hints() : undefined);

            if (ZXHints && reader?.hints) {
                try {
                    reader.hints.set(ZXHints.DecodeHintType.TRY_HARDER, true);
                    reader.hints.set(ZXHints.DecodeHintType.POSSIBLE_FORMATS, [
                        ZXHints.BarcodeFormat.QR_CODE,
                    ]);
                } catch {}
            }

            codeReaderRef.current = reader;

            await reader.decodeFromVideoDevice(
                deviceId,
                videoRef.current,
                async (res, _err, controls) => {
                    if (controls && !controlsRef.current) controlsRef.current = controls;
                    const video = videoRef.current;
                    if (video?.srcObject && !streamRef.current) {
                        streamRef.current = video.srcObject;
                    }
                    if (!res || busy) return; // back-pressure
                    const text = res.getText();
                    if (!text) return;
                    await doValidation(text);
                }
            );
        },
        [busy, doValidation]
    );

    /* =============================
     * Arranque / Parada
     * ============================= */
    const stopScanner = useCallback(() => {
        try {
            loopStopRef.current = true;
            if (frameCancelRef.current) {
                frameCancelRef.current();
                frameCancelRef.current = null;
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
        setActive(false);
        releaseWakeLock();
    }, [releaseWakeLock]);

    const startScanner = useCallback(async () => {
        if (!videoRef.current || busy || active) return;

        setError("");
        setResult(null);
        stopScanner(); // limpia residuos previos

        try {
            const deviceId = await pickBackCamera();

            // Constraints “amigables” para móvil y baja luz
            const baseVideo = {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 }, // 720p suele bastar y es más rápido que 1080p
                height: { ideal: 720 },
                frameRate: { ideal: 30, max: 60 },
                focusMode: "continuous",
                // Sugerir exposición y balance blanco continuos si existen
                advanced: [
                    { exposureMode: "continuous" },
                    { whiteBalanceMode: "continuous" },
                    { zoom: 1.2 }, // un pelín de zoom ayuda con reflejos en pantallas
                ],
            };

            const constraints = deviceId
                ? { video: { ...baseVideo, deviceId: { exact: deviceId } }, audio: false }
                : { video: baseVideo, audio: false };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = videoRef.current;
            video.srcObject = stream;
            streamRef.current = stream;

            // Ajustes post-stream si están soportados (no bloqueantes)
            try {
                const track = stream.getVideoTracks()[0];
                const caps = track.getCapabilities?.();
                const cons = track.getConstraints?.() || {};
                const advanced = [];
                if (caps?.focusMode?.includes?.("continuous"))
                    advanced.push({ focusMode: "continuous" });
                if (caps?.whiteBalanceMode?.includes?.("continuous"))
                    advanced.push({ whiteBalanceMode: "continuous" });
                if (caps?.exposureMode?.includes?.("continuous"))
                    advanced.push({ exposureMode: "continuous" });
                if (caps?.zoom) advanced.push({ zoom: Math.min(caps.zoom.max || 1, 1.5) });
                if (advanced.length) await track.applyConstraints({ ...cons, advanced });
            } catch {}

            setActive(true);
            await requestWakeLock();

            await new Promise((r) => {
                video.onloadeddata = () => r();
            });

            // Intento nativo primero
            const okNative = await nativeLoop();
            if (!okNative) {
                await startZXing(deviceId || undefined);
            }
        } catch (e) {
            setError(e?.message || "No se pudo iniciar el escáner");
            setActive(false);
            releaseWakeLock();
        }
    }, [
        pickBackCamera,
        nativeLoop,
        startZXing,
        busy,
        active,
        stopScanner,
        requestWakeLock,
        releaseWakeLock,
    ]);

    /* =============================
     * Ciclo de vida
     * ============================= */
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

    // Escape para cerrar modal
    const closeModalAndRestart = useCallback(() => {
        setShowModal(false);
        setResult(null);
        setError("");
        // pequeño delay para permitir liberar cámara en móviles
        setTimeout(() => startScanner(), 80);
    }, [startScanner]);

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

    /* =============================
     * UI
     * ============================= */

    // reemplaza tu Switch por este:
    const Switch = ({ checked }) => (
        <button
            type="button"
            onClick={() => {
                if (busy) return;
                const next = !checked;
                modeRef.current = next ? "validate" : "peek";
                setMode(next ? "validate" : "peek");
            }}
            aria-pressed={checked}
            className={[
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
                checked ? "bg-emerald-500/80" : "bg-slate-600/70",
                busy ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                "focus:outline-none ring-1 ring-inset",
                checked ? "ring-emerald-300/50" : "ring-slate-500/60",
                "focus-visible:ring-2 focus-visible:ring-indigo-400/70"
            ].join(" ")}
            aria-label={checked ? "Validar (consume)" : "Solo verificar"}
        >
    <span
        className={[
            "absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0"
        ].join(" ")}
    />
        </button>
    );



    const ModeBadge = () => (
        <div
            style={{
                position: "absolute",
                top: 10,
                right: 10,
                background:
                    mode === "validate" ? "rgba(16,185,129,.9)" : "rgba(59,130,246,.9)",
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

    return (
        <section className="bg-slate-950 text-white">
            <div className="mx-auto w-full max-w-screen-xl 2xl:max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="mx-auto w-[min(92vw,980px)]">
                    <h2 className="mb-4 text-2xl font-bold md:text-3xl">Escanear ticket</h2>

                    {/* Switch de modo */}
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <span className="text-xs text-slate-400">Modo:</span>
                        <Switch checked={mode === "validate"} />
                        <span
                            className={`text-xs ${
                                mode === "validate" ? "text-emerald-400" : "text-sky-400"
                            }`}
                        >
            {mode === "validate" ? "Validar (consume)" : "Solo verificar"}
          </span>
                    </div>

                    {/* Visor */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-700/60 bg-black shadow-2xl">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="h-full w-full object-cover"
                        />
                        {/* ROI */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0 grid place-items-center"
                        >
                            <div className="w-[70%] max-w-[520px] aspect-square rounded-2xl border-2 border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,.35)_inset]" />
                        </div>
                        <ModeBadge usingNative={usingNative} mode={mode} />
                    </div>

                    {/* Controles */}
                    <div className="mt-4 flex flex-wrap gap-3">
                        {!active ? (
                            <button
                                onClick={startScanner}
                                disabled={busy}
                                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {mode === "validate"
                                    ? "Escanear y validar (consume)"
                                    : "Escanear y verificar"}
                            </button>
                        ) : (
                            <button
                                onClick={stopScanner}
                                disabled={busy}
                                className="rounded-xl border border-slate-600/70 px-4 py-2 text-sm font-semibold hover:bg-slate-900/50 disabled:cursor-not-allowed disabled:opacity-70"
                            >
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
                            className="rounded-xl border border-slate-600/70 px-4 py-2 text-sm font-semibold hover:bg-slate-900/50 disabled:cursor-not-allowed disabled:opacity-70"
                            title="Linterna (si está disponible)"
                        >
                            {torchOn ? "Apagar linterna" : "Encender linterna"}
                        </button>
                    </div>

                    {/* Entrada manual */}
                    <div className="mt-6 grid gap-2">
                        <label className="text-sm text-slate-300">Texto del QR (opcional)</label>
                        <textarea
                            rows={3}
                            value={manual}
                            onChange={(e) => setManual(e.target.value)}
                            className="w-full rounded-xl border border-slate-700/60 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                        />
                        <button
                            onClick={validateManual}
                            disabled={busy}
                            className="mt-1 w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                        >
                            {mode === "validate" ? "Validar y consumir texto" : "Verificar texto"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de resultados */}
            <Modal open={showModal} onClose={closeModalAndRestart}>
                {error ? (
                    <div className="rounded-xl border border-red-300/40 bg-red-500/10 p-4">
                        <h3 className="mb-1 text-lg font-semibold text-red-200">❌ Error</h3>
                        <p className="text-sm text-red-100/90">{error}</p>
                    </div>
                ) : result ? (
                    <div
                        className={`rounded-xl p-4 ${
                            result.valid
                                ? "border border-cyan-300/40 bg-cyan-500/10"
                                : "border border-red-300/40 bg-red-500/10"
                        }`}
                    >
                        <h3 className="mb-2 text-lg font-semibold">
                            {result.valid ? "✅ Ticket válido" : "❌ Ticket inválido"}
                        </h3>
                        <div className="space-y-1 text-sm text-slate-800">
                            {result.ticket_id && (
                                <p>
                                    <span className="font-semibold">ID: </span>
                                    {result.ticket_id}
                                </p>
                            )}
                            {result.purchaser_name && (
                                <p>
                                    <span className="font-semibold">Invitado: </span>
                                    {result.purchaser_name}
                                </p>
                            )}
                            {result.national_id && (
                                <p>
                                    <span className="font-semibold">Cédula: </span>
                                    {result.national_id}
                                </p>
                            )}
                            {result.event_id && (
                                <p>
                                    <span className="font-semibold">Evento: </span>
                                    {result.event_id}
                                </p>
                            )}
                            {result.used_at && (
                                <p>
                                    <span className="font-semibold">Usado en: </span>
                                    {new Date(result.used_at).toLocaleString()}
                                </p>
                            )}
                            {result.reason && (
                                <p>
                                    <span className="font-semibold">Motivo: </span>
                                    {result.reason}
                                </p>
                            )}
                        </div>
                        {result.valid && (
                            <p className="mt-2 text-xs text-slate-600">
                                {modeRef.current === "validate"
                                    ? "Se marcó como usado (consumido)."
                                    : "Solo verificado. El ticket NO fue consumido."}
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-slate-700">Sin datos</p>
                )}
            </Modal>
        </section>
    );

}
