import React, { useState, useMemo } from "react";
import { 
  BookMarked, 
  Search, 
  Plus, 
  BookOpen, 
  Calendar, 
  User, 
  MapPin, 
  Trash2, 
  Sparkles, 
  X,
  PlusCircle,
  Hash,
  Compass
} from "lucide-react";
import { JurnalPA, City } from "../types";

interface JurnalPAProps {
  jurnalList: JurnalPA[];
  cities: City[];
  onAddJurnal: (jurnal: Omit<JurnalPA, "id" | "synced" | "action">) => void;
  onDeleteJurnal: (id: string) => void;
  isOnline: boolean;
}

// Preset documentation images for PA
const PA_PRESET_IMAGES = [
  "https://images.unsplash.com/photo-1504052434569-70ad585e515d?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&auto=format&fit=crop&q=80"
];

export default function JurnalPAComponent({
  jurnalList,
  cities,
  onAddJurnal,
  onDeleteJurnal,
  isOnline
}: JurnalPAProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCityId, setSelectedCityId] = useState<string>("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTheme, setFormTheme] = useState("");
  const [formScripture, setFormScripture] = useState("");
  const [formFocus, setFormFocus] = useState("");
  const [formMenteeName, setFormMenteeName] = useState("");
  const [formMentorName, setFormMentorName] = useState("Yosua Reynaldi");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formCityId, setFormCityId] = useState("");
  const [formImage, setFormImage] = useState(PA_PRESET_IMAGES[0]);
  const [formNotes, setFormNotes] = useState("");
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  // Filter Jurnal PA
  const filteredJurnal = useMemo(() => {
    return jurnalList.filter((j) => {
      const matchesSearch = 
        j.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.scripture.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.focus.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.menteeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.notes.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCity = selectedCityId === "All" || j.cityId === selectedCityId;

      return matchesSearch && matchesCity;
    });
  }, [jurnalList, searchTerm, selectedCityId]);

  const handleOpenAddModal = () => {
    setFormTheme("");
    setFormScripture("");
    setFormFocus("");
    setFormMenteeName("");
    setFormMentorName("Yosua Reynaldi");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormCityId(cities[0]?.id || "");
    setFormImage(PA_PRESET_IMAGES[0]);
    setFormNotes("");
    setIsModalOpen(true);
  };

  const handleAiReflect = async () => {
    if (!formScripture || !formTheme) {
      alert("Silakan isi Tema PA dan Ayat Alkitab (Nats) terlebih dahulu agar AI Sion dapat membantu menyusun draf catatan pendampingan rohani!");
      return;
    }

    setIsAiDrafting(true);
    try {
      const promptText = `Saya seorang mentor pemuridan di Sion Ministry. Saya baru saja melakukan penelaahan alkitab (PA / Pemuridan) bersama murid saya bernama "${formMenteeName || "Mentee"}". 
Tema diskusi kami adalah "${formTheme}" berdasarkan nats alkitab "${formScripture}". Fokus pembahasannya adalah "${formFocus || "pembentukan karakter rohani"}".
Tolong susunkan draf catatan pemuridan yang rapi, padat (2-3 kalimat), berfokus pada aplikasi praktis firman Tuhan, serta doa kelanjutan bagi murid. Berikan teks catatannya saja secara santun dan teologis tanpa pembuka tambahan.`;

      const response = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          systemInstruction: "Anda adalah teolog pemuridan Sion Ministry Indonesia yang ahli menyusun catatan pendampingan rohani praktis untuk memperlengkapi murid-murid Kristus."
        })
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      if (data.text) {
        setFormNotes(data.text);
      }
    } catch {
      alert("AI Sion sedang sibuk. Menghasilkan refleksi bimbingan pemuridan otomatis...");
      setFormNotes(`Bersyukur atas bimbingan hari ini mengenai "${formTheme}" (${formScripture}). Bersama ${formMenteeName || "Mentee"}, kami merenungkan pentingnya menghidupi kebenaran ini secara riil. Pokok doa difokuskan agar benih firman ini bertumbuh lebat dan berbuah dalam ketaatan murid.`);
    } finally {
      setIsAiDrafting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTheme || !formScripture || !formMenteeName || !formCityId) {
      alert("Nama Murid, Tema PA, Ayat Alkitab, dan Kota wajib diisi!");
      return;
    }

    const cityObj = cities.find(c => c.id === formCityId);
    const cityName = cityObj ? cityObj.name : "";

    onAddJurnal({
      theme: formTheme,
      scripture: formScripture,
      focus: formFocus || "Pertumbuhan Karakter Kristen",
      menteeName: formMenteeName,
      mentorName: formMentorName,
      date: formDate,
      cityId: formCityId,
      cityName,
      image: formImage,
      notes: formNotes || "Kegiatan Penelaahan Alkitab (PA) terlaksana secara intim dan mendalam."
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner / Title Header */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 material-shadow-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-display font-bold text-slate-900 tracking-tight">Jurnal Pendampingan Alkitab (PA)</h2>
          <p className="text-xs text-slate-500">Mencatat, meninjau, dan melacak pertumbuhan rohani mentee/murid Kristus per kota jangkauan.</p>
        </div>
        
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/10 self-start md:self-auto shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tulis Jurnal PA</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari tema, mentee, ayat alkitab, atau catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <select
          value={selectedCityId}
          onChange={(e) => setSelectedCityId(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700"
        >
          <option value="All">Semua Pos Kota</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>{city.name}</option>
          ))}
        </select>
      </div>

      {/* Journals Grid */}
      {filteredJurnal.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center material-shadow-1">
          <BookMarked className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Belum ada jurnal PA yang ditemukan.</p>
          <p className="text-xs text-slate-400 mt-1">Buat jurnal pendampingan murid pertama Anda hari ini untuk melacak buah pemuridan!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJurnal.map((jurnal) => (
            <div key={jurnal.id} className="bg-white rounded-3xl border border-slate-100 material-shadow-2 overflow-hidden flex flex-col justify-between hover:border-indigo-100 transition-all">
              
              {/* Card Thumbnail Top */}
              <div className="relative aspect-video w-full bg-slate-100">
                <img
                  src={jurnal.image}
                  alt={jurnal.theme}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-indigo-400" />
                  <span>{jurnal.scripture}</span>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      Fokus: {jurnal.focus}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {jurnal.date}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-sm text-slate-900 leading-snug">{jurnal.theme}</h3>
                  
                  {/* Mentee info */}
                  <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-50 text-[11px] text-slate-600">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Mentee (Murid)</span>
                      <span className="font-bold text-slate-800">{jurnal.menteeName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Mentor</span>
                      <span className="font-semibold">{jurnal.mentorName}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 leading-relaxed italic bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/60">
                    "{jurnal.notes}"
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-50 font-mono">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    Sion {jurnal.cityName}
                  </span>
                  
                  <button
                    onClick={() => {
                      if (confirm("Hapus jurnal bimbingan PA ini?")) onDeleteJurnal(jurnal.id);
                    }}
                    className="text-rose-500 hover:text-rose-700 font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* New Journal PA Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden material-shadow-3 max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div className="flex items-center space-x-2">
                <BookMarked className="h-5 w-5 text-indigo-400" />
                <h3 className="font-display font-bold text-sm">Tulis Jurnal PA Baru</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Mentee/Murid</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Roy, Handoko..."
                    value={formMenteeName}
                    onChange={(e) => setFormMenteeName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mentor/Pekerja</label>
                  <input
                    type="text"
                    required
                    value={formMentorName}
                    onChange={(e) => setFormMentorName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tema PA (Pembahasan)</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Kasih Karunia Allah, Melayani Sesama..."
                    value={formTheme}
                    onChange={(e) => setFormTheme(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ayat Alkitab / Nats</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Matius 28:19-20, Efesus 2:8-9"
                    value={formScripture}
                    onChange={(e) => setFormScripture(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pos Kota</label>
                  <select
                    value={formCityId}
                    onChange={(e) => setFormCityId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700"
                  >
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fokus PA</label>
                  <input
                    type="text"
                    placeholder="Misal: Ketaatan, Iman, Karakter"
                    value={formFocus}
                    onChange={(e) => setFormFocus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Single Image documentation picker */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Foto Dokumentasi Sesi PA</label>
                <div className="flex gap-2.5 overflow-x-auto p-2.5 bg-slate-50 rounded-2xl border border-slate-100/80">
                  {PA_PRESET_IMAGES.map((url, idx) => {
                    const isSelected = formImage === url;
                    return (
                      <div 
                        key={idx}
                        type="button"
                        onClick={() => setFormImage(url)}
                        className={`relative w-16 h-12 rounded-lg overflow-hidden cursor-pointer shrink-0 border-2 transition-all ${
                          isSelected ? "border-indigo-600 scale-105 shadow" : "border-transparent opacity-60"
                        }`}
                      >
                        <img src={url} alt={`PA Preset ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Study Notes & AI assist */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catatan & Evaluasi rohani murid</label>
                  <button
                    type="button"
                    disabled={isAiDrafting}
                    onClick={handleAiReflect}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                      isAiDrafting 
                        ? "bg-indigo-600/30 text-indigo-300 cursor-wait border-none"
                        : "bg-indigo-950 hover:bg-slate-950 text-white border-indigo-800 cursor-pointer"
                    }`}
                  >
                    <Sparkles className={`h-3 w-3 text-indigo-400 ${isAiDrafting ? "animate-spin" : ""}`} />
                    <span>{isAiDrafting ? "Menyusun..." : "Susun dengan AI Sion"}</span>
                  </button>
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder="Ceritakan jalannya PA. Apa komitmen iman mentee Anda dari pembacaan alkitab kali ini? Tulis di sini..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Simpan Jurnal PA
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
