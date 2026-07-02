import React, { useState, useMemo } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  UserPlus, 
  Edit, 
  Trash2, 
  MapPin, 
  User, 
  Phone, 
  Calendar, 
  X,
  Check,
  Building,
  Filter,
  Trash
} from "lucide-react";
import { Member, City } from "../types";
import ConfirmDialog from "./ConfirmDialog";

interface MembersProps {
  members: Member[];
  cities: City[];
  onAddMember: (member: Omit<Member, "id">) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
}

export default function Members({
  members,
  cities,
  onAddMember,
  onUpdateMember,
  onDeleteMember
}: MembersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCityId, setSelectedCityId] = useState<string>("All");
  const [selectedStage, setSelectedStage] = useState<string>("All");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCityId, setFormCityId] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formStage, setFormStage] = useState<Member["discipleshipStage"]>("Jemaat");
  const [formMentor, setFormMentor] = useState("");
  const [formStatus, setFormStatus] = useState<Member["status"]>("active");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);

  // Validation and alert states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const stages: Member["discipleshipStage"][] = ["Pekerja", "Jemaat"];

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch = 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone.includes(searchTerm) ||
        m.mentorName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCity = selectedCityId === "All" || m.cityId === selectedCityId;
      const matchesStage = selectedStage === "All" || m.discipleshipStage === selectedStage;

      return matchesSearch && matchesCity && matchesStage;
    });
  }, [members, searchTerm, selectedCityId, selectedStage]);

  const mentorNameSuggestions = useMemo(() => {
    const names = [
      ...members.map((member) => member.name),
      ...members.map((member) => member.mentorName)
    ]
      .map((name) => name.trim())
      .filter(Boolean);

    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "id-ID"));
  }, [members]);

  const formatPhone = (val: string) => {
    let digits = val.replace(/\D/g, "");
    if (digits.length === 0) return "";
    if (digits.startsWith("0")) {
      digits = "62" + digits.substring(1);
    } else if (!digits.startsWith("62")) {
      digits = "62" + digits;
    }
    digits = digits.substring(0, 14);
    let formatted = "+62";
    if (digits.length > 2) {
      formatted += " " + digits.substring(2, 5);
    }
    if (digits.length > 5) {
      formatted += "-" + digits.substring(5, 9);
    }
    if (digits.length > 9) {
      formatted += "-" + digits.substring(9, 14);
    }
    return formatted;
  };

  // Handle open modal for adding
  const handleOpenAddModal = () => {
    setEditingMember(null);
    setFormName("");
    setFormCityId("");
    setFormPhone("");
    setFormStage("" as any);
    setFormMentor("");
    setFormStatus("active");
    setFormDate("");
    setErrors({});
    setIsModalOpen(true);
  };

  // Handle open modal for editing
  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormCityId(member.cityId);
    setFormPhone(member.phone);
    setFormStage(member.discipleshipStage);
    setFormMentor(member.mentorName);
    setFormStatus(member.status);
    setFormDate(member.joinedDate);
    setErrors({});
    setIsModalOpen(true);
  };

  // Handle submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Inline validation
    const tempErrors: Record<string, string> = {};
    if (!formName.trim()) tempErrors.name = "Nama lengkap wajib diisi";
    if (!formCityId) tempErrors.cityId = "Pos kota pelayanan wajib dipilih";
    
    const phoneDigits = formPhone.replace(/\D/g, "");
    if (!formPhone) {
      tempErrors.phone = "No. Telepon / WhatsApp wajib diisi";
    } else if (phoneDigits.length < 12 || phoneDigits.length > 14) {
      tempErrors.phone = "Nomor HP harus minimal input 11 angka dan maksimal input 13 angka";
    }

    if (!formStage) tempErrors.stage = "Tahap pemuridan wajib dipilih";
    if (!formMentor.trim()) tempErrors.mentor = "Nama mentor pembimbing wajib diisi";
    if (!formDate) tempErrors.date = "Tanggal mulai binaan wajib dipilih";

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    
    setErrors({});

    const cityObj = cities.find((c) => c.id === formCityId);
    const cityName = cityObj ? cityObj.name : "";

    if (editingMember) {
      onUpdateMember({
        ...editingMember,
        name: formName,
        cityId: formCityId,
        cityName: cityName,
        phone: formPhone,
        discipleshipStage: formStage,
        mentorName: formMentor,
        joinedDate: formDate,
        status: formStatus,
      });
    } else {
      onAddMember({
        name: formName,
        cityId: formCityId,
        cityName: cityName,
        phone: formPhone,
        discipleshipStage: formStage,
        mentorName: formMentor,
        joinedDate: formDate,
        status: formStatus,
      });
    }

    setIsModalOpen(false);

    // Show centered success alert
    setShowSuccessAlert(true);
    setTimeout(() => {
      setShowSuccessAlert(false);
    }, 2000);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    onDeleteMember(deleteTarget.id);
    setDeleteTarget(null);
  };

  const getStageStyles = (stage: Member["discipleshipStage"]) => {
    switch (stage) {
      case "Pekerja":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Jemaat":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header filter tools */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 material-shadow-1 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900">Database Jemaat & Murid</h2>
            <p className="text-xs text-slate-400 mt-1">Kelola data pembinaan rohani, mentor, dan kemajuan penjangkauan jemaat</p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/15"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tambah Jemaat Baru</span>
          </button>
        </div>

        {/* Search and Advanced Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, mentor, telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Filter City */}
          <div className="relative">
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700"
            >
              <option value="All">Semua Kota (Wilayah)</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Stage */}
          <div className="relative">
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700"
            >
              <option value="All">Semua Tahapan Pemuridan</option>
              {stages.map((stage) => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>

          {/* Display metrics metadata */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Hasil Pencarian:</span>
            <span className="font-mono bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded">
              {filteredMembers.length} Jemaat
            </span>
          </div>
        </div>
      </div>

      {/* Member cards layout */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center material-shadow-1 space-y-3">
          <Users className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">Tidak Ada Jemaat</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">Silakan bersihkan filter pencarian atau rekam jemaat baru menggunakan tombol tambah di atas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <div 
              key={member.id}
              className="bg-white rounded-3xl border border-slate-100 material-shadow-1 hover:material-shadow-2 hover:border-indigo-100 transition-all p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Status chip & Stage badge */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getStageStyles(member.discipleshipStage)}`}>
                    {member.discipleshipStage}
                  </span>

                  <span className={`text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded ${
                    member.status === "active" 
                      ? "bg-emerald-500/10 text-emerald-500" 
                      : "bg-slate-400/10 text-slate-400"
                  }`}>
                    {member.status === "active" ? "Aktif" : "Inaktif"}
                  </span>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-base text-slate-900 line-clamp-1">{member.name}</h3>
                  <div className="flex items-center text-xs text-slate-400 space-x-1.5">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{member.cityName}</span>
                  </div>
                </div>

                {/* Details layout */}
                <div className="grid grid-cols-1 gap-2 pt-1">
                  {/* Phone */}
                  <div className="flex items-center text-xs text-slate-600 space-x-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{member.phone || "Tidak ada nomor"}</span>
                  </div>
                  
                  {/* Mentor */}
                  <div className="flex items-center text-xs text-slate-600 space-x-2">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Mentor: <strong className="text-slate-700">{member.mentorName || "Belum ditentukan"}</strong></span>
                  </div>

                  {/* Joined Date */}
                  <div className="flex items-center text-xs text-slate-500 space-x-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Bergabung: {new Date(member.joinedDate).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons panel */}
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleOpenEditModal(member)}
                  className="p-2 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-500 rounded-xl transition-all"
                  title="Ubah Data"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(member)}
                  className="p-2 hover:bg-rose-50 text-rose-500 hover:text-rose-400 rounded-xl transition-all"
                  title="Hapus Data"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Member Dialog (Material Design Center Dialog Box) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-100 material-shadow-3 animate-in fade-in zoom-in-95 duration-150">
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <h3 className="font-display font-bold text-base">
                {editingMember ? "Ubah Data Jemaat" : "Registrasi Jemaat Baru"}
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
              <datalist id="member-mentor-suggestions">
                {mentorNameSuggestions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <div className="grid grid-cols-1 gap-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Maria Alexandra"
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                      errors.name ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                    }`}
                  />
                  {errors.name && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.name}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* City Select */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Kota Pelayanan</label>
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
                          <option value="">-- Pilih Kota --</option>
                          {cities.map((city) => (
                            <option key={city.id} value={city.id}>{city.name}</option>
                          ))}
                        </>
                      )}
                    </select>
                    {cities.length === 0 ? (
                      <span className="text-amber-500 text-[9px] mt-1 block leading-tight font-semibold">
                        Pos kota kosong! Tambah kota di Dashboard dahulu.
                      </span>
                    ) : errors.cityId && (
                      <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.cityId}</span>
                    )}
                  </div>

                   {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">No. Telepon / WhatsApp</label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(formatPhone(e.target.value))}
                      placeholder="Contoh: +62 822-5139-6690"
                      className={`w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                        errors.phone ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                      }`}
                    />
                    {errors.phone && (
                      <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.phone}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Discipleship Stage */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Tahap Pemuridan</label>
                    <select
                      value={formStage}
                      onChange={(e) => setFormStage(e.target.value as Member["discipleshipStage"])}
                      className={`w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 ${
                        errors.stage ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                      }`}
                    >
                      <option value="">-- Pilih Tahap --</option>
                      {stages.map((stg) => (
                        <option key={stg} value={stg}>{stg}</option>
                      ))}
                    </select>
                    {errors.stage && (
                      <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.stage}</span>
                    )}
                  </div>

                  {/* Mentor Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Nama Mentor Pembimbing</label>
                    <input
                      type="text"
                      list="member-mentor-suggestions"
                      value={formMentor}
                      onChange={(e) => setFormMentor(e.target.value)}
                      placeholder="Contoh: Ev. Yosua"
                      className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                        errors.mentor ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                      }`}
                    />
                    {errors.mentor && (
                      <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.mentor}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Joined Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Tanggal Mulai Binaan</label>
                    <input
                      type="date"
                      placeholder="Pilih tanggal mulai binaan"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                        errors.date ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                      }`}
                    />
                    {errors.date && (
                      <span className="text-red-500 text-[10px] mt-1 block font-semibold">{errors.date}</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Status Keanggotaan</label>
                    <div className="flex items-center space-x-4 h-9">
                      <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="status"
                          checked={formStatus === "active"}
                          onChange={() => setFormStatus("active")}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Aktif</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="status"
                          checked={formStatus === "inactive"}
                          onChange={() => setFormStatus("inactive")}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Inaktif</span>
                      </label>
                    </div>
                  </div>
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
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Data Jemaat?"
        description="Data profil, status pembinaan, dan relasi mentor untuk jemaat ini akan dihapus dari tampilan lokal."
        subject={deleteTarget?.name}
        confirmLabel="Hapus Jemaat"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
      {showSuccessAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col items-center max-w-xs w-full text-center material-shadow-3 animate-scale-up">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-sm text-slate-900">Jemaat Berhasil Disimpan</h3>
            <p className="text-xs text-slate-400 mt-1">Data jemaat telah diperbarui di database.</p>
          </div>
        </div>
      )}
    </div>
  );
}
