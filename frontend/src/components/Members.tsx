import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, Archive, Calendar, ChevronLeft, ChevronRight, Clock3, Download,
  Edit, History, Loader2, Mail, MapPin, Phone, Plus, RefreshCw, Search, ShieldCheck,
  User, Users, X,
} from "lucide-react";
import { City, Member, MemberDuplicateCandidate, MemberHistoryResult, MemberListResult } from "../types";
import { SionDatabase } from "../utils/db";

interface MembersProps {
  cities: City[];
  onMembersChanged?: () => void;
}

type EditableStatus = Exclude<Member["status"], "archived">;
type CommunicationPreference = "whatsapp" | "sms" | "email" | "phone" | "none";

interface MemberForm {
  name: string;
  email: string;
  phone: string;
  cityId: string;
  discipleshipStage: Member["discipleshipStage"] | "";
  mentorName: string;
  groupName: string;
  joinedDate: string;
  status: EditableStatus;
  consentStatus: "unknown" | "granted" | "revoked";
  consentSource: string;
  consentPurpose: string;
  communicationPreferences: CommunicationPreference[];
  duplicateOverrideReason: string;
}

const emptyPage: MemberListResult = { items: [], page: 1, pageSize: 12, total: 0, totalPages: 0 };
const lifecycleStatuses: EditableStatus[] = ["guest", "prospect", "active", "inactive", "moved", "deceased"];
const filterStatuses: Member["status"][] = [...lifecycleStatuses, "archived"];
const preferenceOptions: Array<{ value: CommunicationPreference; label: string }> = [
  { value: "whatsapp", label: "WhatsApp" }, { value: "sms", label: "SMS" },
  { value: "email", label: "Email" }, { value: "phone", label: "Telepon" }, { value: "none", label: "Tidak dihubungi" },
];

const initialForm = (): MemberForm => ({
  name: "", email: "", phone: "", cityId: "", discipleshipStage: "", mentorName: "", groupName: "",
  joinedDate: new Date().toISOString().slice(0, 10), status: "prospect", consentStatus: "unknown",
  consentSource: "", consentPurpose: "", communicationPreferences: [], duplicateOverrideReason: "",
});

const statusLabel: Record<Member["status"], string> = {
  guest: "Tamu", prospect: "Prospek", active: "Aktif", inactive: "Tidak Aktif",
  moved: "Pindah", deceased: "Meninggal", archived: "Diarsipkan",
};

const statusClass = (status: Member["status"]) => {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "archived" || status === "deceased") return "border-slate-300 bg-slate-100 text-slate-600";
  if (status === "prospect" || status === "guest") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
};

