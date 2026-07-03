import React, { useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, MapPin, ShieldCheck, User, UserPlus } from "lucide-react";
import { AuthRole, AuthSession, City } from "../types";
import { SionDatabase } from "../utils/db";
import { SionLogo } from "./Sidebar";

interface AuthScreenProps {
  cities: City[];
  onAuthenticated: (session: AuthSession) => void;
}

type AuthMode = "login" | "register";

type AuthForm = {
  name: string;
  email: string;
  password: string;
  role: AuthRole | "";
  cityId: string;
};

type FieldErrors = Partial<Record<keyof AuthForm, string>>;

const roleOptions: Array<{ role: AuthRole; label: string; description: string }> = [
  { role: "pekerja", label: "Pekerja", description: "Mengelola pelayanan, jurnal, dan laporan lapangan." },
  { role: "admin", label: "Admin", description: "Mengatur data utama, akses user, dan sinkronisasi." },
  { role: "jemaat", label: "Jemaat", description: "Mengikuti modul, donasi, dan informasi pelayanan." },
];

const initialForm: AuthForm = {
  name: "",
  email: "",
  password: "",
  role: "",
  cityId: "",
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function AuthScreen({ cities, onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<AuthForm>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedCity = cities.find((city) => city.id === form.cityId);

  const updateField = <K extends keyof AuthForm>(field: K, value: AuthForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setForm(initialForm);
    setFieldErrors({});
    setMessage(null);
    setShowPassword(false);
  };

  const validateForm = () => {
    const errors: FieldErrors = {};
    const email = form.email.trim();
    const password = form.password.trim();

    if (mode === "register" && !form.name.trim()) {
      errors.name = "Nama lengkap wajib diisi.";
    }
    if (!email) {
      errors.email = "Email wajib diisi.";
    } else if (!isValidEmail(email)) {
      errors.email = "Format email belum sesuai.";
    }
    if (!password) {
      errors.password = "Password wajib diisi.";
    } else if (mode === "register" && password.length < 8) {
      errors.password = "Password minimal 8 karakter.";
    }
    if (mode === "register" && !form.role) {
      errors.role = "Pilih role akun terlebih dahulu.";
    }
    if (mode === "register" && !form.cityId) {
      errors.cityId = "Pilih kota atau pos pelayanan.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const session = await SionDatabase.login(form.email.trim(), form.password);
        onAuthenticated(session);
        return;
      }

      await SionDatabase.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role as AuthRole,
        cityId: form.cityId,
        cityName: selectedCity?.name,
      });

      setForm({ ...initialForm, email: form.email.trim() });
      setMode("login");
      setMessage({ type: "success", text: "Akun berhasil dibuat dan menunggu persetujuan admin sebelum bisa masuk." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Proses autentikasi gagal. Coba periksa kembali datanya." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputShellClass = (hasError?: boolean) =>
    `flex min-h-12 items-center gap-2 rounded-2xl border bg-white px-3 transition-all focus-within:ring-4 ${
      hasError
        ? "border-red-300 focus-within:ring-red-100"
        : "border-slate-200 focus-within:border-red-300 focus-within:ring-red-50"
    }`;

  const errorText = (error?: string) => {
    if (!error) return null;
    return (
      <div className="mt-1.5 inline-flex items-start gap-1.5 rounded-xl border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:grid lg:grid-cols-[minmax(360px,0.72fr)_minmax(640px,1.28fr)]">
      <section className="relative hidden min-h-screen overflow-hidden border-r border-slate-200 bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[linear-gradient(145deg,#17090b_0%,#111827_54%,#0f172a_100%)]" />

        <div className="relative flex items-center gap-3">
          <SionLogo className="h-12 w-12" />
          <div>
            <p className="text-sm font-bold tracking-wide">SION MINISTRY</p>
            <p className="text-xs text-slate-400">Aplikasi pelayanan dan pemuridan</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            Akses berbasis role
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-white">
            Ruang kerja pelayanan yang rapi, aman, dan mudah dipakai.
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Setiap akun masuk sesuai tanggung jawabnya, sehingga admin, pekerja, dan jemaat melihat fitur yang relevan tanpa mengganggu alur pelayanan harian.
          </p>
        </div>

        <div className="relative grid gap-3">
          {roleOptions.map((item) => (
            <div key={item.role} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <p className="text-sm font-bold text-white">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <main className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-10">
        <div className="w-full max-w-4xl">
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-3">
              <SionLogo className="h-10 w-10" />
              <div>
                <p className="text-sm font-bold">SION MINISTRY</p>
                <p className="text-xs text-slate-500">Aplikasi pelayanan</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/8">
            <div className="grid md:grid-cols-[0.82fr_1.18fr]">
              <aside className="border-b border-slate-100 bg-slate-50 p-6 md:border-b-0 md:border-r md:p-8">
                <div className="flex rounded-2xl bg-white p-1 text-xs font-bold shadow-sm ring-1 ring-slate-200">
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className={`flex-1 rounded-xl py-2.5 transition-all ${mode === "login" ? "bg-red-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className={`flex-1 rounded-xl py-2.5 transition-all ${mode === "register" ? "bg-red-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Daftar
                  </button>
                </div>

                <div className="mt-7">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                    {mode === "login" ? "Selamat datang kembali" : "Buat akun baru"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {mode === "login"
                      ? "Masuk menggunakan akun yang sudah disetujui admin Sion Ministry."
                      : "Isi data akun dengan lengkap. Admin akan memeriksa dan menyetujui akun sebelum bisa digunakan."}
                  </p>
                </div>

                <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Status akses</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    {mode === "login"
                      ? "Jika belum bisa masuk, pastikan akun sudah aktif atau hubungi admin pelayanan."
                      : "Role dan pos pelayanan membantu sistem menampilkan menu yang sesuai."}
                  </p>
                </div>
              </aside>

              <section className="p-6 sm:p-8">
                <form noValidate onSubmit={handleSubmit} className="space-y-5">
                  {mode === "register" && (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Nama Lengkap</span>
                        <div className={inputShellClass(Boolean(fieldErrors.name))}>
                          <User className="h-4 w-4 text-slate-400" />
                          <input
                            value={form.name}
                            onChange={(e) => updateField("name", e.target.value)}
                            placeholder="Masukkan nama lengkap"
                            className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                          />
                        </div>
                        {errorText(fieldErrors.name)}
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Kota / Pos Pelayanan</span>
                        <div className={inputShellClass(Boolean(fieldErrors.cityId))}>
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <select
                            value={form.cityId}
                            onChange={(e) => updateField("cityId", e.target.value)}
                            className="w-full bg-transparent text-sm font-semibold outline-none"
                          >
                            <option value="">Pilih kota atau pos pelayanan</option>
                            {cities.map((city) => (
                              <option key={city.id} value={city.id}>{city.name}</option>
                            ))}
                          </select>
                        </div>
                        {errorText(fieldErrors.cityId)}
                      </label>
                    </div>
                  )}

                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Email</span>
                      <div className={inputShellClass(Boolean(fieldErrors.email))}>
                        <Mail className="h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          placeholder="Masukkan alamat email"
                          className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                        />
                      </div>
                      {errorText(fieldErrors.email)}
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Password</span>
                      <div className={inputShellClass(Boolean(fieldErrors.password))}>
                        <LockKeyhole className="h-4 w-4 text-slate-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => updateField("password", e.target.value)}
                          placeholder={mode === "login" ? "Masukkan password" : "Buat password minimal 8 karakter"}
                          className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="rounded-lg p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                          aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errorText(fieldErrors.password)}
                    </label>
                  </div>

                  {mode === "register" && (
                    <div>
                      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Role Akun</span>
                      <div className="grid gap-3 lg:grid-cols-3">
                        {roleOptions.map((item) => (
                          <button
                            key={item.role}
                            type="button"
                            onClick={() => updateField("role", item.role)}
                            className={`min-h-24 rounded-2xl border p-4 text-left transition-all ${
                              form.role === item.role
                                ? "border-red-300 bg-red-50 ring-4 ring-red-50"
                                : fieldErrors.role
                                ? "border-red-200 bg-white hover:bg-slate-50"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <span className="flex items-center justify-between text-sm font-bold">
                              {item.label}
                              {form.role === item.role && <CheckCircle2 className="h-4 w-4 text-red-600" />}
                            </span>
                            <span className="mt-1.5 block text-xs leading-5 text-slate-500">{item.description}</span>
                          </button>
                        ))}
                      </div>
                      {errorText(fieldErrors.role)}
                    </div>
                  )}

                  {message && (
                    <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                      message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
                    }`}>
                      {message.text}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-slate-500">
                      {mode === "login"
                        ? "Data akun dijaga melalui session aplikasi."
                        : "Akun baru masuk daftar approval admin terlebih dahulu."}
                    </p>
                    <button
                      disabled={isSubmitting}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-500 disabled:cursor-wait disabled:bg-slate-300"
                    >
                      {mode === "login" ? "Masuk ke Dashboard" : "Daftar Akun"}
                      {mode === "login" ? <ArrowRight className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
