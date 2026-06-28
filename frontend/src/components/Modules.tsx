import React, { useState, useMemo } from "react";
import { 
  BookOpen, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  BookMarked,
  ArrowLeft,
  Book,
  Smartphone,
  ChevronDown,
  Info
} from "lucide-react";
import { DiscipleshipModule } from "../types";

interface ModulesProps {
  modules: DiscipleshipModule[];
  onToggleDownload: (id: string) => void;
  onCompleteModule: (id: string) => void;
}

export default function Modules({
  modules,
  onToggleDownload,
  onCompleteModule
}: ModulesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedModule, setSelectedModule] = useState<DiscipleshipModule | null>(null);
  const [expandedOutlineIndex, setExpandedOutlineIndex] = useState<number | null>(null);

  const categories = ["All", "Dasar Iman", "Karakter Kristus", "Amanat Agung", "Kepemimpinan"];

  // Filter modules - optimizing for instant response (client-side memoization)
  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      const matchesSearch = 
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.scripture.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "All" || m.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [modules, searchTerm, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Detail Module Viewer Mode */}
      {selectedModule ? (
        <div className="bg-white rounded-3xl border border-slate-100 material-shadow-2 overflow-hidden">
          {/* Module Banner Cover */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white relative">
            <button 
              onClick={() => {
                setSelectedModule(null);
                setExpandedOutlineIndex(null);
              }}
              className="absolute top-6 left-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white backdrop-blur-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="pt-10 max-w-4xl space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="bg-indigo-500 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full">
                  {selectedModule.category}
                </span>
                <span className="flex items-center text-xs text-indigo-200 bg-white/10 px-2.5 py-1 rounded-full">
                  <Clock className="h-3 w-3 mr-1" />
                  {selectedModule.readingTime} Menit Bacaan
                </span>
                {selectedModule.isDownloaded ? (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-medium">
                    Tersedia Offline
                  </span>
                ) : (
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-medium">
                    Streaming Online
                  </span>
                )}
              </div>

              <h2 className="font-display font-bold text-xl sm:text-3xl tracking-tight leading-tight">
                {selectedModule.title}
              </h2>

              <p className="text-slate-300 text-sm italic font-serif bg-slate-950/30 p-3 rounded-xl border-l-4 border-indigo-500">
                📖 {selectedModule.scripture}
              </p>
            </div>
          </div>

          {/* Module interactive Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            {/* Core study content (2/3 width) */}
            <div className="lg:col-span-2 p-6 sm:p-8 space-y-6">
              <div className="prose prose-indigo max-w-none text-slate-800 leading-relaxed font-sans text-sm sm:text-base space-y-6">
                {/* Clean formatted lesson content */}
                {selectedModule.content.split("\n\n").map((para, i) => {
                  if (para.startsWith("###")) {
                    return <h3 key={i} className="font-display font-bold text-lg text-slate-900 pt-4 border-b border-slate-100 pb-2">{para.replace("### ", "")}</h3>;
                  }
                  if (para.startsWith("####")) {
                    return <h4 key={i} className="font-display font-semibold text-base text-indigo-700 pt-2">{para.replace("#### ", "")}</h4>;
                  }
                  if (para.startsWith("- ")) {
                    return (
                      <ul key={i} className="list-disc pl-5 space-y-1.5 text-slate-600 text-sm">
                        {para.split("\n").map((li, j) => (
                          <li key={j}>{li.replace("- ", "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={i} className="text-slate-600 text-sm sm:text-base leading-relaxed">{para}</p>;
                })}
              </div>

              {/* Action checklist */}
              <div className="border-t border-slate-100 pt-8 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
                  <Info className="h-4 w-4 text-indigo-500" />
                  <span>Selesaikan modul untuk merekam progress di akun pelayan Anda.</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onToggleDownload(selectedModule.id)}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      selectedModule.isDownloaded
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Download className="h-4 w-4" />
                    <span>{selectedModule.isDownloaded ? "Hapus dari Offline" : "Unduh untuk Offline"}</span>
                  </button>

                  <button
                    onClick={() => {
                      onCompleteModule(selectedModule.id);
                      setSelectedModule({ ...selectedModule, isCompleted: true });
                    }}
                    disabled={selectedModule.isCompleted}
                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                      selectedModule.isCompleted
                        ? "bg-emerald-600 text-white shadow-emerald-600/10 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{selectedModule.isCompleted ? "Selesai Dipelajari" : "Tandai Selesai"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar study guidelines (1/3 width) */}
            <div className="p-6 bg-slate-50/50 space-y-6">
              <div>
                <h4 className="font-display font-bold text-sm text-slate-900 uppercase tracking-wider font-mono">Garis Besar Pelajaran</h4>
                <p className="text-xs text-slate-400 mt-1">Struktur poin penting dalam modul ini</p>
              </div>

              <div className="space-y-3">
                {selectedModule.outline.map((item, idx) => {
                  const isExpanded = expandedOutlineIndex === idx;
                  return (
                    <div 
                      key={idx} 
                      className="bg-white border border-slate-100 rounded-xl overflow-hidden material-shadow-1 hover:border-indigo-100 transition-all"
                    >
                      <button
                        onClick={() => setExpandedOutlineIndex(isExpanded ? null : idx)}
                        className="w-full flex items-center justify-between p-3 text-left"
                      >
                        <span className="text-xs font-semibold text-slate-800 line-clamp-1">{item}</span>
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-all ${isExpanded ? "transform rotate-180 text-indigo-500" : ""}`} />
                      </button>
                      
                      {isExpanded && (
                        <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed font-light">
                          Gunakan poin ini untuk mendiskusikan pemahaman mendalam bersama jemaat baru. Berikan pertanyaan terbuka berdasarkan nas Alkitab yang dicantumkan agar mereka membagikan respon pribadi.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Practical tips card */}
              <div className="bg-indigo-950 text-indigo-100 rounded-2xl p-4 border border-indigo-900 material-shadow-1 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-800/20 rounded-full blur-xl"></div>
                <BookMarked className="h-5 w-5 text-indigo-400 mb-2" />
                <h5 className="text-xs font-bold text-white">Panduan Diskusi Lapangan</h5>
                <p className="text-[11px] text-indigo-200 mt-1.5 leading-relaxed">
                  Mintalah murid Anda membaca nats Alkitab secara keras. Tanyakan 3 pertanyaan sederhana: Apa yang dipelajari tentang Allah? Apa yang dipelajari tentang manusia? Bagaimana kita menerapkannya hari ini?
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Standard Grid Module Explorer
        <>
          {/* Header section with category tab filters */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 material-shadow-1 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-display font-bold text-lg text-slate-900">Kurikulum Pendidikan Sion</h2>
                <p className="text-xs text-slate-400 mt-1">Akses cepat bahan ajar pemuridan secara berjenjang & mandiri</p>
              </div>

              {/* Instant Search input */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari modul, nats Alkitab..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Category horizontal filters */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {cat === "All" ? "Semua Kurikulum" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Performance Warning banner */}
          <div className="bg-slate-900 text-slate-300 p-4 rounded-2xl flex items-center justify-between border border-slate-800 text-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-800 rounded-lg shrink-0">
                <Smartphone className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <span className="font-semibold text-white block">Akses Tanpa Hambatan di Pelayanan</span>
                <span className="text-[11px] text-slate-400">Unduh kurikulum favorit Anda sebelum berangkat melakukan pelayanan di daerah minim sinyal.</span>
              </div>
            </div>
            <div className="font-mono text-[10px] bg-slate-800 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded-full shrink-0 hidden md:block">
              100% Cache Teroptimasi
            </div>
          </div>

          {/* Module list layout */}
          {filteredModules.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center material-shadow-1 space-y-3">
              <Book className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">Modul Tidak Ditemukan</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">Silakan ubah kata kunci pencarian atau kategori filter Anda untuk menemukan kurikulum pemuridan yang tepat.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredModules.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-white rounded-3xl border border-slate-100 material-shadow-1 hover:material-shadow-2 hover:border-indigo-100 transition-all p-5 flex flex-col justify-between group cursor-pointer"
                  onClick={() => setSelectedModule(mod)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-indigo-50 text-indigo-600 text-[9px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-md">
                        {mod.category}
                      </span>
                      <div className="flex items-center space-x-2">
                        {mod.isCompleted && (
                          <span className="text-emerald-500 font-bold flex items-center space-x-1 text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Selesai</span>
                          </span>
                        )}
                        <span className={`h-2.5 w-2.5 rounded-full ${mod.isDownloaded ? "bg-emerald-400" : "bg-slate-200"}`} title={mod.isDownloaded ? "Tersedia Offline" : "Membutuhkan Internet"}></span>
                      </div>
                    </div>

                    <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-all leading-tight">
                      {mod.title}
                    </h3>

                    <p className="text-[11px] font-serif text-slate-500 font-medium bg-slate-50 p-2 rounded-lg inline-block border-l-2 border-indigo-400">
                      📖 {mod.scripture}
                    </p>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-medium font-mono">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{mod.readingTime} Menit Membaca</span>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModule(mod);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-500 font-bold flex items-center space-x-1"
                    >
                      <span>Mulai Pelajaran</span>
                      <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-all" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