export default function Members({ cities, onMembersChanged }: MembersProps) {
  const [result, setResult] = useState<MemberListResult>(emptyPage);
  const [search, setSearch] = useState("");
  const [cityId, setCityId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState<MemberForm>(initialForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [duplicates, setDuplicates] = useState<MemberDuplicateCandidate[]>([]);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<Member | null>(null);
  const [history, setHistory] = useState<MemberHistoryResult | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Member | null>(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [exportReason, setExportReason] = useState("");
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setResult(await SionDatabase.listMembers({ page, pageSize: 12, q: search, cityId, status, includeArchived: status === "archived" }));
    } catch (err: any) {
      setError(err.message || "Daftar Member 360 gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [page, search, cityId, status]);

  useEffect(() => {
    const timeout = window.setTimeout(loadMembers, 300);
    return () => window.clearTimeout(timeout);
  }, [loadMembers]);

  useEffect(() => {
    SionDatabase.getAccessContext().then((access) => setPermissions(access.permissions)).catch(() => setPermissions([]));
  }, []);

  const canWrite = permissions.includes("member.write");
  const canArchive = permissions.includes("member.archive");
  const canReadHistory = permissions.includes("member.history.read");
  const canExport = permissions.includes("member.export");

  const updateForm = <K extends keyof MemberForm>(field: K, value: MemberForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm());
    setFormErrors({});
    setDuplicates([]);
    setModalOpen(true);
  };

  const openEdit = (member: Member) => {
    setEditing(member);
    setForm({
      name: member.name, email: member.email || "", phone: member.phone, cityId: member.cityId,
      discipleshipStage: member.discipleshipStage, mentorName: member.mentorName || "", groupName: member.groupName || "",
      joinedDate: member.joinedDate || member.joinedOn?.slice(0, 10) || "", status: member.status === "archived" ? "inactive" : member.status,
      consentStatus: member.consentStatus || "unknown", consentSource: member.consentSource || "",
      consentPurpose: member.consentPurpose || "", communicationPreferences: (member.communicationPreferences || []) as CommunicationPreference[],
      duplicateOverrideReason: "",
    });
    setFormErrors({});
    setDuplicates([]);
    setModalOpen(true);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Nama lengkap minimal 2 karakter.";
    if (!form.cityId) next.cityId = "Primary service point wajib dipilih.";
    if (!form.phone.trim()) next.phone = "Nomor telepon wajib diisi.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Format email tidak valid.";
    if (!form.discipleshipStage) next.discipleshipStage = "Tahap pemuridan wajib dipilih.";
    if (!form.joinedDate) next.joinedDate = "Tanggal mulai binaan wajib diisi.";
    if (form.consentStatus === "granted") {
      if (!form.consentSource.trim()) next.consentSource = "Sumber consent wajib diisi.";
      if (!form.consentPurpose.trim()) next.consentPurpose = "Tujuan pemrosesan wajib diisi.";
      if (form.communicationPreferences.length === 0) next.communicationPreferences = "Pilih minimal satu preferensi.";
    }
    if (duplicates.length > 0 && form.duplicateOverrideReason.trim().length < 10) {
      next.duplicateOverrideReason = "Alasan melanjutkan data duplikat minimal 10 karakter.";
    }
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = (): Omit<Member, "id"> => {
    const city = cities.find((item) => item.id === form.cityId);
    return {
      name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), cityId: form.cityId,
      cityName: city?.name || "", primaryServicePointId: form.cityId,
      discipleshipStage: form.discipleshipStage as Member["discipleshipStage"], mentorName: form.mentorName.trim(),
      groupName: form.groupName.trim(), joinedDate: form.joinedDate, status: form.status,
      consentStatus: form.consentStatus, consentSource: form.consentSource.trim(), consentPurpose: form.consentPurpose.trim(),
      communicationPreferences: form.communicationPreferences, duplicateOverrideReason: form.duplicateOverrideReason.trim(),
      version: editing?.version || 1,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError("");
    try {
      const payload = buildPayload();
      const candidates = await SionDatabase.checkMemberDuplicates(payload, editing?.id);
      if (candidates.length > 0 && form.duplicateOverrideReason.trim().length < 10) {
        setDuplicates(candidates);
        setFormErrors({ duplicateOverrideReason: "Tinjau kandidat dan isi alasan jika data baru memang harus dilanjutkan." });
        return;
      }
      if (editing) await SionDatabase.updateMember360({ ...editing, ...payload, id: editing.id });
      else await SionDatabase.createMember360(payload);
      setModalOpen(false);
      setNotice(editing ? "Profil Member 360 berhasil diperbarui." : "Member baru berhasil disimpan.");
      await loadMembers();
      onMembersChanged?.();
    } catch (err: any) {
      if (err.fields) setFormErrors(err.fields);
      if (err.candidates?.length) setDuplicates(err.candidates);
      setError(err.message || "Data anggota gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const openHistory = async (member: Member) => {
    setDetail(member);
    setHistory(null);
    setHistoryLoading(true);
    try {
      setHistory(await SionDatabase.getMemberHistory(member.id));
    } catch (err: any) {
      setError(err.message || "Histori anggota gagal dimuat.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    if (archiveReason.trim().length < 10) {
      setError("Alasan archive minimal 10 karakter.");
      return;
    }
    setSaving(true);
    try {
      await SionDatabase.archiveMember(archiveTarget.id, archiveReason);
      setArchiveTarget(null);
      setArchiveReason("");
      setNotice("Member berhasil diarsipkan dan tetap tersedia pada histori/audit.");
      await loadMembers();
      onMembersChanged?.();
    } catch (err: any) {
      setError(err.message || "Archive anggota gagal.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (exportReason.trim().length < 10) {
      setError("Alasan export minimal 10 karakter agar aktivitas dapat diaudit.");
      return;
    }
    setExporting(true);
    try {
      await SionDatabase.exportMembersMasked(exportReason.trim(), { q: search, cityId, status });
      setNotice("Export ter-mask berhasil diunduh dan dicatat di audit log.");
    } catch (err: any) {
      setError(err.message || "Export anggota gagal.");
    } finally {
      setExporting(false);
    }
  };

  const togglePreference = (value: CommunicationPreference) => {
    if (value === "none") {
      updateForm("communicationPreferences", form.communicationPreferences.includes("none") ? [] : ["none"]);
      return;
    }
    const withoutNone = form.communicationPreferences.filter((item) => item !== "none");
    updateForm("communicationPreferences", withoutNone.includes(value) ? withoutNone.filter((item) => item !== value) : [...withoutNone, value]);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-700"><ShieldCheck className="h-3.5 w-3.5" />Member 360 · scoped & audited</div>
            <h2 className="mt-3 text-xl font-bold text-slate-950">Data Jemaat dan Histori Pelayanan</h2>
            <p className="mt-1 text-sm text-slate-500">Pencarian, filter, dan pagination diproses server sesuai scope akun.</p>
          </div>
          {canWrite && <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500"><Plus className="h-4 w-4" />Tambah Member</button>}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari nama, phone, email..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm" /></label>
          <select value={cityId} onChange={(event) => { setCityId(event.target.value); setPage(1); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Semua service point</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}</select>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Semua lifecycle</option>{(canArchive || canReadHistory ? filterStatuses : lifecycleStatuses).map((item) => <option key={item} value={item}>{statusLabel[item]}</option>)}</select>
          <button onClick={loadMembers} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Muat Ulang</button>
        </div>

        {canExport && <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 md:flex-row">
          <input value={exportReason} onChange={(event) => setExportReason(event.target.value)} placeholder="Alasan export (minimal 10 karakter)" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs" />
          <button onClick={handleExport} disabled={exporting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white disabled:bg-slate-400">{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Export CSV Ter-mask</button>
        </div>}
      </section>

      {notice && <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><span>{notice}</span><button onClick={() => setNotice("")}><X className="h-4 w-4" /></button></div>}
      {error && <div className="flex items-start justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"><span>{error}</span><button onClick={() => setError("")}><X className="h-4 w-4" /></button></div>}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-3xl border border-slate-100 bg-white p-5"><div className="h-4 w-24 rounded bg-slate-100" /><div className="mt-5 h-6 w-2/3 rounded bg-slate-100" /><div className="mt-5 h-20 rounded bg-slate-50" /></div>)}</div>
      ) : result.items.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center"><Users className="mx-auto h-10 w-10 text-slate-300" /><h3 className="mt-3 font-bold text-slate-800">Tidak ada member dalam scope ini</h3><p className="mt-1 text-sm text-slate-500">Ubah pencarian/filter atau buat member baru.</p></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.items.map((member) => (
            <article key={member.id} className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-3"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(member.status)}`}>{statusLabel[member.status]}</span><span className="text-[10px] font-semibold text-slate-400">v{member.version || 1}</span></div>
                <h3 className="mt-4 text-lg font-bold text-slate-950">{member.name}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5 text-indigo-500" />{member.cityName}</p>
                <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{member.phone || "—"}</p>
                  <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{member.email || "—"}</p>
                  <p className="flex items-center gap-2"><User className="h-3.5 w-3.5" />{member.mentorName || "Belum ada mentor"}</p>
                  <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{member.joinedDate || member.joinedOn?.slice(0, 10)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold"><span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">{member.discipleshipStage}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">Consent: {member.consentStatus || "unknown"}</span>{member.groupName && <span className="rounded-full bg-cyan-50 px-2 py-1 text-cyan-700">{member.groupName}</span>}</div>
              </div>
              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                {canReadHistory && <button onClick={() => openHistory(member)} title="Profil dan histori" className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"><History className="h-4 w-4" /></button>}
                {canWrite && member.status !== "archived" && <button onClick={() => openEdit(member)} title="Ubah" className="rounded-xl p-2 text-indigo-600 hover:bg-indigo-50"><Edit className="h-4 w-4" /></button>}
                {canArchive && member.status !== "archived" && <button onClick={() => { setArchiveTarget(member); setArchiveReason(""); }} title="Archive" className="rounded-xl p-2 text-amber-700 hover:bg-amber-50"><Archive className="h-4 w-4" /></button>}
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"><span className="text-slate-500">{result.total} member · halaman {result.page} dari {Math.max(result.totalPages, 1)}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-xl border border-slate-200 p-2 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><button disabled={page >= result.totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-xl border border-slate-200 p-2 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="mx-auto my-6 w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><div><h3 className="font-bold text-slate-950">{editing ? "Ubah Member 360" : "Tambah Member 360"}</h3><p className="text-xs text-slate-500">Field bertanda wajib divalidasi kembali oleh backend.</p></div><button onClick={() => setModalOpen(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nama lengkap *" error={formErrors.name}><input value={form.name} onChange={(e) => updateForm("name", e.target.value)} className="field-input" /></Field>
                <Field label="Primary service point *" error={formErrors.cityId}><select value={form.cityId} onChange={(e) => updateForm("cityId", e.target.value)} className="field-input"><option value="">Pilih kota</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}</select></Field>
                <Field label="Nomor telepon *" error={formErrors.phone}><input value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} placeholder="+628123456789" className="field-input" /></Field>
                <Field label="Email" error={formErrors.email}><input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} className="field-input" /></Field>
                <Field label="Tahap pemuridan *" error={formErrors.discipleshipStage}><select value={form.discipleshipStage} onChange={(e) => updateForm("discipleshipStage", e.target.value as Member["discipleshipStage"])} className="field-input"><option value="">Pilih tahap</option><option>Pekerja</option><option>Jemaat</option></select></Field>
                <Field label="Lifecycle status *" error={formErrors.status}><select value={form.status} onChange={(e) => updateForm("status", e.target.value as EditableStatus)} className="field-input">{lifecycleStatuses.map((item) => <option key={item} value={item}>{statusLabel[item]}</option>)}</select></Field>
                <Field label="Nama mentor" error={formErrors.mentorName}><input value={form.mentorName} onChange={(e) => updateForm("mentorName", e.target.value)} className="field-input" /></Field>
                <Field label="Nama group/komsel" error={formErrors.groupName}><input value={form.groupName} onChange={(e) => updateForm("groupName", e.target.value)} className="field-input" /></Field>
                <Field label="Tanggal mulai binaan *" error={formErrors.joinedDate}><input type="date" value={form.joinedDate} onChange={(e) => updateForm("joinedDate", e.target.value)} className="field-input" /></Field>
                <Field label="Status consent" error={formErrors.consentStatus}><select value={form.consentStatus} onChange={(e) => updateForm("consentStatus", e.target.value as MemberForm["consentStatus"])} className="field-input"><option value="unknown">Belum diketahui</option><option value="granted">Diberikan</option><option value="revoked">Dicabut</option></select></Field>
                <Field label="Sumber consent" error={formErrors.consentSource}><input value={form.consentSource} onChange={(e) => updateForm("consentSource", e.target.value)} placeholder="Form registrasi / verbal" className="field-input" /></Field>
                <Field label="Tujuan pemrosesan" error={formErrors.consentPurpose}><input value={form.consentPurpose} onChange={(e) => updateForm("consentPurpose", e.target.value)} placeholder="Komunikasi pembinaan" className="field-input" /></Field>
              </div>
              <Field label="Preferensi komunikasi" error={formErrors.communicationPreferences}><div className="flex flex-wrap gap-2">{preferenceOptions.map((option) => <button type="button" key={option.value} onClick={() => togglePreference(option.value)} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${form.communicationPreferences.includes(option.value) ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500"}`}>{option.label}</button>)}</div></Field>

              {duplicates.length > 0 && <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4"><div className="flex gap-2 text-sm font-bold text-amber-900"><AlertTriangle className="h-4 w-4" />Kandidat duplicate ditemukan sebelum penyimpanan</div><div className="mt-3 space-y-2">{duplicates.map((candidate) => <div key={candidate.id} className="rounded-xl border border-amber-200 bg-white p-3 text-xs"><p className="font-bold text-slate-900">{candidate.name} · {candidate.cityName}</p><p className="mt-1 text-slate-500">{candidate.maskedPhone} · {candidate.maskedEmail || "tanpa email"} · skor {candidate.score}% · {candidate.matchReasons.join(", ")}</p></div>)}</div><Field label="Alasan tetap membuat/mengubah data *" error={formErrors.duplicateOverrideReason}><textarea value={form.duplicateOverrideReason} onChange={(e) => updateForm("duplicateOverrideReason", e.target.value)} rows={2} className="field-input mt-2" /></Field></div>}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600">Batal</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white disabled:bg-slate-400">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Simpan</button></div>
            </form>
          </div>
        </div>
      )}

      {detail && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"><div className="mx-auto my-8 max-w-2xl rounded-3xl bg-white p-6"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Member 360</p><h3 className="mt-1 text-xl font-bold text-slate-950">{detail.name}</h3><p className="text-sm text-slate-500">{detail.cityName} · {statusLabel[detail.status]}</p></div><button onClick={() => setDetail(null)}><X className="h-5 w-5" /></button></div>{historyLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div> : <div className="mt-6 grid gap-5 md:grid-cols-2"><HistoryList title="Histori pelayanan" items={history?.changes.map((item) => ({ id: item.id, title: `${item.fieldName}: ${item.oldValue || "—"} → ${item.newValue || "—"}`, detail: item.reason, date: item.createdAt })) || []} /><HistoryList title="Histori consent" items={history?.consents.map((item) => ({ id: item.id, title: `${item.consentStatus} · ${item.communicationPreferences.join(", ") || "tanpa preferensi"}`, detail: `${item.source} · ${item.purpose}`, date: item.recordedAt })) || []} /></div>}</div></div>}

      {archiveTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl bg-white p-6"><div className="flex items-center gap-3"><div className="rounded-2xl bg-amber-50 p-3 text-amber-700"><Archive className="h-5 w-5" /></div><div><h3 className="font-bold text-slate-950">Archive {archiveTarget.name}?</h3><p className="text-xs text-slate-500">Data tidak dihapus dan histori tetap tersimpan.</p></div></div><textarea value={archiveReason} onChange={(e) => setArchiveReason(e.target.value)} placeholder="Alasan archive minimal 10 karakter" rows={3} className="field-input mt-5" /><div className="mt-4 flex justify-end gap-2"><button onClick={() => setArchiveTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">Batal</button><button onClick={handleArchive} disabled={saving} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-400">Archive</button></div></div></div>}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-slate-600"><span>{label}</span><div className="mt-1">{children}</div>{error && <span className="mt-1 block text-[11px] font-semibold text-red-600">{error}</span>}</label>;
}

function HistoryList({ title, items }: { title: string; items: Array<{ id: string; title: string; detail: string; date: string }> }) {
  return <section><h4 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Clock3 className="h-4 w-4" />{title}</h4><div className="mt-3 space-y-2">{items.length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Belum ada histori.</p> : items.map((item) => <div key={item.id} className="rounded-xl border border-slate-100 p-3"><p className="text-xs font-bold text-slate-800">{item.title}</p>{item.detail && <p className="mt-1 text-[11px] text-slate-500">{item.detail}</p>}<p className="mt-1 text-[10px] text-slate-400">{new Date(item.date).toLocaleString("id-ID")}</p></div>)}</div></section>;
}
