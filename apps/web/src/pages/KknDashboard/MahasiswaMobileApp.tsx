/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Master Mobile App Component for Mahasiswa KKN (React Web Mobile Experience)
 */

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { IOSSafariGate } from "../../components/common/IOSSafariGate";
import { MahasiswaMobileShell } from "../../components/layout/MahasiswaMobileShell/MahasiswaMobileShell";
import { MahasiswaMobileHome } from "./MahasiswaMobileHome";
import { MahasiswaPresensiMobile } from "./MahasiswaPresensiMobile";
import { MahasiswaLogbookMobile } from "./MahasiswaLogbookMobile";
import { MahasiswaProkerMobile } from "./MahasiswaProkerMobile";
import { MahasiswaProfilMobile } from "./MahasiswaProfilMobile";
import { MahasiswaLogbookFormModal } from "./MahasiswaLogbookFormModal";
import { type LogbookMahasiswaItem } from "../../services/logbookService";
import api from "../../utils/api";

export const MahasiswaMobileApp: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") as "beranda" | "presensi" | "logbook" | "proker" | "profil" | null;
  const requestedAction = searchParams.get("action");

  const [activeTab, setActiveTab] = useState<"beranda" | "presensi" | "logbook" | "proker" | "profil">(
    requestedTab && ["beranda", "presensi", "logbook", "proker", "profil"].includes(requestedTab)
      ? requestedTab
      : "beranda"
  );
  const [isLogbookModalOpen, setIsLogbookModalOpen] = useState(requestedAction === "create-logbook" || searchParams.get("create") === "1");
  const [editingLogbook, setEditingLogbook] = useState<LogbookMahasiswaItem | null>(null);
  const [logbookRefreshTrigger, setLogbookRefreshTrigger] = useState(0);
  const [prokerList, setProkerList] = useState<any[]>([]);

  useEffect(() => {
    fetchProkerList();
  }, []);

  // Sync state if URL query params change
  useEffect(() => {
    if (
      requestedTab &&
      ["beranda", "presensi", "logbook", "proker", "profil"].includes(requestedTab) &&
      requestedTab !== activeTab
    ) {
      setActiveTab(requestedTab);
    }
    if (requestedAction === "create-logbook" || searchParams.get("create") === "1") {
      setEditingLogbook(null);
      setIsLogbookModalOpen(true);
    }
  }, [requestedTab, requestedAction]);

  const handleTabChange = (newTab: "beranda" | "presensi" | "logbook" | "proker" | "profil") => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
    // Sync to URL search params cleanly without reload
    const nextParams = new URLSearchParams(window.location.search);
    nextParams.set("tab", newTab);
    nextParams.delete("action");
    nextParams.delete("create");
    setSearchParams(nextParams, { replace: true });
  };

  const handleOpenCreateLogbook = () => {
    setEditingLogbook(null);
    setIsLogbookModalOpen(true);
  };

  const handleOpenEditLogbook = (log: LogbookMahasiswaItem) => {
    setEditingLogbook(log);
    setIsLogbookModalOpen(true);
  };

  const handleCloseLogbookModal = () => {
    setIsLogbookModalOpen(false);
    setEditingLogbook(null);
  };

  const fetchProkerList = async () => {
    try {
      const res = await api.get("/kkn/program-kerja");
      setProkerList(res.data?.data || []);
    } catch {
      // Fallback
    }
  };

  return (
    <IOSSafariGate>
      <MahasiswaMobileShell activeTab={activeTab} onTabChange={handleTabChange}>
        {() => (
          <div className="relative w-full">
            <div className={activeTab === "beranda" ? "block" : "hidden"}>
              <MahasiswaMobileHome
                onNavigateTab={handleTabChange}
                onOpenLogbookModal={handleOpenCreateLogbook}
                refreshTrigger={logbookRefreshTrigger}
              />
            </div>
            <div className={activeTab === "presensi" ? "block" : "hidden"}>
              <MahasiswaPresensiMobile />
            </div>
            <div className={activeTab === "logbook" ? "block" : "hidden"}>
              <MahasiswaLogbookMobile
                onOpenCreateModal={handleOpenCreateLogbook}
                onOpenEditModal={handleOpenEditLogbook}
                refreshTrigger={logbookRefreshTrigger}
              />
            </div>
            <div className={activeTab === "proker" ? "block" : "hidden"}>
              <MahasiswaProkerMobile onProkerCreated={fetchProkerList} />
            </div>
            <div className={activeTab === "profil" ? "block" : "hidden"}>
              <MahasiswaProfilMobile />
            </div>
          </div>
        )}
      </MahasiswaMobileShell>

      {/* Global Logbook Modal (Create / Edit) */}
      <MahasiswaLogbookFormModal
        isOpen={isLogbookModalOpen}
        initialData={editingLogbook}
        onClose={handleCloseLogbookModal}
        onSuccess={() => {
          setEditingLogbook(null);
          setLogbookRefreshTrigger((prev) => prev + 1);
        }}
        prokerList={prokerList}
      />
    </IOSSafariGate>
  );
};

export default MahasiswaMobileApp;
