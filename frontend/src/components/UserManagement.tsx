import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, ShieldCheck, UserCheck, UsersRound } from "lucide-react";
import { AuthUser } from "../types";
import { SionDatabase } from "../utils/db";

export default function UserManagement() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      setUsers(await SionDatabase.getAuthUsers());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => user.status === "active").length,
      pending: users.filter((user) => user.status === "pending").length,
    };
  }, [users]);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    setMessage(null);
    try {
      await SionDatabase.approveUser(id);
      await loadUsers();
      setMessage("Akun berhasil disetujui dan sudah bisa masuk.");
    } catch (err: any) {
      setMessage(err.message || "Gagal menyetujui akun.");
    } finally {
      setApprovingId(null);
    }
  };

  const statusClass = (status: AuthUser["status"]) => {
    if (status === "active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Access
            </div>
            <h2 className="mt-3 text-xl font-bold text-slate-950">Manajemen User & Role</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Kelola akun yang mendaftar, pastikan role sesuai, lalu setujui akun yang sudah valid untuk masuk ke aplikasi.
            </p>
          </div>
          <button
            onClick={loadUsers}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Muat Ulang
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <UsersRound className="h-5 w-5 text-slate-500" />
            <p className="mt-3 text-2xl font-bold text-slate-950">{stats.total}</p>
            <p className="text-xs font-semibold text-slate-500">Total Akun</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <UserCheck className="h-5 w-5 text-emerald-600" />
            <p className="mt-3 text-2xl font-bold text-emerald-800">{stats.active}</p>
            <p className="text-xs font-semibold text-emerald-700">Aktif</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <Clock3 className="h-5 w-5 text-amber-600" />
            <p className="mt-3 text-2xl font-bold text-amber-800">{stats.pending}</p>
            <p className="text-xs font-semibold text-amber-700">Menunggu Approval</p>
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          {message}
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-bold text-slate-900">Daftar Akun</h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm font-semibold text-slate-500">Memuat data user...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-slate-500">Belum ada akun terdaftar.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div key={user.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-950">{user.name}</p>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ${statusClass(user.status)}`}>
                      {user.status}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold capitalize text-slate-600">
                      {user.role}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {user.cityName || "Kota belum dipilih"} · Terdaftar {new Date(user.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>

                {user.status === "pending" ? (
                  <button
                    disabled={approvingId === user.id}
                    onClick={() => handleApprove(user.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-500 disabled:cursor-wait disabled:bg-slate-300"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {approvingId === user.id ? "Menyetujui..." : "Setujui Akun"}
                  </button>
                ) : (
                  <div className="text-sm font-bold text-emerald-600">Sudah aktif</div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
