"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import SignaturePadLib from "signature_pad";

export interface SignaturePadHandle {
  getDataUrl: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
}

export const SignaturePad = forwardRef<SignaturePadHandle>(function SignaturePad(
  _props,
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pad = new SignaturePadLib(canvas, {
      penColor: "#171717",
      backgroundColor: "#ffffff",
    });
    padRef.current = pad;

    function resize() {
      if (!canvas) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      pad.clear();
    }

    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      pad.off();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    getDataUrl: () => (padRef.current?.isEmpty() ? null : (padRef.current?.toDataURL("image/png") ?? null)),
    clear: () => padRef.current?.clear(),
    isEmpty: () => padRef.current?.isEmpty() ?? true,
  }));

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-neutral-300 bg-white">
        <canvas ref={canvasRef} className="h-40 w-full cursor-crosshair touch-none" />
      </div>
      <button
        type="button"
        onClick={() => padRef.current?.clear()}
        className="mt-2 text-xs font-medium text-neutral-500 hover:text-neutral-700"
      >
        Clear
      </button>
    </div>
  );
});
