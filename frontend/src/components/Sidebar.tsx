import React from "react";
import { 
  BookOpen, 
  Users, 
  Newspaper,
  BookMarked,
  HeartHandshake,
  Link2, 
  Sparkles, 
  LayoutDashboard, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Briefcase
} from "lucide-react";
import { SyncState } from "../types";

// Custom Sion Ministry Image Logo
export function SionLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <img 
      src="/logo.jpeg" 
      alt="Sion Logo" 
      className={`${className} rounded-full object-cover`} 
    />
  );
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  syncState: SyncState;
  onToggleOnline: () => void;
  onSync: () => void;
  isSyncing: boolean;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  syncState,
  onToggleOnline,
  onSync,
  isSyncing
}: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "modules", label: "Modul Belajar", icon: BookOpen },
    { id: "members", label: "Data Jemaat", icon: Users },
    { id: "berita", label: "Berita Acara", icon: Newspaper },
    { id: "jurnal_pa", label: "Jurnal PA", icon: BookMarked },
    { id: "donasi", label: "Donasi", icon: HeartHandshake },
    { id: "links", label: "Tautan Sumber", icon: Link2 },
    { id: "pekerjaan", label: "Pekerjaan", icon: Briefcase },
    { id: "ai", label: "Sion AI Assistant", icon: Sparkles },
  ];

  return (
    <>
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 h-screen sticky top-0 border-r border-slate-800 shrink-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3 bg-gradient-to-r from-indigo-950 to-slate-900">
          <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700/55 shadow-inner">
            <SionLogo className="h-9 w-9" />
          </div>
          <div>
            <h1 className="font-display font-bold text-base tracking-tight leading-none text-white">SION MINISTRY</h1>
            <p className="text-[9px] text-slate-400 font-mono tracking-widest mt-1.5 uppercase">Amanat Agung</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Offline & Sync Status Control Center */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-3">
            {/* Connection Switcher */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Status Koneksi</span>
              <button
                onClick={onToggleOnline}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold select-none transition-all ${
                  syncState.isOnline
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {syncState.isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 animate-pulse" />
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    <span>Offline</span>
                  </>
                )}
              </button>
            </div>

            {/* Pending queue metrics */}
            {syncState.pendingChanges.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-[11px] text-amber-300 flex items-center justify-between">
                <span>Antrean sinkronisasi:</span>
                <span className="font-bold bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded text-[10px]">
                  {syncState.pendingChanges.length} item
                </span>
              </div>
            )}

            {/* Sync trigger button */}
            <button
              disabled={!syncState.isOnline || isSyncing}
              onClick={onSync}
              className={`w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                !syncState.isOnline
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                  : isSyncing
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 cursor-wait"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 border border-indigo-500/50"
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}</span>
            </button>

            {/* Timestamp of last sync */}
            <div className="text-[10px] text-slate-500 text-center font-mono leading-tight">
              Sinkronisasi Terakhir:<br />
              {syncState.lastSyncedAt 
                ? new Date(syncState.lastSyncedAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  }) + " WIB"
                : "Belum pernah"}
            </div>
          </div>
        </div>
      </aside>

      {/* Sticky Bottom Nav Bar for Mobile Devices */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 px-2 py-1 flex justify-around items-center">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                isActive 
                  ? "text-indigo-400 bg-slate-800/50" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] mt-0.5 font-medium tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
