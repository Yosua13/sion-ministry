import React, { useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, Clock3, History, Monitor, Plus, RefreshCw, ShieldCheck, UserCheck, UsersRound } from "lucide-react";
import { AuditLog, AuthUser, DeviceSession, Member, RoleAssignment, ScopeCatalog, ScopedRole, ScopeType } from "../types";
import { SionDatabase } from "../utils/db";

const roles: ScopedRole[] = ["admin", "pekerja", "mentor", "jemaat", "content_publisher", "auditor", "donation_verifier"];
const scopeTypes: ScopeType[] = ["organization", "ministry_unit", "region", "city", "self"];

export default function UserManagement() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [catalog, setCatalog] = useState<ScopeCatalog | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ userId: "", role: "pekerja" as ScopedRole, scopeType: "city" as ScopeType, scopeId: "", validUntil: "" });
  const [sessionUserId, setSessionUserId] = useState("");
  const [mentorForm, setMentorForm] = useState({ memberId: "", mentorUserId: "", memberUserId: "" });

  const userNames = useMemo(() => Object.fromEntries(users.map((user) => [user.id, user.name])), [users]);
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => user.status === "active").length,
    pending: users.filter((user) => user.status === "pending").length,
  }), [users]);

  const loadAdminData = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const [nextUsers, nextAssignments, nextCatalog, nextAudit, nextMembers] = await Promise.all([
        SionDatabase.getAuthUsers(), SionDatabase.getRoleAssignments(), SionDatabase.getScopeCatalog(), SionDatabase.getAuditLogs(), SionDatabase.getScopedMembers(),
      ]);
      setUsers(nextUsers);
      setAssignments(nextAssignments);
      setCatalog(nextCatalog);
      setForm((current) => ({ ...current, userId: current.userId || nextUsers[0]?.id || "" }));
      setSessionUserId((current) => current || nextUsers[0]?.id || "");
      setAuditLogs(nextAudit);
      setMembers(nextMembers);
      setMentorForm((current) => ({
        memberId: current.memberId || nextMembers[0]?.id || "",
        mentorUserId: current.mentorUserId || nextUsers.find((user) => user.role === "pekerja" && user.status === "active")?.id || "",
        memberUserId: current.memberUserId,
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat kontrol akses.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAdminData(); }, []);
  useEffect(() => {
    if (!sessionUserId) return;
    SionDatabase.getDeviceSessions(sessionUserId).then(setSessions).catch((error) => setMessage(error.message));
  }, [sessionUserId]);

  const scopeOptions = useMemo(() => {
    if (!catalog) return [];
    if (form.scopeType === "organization") return catalog.organizations;
    if (form.scopeType === "ministry_unit") return catalog.ministryUnits;
    if (form.scopeType === "region") return catalog.regions;
    if (form.scopeType === "city") return catalog.cities;
    return users.filter((user) => user.id === form.userId).map((user) => ({ id: user.id, name: user.name }));
  }, [catalog, form.scopeType, form.userId, users]);

  useEffect(() => {
    if (!scopeOptions.some((scope) => scope.id === form.scopeId)) {
      setForm((current) => ({ ...current, scopeId: scopeOptions[0]?.id || "" }));
    }
  }, [scopeOptions, form.scopeId]);

  const runAction = async (id: string, action: () => Promise<unknown>, success: string) => {
    setBusyId(id);
    setMessage(null);
    try {
      await action();
      await loadAdminData();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Aksi gagal diproses.");
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateAssignment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.userId || !form.scopeId) return setMessage("User dan scope wajib dipilih.");
    await runAction("new-assignment", () => SionDatabase.createRoleAssignment({
      userId: form.userId, role: form.role, scopeType: form.scopeType, scopeId: form.scopeId,
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
    }), "Role assignment dibuat dan menunggu persetujuan.");
  };

  const handleAssignMentor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mentorForm.memberId || !mentorForm.mentorUserId) return setMessage("Anggota dan mentor wajib dipilih.");
    await runAction("mentorship", () => SionDatabase.assignMentor(mentorForm), "Relasi mentor, mentee, dan akun anggota berhasil diperbarui.");
  };

  const statusClass = (status: string) => {
    if (status === "active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600"><ShieldCheck className="h-3.5 w-3.5" />Admin Access</div>
            <h2 className="mt-3 text-xl font-bold text-slate-950">Role, Scope, Perangkat & Audit</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Role menentukan aksi; scope menentukan organisasi, unit, region, atau kota yang boleh diakses.</p>
          </div>
          <button onClick={loadAdminData} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Muat Ulang</button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            [UsersRound, stats.total, "Total Akun", "border-slate-200 bg-slate-50", "text-slate-600"],
            [UserCheck, stats.active, "Aktif", "border-emerald-200 bg-emerald-50", "text-emerald-600"],
            [Clock3, stats.pending, "Menunggu Approval", "border-amber-200 bg-amber-50", "text-amber-600"],
          ].map(([Icon, value, label, cardClass, iconClass]: any) => (
            <div key={label} className={`rounded-2xl border p-4 ${cardClass}`}><Icon className={`h-5 w-5 ${iconClass}`} /><p className="mt-3 text-2xl font-bold text-slate-950">{value}</p><p className="text-xs font-semibold text-slate-500">{label}</p></div>
          ))}
        </div>
      </section>

      {message && <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">{message}</div>}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4"><h3 className="text-sm font-bold text-slate-900">Persetujuan Akun</h3></div>
        {isLoading ? <div className="p-8 text-center text-sm font-semibold text-slate-500">Memuat kontrol akses...</div> : (
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div key={user.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-950">{user.name}</p><span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusClass(user.status)}`}>{user.status}</span><span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">{user.role}</span></div><p className="mt-1 text-sm text-slate-500">{user.email}</p><p className="mt-1 text-xs text-slate-400">{user.cityName || "Kota belum dipilih"}</p></div>
                {user.status === "pending" && <button disabled={busyId === user.id} onClick={() => runAction(user.id, () => SionDatabase.approveUser(user.id), "Akun dan scope awal berhasil diaktifkan.")} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:bg-slate-300"><CheckCircle2 className="h-4 w-4" />Setujui Akun</button>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
        <form onSubmit={handleCreateAssignment} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Plus className="h-4 w-4" />Assignment Baru</h3>
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-bold text-slate-600">User<select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm">{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
            <label className="block text-xs font-bold text-slate-600">Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as ScopedRole })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm">{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
            <label className="block text-xs font-bold text-slate-600">Jenis Scope<select value={form.scopeType} onChange={(e) => setForm({ ...form, scopeType: e.target.value as ScopeType })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm">{scopeTypes.map((scope) => <option key={scope}>{scope}</option>)}</select></label>
            <label className="block text-xs font-bold text-slate-600">Scope<select value={form.scopeId} onChange={(e) => setForm({ ...form, scopeId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm">{scopeOptions.map((scope) => <option key={scope.id} value={scope.id}>{scope.name}</option>)}</select></label>
            <label className="block text-xs font-bold text-slate-600">Berlaku sampai (opsional)<input type="datetime-local" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm" /></label>
            <button disabled={busyId === "new-assignment"} className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:bg-slate-400">Buat Assignment</button>
          </div>
        </form>

        <form onSubmit={handleAssignMentor} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Relasi Mentor & Mentee</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">Jurnal hanya dapat dibuka oleh akun anggota sendiri atau mentor aktif yang ditugaskan di kota yang sama.</p>
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-bold text-slate-600">Data Anggota<select value={mentorForm.memberId} onChange={(e) => setMentorForm({ ...mentorForm, memberId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm">{members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.cityName}</option>)}</select></label>
            <label className="block text-xs font-bold text-slate-600">Akun Mentor<select value={mentorForm.mentorUserId} onChange={(e) => setMentorForm({ ...mentorForm, mentorUserId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm">{users.filter((user) => user.status === "active" && (user.role === "pekerja" || user.role === "admin")).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
            <label className="block text-xs font-bold text-slate-600">Akun Mentee (opsional)<select value={mentorForm.memberUserId} onChange={(e) => setMentorForm({ ...mentorForm, memberUserId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm"><option value="">Belum ditautkan</option>{users.filter((user) => user.status === "active" && user.role === "jemaat").map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
            <button disabled={busyId === "mentorship"} className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:bg-slate-400">Simpan Relasi</button>
          </div>
        </form>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4"><h3 className="text-sm font-bold text-slate-900">Role Assignment</h3></div>
          <div className="divide-y divide-slate-100">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div><p className="text-sm font-bold text-slate-900">{userNames[assignment.userId] || assignment.userId} · {assignment.role}</p><p className="mt-1 text-xs text-slate-500">{assignment.scopeType}: {assignment.scopeId}</p><span className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusClass(assignment.status)}`}>{assignment.status}</span></div>
                <div className="flex gap-2">{assignment.status === "pending" && <button onClick={() => runAction(assignment.id, () => SionDatabase.approveRoleAssignment(assignment.id), "Assignment berhasil disetujui.")} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Setujui</button>}{assignment.status === "active" && <button onClick={() => runAction(assignment.id, () => SionDatabase.revokeRoleAssignment(assignment.id), "Assignment dan sesi terkait berhasil dicabut.")} className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700"><Ban className="h-3.5 w-3.5" />Cabut</button>}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Monitor className="h-4 w-4" />Perangkat & Sesi Aktif</h3><select value={sessionUserId} onChange={(e) => setSessionUserId(e.target.value)} className="rounded-xl border border-slate-200 p-2 text-sm">{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></div>
        <div className="mt-4 divide-y divide-slate-100">{sessions.length === 0 ? <p className="py-4 text-sm text-slate-500">Tidak ada sesi aktif.</p> : sessions.map((session) => <div key={session.id} className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-bold text-slate-800">{session.deviceName || "Perangkat tidak dikenal"}</p><p className="text-xs text-slate-500">{session.ipAddress} · terakhir aktif {new Date(session.lastSeenAt || session.createdAt).toLocaleString("id-ID")}</p></div><button onClick={() => runAction(session.id, () => SionDatabase.revokeDeviceSession(session.id), "Sesi perangkat berhasil dicabut.").then(() => SionDatabase.getDeviceSessions(sessionUserId).then(setSessions))} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">Cabut Sesi</button></div>)}</div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><History className="h-4 w-4" />Histori Akses dan Perubahan</h3></div>
        <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">{auditLogs.map((audit) => <div key={audit.id} className="p-4"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-slate-800">{audit.action}</p><span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${audit.outcome === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{audit.outcome}</span></div><p className="mt-1 text-xs text-slate-500">{userNames[audit.actorUserId || ""] || audit.actorUserId || "system"} · {audit.resourceType} {audit.resourceId || ""}</p><p className="mt-1 text-[11px] text-slate-400">{new Date(audit.createdAt).toLocaleString("id-ID")} · request {audit.requestId || "-"}</p></div>)}</div>
      </section>
    </div>
  );
}
