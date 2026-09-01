import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Building2, CalendarDays, CheckCircle2, ChevronRight, CircleCheck, Clock3, Heart, LoaderCircle, Send, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { SionLogo } from "./Sidebar";

type FormValues = { name: string; major: string; campus: string; cohort: string; website: string };
const initialValues: FormValues = { name: "", major: "", campus: "", cohort: "", website: "" };
const missionSlides = [
  { eyebrow: "Misi Sion Ministry", title: "Memberitakan Injil dan memuridkan kembali.", description: "Menjadi tempat persemaian bagi mahasiswa untuk mengasihi Tuhan, kampus, dan bangsa-bangsa." },
  { eyebrow: "Kampus untuk Kristus", title: "Bertumbuh bersama, memberi dampak bersama.", description: "Satu komunitas lintas kampus yang saling menguatkan untuk menjalankan Amanat Agung." },
  { eyebrow: "Open House 2026", title: "Mulai langkah pertamamu bersama kami.", description: "Datang, berkenalan, dan temukan ruang untuk bertumbuh dalam iman serta pelayanan." },
];

async function readError(response: Response) {
  try { const payload = await response.json(); return payload?.error?.message || payload?.message || "Pendaftaran belum dapat dikirim. Silakan coba lagi."; }
  catch { return "Pendaftaran belum dapat dikirim. Silakan coba lagi."; }
}

function csrfHeader(): Record<string, string> {
  const token = document.cookie.split("; ").find((item) => item.startsWith("sion_csrf="))?.split("=")[1];
  return token ? { "X-CSRF-Token": decodeURIComponent(token) } : {};
}

