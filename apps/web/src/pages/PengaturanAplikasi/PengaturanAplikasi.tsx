/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Khusus: Pengaturan Identitas & Branding Aplikasi (Dinamis)
 * Hak Akses: DEVELOPER & SUPER_USER
 */

import React from "react";
import AppBrandingSettings from "../Developer/components/AppBrandingSettings";

export const PengaturanAplikasi: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100">
      <AppBrandingSettings />
    </div>
  );
};

export default PengaturanAplikasi;
