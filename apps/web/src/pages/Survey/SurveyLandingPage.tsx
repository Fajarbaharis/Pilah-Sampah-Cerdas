import React, { useEffect } from "react";

export const SurveyLandingPage: React.FC = () => {
  useEffect(() => {
    window.location.replace("/survey/index.html");
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mb-3" />
        <p className="text-sm font-medium text-slate-600">Memuat Form Survey Kegiatan KKN Berseka...</p>
        <p className="mt-2 text-xs text-slate-400">
          Jika tidak dialihkan otomatis,{" "}
          <a href="/survey/index.html" className="text-emerald-600 underline font-semibold">
            klik di sini
          </a>.
        </p>
      </div>
    </div>
  );
};

export default SurveyLandingPage;
