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
import ConfirmDialog from "./ConfirmDialog";

const MAX_IMAGE_FILE_SIZE = 2 * 1024 * 1024;
const MAX_TOTAL_IMAGE_SIZE = 6 * 1024 * 1024;

const formatFileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
};

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
  const [formDate, setFormDate] = useState("");
  const [formCityId, setFormCityId] = useState("");
  const [formWorker, setFormWorker] = useState("");
  const [formType, setFormType] = useState<BeritaAcara["activityType"]>("" as any);
  const [formAttendees, setFormAttendees] = useState<number>("" as any);
  const [formDescription, setFormDescription] = useState("");
  
  // Multiple images state for the upload form
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formImageBytes, setFormImageBytes] = useState<number[]>([]);
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  // Validation and alert states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [selectedBerita, setSelectedBerita] = useState<BeritaAcara | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BeritaAcara | null>(null);
  const [aiNotice, setAiNotice] = useState<{
    title: string;
    message: string;
    tone: "info" | "success";
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files) as File[];
    const oversizedFiles = filesArray.filter((file) => file.size > MAX_IMAGE_FILE_SIZE);
    const currentTotal = formImageBytes.reduce((sum, size) => sum + size, 0);
    const incomingTotal = filesArray.reduce((sum, file) => sum + file.size, 0);

    if (oversizedFiles.length > 0) {
      setErrors(prev => ({
        ...prev,
        images: `Ukuran foto terlalu besar. Maksimal ${formatFileSize(MAX_IMAGE_FILE_SIZE)} per foto. File bermasalah: ${oversizedFiles.map((file) => `${file.name} (${formatFileSize(file.size)})`).join(", ")}.`
      }));
      e.target.value = "";
      return;
    }

    if (currentTotal + incomingTotal > MAX_TOTAL_IMAGE_SIZE) {
      setErrors(prev => ({
        ...prev,
        images: `Total ukuran foto terlalu besar. Maksimal ${formatFileSize(MAX_TOTAL_IMAGE_SIZE)} per laporan agar penyimpanan tetap stabil.`
      }));
      e.target.value = "";
      return;
    }
    
    const promises = filesArray.map((file: File) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(base64Images => {
      setFormImages(prev => [...prev, ...base64Images]);
      setFormImageBytes(prev => [...prev, ...filesArray.map((file) => file.size)]);
      setErrors(prev => {
        const next = { ...prev };
        delete next.images;
        return next;
      });
      e.target.value = "";
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setFormImageBytes(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

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
    setFormDate("");
    setFormCityId("");
    setFormWorker("");
    setFormType("" as any);
    setFormAttendees("" as any);
    setFormDescription("");
    setFormImages([]); // No preset images! Start empty.
    setFormImageBytes([]);
    setErrors({});
    setIsModalOpen(true);
  };

  // Add a picture to the active upload collection
  const handleAddPresetImage = (url: string) => {
    if (formImages.includes(url)) {
      const nextImages = formImages.filter(img => img !== url);
      setFormImageBytes(formImageBytes.filter((_, index) => formImages[index] !== url));
      setFormImages(nextImages);
    } else {
      setFormImages([...formImages, url]);
      setFormImageBytes([...formImageBytes, 0]);
    }
  };

  const handleAiDraft = async () => {
    if (!formDescription && !formTitle) {
      setAiNotice({
        title: "Butuh Bahan Draf",
        message: "Isi judul kegiatan atau tulis beberapa poin catatan terlebih dahulu. AI Sion akan lebih mudah merapikan narasi jika ada bahan dasar pelayanan yang bisa diolah.",
        tone: "info"
      });
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
      const selectedCity = cities.find((city) => city.id === formCityId)?.name || "pos pelayanan";
      setFormDescription(`Kegiatan ${formType || "pelayanan"} bertema "${formTitle || "Tuhan Yesus Penyelamat"}" di ${selectedCity} berlangsung dengan tertib, hangat, dan penuh sukacita. Firman serta sharing yang dibawakan meneguhkan jemaat untuk terus bertumbuh dalam iman dan saling melayani. Pokok doa diarahkan bagi multiplikasi murid, kesatuan pekerja, dan terbukanya hati masyarakat untuk menerima kasih Kristus.`);
      setAiNotice({
        title: "Draf Lokal Sudah Disiapkan",
        message: "Koneksi AI belum memberi respons, jadi Sion Academy menyiapkan draf lokal yang tetap bisa Anda edit. Silakan poles bagian yang perlu dibuat lebih spesifik sebelum disimpan.",
        tone: "success"
      });
    } finally {
      setIsAiDrafting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Inline validation
    const tempErrors: Record<string, string> = {};
    if (!formTitle.trim()) tempErrors.title = "Judul kegiatan wajib diisi";
    if (!formType) tempErrors.type = "Jenis kegiatan wajib dipilih";
    if (!formDate) tempErrors.date = "Tanggal kegiatan wajib diisi";
    if (!formCityId) tempErrors.cityId = "Pos kota pelayanan wajib dipilih";
    if (!formAttendees || Number(formAttendees) <= 0) tempErrors.attendees = "Jumlah jemaat hadir wajib diisi (minimal 1)";
    if (!formWorker.trim()) tempErrors.workerName = "Nama pembawa sharing wajib diisi";
    if (!formDescription.trim()) tempErrors.description = "Deskripsi kegiatan pelayanan wajib diisi";
    if (formImages.length === 0) tempErrors.images = "Dokumentasi foto wajib diunggah (minimal 1 foto)";
    if (formImageBytes.some((size) => size > MAX_IMAGE_FILE_SIZE)) tempErrors.images = `Ada foto yang melebihi ${formatFileSize(MAX_IMAGE_FILE_SIZE)}. Hapus foto tersebut lalu unggah versi yang lebih kecil.`;
    if (formImageBytes.reduce((sum, size) => sum + size, 0) > MAX_TOTAL_IMAGE_SIZE) tempErrors.images = `Total foto melebihi ${formatFileSize(MAX_TOTAL_IMAGE_SIZE)}. Kurangi jumlah foto atau kompres gambar terlebih dahulu.`;

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setErrors({});

    const cityObj = cities.find(c => c.id === formCityId);
    const cityName = cityObj ? cityObj.name : "";

    try {
      onAddBerita({
        title: formTitle,
        date: formDate,
        cityId: formCityId,
        cityName,
        workerName: formWorker,
        activityType: formType,
        attendeesCount: Number(formAttendees),
        description: formDescription,
        images: formImages
      });
    } catch {
      setErrors({
        images: "Foto terlalu besar untuk disimpan di perangkat ini. Kompres gambar atau unggah lebih sedikit foto, lalu coba simpan lagi."
      });
      return;
    }

    setIsModalOpen(false);
    
    // Trigger success alert
    setShowSuccessAlert(true);
    setTimeout(() => {
      setShowSuccessAlert(false);
    }, 2000);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    onDeleteBerita(deleteTarget.id);
    if (selectedBerita?.id === deleteTarget.id) {
      setSelectedBerita(null);
    }
    setDeleteTarget(null);
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
              <div
                key={berita.id}
                onClick={() => setSelectedBerita(berita)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedBerita(berita);
                }}
                role="button"
                tabIndex={0}
                className="bg-white rounded-3xl border border-slate-100 material-shadow-2 hover:border-indigo-100 transition-all flex flex-col overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrevSlide(berita.id, berita.images.length);
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/70 hover:bg-white text-slate-800 rounded-full shadow-md transition-all z-10 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextSlide(berita.id, berita.images.length);
                        }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(berita.id);
                      }}
                      className="flex items-center space-x-1 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Heart className={`h-4.5 w-4.5 transition-transform ${likeInfo.active ? "text-rose-600 fill-rose-600 scale-110" : ""}`} />
                      <span className="text-[11px] font-bold">{likeInfo.count} Dukungan Doa</span>
                    </button>

                    <div className="flex items-center space-x-1 text-slate-400">
                      <User className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium text-slate-500">Pembawa: {berita.workerName}</span>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(berita);
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

      {selectedBerita && (() => {
        const detailSlide = activeSlides[selectedBerita.id] || 0;
        const detailLike = likes[selectedBerita.id] || { count: 0, active: false };
        const detailImage = selectedBerita.images[detailSlide] || selectedBerita.images[0];

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5" onClick={() => setSelectedBerita(null)}>
            <div className="relative bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden material-shadow-3 grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_420px] animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setSelectedBerita(null)}
                className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-slate-950/70 text-white hover:bg-slate-950 flex items-center justify-center transition-all"
                aria-label="Tutup detail berita acara"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative min-h-[320px] lg:min-h-[82vh] bg-slate-950 flex items-center justify-center">
                <img
                  src={detailImage}
                  alt={selectedBerita.title}
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />

                {selectedBerita.images.length > 1 && (
                  <>
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold font-mono px-2.5 py-1 rounded-full">
                      {detailSlide + 1}/{selectedBerita.images.length}
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePrevSlide(selectedBerita.id, selectedBerita.images.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/80 hover:bg-white text-slate-900 rounded-full shadow-md transition-all flex items-center justify-center"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNextSlide(selectedBerita.id, selectedBerita.images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/80 hover:bg-white text-slate-900 rounded-full shadow-md transition-all flex items-center justify-center"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5">
                      {selectedBerita.images.map((_, idx) => (
                        <span
                          key={idx}
                          className={`h-2 w-2 rounded-full transition-all ${idx === detailSlide ? "bg-white scale-125" : "bg-white/40"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex min-h-0 flex-col bg-white">
                <div className="p-5 border-b border-slate-100 flex items-start gap-3 pr-14">
                  <div className="h-11 w-11 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                    {selectedBerita.cityName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-base text-slate-950 leading-snug">{selectedBerita.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-semibold">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />Sion {selectedBerita.cityName}</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{selectedBerita.date}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-5 overflow-y-auto">
                  <div className="flex items-center justify-between gap-3">
                    <span className="bg-indigo-50 text-indigo-600 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
                      {selectedBerita.activityType}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">ID: {selectedBerita.id}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Pembawa Sharing</span>
                      <span className="text-xs font-bold text-slate-800">{selectedBerita.workerName}</span>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Jumlah Hadir</span>
                      <span className="text-xs font-bold text-slate-800">{selectedBerita.attendeesCount} jiwa</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Deskripsi Laporan</span>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{selectedBerita.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => toggleLike(selectedBerita.id)}
                      className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-rose-600 transition-colors"
                    >
                      <Heart className={`h-5 w-5 transition-transform ${detailLike.active ? "text-rose-600 fill-rose-600 scale-110" : ""}`} />
                      <span>{detailLike.count} Dukungan Doa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(selectedBerita)}
                      className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
                  placeholder="Misal: Kebaktian Sion Raya Kenaikan, Ekspedisi Misi pedalaman..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                    errors.title ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                  }`}
                />
                {errors.title && (
                  <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.title}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Jenis Kegiatan</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as BeritaAcara["activityType"])}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800 ${
                      errors.type ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                    }`}
                  >
                    <option value="">-- Pilih Jenis Kegiatan --</option>
                    <option value="Sion Raya (SR)">Sion Raya (SR)</option>
                    <option value="Persekutuan Doa Sion (PDS)">Persekutuan Doa Sion (PDS)</option>
                    <option value="Komsel">Komsel</option>
                    <option value="Misi Pedalaman">Misi Pedalaman</option>
                    <option value="Doa Keliling">Doa Keliling</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  {errors.type && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.type}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal</label>
                  <input
                    type="date"
                    placeholder="Pilih tanggal kegiatan"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                      errors.date ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                    }`}
                  />
                  {errors.date && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.date}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pos Kota</label>
                  <select
                    value={formCityId}
                    onChange={(e) => setFormCityId(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 ${
                      errors.cityId ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                    }`}
                  >
                    {cities.length === 0 ? (
                      <option value="">-- Tidak ada kota --</option>
                    ) : (
                      <>
                        <option value="">-- Pilih --</option>
                        {cities.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                  {cities.length === 0 ? (
                    <span className="text-amber-500 text-[9px] mt-1 block leading-tight font-semibold">
                      Kosong! Tambah kota di Dashboard dahulu.
                    </span>
                  ) : errors.cityId && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.cityId}</span>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hadir (Jiwa)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 35"
                    value={formAttendees}
                    onChange={(e) => setFormAttendees(e.target.value === "" ? ("" as any) : Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                      errors.attendees ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                    }`}
                  />
                  {errors.attendees && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.attendees}</span>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pembawa Sharing</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ev. Yosua, Pdt. Markus"
                    value={formWorker}
                    onChange={(e) => setFormWorker(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                      errors.workerName ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                    }`}
                  />
                  {errors.workerName && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.workerName}</span>
                  )}
                </div>
              </div>

              {/* Image Upload Block */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dokumentasi Foto (Unggah dari Device)</label>
                
                {/* Device Uploader */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-semibold block">
                    Maksimal {formatFileSize(MAX_IMAGE_FILE_SIZE)} per foto dan {formatFileSize(MAX_TOTAL_IMAGE_SIZE)} total per laporan.
                  </span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {errors.images && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.images}</span>
                  )}
                </div>

                {/* Selected Images Previews */}
                {formImages.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-semibold block">Foto Terpilih ({formImages.length}) - Klik untuk memperbesar:</span>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                      {formImages.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                          <img 
                            src={url} 
                            alt={`Selected ${idx}`} 
                            onClick={() => setZoomedImage(url)}
                            className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-all" 
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-all opacity-85 hover:opacity-100 z-10"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                  rows={4}
                  placeholder="Misalkan: Ibadah lancar dipenuhi kasih Allah. Doakan agar jemaat terus bertekun dalam kelompok sel pemuridan minggu depan..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                    errors.description ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                  }`}
                />
                {errors.description && (
                  <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.description}</span>
                )}
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
      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Berita Acara?"
        description="Laporan, dokumentasi foto, dan antrean sinkronisasi terkait data ini akan dihapus dari tampilan lokal."
        subject={deleteTarget?.title}
        confirmLabel="Hapus Laporan"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
      {aiNotice && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-100 material-shadow-3 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <div className={`mx-auto h-12 w-12 rounded-2xl flex items-center justify-center border mb-4 ${
                aiNotice.tone === "success"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-indigo-50 text-indigo-600 border-indigo-100"
              }`}>
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-950">{aiNotice.title}</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">{aiNotice.message}</p>
              <button
                type="button"
                onClick={() => setAiNotice(null)}
                className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
      {showSuccessAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col items-center max-w-xs w-full text-center material-shadow-3 animate-scale-up">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Newspaper className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-sm text-slate-900">Laporan Berhasil Disimpan</h3>
            <p className="text-xs text-slate-400 mt-1">Berita acara pelayanan telah ditambahkan ke database.</p>
          </div>
        </div>
      )}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setZoomedImage(null)}>
          <div className="relative max-w-3xl w-full max-h-[85vh] p-4 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 bg-slate-900/60 hover:bg-slate-900/80 text-white rounded-full p-2 transition-all cursor-pointer z-50"
            >
              <X className="h-6 w-6" />
            </button>
            <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-slate-800" />
          </div>
        </div>
      )}
    </div>
  );
}