export default function PublicRegistration() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [activeMission, setActiveMission] = useState(0);
  const filledFields = useMemo(() => [values.name, values.campus, values.cohort, values.major].filter((value) => value.trim()).length, [values]);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveMission((current) => (current + 1) % missionSlides.length), 5500);
    return () => window.clearInterval(timer);
  }, []);

  const update = (field: keyof FormValues) => (event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, [field]: event.target.value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setIsSubmitting(true);
    try {
      const response = await fetch("/api/public/registrations", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", ...csrfHeader() }, body: JSON.stringify(values) });
      if (!response.ok) throw new Error(await readError(response));
      setCompleted(true); setValues(initialValues);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Pendaftaran belum dapat dikirim. Silakan coba lagi."); }
    finally { setIsSubmitting(false); }
  };

  return <main className="min-h-screen overflow-hidden bg-[#fff9f7] text-slate-900">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[630px] bg-[radial-gradient(circle_at_6%_8%,#fb7185_0,transparent_30%),radial-gradient(circle_at_92%_6%,#fde68a_0,transparent_22%),linear-gradient(135deg,#7f1d1d_0%,#be123c_48%,#ef4444_100%)]" />
    <div className="pointer-events-none absolute -left-16 top-72 h-52 w-52 rounded-full border-[24px] border-white/10" />
    <div className="pointer-events-none absolute right-[6%] top-40 hidden h-24 w-24 rotate-12 rounded-3xl border border-white/20 bg-white/10 lg:block" />
    <div className="relative mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <header className="flex items-center justify-between text-white"><div className="flex items-center gap-3"><SionLogo className="h-11 w-11 border-2 border-white/70 shadow-lg shadow-red-950/20" /><div><p className="text-sm font-black tracking-wide">SION MINISTRY</p><p className="text-xs font-medium text-white/75">Amanat Agung</p></div></div><div className="flex items-center gap-3"><nav className="hidden items-center gap-4 text-xs font-bold text-white/75 md:flex"><a href="https://sionministry.org/#about" className="transition hover:text-white">Tentang</a><a href="https://sionministry.org/#values" className="transition hover:text-white">Nilai</a><a href="https://sionministry.org/#contact" className="transition hover:text-white">Kontak</a></nav><a href="/" className="rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20">Masuk</a></div></header>
      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_500px] lg:items-stretch">
        <aside className="relative overflow-hidden rounded-[30px] border border-white/20 bg-gradient-to-br from-rose-800/85 to-red-700/85 p-6 text-white shadow-2xl shadow-red-950/15 backdrop-blur-sm sm:p-8 lg:min-h-[590px] lg:p-10"><div className="absolute -right-20 top-24 h-52 w-52 rounded-full border-[28px] border-white/10" /><div className="relative"><div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-black"><Sparkles className="h-3.5 w-3.5" />OPEN HOUSE 2026</div><div key={activeMission} className="animate-in fade-in slide-in-from-bottom-2 duration-500"><p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-white/65">{missionSlides[activeMission].eyebrow}</p><h1 className="mt-3 max-w-xl text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl">{missionSlides[activeMission].title}</h1><p className="mt-5 max-w-md text-sm leading-7 text-white/85 sm:text-base">{missionSlides[activeMission].description}</p></div><div className="mt-5 flex gap-2">{missionSlides.map((slide, index) => <button key={slide.eyebrow} type="button" aria-label={`Tampilkan ${slide.eyebrow}`} onClick={() => setActiveMission(index)} className={`h-1.5 rounded-full transition-all ${index === activeMission ? "w-8 bg-white" : "w-2 bg-white/35 hover:bg-white/60"}`} />)}</div><div className="mt-8 grid gap-3 sm:grid-cols-2"><InfoCard icon={<Clock3 className="h-4 w-4" />} title="Cepat diisi" description="Empat data singkat, selesai dalam 1 menit." /><InfoCard icon={<Heart className="h-4 w-4" />} title="Komunitas kampus" description="Terbuka untuk semua kampus dan jurusan." /></div><div className="mt-8 rounded-2xl border border-white/20 bg-slate-950/15 p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Setelah daftar</p><div className="mt-4 flex items-center gap-3"><Step number="1" label="Isi data" /><div className="h-px flex-1 bg-white/25" /><Step number="2" label="Diterima" /><div className="h-px flex-1 bg-white/25" /><Step number="3" label="Sampai jumpa" /></div></div></div></aside>
        <section className="rounded-[30px] border border-white/80 bg-white p-5 shadow-2xl shadow-red-950/20 sm:p-8">{completed ? <Success onAgain={() => setCompleted(false)} /> : <form onSubmit={submit} className="space-y-5" noValidate><div><p className="text-xs font-black uppercase tracking-[0.18em] text-red-600">Pendaftaran ibadah</p><h2 className="mt-2 text-2xl font-black tracking-tight">Mari berkenalan</h2><p className="mt-1.5 text-sm leading-6 text-slate-500">Lengkapi data berikut untuk panitia.</p></div><div className="rounded-2xl bg-slate-50 p-3.5"><div className="flex items-center justify-between text-xs font-bold"><span className="text-slate-600">Kelengkapan data</span><span className={filledFields === 4 ? "text-emerald-600" : "text-red-600"}>{filledFields}/4</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-500" style={{ width: `${(filledFields / 4) * 100}%` }} /></div></div><Field icon={<UserRound className="h-4 w-4" />} label="Nama lengkap" required value={values.name} onChange={update("name")} placeholder="Contoh: Maria Natalia" autoComplete="name" /><div className="grid gap-4 sm:grid-cols-2"><Field icon={<Building2 className="h-4 w-4" />} label="Kampus" required value={values.campus} onChange={update("campus")} placeholder="Contoh: UI" /><Field icon={<CalendarDays className="h-4 w-4" />} label="Angkatan" required value={values.cohort} onChange={update("cohort")} placeholder="Contoh: 2024" inputMode="numeric" /></div><Field icon={<BookOpen className="h-4 w-4" />} label="Jurusan" required value={values.major} onChange={update("major")} placeholder="Contoh: Teknik Informatika" /><div className="hidden" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={values.website} onChange={update("website")} /></label></div>{error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}<button disabled={isSubmitting} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-red-600/25 transition hover:-translate-y-0.5 hover:from-red-700 hover:to-rose-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? <><LoaderCircle className="h-4 w-4 animate-spin" />Mengirim pendaftaran…</> : <><Send className="h-4 w-4" />{filledFields === 4 ? "Kirim pendaftaran" : "Lengkapi data untuk lanjut"}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}</button><p className="flex items-start gap-2 text-xs leading-5 text-slate-400"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />Data dikirim langsung ke panitia dan hanya digunakan untuk keperluan kegiatan.</p></form>}</section>
      </section>
    </div>
  </main>;
}

function Field({ icon, label, required, ...props }: { icon: React.ReactNode; label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) { return <label className="block text-sm font-bold text-slate-700">{label} {required && <span className="text-red-600">*</span>}<span className="relative mt-2 block"><span className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-slate-400">{icon}</span><input {...props} required={required} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-50" /></span></label>; }
function InfoCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) { return <div className="rounded-2xl border border-white/20 bg-white/[0.12] p-4"><div className="grid h-8 w-8 place-items-center rounded-xl bg-white/15">{icon}</div><p className="mt-3 text-sm font-black">{title}</p><p className="mt-1 text-xs leading-5 text-white/70">{description}</p></div>; }
function Step({ number, label }: { number: string; label: string }) { return <div className="min-w-0 text-center"><span className="mx-auto grid h-6 w-6 place-items-center rounded-full border border-white/30 bg-white/15 text-[10px] font-black">{number}</span><p className="mt-1.5 whitespace-nowrap text-[10px] font-semibold text-white/75">{label}</p></div>; }
function Success({ onAgain }: { onAgain: () => void }) { return <div className="py-8 text-center"><div className="relative mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-emerald-50 text-emerald-600"><div className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-amber-300 text-amber-900"><Sparkles className="h-3.5 w-3.5" /></div><CheckCircle2 className="h-10 w-10" /></div><p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Pendaftaran berhasil</p><h2 className="mt-2 text-3xl font-black tracking-tight">Sampai jumpa!</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">Data kamu sudah diterima oleh panitia. Terima kasih telah mengambil satu langkah untuk bertumbuh bersama.</p><div className="mx-auto mt-6 flex max-w-xs items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><CircleCheck className="h-4 w-4" />Data berhasil dikirim</div><button onClick={onAgain} className="mt-7 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Daftarkan orang lain <ChevronRight className="h-4 w-4" /></button></div>; }
