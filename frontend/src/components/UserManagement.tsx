import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  Ban,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Filter,
  Globe,
  History,
  Info,
  KeyRound,
  Laptop,
  Mail,
  MailPlus,
  MapPin,
  Monitor,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  UserCheck,
  UserPlus,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import {
  AuditLog,
  AuthUser,
  City,
  DeviceSession,
  Member,
  RoleAssignment,
  ScopeCatalog,
  ScopedRole,
  ScopeType,
} from "../types";
import { SionDatabase } from "../utils/db";

const rolesList: { role: ScopedRole; label: string; description: string; color: string }[] = [
  { role: "admin", label: "Admin", description: "Akses penuh global ke seluruh modul & pengaturan", color: "bg-red-50 text-red-700 border-red-200" },
  { role: "pekerja", label: "Pekerja", description: "Akses pelayanan, jemaat, modul & laporan kota", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { role: "mentor", label: "Mentor", description: "Pendampingan jemaat dan pemuridan", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { role: "jemaat", label: "Jemaat", description: "Akses modul, renungan & materi pembelajaran", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { role: "content_publisher", label: "Content Publisher", description: "Mengelola berita & materi modul", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { role: "auditor", label: "Auditor", description: "Melihat histori audit & laporan kepatuhan", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { role: "donation_verifier", label: "Verifikator Donasi", description: "Memverifikasi catatan & kampanye donasi", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

type ActiveTab = "invitations" | "roles" | "history";

const avatarGradients = [
  "from-red-500 to-rose-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-purple-500 to-violet-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
  "from-pink-500 to-rose-600",
];

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarGradients.length;
  return avatarGradients[index];
}

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("invitations");

  // Data states
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [catalog, setCatalog] = useState<ScopeCatalog | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Filter & Search states for Undangan Akun DataTable
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<"name" | "createdAt" | "role" | "status">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Modal "Kirim Undangan" state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteMode, setInviteMode] = useState<"new" | "member">("new");
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    phone: "",
    cityId: "",
    role: "jemaat" as ScopedRole,
    discipleshipStage: "Jemaat" as "Pekerja" | "Jemaat",
    selectedMemberId: "",
  });
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Forms for Role tab
  const [roleForm, setRoleForm] = useState({
    userId: "",
    role: "pekerja" as ScopedRole,
    scopeType: "city" as ScopeType,
    scopeId: "",
    validUntil: "",
  });
  const [sessionUserId, setSessionUserId] = useState("");
  const [mentorForm, setMentorForm] = useState({ memberId: "", mentorUserId: "" });

  // Filter states for Audit Log tab
  const [auditSearch, setAuditSearch] = useState("");
  const [auditOutcomeFilter, setAuditOutcomeFilter] = useState<string>("all");
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(10);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);

  const userNames = useMemo(() => Object.fromEntries(users.map((user) => [user.id, user.name])), [users]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.status === "active").length,
      pending: users.filter((user) => user.status === "invited").length,
      disabled: users.filter((user) => user.status === "disabled").length,
    }),
    [users]
  );

  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage({ text, type });
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [nextUsers, nextAssignments, nextCatalog, nextAudit, nextMembers] = await Promise.all([
        SionDatabase.getAuthUsers(),
        SionDatabase.getRoleAssignments(),
        SionDatabase.getScopeCatalog(),
        SionDatabase.getAuditLogs(),
        SionDatabase.getScopedMembers(),
      ]);

      const roleByUser = new Map<string, ScopedRole>();
      nextAssignments
        .filter((assignment) => assignment.status === "active")
        .forEach((assignment) => {
          if (!roleByUser.has(assignment.userId)) roleByUser.set(assignment.userId, assignment.role);
        });

      const usersWithRole = nextUsers.map((user) => ({
        ...user,
        role: roleByUser.get(user.id) || user.role || "jemaat",
      }));

      setUsers(usersWithRole);
      setAssignments(nextAssignments);
      setCatalog(nextCatalog);
      setRoleForm((current) => ({ ...current, userId: current.userId || usersWithRole[0]?.id || "" }));
      setSessionUserId((current) => current || usersWithRole[0]?.id || "");
      setAuditLogs(nextAudit);
      setMembers(nextMembers);

      if (nextCatalog && nextCatalog.cities.length > 0 && !inviteForm.cityId) {
        setInviteForm((prev) => ({ ...prev, cityId: nextCatalog.cities[0].id }));
      }

      setMentorForm((current) => ({
        memberId: current.memberId || nextMembers[0]?.id || "",
        mentorUserId:
          current.mentorUserId ||
          usersWithRole.find((user) => user.role === "pekerja" && user.status === "active")?.id ||
          "",
      }));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal memuat kontrol akses.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (!sessionUserId) return;
    SionDatabase.getDeviceSessions(sessionUserId)
      .then(setSessions)
      .catch((error) => showToast(error.message, "error"));
  }, [sessionUserId]);

  const scopeOptions = useMemo(() => {
    if (!catalog) return [];
    return catalog.cities;
  }, [catalog]);

  useEffect(() => {
    if (!scopeOptions.some((scope) => scope.id === roleForm.scopeId)) {
      setRoleForm((current) => ({ ...current, scopeId: scopeOptions[0]?.id || "" }));
    }
  }, [scopeOptions, roleForm.scopeId]);

  const runAction = async (id: string, action: () => Promise<unknown>, success: string) => {
    setBusyId(id);
    try {
      await action();
      await loadAdminData();
      showToast(success, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Aksi gagal diproses.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateAssignment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!roleForm.userId || (roleForm.role !== "admin" && !roleForm.scopeId)) {
      return showToast("User dan kota wajib dipilih.", "error");
    }
    await runAction(
      "new-assignment",
      () =>
        SionDatabase.createRoleAssignment({
          userId: roleForm.userId,
          role: roleForm.role,
          scopeType: roleForm.scopeType,
          scopeId: roleForm.scopeId,
          validUntil: roleForm.validUntil ? new Date(roleForm.validUntil).toISOString() : undefined,
        }),
      "Role berhasil diberikan."
    );
  };

  const handleAssignMentor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mentorForm.memberId || !mentorForm.mentorUserId) {
      return showToast("Anggota dan mentor wajib dipilih.", "error");
    }
    await runAction(
      "mentorship",
      () => SionDatabase.assignMentor(mentorForm),
      "Relasi mentor, mentee, dan akun anggota berhasil diperbarui."
    );
  };

  // Submit Kirim Undangan Baru
  const handleSendInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSubmitting(true);
    try {
      let targetName = inviteForm.name.trim();
      let targetEmail = inviteForm.email.trim().toLowerCase();
      let targetPhone = inviteForm.phone.trim();
      let targetCityId = inviteForm.cityId;
      let targetStage = inviteForm.discipleshipStage;

      if (inviteMode === "member") {
        const selectedMember = members.find((m) => m.id === inviteForm.selectedMemberId);
        if (!selectedMember) {
          throw new Error("Pilih anggota yang valid dari daftar.");
        }
        targetName = selectedMember.name;
        targetEmail = (selectedMember.email || "").trim().toLowerCase();
        targetPhone = selectedMember.phone;
        targetCityId = selectedMember.cityId;
        targetStage = selectedMember.discipleshipStage === "Pekerja" ? "Pekerja" : "Jemaat";

        if (!targetEmail) {
          throw new Error("Anggota ini belum memiliki alamat email. Mohon lengkapi email anggota terlebih dahulu.");
        }
      } else {
        if (!targetName) throw new Error("Nama lengkap wajib diisi.");
        if (!targetEmail || !targetEmail.includes("@")) throw new Error("Alamat email valid wajib diisi.");
        if (!targetCityId) throw new Error("Kota pelayanan wajib dipilih.");
      }

      const selectedCity = catalog?.cities.find((c) => c.id === targetCityId);
      const cityName = selectedCity ? selectedCity.name : "";

      await SionDatabase.createMember360({
        name: targetName,
        email: targetEmail,
        phone: targetPhone || "-",
        cityId: targetCityId,
        cityName: cityName,
        discipleshipStage: targetStage,
        mentorName: "-",
        groupName: "Umum",
        joinedDate: new Date().toISOString().slice(0, 10),
        status: "active",
        consentStatus: "granted",
        consentSource: "admin_portal_invitation",
        consentPurpose: "account_activation",
        communicationPreferences: ["email", "whatsapp"],
        inviteRole: inviteForm.role,
      });

      showToast(
        import.meta.env.DEV
          ? `Undangan akun untuk ${targetName} berhasil dibuat! (Token aktivasi dicatat di terminal backend).`
          : `Undangan aktivasi akun berhasil dikirimkan ke ${targetEmail}.`,
        "success"
      );

      setInviteModalOpen(false);
      setInviteForm({
        name: "",
        email: "",
        phone: "",
        cityId: catalog?.cities[0]?.id || "",
        role: "jemaat",
        discipleshipStage: "Jemaat",
        selectedMemberId: "",
      });
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || "Gagal mengirim undangan akun.", "error");
    } finally {
      setInviteSubmitting(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Email/ID berhasil disalin ke clipboard.", "info");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper styles for roles & status
  const getRoleBadge = (role: ScopedRole | string) => {
    const matched = rolesList.find((r) => r.role === role);
    const color = matched ? matched.color : "bg-slate-100 text-slate-700 border-slate-200";
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${color}`}>
        {role === "admin" && <Shield className="h-3 w-3" />}
        {role === "pekerja" && <Briefcase className="h-3 w-3" />}
        {role === "mentor" && <Users className="h-3 w-3" />}
        {role === "jemaat" && <User className="h-3 w-3" />}
        {matched ? matched.label : role}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          Aktif
        </span>
      );
    }
    if (status === "invited") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
          <Clock3 className="h-3.5 w-3.5" />
          Menunggu Aktivasi
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
        <Ban className="h-3.5 w-3.5" />
        Nonaktif
      </span>
    );
  };

  // Filtered & Paginated Users for DataTable
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const matchesSearch =
          !searchQuery.trim() ||
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.cityName && user.cityName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          user.role.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || user.status === statusFilter;
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesCity = cityFilter === "all" || user.cityId === cityFilter;

        return matchesSearch && matchesStatus && matchesRole && matchesCity;
      })
      .sort((a, b) => {
        let valA: any = a[sortField] || "";
        let valB: any = b[sortField] || "";

        if (sortField === "createdAt") {
          valA = new Date(a.createdAt || 0).getTime();
          valB = new Date(b.createdAt || 0).getTime();
        } else if (typeof valA === "string") {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [users, searchQuery, statusFilter, roleFilter, cityFilter, sortField, sortDirection]);

  const isAllUsers = pageSize === -1;
  const totalUserPages = isAllUsers ? 1 : Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    if (isAllUsers) return filteredUsers;
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize, isAllUsers]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, roleFilter, cityFilter, pageSize]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        !auditSearch.trim() ||
        log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.resourceType.toLowerCase().includes(auditSearch.toLowerCase()) ||
        (log.actorUserId && (userNames[log.actorUserId] || log.actorUserId).toLowerCase().includes(auditSearch.toLowerCase())) ||
        (log.requestId && log.requestId.toLowerCase().includes(auditSearch.toLowerCase()));

      const matchesOutcome = auditOutcomeFilter === "all" || log.outcome === auditOutcomeFilter;
      return matchesSearch && matchesOutcome;
    });
  }, [auditLogs, auditSearch, auditOutcomeFilter, userNames]);

  const isAllAudit = auditPageSize === -1;
  const totalAuditPages = isAllAudit ? 1 : Math.ceil(filteredAuditLogs.length / auditPageSize) || 1;
  const paginatedAuditLogs = useMemo(() => {
    if (isAllAudit) return filteredAuditLogs;
    const start = (auditPage - 1) * auditPageSize;
    return filteredAuditLogs.slice(start, start + auditPageSize);
  }, [filteredAuditLogs, auditPage, auditPageSize, isAllAudit]);

  // Reset audit page when filter changes
  useEffect(() => {
    setAuditPage(1);
  }, [auditSearch, auditOutcomeFilter, auditPageSize]);

  // Toggle sort handler
  const handleSort = (field: "name" | "createdAt" | "role" | "status") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl ring-1 ring-slate-950/5 transition-all">
          {toastMessage.type === "success" && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
          {toastMessage.type === "error" && <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />}
          {toastMessage.type === "info" && <Info className="h-5 w-5 shrink-0 text-blue-600" />}
          <p className="text-sm font-medium text-slate-800">{toastMessage.text}</p>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 ring-1 ring-red-600/10">
                <ShieldCheck className="h-3.5 w-3.5" />
                Manajemen Akses & Keamanan
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                Super Admin
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
              Kontrol Pengguna & Hak Akses
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
              Kelola undangan aktivasi akun pengguna, konfigurasi role & scope wilayah, pantau perangkat aktif, serta telusuri rekam jejak audit sistem.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadAdminData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-red-600" : ""}`} />
              Muat Ulang
            </button>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-red-600/20 transition hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:shadow-red-600/30"
            >
              <MailPlus className="h-4 w-4" />
              Kirim Undangan
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-slate-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Akun</span>
              <UsersRound className="h-4 w-4 text-slate-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{stats.total}</p>
            <span className="text-[11px] font-medium text-slate-400">Pengguna terdaftar</span>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 transition hover:bg-emerald-50/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Akun Aktif</span>
              <UserCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-900">{stats.active}</p>
            <span className="text-[11px] font-medium text-emerald-600/80">Siap & terverifikasi</span>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 transition hover:bg-amber-50/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Menunggu Aktivasi</span>
              <Clock3 className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-amber-900">{stats.pending}</p>
            <span className="text-[11px] font-medium text-amber-600/80">Tautan undangan terkirim</span>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/40 p-4 transition hover:bg-slate-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Role Penugasan</span>
              <KeyRound className="h-4 w-4 text-slate-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{assignments.length}</p>
            <span className="text-[11px] font-medium text-slate-500">Penetapan role & scope</span>
          </div>
        </div>
      </section>

      {/* Main Tab Navigation Bar */}
      <div className="border-b border-slate-200 bg-white px-2 rounded-2xl shadow-sm">
        <nav className="flex space-x-2 overflow-x-auto py-2" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("invitations")}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "invitations"
                ? "bg-red-50 text-red-700 shadow-xs ring-1 ring-red-600/20"
                : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Undangan Akun</span>
            <span
              className={`ml-1.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === "invitations"
                  ? "bg-red-600 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "roles"
                ? "bg-red-50 text-red-700 shadow-xs ring-1 ring-red-600/20"
                : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Role & Akses</span>
            <span
              className={`ml-1.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === "roles"
                  ? "bg-red-600 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {assignments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "history"
                ? "bg-red-50 text-red-700 shadow-xs ring-1 ring-red-600/20"
                : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
            }`}
          >
            <History className="h-4 w-4" />
            <span>Histori Akses & Perubahan</span>
            <span
              className={`ml-1.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === "history"
                  ? "bg-red-600 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {auditLogs.length}
            </span>
          </button>
        </nav>
      </div>

      {/* TAB 1: UNDANGAN AKUN (DATATABLE) */}
      {activeTab === "invitations" && (
        <div className="space-y-4">
          {/* DataTable Filter Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, email, role, atau kota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-50"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="invited">Menunggu Aktivasi</option>
                  <option value="disabled">Nonaktif</option>
                </select>
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-50"
              >
                <option value="all">Semua Role</option>
                {rolesList.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.label}
                  </option>
                ))}
              </select>

              {/* City Filter */}
              {catalog && catalog.cities.length > 0 && (
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-50"
                >
                  <option value="all">Semua Kota</option>
                  {catalog.cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Page size selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-50"
                >
                  <option value={10}>10 data</option>
                  <option value={25}>25 data</option>
                  <option value={50}>50 data</option>
                  <option value={100}>100 data</option>
                  <option value={-1}>Semua (All)</option>
                </select>
              </div>
            </div>
          </div>

          {/* DataTable Card */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th
                      scope="col"
                      onClick={() => handleSort("name")}
                      className="cursor-pointer px-6 py-4 transition hover:text-slate-900"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Pengguna</span>
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th
                      scope="col"
                      onClick={() => handleSort("role")}
                      className="cursor-pointer px-6 py-4 transition hover:text-slate-900"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Role</span>
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Kota Pelayanan
                    </th>
                    <th
                      scope="col"
                      onClick={() => handleSort("status")}
                      className="cursor-pointer px-6 py-4 transition hover:text-slate-900"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Status</span>
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th
                      scope="col"
                      onClick={() => handleSort("createdAt")}
                      className="cursor-pointer px-6 py-4 transition hover:text-slate-900"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Tanggal Terdaftar</span>
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm font-semibold text-slate-400">
                        <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-red-600" />
                        Memuat data pengguna dan undangan...
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <Users className="h-7 w-7" />
                        </div>
                        <h4 className="mt-3 text-base font-bold text-slate-800">Tidak ada data pengguna yang cocok</h4>
                        <p className="mt-1 text-xs text-slate-500">
                          Coba sesuaikan kata kunci pencarian atau ubah filter di atas.
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("all");
                            setRoleFilter("all");
                            setCityFilter("all");
                          }}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Reset Semua Filter
                        </button>
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr key={user.id} className="transition hover:bg-slate-50/70">
                        {/* User info cell */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient(
                                user.name
                              )} text-xs font-bold text-white shadow-xs`}
                            >
                              {getInitials(user.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900">{user.name}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="truncate">{user.email}</span>
                                <button
                                  onClick={() => handleCopy(user.email, user.id)}
                                  title="Salin email"
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  {copiedId === user.id ? (
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role cell */}
                        <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>

                        {/* City cell */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.cityName ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              {user.cityName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                              <Globe className="h-3.5 w-3.5" />
                              Global / Semua Kota
                            </span>
                          )}
                        </td>

                        {/* Status cell */}
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.status)}</td>

                        {/* Date cell */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </td>

                        {/* Actions cell */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {user.status === "invited" ? (
                              <button
                                disabled={busyId === user.id}
                                onClick={() =>
                                  runAction(
                                    user.id,
                                    () => SionDatabase.resendInvitation(user.id),
                                    import.meta.env.DEV
                                      ? "Undangan diperbarui. Tautan aktivasi dicatat pada terminal backend."
                                      : `Undangan aktivasi baru berhasil dikirim ke ${user.email}.`
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                              >
                                <RefreshCw className={`h-3.5 w-3.5 ${busyId === user.id ? "animate-spin" : ""}`} />
                                Kirim Ulang
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSessionUserId(user.id);
                                  setActiveTab("roles");
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                              >
                                <Shield className="h-3.5 w-3.5 text-slate-500" />
                                Kelola Role
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-medium text-slate-500">
                  Menampilkan{" "}
                  <span className="font-bold text-slate-900">
                    {filteredUsers.length > 0 ? (isAllUsers ? 1 : (currentPage - 1) * pageSize + 1) : 0}
                  </span>{" "}
                  sampai{" "}
                  <span className="font-bold text-slate-900">
                    {isAllUsers ? filteredUsers.length : Math.min(currentPage * pageSize, filteredUsers.length)}
                  </span>{" "}
                  dari <span className="font-bold text-slate-900">{filteredUsers.length}</span> data
                  {isAllUsers && " (Semua data)"}
                </p>

                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                  <span className="text-xs font-medium text-slate-500">Tampilkan:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-50"
                  >
                    <option value={10}>10 data</option>
                    <option value={25}>25 data</option>
                    <option value={50}>50 data</option>
                    <option value={100}>100 data</option>
                    <option value={-1}>Semua (All)</option>
                  </select>
                </div>
              </div>

              {!isAllUsers && totalUserPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalUserPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalUserPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && p - prev > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && <span className="px-1 text-xs text-slate-400">...</span>}
                          <button
                            onClick={() => setCurrentPage(p)}
                            className={`h-8 w-8 rounded-lg text-xs font-bold transition ${
                              currentPage === p
                                ? "bg-red-600 text-white shadow-xs"
                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    disabled={currentPage >= totalUserPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalUserPages, p + 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLE & AKSES */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
            {/* Left Forms Column */}
            <div className="space-y-6">
              {/* Form Berikan Role Baru */}
              <form
                onSubmit={handleCreateAssignment}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Penugasan Role Baru</h3>
                    <p className="text-xs text-slate-500">Berikan peran dan batas wilayah ke akun pengguna.</p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Pilih Pengguna
                    </label>
                    <select
                      value={roleForm.userId}
                      onChange={(e) => setRoleForm({ ...roleForm, userId: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email}) · {user.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Role yang Diberikan
                    </label>
                    <select
                      value={roleForm.role}
                      onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value as ScopedRole })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                    >
                      {rolesList.map((r) => (
                        <option key={r.role} value={r.role}>
                          {r.label} — {r.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {roleForm.role !== "admin" && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Scope Wilayah Kota
                      </label>
                      <select
                        value={roleForm.scopeId}
                        onChange={(e) => setRoleForm({ ...roleForm, scopeId: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                      >
                        {scopeOptions.map((scope) => (
                          <option key={scope.id} value={scope.id}>
                            {scope.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={busyId === "new-assignment"}
                    className="mt-2 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {busyId === "new-assignment" ? "Memproses..." : "Terapkan Role"}
                  </button>
                </div>
              </form>

              {/* Form Relasi Mentor & Mentee */}
              <form
                onSubmit={handleAssignMentor}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Relasi Mentor & Mentee</h3>
                    <p className="text-xs text-slate-500">Hubungkan akun jemaat ke mentor di kota yang sama.</p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Data Anggota / Mentee
                    </label>
                    <select
                      value={mentorForm.memberId}
                      onChange={(e) => setMentorForm({ ...mentorForm, memberId: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                    >
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} · {member.cityName || "Kota belum ditentukan"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Akun Mentor Aktif
                    </label>
                    <select
                      value={mentorForm.mentorUserId}
                      onChange={(e) => setMentorForm({ ...mentorForm, mentorUserId: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                    >
                      {users
                        .filter((user) => user.status === "active" && (user.role === "pekerja" || user.role === "admin" || user.role === "mentor"))
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.role}) · {user.cityName || "Semua Kota"}
                          </option>
                        ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={busyId === "mentorship"}
                    className="mt-2 w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-bold text-white shadow-md shadow-red-600/20 transition hover:from-red-700 hover:to-red-800 disabled:opacity-50"
                  >
                    {busyId === "mentorship" ? "Menyimpan..." : "Simpan Penugasan Mentor"}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Active Role List */}
            <div className="space-y-6">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h3 className="text-sm font-bold text-slate-900">Daftar Penugasan Role Aktif</h3>
                  <p className="text-xs text-slate-500">Daftar seluruh pengguna yang memiliki wewenang khusus dalam sistem.</p>
                </div>

                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                  {assignments.length === 0 ? (
                    <p className="p-6 text-center text-sm text-slate-500">Belum ada role yang tercatat.</p>
                  ) : (
                    assignments.map((assignment) => {
                      const cityName = catalog?.cities.find((c) => c.id === assignment.scopeId)?.name;
                      return (
                        <div
                          key={assignment.id}
                          className="flex flex-col gap-3 p-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-slate-900">
                                {userNames[assignment.userId] || assignment.userId}
                              </p>
                              {getRoleBadge(assignment.role)}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              Scope:{" "}
                              <span className="font-semibold text-slate-700">
                                {assignment.scopeType === "global" || !assignment.scopeId || assignment.scopeId === "global"
                                  ? "Global (Semua Wilayah)"
                                  : `Kota ${cityName || assignment.scopeId}`}
                              </span>
                              {" · "}
                              Diberikan pada:{" "}
                              {assignment.validFrom
                                ? new Date(assignment.validFrom).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "-"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                runAction(
                                  assignment.id,
                                  () => SionDatabase.revokeRoleAssignment(assignment.id),
                                  "Role dan sesi terkait berhasil dicabut."
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              Cabut Role
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Device & Active Sessions Section */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Monitor className="h-4 w-4 text-slate-600" />
                  Perangkat & Sesi Login Aktif
                </h3>
                <p className="text-xs text-slate-500">Pantau dan kelola sesi browser yang sedang aktif per akun.</p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600">Pilih User:</label>
                <select
                  value={sessionUserId}
                  onChange={(e) => setSessionUserId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-800 outline-none focus:border-red-500"
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {sessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-sm font-medium text-slate-400">
                  Tidak ada sesi aktif yang tercatat untuk pengguna ini.
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col gap-3 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        {session.deviceName?.toLowerCase().includes("mobile") ||
                        session.userAgent?.toLowerCase().includes("mobile") ? (
                          <Smartphone className="h-5 w-5" />
                        ) : (
                          <Laptop className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {session.deviceName || "Perangkat Web / Browser"}
                        </p>
                        <p className="text-xs text-slate-500">
                          IP: <span className="font-mono">{session.ipAddress}</span> · Terakhir aktif:{" "}
                          {new Date(session.lastSeenAt || session.createdAt).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        runAction(
                          session.id,
                          () => SionDatabase.revokeDeviceSession(session.id),
                          "Sesi perangkat berhasil dicabut."
                        ).then(() => SionDatabase.getDeviceSessions(sessionUserId).then(setSessions))
                      }
                      className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Cabut Sesi
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: HISTORI AKSES & PERUBAHAN (AUDIT LOGS) */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Audit Controls & Filters */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari aksi, nama aktor, resource type, atau request ID..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-50"
              />
              {auditSearch && (
                <button
                  onClick={() => setAuditSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={auditOutcomeFilter}
                onChange={(e) => setAuditOutcomeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-red-500"
              >
                <option value="all">Semua Status Outcome</option>
                <option value="success">Berhasil (Success)</option>
                <option value="denied">Ditolak (Denied)</option>
                <option value="failure">Gagal (Failure)</option>
              </select>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">Tampilkan:</span>
                <select
                  value={auditPageSize}
                  onChange={(e) => setAuditPageSize(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-red-500"
                >
                  <option value={10}>10 data</option>
                  <option value={25}>25 data</option>
                  <option value={50}>50 data</option>
                  <option value={100}>100 data</option>
                  <option value={-1}>Semua (All)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Log Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-6 py-4">Waktu</th>
                    <th scope="col" className="px-6 py-4">Aksi</th>
                    <th scope="col" className="px-6 py-4">Aktor Pelaku</th>
                    <th scope="col" className="px-6 py-4">Resource & Scope</th>
                    <th scope="col" className="px-6 py-4">Hasil</th>
                    <th scope="col" className="px-6 py-4 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm font-semibold text-slate-400">
                        Tidak ada catatan audit yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedAuditLogs.map((audit) => (
                      <tr key={audit.id} className="transition hover:bg-slate-50/70">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          {new Date(audit.createdAt).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-slate-900">
                          {audit.action}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-800">
                            {userNames[audit.actorUserId || ""] || audit.actorUserId || "Sistem"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700">
                            {audit.resourceType}
                          </span>
                          {audit.resourceId && (
                            <span className="ml-1 text-[11px] text-slate-400 font-mono">
                              #{audit.resourceId.slice(0, 8)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {audit.outcome === "success" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                              <Check className="h-3 w-3" />
                              Success
                            </span>
                          ) : audit.outcome === "denied" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                              <Ban className="h-3 w-3" />
                              Denied
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200">
                              <AlertTriangle className="h-3 w-3" />
                              Failure
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedAuditLog(audit)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                          >
                            <Info className="h-3 w-3 text-slate-400" />
                            Payload
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Audit Pagination */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-medium text-slate-500">
                  Menampilkan{" "}
                  <span className="font-bold text-slate-900">
                    {filteredAuditLogs.length > 0 ? (isAllAudit ? 1 : (auditPage - 1) * auditPageSize + 1) : 0}
                  </span>{" "}
                  sampai{" "}
                  <span className="font-bold text-slate-900">
                    {isAllAudit ? filteredAuditLogs.length : Math.min(auditPage * auditPageSize, filteredAuditLogs.length)}
                  </span>{" "}
                  dari <span className="font-bold text-slate-900">{filteredAuditLogs.length}</span> data
                  {isAllAudit && " (Semua data)"}
                </p>

                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                  <span className="text-xs font-medium text-slate-500">Tampilkan:</span>
                  <select
                    value={auditPageSize}
                    onChange={(e) => setAuditPageSize(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-red-500"
                  >
                    <option value={10}>10 data</option>
                    <option value={25}>25 data</option>
                    <option value={50}>50 data</option>
                    <option value={100}>100 data</option>
                    <option value={-1}>Semua (All)</option>
                  </select>
                </div>
              </div>

              {!isAllAudit && totalAuditPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={auditPage <= 1}
                    onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-700">
                    Halaman {auditPage} dari {totalAuditPages}
                  </span>
                  <button
                    disabled={auditPage >= totalAuditPages}
                    onClick={() => setAuditPage((p) => Math.min(totalAuditPages, p + 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KIRIM UNDANGAN AKUN */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <MailPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Kirim Undangan Akun Baru</h3>
                  <p className="text-xs text-slate-500">Kirimkan tautan aktivasi untuk akun pengguna baru.</p>
                </div>
              </div>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="mt-4 flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setInviteMode("new")}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                  inviteMode === "new" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Input Akun Baru
              </button>
              <button
                type="button"
                onClick={() => setInviteMode("member")}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                  inviteMode === "member" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Undang dari Jemaat
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendInviteSubmit} className="mt-4 space-y-4">
              {inviteMode === "member" ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Pilih Data Jemaat <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={inviteForm.selectedMemberId}
                    onChange={(e) => setInviteForm({ ...inviteForm, selectedMemberId: e.target.value })}
                    required
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                  >
                    <option value="">-- Pilih Jemaat --</option>
                    {members
                      .filter((m) => !users.some((u) => u.email && m.email && u.email.toLowerCase() === m.email.toLowerCase()))
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} {member.email ? `(${member.email})` : "(Belum ada email)"} · {member.cityName}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Hanya menampilkan jemaat yang belum memiliki akun login.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Alamat Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="nama@email.com"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Nomor HP / WhatsApp
                      </label>
                      <input
                        type="tel"
                        placeholder="08123456789"
                        value={inviteForm.phone}
                        onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Kota Pelayanan <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={inviteForm.cityId}
                        onChange={(e) => setInviteForm({ ...inviteForm, cityId: e.target.value })}
                        required
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                      >
                        {scopeOptions.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Tahapan Pelayanan
                      </label>
                      <select
                        value={inviteForm.discipleshipStage}
                        onChange={(e) =>
                          setInviteForm({
                            ...inviteForm,
                            discipleshipStage: e.target.value as "Pekerja" | "Jemaat",
                          })
                        }
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                      >
                        <option value="Jemaat">Jemaat</option>
                        <option value="Pekerja">Pekerja</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Role Akses Awal <span className="text-red-500">*</span>
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as ScopedRole })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                >
                  {rolesList.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label} — {r.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Informative Note */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800">
                <p className="font-bold flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" />
                  Informasi Pengiriman Undangan:
                </p>
                <p className="mt-1 leading-relaxed text-amber-700">
                  Tautan aktivasi berdurasi 7 hari akan dikirimkan ke email tujuan. Penerima undangan dapat langsung mengklik tautan untuk mengatur kata sandi akunnya.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={inviteSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-red-600/20 hover:from-red-700 hover:to-red-800 disabled:opacity-50"
                >
                  <Send className={`h-4 w-4 ${inviteSubmitting ? "animate-spin" : ""}`} />
                  {inviteSubmitting ? "Mengirim..." : "Kirim Undangan Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL PAYLOAD AUDIT LOG */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Rincian Audit Log Payload</h3>
                <p className="text-xs font-mono text-slate-500">ID: {selectedAuditLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
                <div>
                  <span className="font-bold text-slate-500">Aksi:</span>
                  <p className="font-mono font-bold text-slate-900">{selectedAuditLog.action}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Hasil:</span>
                  <p className="font-bold text-slate-900">{selectedAuditLog.outcome}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Aktor:</span>
                  <p className="text-slate-900">
                    {userNames[selectedAuditLog.actorUserId || ""] || selectedAuditLog.actorUserId || "Sistem"}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-500">IP Address:</span>
                  <p className="font-mono text-slate-900">{selectedAuditLog.ipAddress || "-"}</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-600">Metadata Payload (JSON):</span>
                <pre className="mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-slate-950 p-3.5 font-mono text-xs text-emerald-400">
                  {JSON.stringify(selectedAuditLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
