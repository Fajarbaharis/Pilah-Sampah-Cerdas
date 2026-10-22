/**
 * Component: Footer (Footstep Layout Component)
 * Clean, modern, user-friendly footer with Dynamic App Branding
 * Copyright: UNIKOM
 */

import React from "react";
import { ShieldCheck } from "lucide-react";
import { useAppBrandingStore } from "../../../store/useAppBrandingStore";

export const Footer: React.FC = () => {
  const { branding } = useAppBrandingStore();

  const logoSrc = branding.logoEmblemUrl || "/logos/berseka/berseka-logo-bg-transparent.png";
  const appName = branding.appName || "BERSEKA";
  const appTagline = branding.appTagline || "Bersih, Sehat, Kampung Asri";
  const appVersion = branding.appVersion ? `v${branding.appVersion}` : "v1.0.0";

  return (
    <footer className="mt-4 py-3 px-6 border border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium shadow-2xs transition-all">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          <img
            src={logoSrc}
            alt={appName}
            className="h-7 w-auto object-contain shrink-0"
          />
          <span>{appName}</span>
        </div>
        <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
        <span className="text-[#549e26] font-semibold">
          {appTagline}
        </span>
      </div>

      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-700/30 shadow-2xs">
          <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
          <span>{appVersion}</span>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
