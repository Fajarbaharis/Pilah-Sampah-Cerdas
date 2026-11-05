import React, { useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";

export const SurveyLandingPage: React.FC = () => {
  const { user } = useAuthStore();
  const isDeveloper = user?.peran === "DEVELOPER" || user?.role === "DEVELOPER";

  useEffect(() => {
    document.title = "Form Survey KKN Tematik BERSEKA · UNIKOM";
  }, []);

  return (
    <div className="w-full h-screen h-[100dvh] overflow-hidden bg-slate-50 flex flex-col">
      <iframe
        src={`/survey/index.html${isDeveloper ? "?role=DEVELOPER" : ""}`}
        title="Form Survey KKN Tematik Berseka"
        className="w-full flex-1 border-0"
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
};

export default SurveyLandingPage;
