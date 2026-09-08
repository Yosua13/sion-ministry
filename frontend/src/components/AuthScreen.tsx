import React from "react";
import { ShieldCheck } from "lucide-react";
import { SionDatabase } from "../utils/db";
import { SionLogo } from "./Sidebar";

export default function AuthScreen() {
  const message = new URLSearchParams(window.location.search).get("auth");
  const notice = message === "pending" ? "Login Google berhasil. Akun Anda sedang menunggu persetujuan admin."
    : message === "cancelled" ? "Login Google dibatalkan."
    : message === "error" ? "Login Google tidak dapat diselesaikan. Silakan coba kembali."
    : "Masuk menggunakan akun Google Anda. Akun baru akan ditinjau oleh admin sebelum dapat mengakses aplikasi.";
  return <main className="grid min-h-screen place-items-center bg-slate-100 p-4 text-slate-900"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl"><div className="flex items-center gap-3"><SionLogo className="h-12 w-12" /><div><h1 className="font-bold">SION MINISTRY</h1><p className="text-xs text-slate-500">Aplikasi pelayanan dan pemuridan</p></div></div><div className="mt-8 rounded-2xl bg-slate-50 p-4"><p className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-4 w-4 text-emerald-600" />Login aman dengan Google</p><p className="mt-1 text-xs leading-5 text-slate-500">{notice}</p></div><button onClick={() => SionDatabase.startGoogleLogin()} className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"><GoogleMark />Lanjutkan dengan Google</button><p className="mt-5 text-center text-xs leading-5 text-slate-400">Sesi berakhir setelah sekitar satu jam. Anda akan diminta masuk kembali dengan Google.</p></section></main>;
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.22-.2-1.75H12v3.52h5.52c-.11.88-.73 2.2-2.1 3.09l-.02.12 3.05 2.36.21.02c1.93-1.78 2.94-4.39 2.94-7.34Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.61-2.42l-3.15-2.44c-.84.58-1.96.98-3.46.98-2.64 0-4.88-1.78-5.68-4.23l-.11.01-3.17 2.45-.04.1A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.32 13.89A6.05 6.05 0 0 1 6 12c0-.66.12-1.3.31-1.89l-.01-.13-3.21-2.49-.1.05A10 10 0 0 0 2 12c0 1.61.39 3.13 1.08 4.47l3.24-2.58Z"/><path fill="#EA4335" d="M12 5.88c1.89 0 3.16.82 3.89 1.5l2.84-2.77C16.95 2.95 14.7 2 12 2a10 10 0 0 0-8.92 5.53l3.23 2.5C7.12 7.57 9.36 5.88 12 5.88Z"/></svg>;
}
