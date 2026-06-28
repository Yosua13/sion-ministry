import React, { useState, useMemo } from "react";
import { 
  Newspaper, 
  Search, 
  Plus, 
  MapPin, 
  Calendar, 
  User, 
  Users, 
  Sparkles, 
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageSquare,
  Share2,
  Trash2,
  Image as ImageIcon
} from "lucide-react";
import { BeritaAcara, City } from "../types";

interface BeritaAcaraProps {
  beritaList: BeritaAcara[];
  cities: City[];
  onAddBerita: (berita: Omit<BeritaAcara, "id" | "synced" | "action">) => void;
  onDeleteBerita: (id: string) => void;
  isOnline: boolean;
}

// Preset high-quality images for simulation/quick insert
const PRESET_IMAGES = [
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1471623322304-7e9c9b9ce370?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1541976844346-f18aeac57b06?w=800&auto=format&fit=crop&q=80"
];

export default function BeritaAcaraComponent({
  beritaList,
  cities,
  onAddBerita,
  onDeleteBerita,
  isOnline
}: BeritaAcaraProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCityId, setSelectedCityId] = useState<string>("All");
  const [selectedActivity, setSelectedActivity] = useState<string>("All");

  // Like state simulation
  const [likes, setLikes] = useState<Record<string, { count: number; active: boolean }>>({
    "ber-1": { count: 42, active: true },
    "ber-2": { count: 28, active: false },
    "ber-3": { count: 19, active: false }
  });

  // Active slide state for carousels
  const [activeSlides, setActiveSlides] = useState<Record<string, number>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formCityId, setFormCityId] = useState("");
  const [formWorker, setFormWorker] = useState("");
  const [formType, setFormType] = useState<BeritaAcara["activityType"]>("Sion Raya (SR)");
  const [formAttendees, setFormAttendees] = useState<number>(10);
  const [formDescription, setFormDescription] = useState("");
  
  // Multiple images state for the upload form
  const [formImages, setFormImages] = useState<string[]>([]);
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  const toggleLike = (id: string) => {
    setLikes(prev => {
      const current = prev[id] || { count: 0, active: false };
      return {
        ...prev,
        [id]: {
          count: current.active ? current.count - 1 : current.count + 1,
          active: !current.active
        }
      };
    });
  };

  const handleNextSlide = (id: string, max: number) => {
    setActiveSlides(prev => {
      const current = prev[id] || 0;
      return { ...prev, [id]: current === max - 1 ? 0 : current + 1 };
    });
  };

  const handlePrevSlide = (id: string, max: number) => {
    setActiveSlides(prev => {
      const current = prev[id] || 0;
      return { ...prev, [id]: current === 0 ? max - 1 : current - 1 };
    });
  };

  // Filter List
  const filteredBerita = useMemo(() => {
    return beritaList.filter((b) => {
      const matchesSearch = 
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.workerName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCity = selectedCityId === "All" || b.cityId === selectedCityId;
      const matchesActivity = selectedActivity === "All" || b.activityType === selectedActivity;

      return matchesSearch && matchesCity && matchesActivity;
    });
  }, [beritaList, searchTerm, selectedCityId, selectedActivity]);

  const handleOpenAddModal = () => {
    setFormTitle("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormCityId(cities[0]?.id || "");
    setFormWorker("Yosua Reynaldi");
    setFormType("Sion Raya (SR)");
    setFormAttendees(25);
    setFormDescription("");
    setFormImages([PRESET_IMAGES[0]]); // default with 1 image
    setIsModalOpen(true);
  };

  // Add a picture to the active upload collection
  const handleAddPresetImage = (url: string) => {
    if (formImages.includes(url)) {
      setFormImages(formImages.filter(img => img !== url));
    } else {
      setFormImages([...formImages, url]);
    }
  };

  const handleAiDraft = async () => {
    if (!formDescription && !formTitle) {
      alert("Silakan tulis judul atau draf poin-poin catatan draf terlebih dahulu agar AI Sion bisa merapikannya!");
      return;
    }

    setIsAiDrafting(true);
    try {
      const promptText = `Saya sedang melayani di Sion Ministry. Tolong bantu drafkan narasi berita acara kegiatan ibadah/misi dengan tema "${formTitle || "Pelayanan Sion"}" tipe kegiatan "${formType}". Catatan draf kasar saya: "${formDescription || "Ibadah berjalan luar biasa, jemaat diberkati, firman tersampaikan dengan baik"}".
Buatkan laporan berita acara resmi Sion Ministry Indonesia yang rapi, padat, bersemangat rohani (anointed), menginspirasi pembaca, dan siap dipublikasikan di newsfeed. Maksimal 3-4 kalimat. Tuliskan narasinya saja tanpa ada label pendahuluan.`;

      const response = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          systemInstruction: "Anda adalah penulis buletin resmi Sion Ministry yang andal menulis berita acara dengan bahasa Indonesia rohani yang indah, taktis, dan membangkitkan iman."
        })
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      if (data.text) {
        setFormDescription(data.text);
      }
    } catch {
      alert("AI Sion sedang sibuk. Menulis draf simulasi rohani...");
      setFormDescription(`Kegiatan ${formType} dengan tema "${formTitle || 'Tuhan Yesus Penyelamat'}" terlaksana dengan penuh hadirat Tuhan. Pokok doa keliling dipanjatkan untuk multiplikasi jiwa-jiwa baru serta penjangkauan masyarakat pedalaman. Semua pekerja melayani dengan hati hamba.`);
    } finally {
      setIsAiDrafting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formCityId) {
      alert("Judul dan Kota wajib diisi!");
      return;
    }

    const cityObj = cities.find(c => c.id === formCityId);
    const cityName = cityObj ? cityObj.name : "";

    onAddBerita({
      title: formTitle,
      date: formDate,
      cityId: formCityId,
      cityName,
      workerName: formWorker,
      activityType: formType,
      attendeesCount: Number(formAttendees),
      description: formDescription || "Laporan kegiatan pelayanan Sion Ministry terlaksana dengan baik.",
      images: formImages.length > 0 ? formImages : [PRESET_IMAGES[0]]
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Quick Filters Header */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 material-shadow-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-display font-bold text-slate-900 tracking-tight">Berita Acara Pelayanan</h2>
          <p className="text-xs text-slate-500">Menampilkan berita duka, misi pedalaman, Sion Raya (SR), PDS, Komsel, dan aksi doa keliling.</p>
        </div>
        
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/10 self-start md:self-auto shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Berita Acara</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative col-span-1 sm:col-span-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berita acara..."
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

        <select
          value={selectedActivity}
          onChange={(e) => setSelectedActivity(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700"
        >
          <option value="All">Semua Jenis Kegiatan</option>
          <option value="Sion Raya (SR)">Sion Raya (SR)</option>
          <option value="Persekutuan Doa Sion (PDS)">Persekutuan Doa Sion (PDS)</option>
          <option value="Komsel">Komsel</option>
          <option value="Misi Pedalaman">Misi Pedalaman</option>
          <option value="Doa Keliling">Doa Keliling</option>
          <option value="Lainnya">Lainnya</option>
        </select>
      </div>

      {/* Grid of Instagram style cards */}
      {filteredBerita.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center material-shadow-1">
          <Newspaper className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Belum ada berita acara yang cocok dengan pencarian.</p>
          <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter kota atau kata kunci pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredBerita.map((berita) => {
            const currentSlide = activeSlides[berita.id] || 0;
            const likeInfo = likes[berita.id] || { count: 0, active: false };
            
            return (
              <div key={berita.id} className="bg-white rounded-3xl border border-slate-100 material-shadow-2 hover:border-indigo-100 transition-all flex flex-col overflow-hidden">
                
                {/* Card Header (Profile Style) */}
                <div className="p-4 flex items-center justify-between border-b border-slate-50">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                      {berita.cityName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">{berita.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span>Sion {berita.cityName}</span>
                        <span>•</span>
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>{berita.date}</span>
                      </p>
                    </div>
                  </div>

                  {/* Badge */}
                  <span className="bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full select-none shrink-0">
                    {berita.activityType.split(" ")[0]}
                  </span>
                </div>

                {/* Instagram Image Slide */}
                <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden group">
                  <img
                    src={berita.images[currentSlide]}
                    alt={`${berita.title} documentation ${currentSlide + 1}`}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    referrerPolicy="no-referrer"
                  />

                  {/* Image counter indicator */}
                  {berita.images.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold font-mono px-2 py-0.5 rounded-full z-10">
                      {currentSlide + 1}/{berita.images.length}
                    </div>
                  )}

                  {/* Navigation controls */}
                  {berita.images.length > 1 && (
                    <>
                      <button
                        onClick={() => handlePrevSlide(berita.id, berita.images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/70 hover:bg-white text-slate-800 rounded-full shadow-md transition-all z-10 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleNextSlide(berita.id, berita.images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/70 hover:bg-white text-slate-800 rounded-full shadow-md transition-all z-10 cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  {/* Pagination dots */}
                  {berita.images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
                      {berita.images.map((_, idx) => (
                        <span
                          key={idx}
                          className={`h-1.5 w-1.5 rounded-full transition-all ${
                            idx === currentSlide ? "bg-white scale-125" : "bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Interaction Row (Instagram Feed Style) */}
                <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => toggleLike(berita.id)}
                      className="flex items-center space-x-1 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Heart className={`h-4.5 w-4.5 transition-transform ${likeInfo.active ? "text-rose-600 fill-rose-600 scale-110" : ""}`} />
                      <span className="text-[11px] font-bold">{likeInfo.count} Dukungan Doa</span>
                    </button>

                    <div className="flex items-center space-x-1 text-slate-400">
                      <User className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium text-slate-500">{berita.workerName}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-slate-500 text-[10px] font-bold">
                    <Users className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Hadir: {berita.attendeesCount} Jiwa</span>
                  </div>
                </div>

                {/* Description Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    {berita.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-50">
                    <span>ID: {berita.id}</span>
                    <button 
                      onClick={() => {
                        if (confirm("Hapus berita acara pelayanan ini?")) onDeleteBerita(berita.id);
                      }}
                      className="text-rose-500 hover:text-rose-700 font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Create New Berita Acara Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden material-shadow-3 max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div className="flex items-center space-x-2">
                <Newspaper className="h-5 w-5 text-indigo-400" />
                <h3 className="font-display font-bold text-sm">Buat Berita Acara Baru</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* Form Input fields */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Judul / Kegiatan</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kebaktian Sion Raya Kenaikan, Ekspedisi Misi pedalaman..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Jenis Kegiatan</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as BeritaAcara["activityType"])}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
                  >
                    <option value="Sion Raya (SR)">Sion Raya (SR)</option>
                    <option value="Persekutuan Doa Sion (PDS)">Persekutuan Doa Sion (PDS)</option>
                    <option value="Komsel">Komsel</option>
                    <option value="Misi Pedalaman">Misi Pedalaman</option>
                    <option value="Doa Keliling">Doa Keliling</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hadir (Jiwa)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formAttendees}
                    onChange={(e) => setFormAttendees(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Pelayan/Pekerja</label>
                  <input
                    type="text"
                    required
                    value={formWorker}
                    onChange={(e) => setFormWorker(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Instagram multiple image upload simulation */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dokumentasi Foto (Pilih beberapa - Gaya Instagram)</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  {PRESET_IMAGES.map((url, idx) => {
                    const isSelected = formImages.includes(url);
                    return (
                      <div 
                        key={idx} 
                        onClick={() => handleAddPresetImage(url)}
                        className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 ${
                          isSelected ? "border-indigo-600 scale-95" : "border-transparent opacity-60"
                        }`}
                      >
                        <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center text-white text-[10px] font-extrabold font-mono">
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[9px] text-slate-400">Ketuk gambar untuk memilih/batal memilih. Anda bisa memilih lebih dari satu foto untuk ditampilkan dalam carousel Instagram!</p>
              </div>

              {/* Description & AI assist */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deskripsi Laporan Berita Acara</label>
                  <button
                    type="button"
                    disabled={isAiDrafting}
                    onClick={handleAiDraft}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                      isAiDrafting 
                        ? "bg-indigo-600/30 text-indigo-300 cursor-wait border-none"
                        : "bg-indigo-950 hover:bg-slate-950 text-white border-indigo-800 cursor-pointer"
                    }`}
                  >
                    <Sparkles className={`h-3 w-3 text-indigo-400 ${isAiDrafting ? "animate-spin" : ""}`} />
                    <span>{isAiDrafting ? "Mendraf..." : "Tulis dengan AI Sion"}</span>
                  </button>
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder="Misalkan: Ibadah lancar dipenuhi kasih Allah. Doakan agar jemaat terus bertekun dalam kelompok sel pemuridan minggu depan..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
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
                  Simpan Laporan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
