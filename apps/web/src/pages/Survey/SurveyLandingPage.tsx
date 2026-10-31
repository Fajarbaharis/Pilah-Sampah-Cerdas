import React, { useEffect } from "react";

export const SurveyLandingPage: React.FC = () => {
  useEffect(() => {
    document.title = "Form Survey KKN Tematik BERSEKA · UNIKOM";
  }, []);

  return (
    <div className="w-full h-screen h-[100dvh] overflow-hidden bg-slate-50 flex flex-col">
      <iframe
        src="/survey/index.html"
        title="Form Survey KKN Tematik Berseka"
        className="w-full flex-1 border-0"
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
};

export default SurveyLandingPage;
