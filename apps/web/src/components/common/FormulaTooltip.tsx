/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * FormulaTooltip: Indikator rumus metrik analitik sistem
 * Standar Desain: ISO 9241 (Ergonomi & UX Interaksi), Palet Berseka #009966,
 * Tipografi Jelas & Elegan, Border Halus, Badge Standar Terstruktur.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, Sparkles, BookOpen } from "lucide-react";

interface FormulaTooltipProps {
  title: string;
  formula: string;
  description?: string;
  isoStandard?: string;
}

export const FormulaTooltip: React.FC<FormulaTooltipProps> = ({
  title,
  formula,
  description,
  isoStandard,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    placeAbove: boolean;
    arrowLeft: number;
    width: number;
  } | null>(null);

  // Penyesuaian posisi dinamis presisi via Portal agar tidak terpangkas overflow container (ISO 9241-110)
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Lebar responsif maksimal 360px atau lebar layar dikurangi margin
    const tooltipWidth = Math.min(360, screenWidth - 32);

    // Deteksi ruang atas vs bawah
    const placeAbove = rect.top > 250 || (screenHeight - rect.bottom < 250 && rect.top > 150);

    // Hitung posisi horizontal (pusatkan ke trigger)
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    const padding = 16;
    if (left < padding) left = padding;
    if (left + tooltipWidth > screenWidth - padding) {
      left = screenWidth - tooltipWidth - padding;
    }

    // Posisi panah relatif terhadap bodi tooltip agar menunjuk tepat ke ikon trigger
    const arrowLeft = Math.max(16, Math.min(tooltipWidth - 16, (rect.left + rect.width / 2) - left));

    let top = 0;
    if (placeAbove) {
      top = rect.top - 8; // akan ditransform translateY(-100%)
    } else {
      top = rect.bottom + 8;
    }

    setCoords({ top, left, placeAbove, arrowLeft, width: tooltipWidth });
  }, []);

  useEffect(() => {
    if (open) {
      updatePosition();
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();

      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [open, updatePosition]);

  return (
    <div 
      className="relative inline-flex items-center ml-1.5 align-middle select-none"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-[#009966] dark:hover:text-emerald-400 hover:bg-[#e5f7ed]/60 dark:hover:bg-emerald-950/40 transition-colors focus:outline-none cursor-pointer"
        aria-label={`Rumus: ${title}`}
        aria-expanded={open}
      >
        <HelpCircle size={13} strokeWidth={2.2} />
      </button>

      {open && coords && typeof document !== "undefined" && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform: coords.placeAbove ? "translateY(-100%)" : "none",
            width: `${coords.width}px`,
            zIndex: 99999,
          }}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/95 dark:border-slate-800 text-left transition-all duration-150 animate-in fade-in-0 zoom-in-95 pointer-events-auto leading-normal"
        >
          {/* Header Popover */}
          <div className="flex items-start justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Spesifikasi Metrik
              </span>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 leading-snug">
                {title}
              </h4>
            </div>

            {isoStandard && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-[#009966]/20 dark:border-emerald-800/60 text-[10px] font-bold tracking-tight shrink-0 shadow-2xs">
                <BookOpen size={10} />
                <span>{isoStandard}</span>
              </span>
            )}
          </div>

          {/* Blok Formula Matematika */}
          <div className="my-2.5">
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              <span>Formulasi Perhitungan</span>
              <Sparkles size={11} className="text-[#009966] dark:text-emerald-400" />
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-100 dark:border-slate-800 font-mono text-[11px] text-[#009966] dark:text-emerald-400 font-semibold leading-relaxed break-words select-all shadow-inner">
              {formula}
            </div>
          </div>

          {/* Keterangan Metrik */}
          {description && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
              {description}
            </p>
          )}

          {/* Panah Segitiga (Arrow Drop) */}
          <div 
            className={`absolute w-0 h-0 border-x-6 border-x-transparent ${
              coords.placeAbove
                ? "top-full border-t-6 border-t-white dark:border-t-slate-900"
                : "bottom-full border-b-6 border-b-white dark:border-b-slate-900"
            }`}
            style={{
              left: `${coords.arrowLeft}px`,
              transform: "translateX(-50%)",
              filter: coords.placeAbove
                ? "drop-shadow(0 1px 1px rgba(0,0,0,0.06))"
                : "drop-shadow(0 -1px 1px rgba(0,0,0,0.06))",
            }}
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default FormulaTooltip;
