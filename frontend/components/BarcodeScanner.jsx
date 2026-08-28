"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { ScanBarcode, Camera, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BarcodeScanner({ onScan, className, placeholder = "Código de barras" }) {
  const [mode, setMode] = useState("input");
  const [inputValue, setInputValue] = useState("");
  const [cameraError, setCameraError] = useState("");
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const controlsRef = useRef(null);
  const rafRef = useRef(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (mode === "input") inputRef.current?.focus();
  }, [mode]);

  const stopCamera = useCallback(() => {
    stoppedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    controlsRef.current?.stop();
    controlsRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    if (mode !== "camera") return;

    stoppedRef.current = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        });

        if (stoppedRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }

        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        // Preferência: BarcodeDetector nativo (Chrome 83+, Edge, Android)
        if ("BarcodeDetector" in window) {
          const detector = new window.BarcodeDetector({
            formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code"],
          });

          async function scan() {
            if (stoppedRef.current) return;
            try {
              const results = await detector.detect(video);
              if (results.length > 0) {
                const code = results[0].rawValue;
                stopCamera();
                setMode("input");
                onScan(code);
                return;
              }
            } catch {}
            rafRef.current = requestAnimationFrame(scan);
          }

          rafRef.current = requestAnimationFrame(scan);
        } else {
          // Fallback: @zxing/browser
          const { BrowserMultiFormatReader } = await import("@zxing/browser");
          const reader = new BrowserMultiFormatReader();

          const controls = await reader.decodeFromVideoElement(video, (result) => {
            if (!result || stoppedRef.current) return;
            const code = result.getText();
            stopCamera();
            setMode("input");
            onScan(code);
          });

          if (!stoppedRef.current) {
            controlsRef.current = controls;
          } else {
            controls?.stop();
          }
        }
      } catch (err) {
        if (!stoppedRef.current) {
          setCameraError(
            err.name === "NotAllowedError"
              ? "Permissão de câmera negada"
              : "Câmera não disponível"
          );
          setMode("input");
        }
      }
    }

    startCamera();
    return () => stopCamera();
  }, [mode, onScan, stopCamera]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && inputValue.trim()) {
      onScan(inputValue.trim());
      setInputValue("");
    }
  }

  if (mode === "camera") {
    return (
      <div className={cn("relative rounded-xl overflow-hidden bg-black", className)}>
        <video
          ref={videoRef}
          className="w-full h-48 object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Mira de leitura */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-52 h-28">
            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-primary" />
            {/* Linha de scan animada */}
            <div className="absolute left-0 right-0 h-px bg-primary/70 animate-pulse top-1/2" />
          </div>
        </div>

        {/* Botão voltar ao teclado */}
        <button
          type="button"
          onClick={() => { stopCamera(); setMode("input"); }}
          className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
        >
          <Keyboard className="h-4 w-4" />
        </button>

        <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/60">
          Aponte para o código de barras
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {cameraError && (
        <p className="text-xs text-destructive">{cameraError}</p>
      )}
      <div className="relative flex items-center">
        <ScanBarcode className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-10 pl-9 pr-10 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="button"
          onClick={() => { setCameraError(""); setMode("camera"); }}
          className="absolute right-2 h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title="Usar câmera"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
