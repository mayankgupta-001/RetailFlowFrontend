import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface CameraScannerProps {
  enabled: boolean;
  onScan: (code: string) => void;
}

const SCANNER_ELEMENT_ID = "camera-scanner-region";

export default function CameraScanner({ enabled, onScan }: CameraScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const lastScanRef = useRef<{ code: string; time: number }>({
    code: "",
    time: 0,
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setStarting(true);
    setError(null);

    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.UPC_A,
      ],
      verbose: false,
    });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" }, // rear camera on phones
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          const now = Date.now();
          // Ignore the same code re-firing repeatedly while it's
          // still in view of the camera.
          if (
            decodedText === lastScanRef.current.code &&
            now - lastScanRef.current.time < 2000
          ) {
            return;
          }
          lastScanRef.current = { code: decodedText, time: now };
          onScan(decodedText);
        },
        () => {
          // Fires continuously while no barcode is in frame — expected, ignore.
        }
      )
      .then(() => {
        if (!cancelled) setStarting(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not access camera. Check permissions."
          );
          setStarting(false);
        }
      });

    return () => {
      cancelled = true;
      const activeScanner = scannerRef.current;
      if (activeScanner) {
        activeScanner
          .stop()
          .then(() => activeScanner.clear())
          .catch(() => {
            // Already stopped — safe to ignore.
          });
        scannerRef.current = null;
      }
    };
  }, [enabled, onScan]);

  if (!enabled) return null;

  return (
    <div className="border rounded-lg overflow-hidden bg-black mb-4">
      <div id={SCANNER_ELEMENT_ID} className="w-full" />
      {starting && (
        <p className="text-white text-sm text-center py-2">
          Starting camera...
        </p>
      )}
      {error && (
        <p className="text-red-400 text-sm text-center py-2 bg-black">
          {error}
        </p>
      )}
    </div>
  );
}