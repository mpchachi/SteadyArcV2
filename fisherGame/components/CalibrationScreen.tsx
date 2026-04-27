"use client";

import { useEffect, useRef } from "react";
import type { CoinElement } from "@/lib/eye/marioCoin";
import type { PixelSea }    from "@/lib/eye/pixelSea";
import { EYEDID_LICENSE_KEY } from "@/config/eyedid";

interface Props {
  onGaze:       (g: { x: number; y: number }) => void;
  onCalibrated: () => void;
}

export default function CalibrationScreen({ onGaze, onCalibrated }: Props) {
  // Keep callbacks stable in closure without re-running the effect
  const cbRef = useRef({ onGaze, onCalibrated });
  useEffect(() => { cbRef.current = { onGaze, onCalibrated }; });

  useEffect(() => {
    let isMounted     = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let eyeTracker:   any          = null;
    let sea:          PixelSea     | null = null;
    let coin:         CoinElement  | null = null;

    // "mira el punto" overlay — same as original eyetracker
    const focusMsg = document.createElement("div");
    Object.assign(focusMsg.style, {
      position:      "fixed",
      inset:         "0",
      zIndex:        "500",
      display:       "none",
      alignItems:    "center",
      justifyContent:"center",
      fontFamily:    '"Press Start 2P", monospace',
      fontSize:      "1.5rem",
      color:         "#ffffff",
      textShadow:    "2px 2px 0 #000",
      pointerEvents: "none",
    });
    focusMsg.textContent = "mira el punto";
    document.body.appendChild(focusMsg);

    function startCalibration() {
      eyeTracker?.hideImage();
      sea?.show();
      focusMsg.style.display = "flex";

      setTimeout(() => {
        if (!isMounted) return;
        focusMsg.style.display = "none";
        eyeTracker.startCalibration(
          (x: number, y: number) => {
            coin?.show(x, y);
            eyeTracker.startCollectSamples();
          },
          (progress: number) => {
            coin?.setProgress(progress);
          },
          () => {
            if (!isMounted) return;
            coin?.hide();
            sea?.hide();
            // Keep eyeTracker running — onGaze keeps firing for the game dot
            cbRef.current.onCalibrated();
          }
        );
      }, 2000);
    }

    async function init() {
      try {
        const { default: EasySeeSo }   = await import("seeso/easy-seeso");
        const { createPixelSea }       = await import("@/lib/eye/pixelSea");
        const { createCoinElement }    = await import("@/lib/eye/marioCoin");
        if (!isMounted) return;

        sea  = createPixelSea();
        coin = createCoinElement(64);

        eyeTracker = new EasySeeSo();
        await eyeTracker.init(
          EYEDID_LICENSE_KEY,
          async () => {
            if (!isMounted) return;
            eyeTracker.setMonitorSize(15.6);
            eyeTracker.setFaceDistance(50);
            eyeTracker.setCameraPosition(window.outerWidth / 2, true);
            await eyeTracker.startTracking(
              (g: { x: number; y: number }) => { if (isMounted) cbRef.current.onGaze(g); },
              () => {}   // onDebug — no necesitamos FPS en el juego
            );
            // No llamamos showImage() — no queremos la preview de cámara en el juego
            startCalibration();
          },
          () => { console.error("EasySeeSo: error de inicialización — revisa licencia o cámara"); }
        );
      } catch (err) {
        console.error("CalibrationScreen init error:", err);
      }
    }

    init();

    return () => {
      isMounted = false;
      try { eyeTracker?.stopTracking?.(); } catch (_) {}
      coin?.hide();  coin?.remove();
      sea?.hide();   sea?.remove();
      focusMsg.remove();
    };
  // Solo se ejecuta al montar — las callbacks se leen vía cbRef
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Todo el UI es imperativo (DOM directo), igual que el eyetracker original
  return null;
}
