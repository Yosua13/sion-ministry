import React, { useState, useEffect } from "react";
import { SionDatabase } from "./utils/db";
import { City, Member, BeritaAcara, JurnalPA, DonationCampaign, DonationRecord, DiscipleshipLink, DiscipleshipModule, SyncState } from "./types";
import Sidebar, { SionLogo } from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Modules from "./components/Modules";
import Members from "./components/Members";
import BeritaAcaraComponent from "./components/BeritaAcara";
import JurnalPAComponent from "./components/JurnalPA";
import DonationsComponent from "./components/Donations";
import Links from "./components/Links";
import AiAssistant from "./components/AiAssistant";
import Pekerjaan from "./components/Pekerjaan";
import { Wifi, WifiOff, Bell, Menu, X, RefreshCw } from "lucide-react";

export default function App() {
  // Initialize Database on App load
  useEffect(() => {
    SionDatabase.init();
  }, []);

  // State managers
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [cities, setCities] = useState<City[]>([]);
  const [modules, setModules] = useState<DiscipleshipModule[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [berita, setBerita] = useState<BeritaAcara[]>([]);
  const [jurnalPa, setJurnalPa] = useState<JurnalPA[]>([]);
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [donationRecords, setDonationRecords] = useState<DonationRecord[]>([]);
  const [links, setLinks] = useState<DiscipleshipLink[]>([]);
  const [syncState, setSyncState] = useState<SyncState>({ isOnline: true, lastSyncedAt: "", pendingChanges: [] });
  
  // Sync loading state
  const [isSyncing, setIsSyncing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load all data from client offline database
  const refreshData = () => {
    setCities(SionDatabase.getCities());
    setModules(SionDatabase.getModules());
    setMembers(SionDatabase.getMembers());
    setBerita(SionDatabase.getBerita());
    setJurnalPa(SionDatabase.getJurnalPA());
    setCampaigns(SionDatabase.getCampaigns());
    setDonationRecords(SionDatabase.getDonationRecords());
    setLinks(SionDatabase.getLinks());
    setSyncState(SionDatabase.getSyncState());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Listen to browser network changes to automatically sync or flag status
  useEffect(() => {
    const handleOnline = () => {
      const updated = SionDatabase.toggleOnlineStatus(true);
      setSyncState(updated);
    };
    const handleOffline = () => {
      const updated = SionDatabase.toggleOnlineStatus(false);
      setSyncState(updated);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Connection Online/Offline Manual toggle helper
  const handleToggleOnline = () => {
    const updated = SionDatabase.toggleOnlineStatus();
    setSyncState(updated);
  };

  // Perform Cloud Synchronization Routine
  const handleSyncWithCloud = async () => {
    setIsSyncing(true);
    try {
      const res = await SionDatabase.syncWithCloud();
      if (res.success) {
        alert(`Sinkronisasi sukses! ${res.syncedItemsCount} data perubahan berhasil diunggah ke server cloud Sion Academy.`);
      }
    } catch (err: any) {
      alert(`Sinkronisasi gagal: ${err.message}`);
    } finally {
      setIsSyncing(false);
      refreshData();
    }
  };

  // --- CRUD Handler proxies ---

  // Members
  const handleAddMember = (m: Omit<Member, "id">) => {
    SionDatabase.addMember(m);
    refreshData();
  };

  const handleUpdateMember = (m: Member) => {
    SionDatabase.updateMember(m);
    refreshData();
  };

  const handleDeleteMember = (id: string) => {
    SionDatabase.deleteMember(id);
    refreshData();
  };

  // Berita Acara
  const handleAddBerita = (b: Omit<BeritaAcara, "id" | "synced" | "action">) => {
    SionDatabase.addBerita(b);
    refreshData();
  };

  const handleDeleteBerita = (id: string) => {
    SionDatabase.deleteBerita(id);
    refreshData();
  };

  // Jurnal PA
  const handleAddJurnalPA = (j: Omit<JurnalPA, "id" | "synced" | "action">) => {
    SionDatabase.addJurnalPA(j);
    refreshData();
  };

  const handleDeleteJurnalPA = (id: string) => {
    SionDatabase.deleteJurnalPA(id);
    refreshData();
  };

  // Donations & Campaigns
  const handleAddCampaign = (c: Omit<DonationCampaign, "id">) => {
    SionDatabase.addCampaign(c);
    refreshData();
  };

  const handleAddDonationRecord = (r: Omit<DonationRecord, "id" | "date">) => {
    SionDatabase.addDonationRecord(r);
    refreshData();
  };

  // Links
  const handleAddLink = (l: Omit<DiscipleshipLink, "id">) => {
    SionDatabase.addLink(l);
    refreshData();
  };

  const handleUpdateLink = (l: DiscipleshipLink) => {
    SionDatabase.updateLink(l);
    refreshData();
  };

  const handleDeleteLink = (id: string) => {
    SionDatabase.deleteLink(id);
    refreshData();
  };

  // Modules cache completion
  const handleToggleDownloadModule = (id: string) => {
    SionDatabase.toggleModuleDownload(id);
    refreshData();
  };

  const handleCompleteModule = (id: string) => {
    SionDatabase.completeModule(id);
    refreshData();
  };

  // Helper to switch active panel views
  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            cities={cities}
            members={members}
            berita={berita}
            jurnalPa={jurnalPa}
            campaigns={campaigns}
            syncState={syncState}
            onNavigateToTab={(tab) => {
              setActiveTab(tab);
              setMobileMenuOpen(false);
            }}
          />
        );
      case "modules":
        return (
          <Modules
            modules={modules}
            onToggleDownload={handleToggleDownloadModule}
            onCompleteModule={handleCompleteModule}
          />
        );
      case "members":
        return (
          <Members
            members={members}
            cities={cities}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
          />
        );
      case "berita":
        return (
          <BeritaAcaraComponent
            beritaList={berita}
            cities={cities}
            onAddBerita={handleAddBerita}
            onDeleteBerita={handleDeleteBerita}
            isOnline={syncState.isOnline}
          />
        );
      case "jurnal_pa":
        return (
          <JurnalPAComponent
            jurnalList={jurnalPa}
            cities={cities}
            onAddJurnal={handleAddJurnalPA}
            onDeleteJurnal={handleDeleteJurnalPA}
            isOnline={syncState.isOnline}
          />
        );
      case "donasi":
        return (
          <DonationsComponent
            campaigns={campaigns}
            donationRecords={donationRecords}
            onAddDonationRecord={handleAddDonationRecord}
            onAddCampaign={handleAddCampaign}
          />
        );
      case "links":
        return (
          <Links
            links={links}
            onAddLink={handleAddLink}
            onUpdateLink={handleUpdateLink}
            onDeleteLink={handleDeleteLink}
          />
        );
      case "ai":
        return <AiAssistant />;
      default:
        return <div className="text-center py-10 font-medium">Halaman Sedang Dipersiapkan</div>;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard": return "Dashboard Utama";
      case "modules": return "Kurikulum Pelatihan";
      case "members": return "Daftar Jemaat";
      case "berita": return "Laporan Berita Acara";
      case "jurnal_pa": return "Jurnal Pendampingan (PA)";
      case "donasi": return "Portal Donasi Sion Care";
      case "links": return "Tautan & Dokumen";
      case "ai": return "Asisten Pemuridan AI";
      default: return "Sion Academy";
    }
  };

  if (activeTab === "pekerjaan") {
    return <Pekerjaan onBackToMain={() => setActiveTab("dashboard")} />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800 font-sans pb-16 md:pb-0">
      
      {/* Sidebar Nav */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setMobileMenuOpen(false);
        }}
        syncState={syncState}
        onToggleOnline={handleToggleOnline}
        onSync={handleSyncWithCloud}
        isSyncing={isSyncing}
      />

      {/* Main Panel Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Upper Dashboard Header (Material App Bar) */}
        <header className="bg-white border-b border-slate-100 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile Sidebar Trigger button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 hover:bg-slate-100 rounded-xl md:hidden text-slate-600 transition-all cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            
            <h1 className="font-display font-bold text-sm sm:text-base text-slate-900 tracking-tight flex items-center gap-2">
              <span className="md:hidden"><SionLogo className="h-6 w-6" /></span>
              <span>{getPageTitle()}</span>
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Connection badge for desktop */}
            <span 
              onClick={handleToggleOnline}
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer select-none transition-all ${
                syncState.isOnline
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-rose-50 text-rose-600 border border-rose-100"
              }`}
            >
              {syncState.isOnline ? (
                <>
                  <Wifi className="h-3 w-3 text-emerald-500 animate-pulse" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-rose-500" />
                  <span>Offline</span>
                </>
              )}
            </span>

            {/* Quick action notification bell */}
            <button className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all relative">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-rose-500 rounded-full animate-pulse"></span>
            </button>

            {/* Active User account chip */}
            <div className="flex items-center space-x-2 border-l border-slate-100 pl-4">
              <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold font-mono">
                P
              </div>
              <div className="hidden lg:block text-left">
                <span className="text-xs font-bold text-slate-700 block leading-tight">Yosua Reynaldi</span>
                <span className="text-[10px] text-slate-400 font-medium block">Pekerja Lapangan</span>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Dropdown Nav Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 text-slate-200 p-4 sticky top-[61px] z-30 space-y-4">
            {/* Sync control for mobile */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Status Sinkronisasi</span>
                <button
                  onClick={handleToggleOnline}
                  className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    syncState.isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {syncState.isOnline ? "Online" : "Offline"}
                </button>
              </div>

              {syncState.pendingChanges.length > 0 && (
                <div className="text-[10px] text-amber-300 flex items-center justify-between font-semibold">
                  <span>Antrean Belum Sinkron:</span>
                  <span className="font-bold">{syncState.pendingChanges.length} item</span>
                </div>
              )}

              <button
                disabled={!syncState.isOnline || isSyncing}
                onClick={handleSyncWithCloud}
                className="w-full py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Scrollable central content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {renderActiveView()}
        </main>

      </div>
    </div>
  );
}
