import React from "react";
import { 
  Globe, 
  Users, 
  Newspaper, 
  TrendingUp, 
  MapPin, 
  Calendar, 
  BookOpen, 
  ArrowRight,
  ShieldAlert,
  BookMarked,
  HeartHandshake
} from "lucide-react";
import { City, Member, BeritaAcara, JurnalPA, DonationCampaign, SyncState } from "../types";

import { useState } from "react";

interface DashboardProps {
  cities: City[];
  members: Member[];
  berita: BeritaAcara[];
  jurnalPa: JurnalPA[];
  campaigns: DonationCampaign[];
  syncState: SyncState;
  onNavigateToTab: (tab: string) => void;
  onAddCity: (city: Omit<City, "id" | "membersCount" | "journalsCount" | "beritaCount" | "jurnalPaCount">) => void;
}

export default function Dashboard({
  cities,
  members,
  berita,
  jurnalPa,
  campaigns,
  syncState,
  onNavigateToTab,
  onAddCity
}: DashboardProps) {
  // Add City Modal states
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [newCityRegion, setNewCityRegion] = useState("");
  const [newCityReachedDate, setNewCityReachedDate] = useState("");
  const [newCityWorkersCount, setNewCityWorkersCount] = useState(1);
  const [cityFormErrors, setCityFormErrors] = useState<Record<string, string>>({});
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const handleSaveCity = () => {
    const errors: Record<string, string> = {};
    if (!newCityName.trim()) errors.name = "Nama kota wajib diisi";
    if (!newCityRegion.trim()) errors.region = "Wilayah/Provinsi wajib diisi";
    if (!newCityReachedDate) errors.reachedDate = "Tanggal mulai dijangkau wajib dipilih";

    if (Object.keys(errors).length > 0) {
      setCityFormErrors(errors);
      return;
    }

    onAddCity({
      name: newCityName,
      region: newCityRegion,
      reachedDate: newCityReachedDate,
      workersCount: newCityWorkersCount,
    });

    setCityFormErrors({});
    setIsAddCityOpen(false);
    
    // Clear inputs
    setNewCityName("");
    setNewCityRegion("");
    setNewCityReachedDate("");
    setNewCityWorkersCount(1);

    // Show success banner
    setShowSuccessAlert(true);
    setTimeout(() => {
      setShowSuccessAlert(false);
    }, 2000);
  };
  // Aggregate statistics
  const totalCities = cities.length;
  const totalMembers = members.length;
  const totalBerita = berita.length;
  const totalJurnalPa = jurnalPa.length;
  const activeMembersCount = members.filter((m) => m.status === "active").length;

  const totalDonationsCollected = campaigns.reduce((sum, c) => sum + c.collectedAmount, 0);

  // Spiritual maturity breakdown for SVG progress indicators
  const stages = {
    "Pra-Murid": members.filter((m) => m.discipleshipStage === "Pra-Murid").length,
    "Murid Baru": members.filter((m) => m.discipleshipStage === "Murid Baru").length,
    "Murid Bertumbuh": members.filter((m) => m.discipleshipStage === "Murid Bertumbuh").length,
    "Pembuat Murid": members.filter((m) => m.discipleshipStage === "Pembuat Murid").length,
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get recent 3 berita
  const recentBerita = [...berita].slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Inspirational commissioning banner (Matius 28:19-20) */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 sm:p-8 text-white border border-slate-800 material-shadow-2">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-50/5 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative z-10 max-w-3xl">
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider font-mono">
            Amanat Agung Matius 28:19-20
          </span>
          <h2 className="font-display font-bold text-lg sm:text-xl mt-4 leading-tight">
            "Karena itu pergilah, jadikanlah semua bangsa murid-Ku dan baptislah mereka dalam nama Bapa dan Anak dan Roh Kudus..."
          </h2>
          <p className="text-slate-400 text-xs mt-2 font-light leading-relaxed">
            "...dan ajarlah mereka melakukan segala sesuatu yang telah Kuperintahkan kepadamu. Dan ketahuilah, Aku menyertai kamu senantiasa sampai kepada akhir zaman."
          </p>
          
          <div className="flex flex-wrap gap-3 mt-6">
            <button 
              onClick={() => onNavigateToTab("modules")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center space-x-2 cursor-pointer"
            >
              <span>Pelajari Modul</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => onNavigateToTab("ai")}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>Tanya Sion AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Connection Mode Warning if Offline */}
      {!syncState.isOnline && (
        <div className="bg-amber-500/15 border border-amber-500/30 text-amber-200 p-4 rounded-2xl flex items-start space-x-3">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-semibold text-amber-300">Sion Academy Sedang Berjalan dalam Mode Offline</h4>
            <p className="mt-1 opacity-90 leading-relaxed font-medium">
              Anda berada di area terpencil tanpa koneksi internet. Anda masih dapat menulis berita acara pelayanan, mengisi jurnal PA pendampingan murid, dan mengubah data jemaat. Perubahan akan disimpan secara lokal dan akan otomatis diantrekan untuk disinkronkan kembali saat Anda kembali online.
            </p>
          </div>
        </div>
      )}

      {/* Stat grid (Material cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Kota Terjangkau Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 material-shadow-1 hover:material-shadow-2 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Kota Terjangkau</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-all">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="font-display font-bold text-2xl text-slate-900">{totalCities}</span>
            <span className="text-[10px] text-indigo-600 font-bold ml-1.5">KOTA</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span>Aktif melayani jiwa</span>
          </div>
        </div>

        {/* Total Jemaat Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 material-shadow-1 hover:material-shadow-2 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Total Jemaat</span>
            <div className="p-2 bg-rose-50 text-indigo-600 rounded-xl group-hover:bg-rose-100 transition-all">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="font-display font-bold text-2xl text-slate-900">{totalMembers}</span>
            <span className="text-[10px] text-indigo-600 font-bold ml-1.5">JIWA</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-semibold">
            <span className="text-emerald-600 font-extrabold">{activeMembersCount}</span> aktif dimuridkan
          </div>
        </div>

        {/* Berita Acara Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 material-shadow-1 hover:material-shadow-2 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Berita Acara</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-all">
              <Newspaper className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="font-display font-bold text-2xl text-slate-900">{totalBerita}</span>
            <span className="text-[10px] text-amber-600 font-bold ml-1.5">BERITA</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-semibold">
            Aktivitas ibadah & misi
          </div>
        </div>

        {/* Jurnal PA Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 material-shadow-1 hover:material-shadow-2 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Jurnal PA</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl group-hover:bg-teal-100 transition-all">
              <BookMarked className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="font-display font-bold text-2xl text-slate-900">{totalJurnalPa}</span>
            <span className="text-[10px] text-teal-600 font-bold ml-1.5">JURNAL</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-semibold">
            Pertumbuhan murid
          </div>
        </div>

        {/* Donasi Terkumpul Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 material-shadow-1 hover:material-shadow-2 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Donasi Terkumpul</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-all">
              <HeartHandshake className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex flex-col justify-end">
            <span className="font-display font-bold text-sm text-slate-950 truncate block">{formatRupiah(totalDonationsCollected)}</span>
            <span className="text-[9px] text-slate-400 font-bold block uppercase mt-1">DARI PARA DONATUR</span>
          </div>
        </div>
      </div>

      {/* Core split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Spiritual Maturity Breakdown & City stats (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Spiritual Maturity Breakdown Visualization (Custom SVG Chart) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 material-shadow-1">
            <h3 className="font-display font-bold text-base text-slate-900">Perkembangan Tahapan Pemuridan</h3>
            <p className="text-xs text-slate-400 mt-1">Mengukur kedewasaan rohani seluruh jemaat yang dibimbing di Sion Ministry</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 items-center">
              {/* Custom SVG Donut Chart */}
              <div className="flex justify-center">
                <svg width="180" height="180" viewBox="0 0 200 200" className="transform -rotate-90">
                  {/* Outer circle track */}
                  <circle cx="100" cy="100" r="70" fill="transparent" stroke="#f1f5f9" strokeWidth="20" />
                  
                  {/* Draw 4 stylized semi-circular rings showing proportions of each level */}
                  <circle cx="100" cy="100" r="75" fill="transparent" stroke="#cbd5e1" strokeWidth="8" strokeDasharray="471" strokeDashoffset={471 - (471 * (stages["Pra-Murid"] / (totalMembers || 1)))} strokeLinecap="round" />
                  <circle cx="100" cy="100" r="60" fill="transparent" stroke="#ef4444" strokeWidth="8" strokeDasharray="377" strokeDashoffset={377 - (377 * (stages["Murid Baru"] / (totalMembers || 1)))} strokeLinecap="round" />
                  <circle cx="100" cy="100" r="45" fill="transparent" stroke="#EB2323" strokeWidth="8" strokeDasharray="282" strokeDashoffset={282 - (282 * (stages["Murid Bertumbuh"] / (totalMembers || 1)))} strokeLinecap="round" />
                  <circle cx="100" cy="100" r="30" fill="transparent" stroke="#10b981" strokeWidth="8" strokeDasharray="188" strokeDashoffset={188 - (188 * (stages["Pembuat Murid"] / (totalMembers || 1)))} strokeLinecap="round" />
                </svg>
              </div>

              {/* Chart Legend */}
              <div className="space-y-4">
                {(Object.keys(stages) as Array<keyof typeof stages>).map((stage) => {
                  const count = stages[stage];
                  const pct = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
                  
                  // Color dot indicator mapping
                  const dotColor = 
                    stage === "Pra-Murid" ? "bg-slate-400" :
                    stage === "Murid Baru" ? "bg-red-400" :
                    stage === "Murid Bertumbuh" ? "bg-indigo-600" : "bg-emerald-500";

                  return (
                    <div key={stage} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`h-3 w-3 rounded-full ${dotColor}`}></span>
                        <span className="text-xs font-semibold text-slate-700">{stage}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{count} Jiwa</span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-medium">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reached Cities Overview */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 material-shadow-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">Perkembangan Wilayah Pelayanan</h3>
                <p className="text-xs text-slate-400 mt-1">Data kota-kota di Indonesia yang telah dijangkau</p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setIsAddCityOpen(true)}
                  className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>+ Tambah Kota</span>
                </button>
                <button 
                  onClick={() => onNavigateToTab("members")}
                  className="text-xs text-indigo-600 font-bold hover:text-indigo-500 transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>Lihat Anggota</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-3 text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Kota</th>
                    <th className="py-3 text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Wilayah</th>
                    <th className="py-3 text-xs font-bold font-mono tracking-wider text-slate-400 uppercase text-center">Pekerja</th>
                    <th className="py-3 text-xs font-bold font-mono tracking-wider text-slate-400 uppercase text-center">Jemaat</th>
                    <th className="py-3 text-xs font-bold font-mono tracking-wider text-slate-400 uppercase text-center">Berita Acara</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cities.map((city) => (
                    <tr key={city.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="py-3 text-xs font-semibold text-slate-900 flex items-center space-x-2">
                        <MapPin className="h-3.5 w-3.5 text-indigo-500 group-hover:scale-110 transition-all" />
                        <span>{city.name}</span>
                      </td>
                      <td className="py-3 text-xs text-slate-500">{city.region}</td>
                      <td className="py-3 text-xs font-mono font-medium text-slate-600 text-center">{city.workersCount}</td>
                      <td className="py-3 text-xs font-mono font-bold text-indigo-600 text-center">{city.membersCount}</td>
                      <td className="py-3 text-xs text-center">
                        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                          {city.beritaCount ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Recent Activity / Reports logs (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 material-shadow-1 flex flex-col h-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">Aktivitas Laporan Terkini</h3>
                <p className="text-xs text-slate-400 mt-1">Berita acara pemuridan terbaru</p>
              </div>
              <button
                onClick={() => onNavigateToTab("berita")}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <Newspaper className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 flex-1">
              {recentBerita.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-slate-50/50 border border-slate-100/50 hover:bg-slate-50 hover:border-slate-100 p-4 rounded-2xl transition-all space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-mono uppercase">
                      {item.cityName}
                    </span>
                    <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(item.date).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}</span>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] border-t border-dashed border-slate-200">
                    <span className="text-slate-400">Pekerja: <strong className="text-slate-600">{item.workerName}</strong></span>
                    <span className="font-mono text-indigo-500 font-bold">{item.attendeesCount} Jemaat</span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => onNavigateToTab("berita")}
              className="mt-6 w-full text-center py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-100 cursor-pointer"
            >
              Tulis Berita Acara Baru
            </button>
          </div>
        </div>

      </div>

      {isAddCityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 max-w-sm w-full material-shadow-3 animate-scale-up">
            <h3 className="font-display font-bold text-base text-slate-900 mb-4">Tambah Kota Pelayanan</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Kota</label>
                <input 
                  type="text" 
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  placeholder="Contoh: Malang, Jayapura"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
                {cityFormErrors.name && (
                  <span className="text-red-500 text-[10px] mt-1 block font-semibold">{cityFormErrors.name}</span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Wilayah / Provinsi</label>
                <input 
                  type="text" 
                  value={newCityRegion}
                  onChange={(e) => setNewCityRegion(e.target.value)}
                  placeholder="Contoh: Jawa Timur, Papua"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
                {cityFormErrors.region && (
                  <span className="text-red-500 text-[10px] mt-1 block font-semibold">{cityFormErrors.region}</span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tanggal Mulai Dijangkau</label>
                <input 
                  type="date" 
                  value={newCityReachedDate}
                  onChange={(e) => setNewCityReachedDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                    cityFormErrors.reachedDate ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                  }`}
                />
                {cityFormErrors.reachedDate && (
                  <span className="text-red-500 text-[10px] mt-1 block font-semibold">{cityFormErrors.reachedDate}</span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jumlah Pekerja</label>
                <input 
                  type="number" 
                  min="0"
                  value={newCityWorkersCount}
                  onChange={(e) => setNewCityWorkersCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              <button 
                onClick={() => {
                  setIsAddCityOpen(false);
                  setCityFormErrors({});
                }}
                className="flex-1 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveCity}
                className="flex-1 py-2 bg-indigo-600 text-white hover:bg-indigo-500 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col items-center max-w-xs w-full text-center material-shadow-3">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-sm text-slate-900">Kota Berhasil Ditambahkan</h3>
            <p className="text-xs text-slate-400 mt-1">Kota baru telah terdaftar di database Sion Ministry.</p>
          </div>
        </div>
      )}
    </div>
  );
}
