import React, { useState, useMemo } from "react";
import { 
  Link2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  X,
  BookOpen,
  FileSpreadsheet,
  Video,
  FileText
} from "lucide-react";
import { DiscipleshipLink } from "../types";

interface LinksProps {
  links: DiscipleshipLink[];
  onAddLink: (link: Omit<DiscipleshipLink, "id">) => void;
  onUpdateLink: (link: DiscipleshipLink) => void;
  onDeleteLink: (id: string) => void;
}

export default function Links({
  links,
  onAddLink,
  onUpdateLink,
  onDeleteLink
}: LinksProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<DiscipleshipLink | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<DiscipleshipLink["category"]>("" as any);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const categories = ["Bahan PA", "Buku Panduan", "Video Pengajaran", "Formulir"];

  // Filter links
  const filteredLinks = useMemo(() => {
    return links.filter((l) => {
      const matchesSearch = 
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.url.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === "All" || l.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [links, searchTerm, selectedCategory]);

  // Handle open modal for adding
  const handleOpenAddModal = () => {
    setEditingLink(null);
    setFormTitle("");
    setFormUrl("");
    setFormDescription("");
    setFormCategory("" as any);
    setErrors({});
    setIsModalOpen(true);
  };

  // Handle open modal for editing
  const handleOpenEditModal = (link: DiscipleshipLink) => {
    setEditingLink(link);
    setFormTitle(link.title);
    setFormUrl(link.url);
    setFormDescription(link.description);
    setFormCategory(link.category);
    setErrors({});
    setIsModalOpen(true);
  };

  // Handle submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tempErrors: Record<string, string> = {};
    if (!formTitle.trim()) tempErrors.title = "Judul tautan wajib diisi";
    if (!formUrl.trim()) tempErrors.url = "Tautan URL wajib diisi";
    if (!formCategory) tempErrors.category = "Kategori wajib dipilih";
    if (!formDescription.trim()) tempErrors.description = "Deskripsi kegunaan wajib diisi";

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setErrors({});

    if (editingLink) {
      onUpdateLink({
        ...editingLink,
        title: formTitle,
        url: formUrl,
        description: formDescription,
        category: formCategory,
      });
    } else {
      onAddLink({
        title: formTitle,
        url: formUrl,
        description: formDescription,
        category: formCategory,
      });
    }

    setIsModalOpen(false);

    // Trigger success alert
    setShowSuccessAlert(true);
    setTimeout(() => {
      setShowSuccessAlert(false);
    }, 2000);
  };

  const getCategoryIcon = (category: DiscipleshipLink["category"]) => {
    switch (category) {
      case "Bahan PA":
        return <BookOpen className="h-5 w-5 text-indigo-500" />;
      case "Buku Panduan":
        return <FileText className="h-5 w-5 text-amber-500" />;
      case "Video Pengajaran":
        return <Video className="h-5 w-5 text-rose-500" />;
      case "Formulir":
        return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
      default:
        return <Link2 className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Header Toolbar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 material-shadow-1 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900">Tautan & Sumber Daya</h2>
            <p className="text-xs text-slate-400 mt-1">Akses cepat berkas, formulir, video, dan panduan praktis pelayanan</p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/15"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Tautan</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tautan, deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Horizontal buttons category filter */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === "All"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua Tipe
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid List of links */}
      {filteredLinks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center material-shadow-1 space-y-3">
          <Link2 className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">Tautan Kosong</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">Silakan tambahkan tautan panduan/formulir bermanfaat menggunakan tombol tambah di atas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((link) => (
            <div 
              key={link.id}
              className="bg-white rounded-3xl border border-slate-100 material-shadow-1 p-5 space-y-4 hover:border-indigo-100 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header Category and Icon */}
                <div className="flex items-center justify-between">
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                    {link.category}
                  </span>
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                    {getCategoryIcon(link.category)}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 leading-snug line-clamp-2">{link.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 font-normal">
                    {link.description || "Tidak ada deskripsi tambahan."}
                  </p>
                </div>
              </div>

              {/* URL and quick Actions */}
              <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                <a 
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-600 hover:text-indigo-500 font-semibold flex items-center space-x-1 hover:underline truncate max-w-[150px] sm:max-w-[180px]"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{link.url}</span>
                </a>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEditModal(link)}
                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
                    title="Ubah"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Apakah Anda yakin ingin menghapus tautan "${link.title}"?`)) {
                        onDeleteLink(link.id);
                      }
                    }}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                    title="Hapus"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Link Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-slate-100 material-shadow-3 animate-in fade-in zoom-in-95 duration-150">
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <h3 className="font-display font-bold text-base">
                {editingLink ? "Ubah Tautan" : "Tambah Tautan Baru"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-all text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dialog Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Judul Tautan / Berkas</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Contoh: Modul Dasar Kristen Versi PDF"
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                      errors.title ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                    }`}
                  />
                  {errors.title && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.title}</span>
                  )}
                </div>

                {/* URL */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Tautan URL Sumber Daya</label>
                  <input
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="Contoh: https://example.com/file.pdf"
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                      errors.url ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                    }`}
                  />
                  {errors.url && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.url}</span>
                  )}
                </div>

                {/* Category Select */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Kategori Sumber Daya</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as DiscipleshipLink["category"])}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 ${
                      errors.category ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                    }`}
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.category}</span>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Deskripsi Kegunaan</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Tulis ringkasan isi berkas atau panduan penggunaan cepat..."
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                      errors.description ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                    }`}
                  />
                  {errors.description && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.description}</span>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/10"
                >
                  Simpan Tautan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showSuccessAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col items-center max-w-xs w-full text-center material-shadow-3 animate-scale-up">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <ExternalLink className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="font-display font-bold text-sm text-slate-900">Tautan Berhasil Disimpan</h3>
            <p className="text-xs text-slate-400 mt-1">Link sumber daya murid telah diperbarui di database.</p>
          </div>
        </div>
      )}
    </div>
  );
}
