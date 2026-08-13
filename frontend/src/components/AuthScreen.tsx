import React, { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { AuthSession } from "../types";
import { SionDatabase } from "../utils/db";
import { SionLogo } from "./Sidebar";

export default function AuthScreen({ onAuthenticated }: { onAuthenticated: (session: AuthSession) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setBusy(true);
    try { onAuthenticated(await SionDatabase.login(email.trim(), password)); }
    catch (err: any) { setError(err.message || "Tidak dapat masuk."); }
    finally { setBusy(false); }
  };

  return <main className="grid min-h-screen place-items-center bg-slate-100 p-4 text-slate-900"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl"><div className="flex items-center gap-3"><SionLogo className="h-12 w-12" /><div><h1 className="font-bold">SION MINISTRY</h1><p className="text-xs text-slate-500">Aplikasi pelayanan dan pemuridan</p></div></div><div className="mt-8 rounded-2xl bg-slate-50 p-4"><p className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-4 w-4 text-emerald-600" />Akun dibuat oleh pengurus</p><p className="mt-1 text-xs leading-5 text-slate-500">Pengurus mengirim email aktivasi untuk anggota baru. Gunakan email dan password setelah aktivasi selesai.</p></div><form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-bold">Email<div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 px-3"><Mail className="h-4 w-4 text-slate-400" /><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" className="h-11 w-full outline-none" /></div></label><label className="block text-sm font-bold">Password<div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 px-3"><LockKeyhole className="h-4 w-4 text-slate-400" /><input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} required autoComplete="current-password" className="h-11 w-full outline-none" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Tampilkan password">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>{error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={busy} className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white disabled:bg-slate-400">{busy ? "Memproses..." : "Masuk"}</button></form></section></main>;
}
