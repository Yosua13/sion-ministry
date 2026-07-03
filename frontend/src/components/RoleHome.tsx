import React from "react";
import { BookMarked, BookOpen, Briefcase, HeartHandshake, Link2, Newspaper, Sparkles, Users } from "lucide-react";
import { AuthUser, BeritaAcara, DiscipleshipModule, DonationCampaign, JurnalPA, Member } from "../types";

interface RoleHomeProps {
  currentUser: AuthUser;
  members: Member[];
  berita: BeritaAcara[];
  jurnalPa: JurnalPA[];
  campaigns: DonationCampaign[];
  modules: DiscipleshipModule[];
  onNavigateToTab: (tab: string) => void;
}

export default function RoleHome({
  currentUser,
  members,
  berita,
  jurnalPa,
  campaigns,
  modules,
  onNavigateToTab,
}: RoleHomeProps) {
  const isPekerja = currentUser.role === "pekerja";
  const completedModules = modules.filter((module) => module.isCompleted).length;
  const activeCampaigns = campaigns.filter((campaign) => campaign.daysRemaining > 0);
  const recentBerita = berita.slice(0, 3);
  const recentJurnal = jurnalPa.slice(0, 3);

  const quickActions = isPekerja
    ? [
        { label: "Data Jemaat", description: "Pantau dan kelola data jiwa pelayanan.", icon: Users, tab: "members" },
        { label: "Berita Acara", description: "Tulis atau cek laporan kegiatan terbaru.", icon: Newspaper, tab: "berita" },
        { label: "Jurnal PA", description: "Catat pendampingan murid dan pertumbuhan PA.", icon: BookMarked, tab: "jurnal_pa" },
        { label: "Sion AI", description: "Bantu susun draf pelayanan lebih cepat.", icon: Sparkles, tab: "ai" },
      ]
    : [
        { label: "Modul Belajar", description: "Lanjutkan materi pemuridan yang tersedia.", icon: BookOpen, tab: "modules" },
        { label: "Berita Acara", description: "Baca kabar pelayanan dan kegiatan Sion.", icon: Newspaper, tab: "berita" },
        { label: "Jurnal PA", description: "Lihat catatan pendampingan yang tersedia.", icon: BookMarked, tab: "jurnal_pa" },
        { label: "Donasi", description: "Lihat program dukungan kasih yang aktif.", icon: HeartHandshake, tab: "donasi" },
      ];

  const metrics = isPekerja
    ? [
        { label: "Jemaat Aktif", value: members.filter((member) => member.status === "active").length, suffix: "jiwa" },
        { label: "Berita Acara", value: berita.length, suffix: "laporan" },
        { label: "Jurnal PA", value: jurnalPa.length, suffix: "catatan" },
      ]
    : [
        { label: "Modul Selesai", value: completedModules, suffix: "modul" },
        { label: "Kabar Pelayanan", value: berita.length, suffix: "berita" },
        { label: "Program Donasi", value: activeCampaigns.length, suffix: "aktif" },
      ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold capitalize text-red-600">
              Beranda {currentUser.role}
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
              {isPekerja ? "Ruang kerja pelayanan harian" : "Ruang informasi dan pertumbuhan jemaat"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {isPekerja
                ? "Fokus pada data jemaat, laporan kegiatan, pendampingan PA, dan sumber pelayanan yang paling sering digunakan pekerja."
                : "Akses kabar pelayanan, jurnal PA, bahan belajar, donasi, dan tautan sumber tanpa fitur pengubahan data."}
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab(isPekerja ? "berita" : "modules")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-red-600/15 hover:bg-red-500"
          >
            {isPekerja ? <Newspaper className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
            {isPekerja ? "Buka Laporan" : "Lanjut Belajar"}
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{metric.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{metric.value}</p>
              <p className="text-xs font-semibold text-slate-500">{metric.suffix}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => onNavigateToTab(item.tab)}
              className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-red-100 hover:bg-red-50/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-red-600">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-950">{item.label}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
            </button>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-950">Berita Acara Terbaru</h3>
            <button onClick={() => onNavigateToTab("berita")} className="text-xs font-bold text-red-600">Lihat semua</button>
          </div>
          <div className="mt-4 space-y-3">
            {recentBerita.length === 0 ? (
              <p className="text-xs font-semibold text-slate-400">Belum ada berita acara.</p>
            ) : recentBerita.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-900">{item.title}</p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">Sion {item.cityName} · {item.date}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-950">{isPekerja ? "Jurnal PA Terbaru" : "Akses Cepat"}</h3>
            <button onClick={() => onNavigateToTab(isPekerja ? "jurnal_pa" : "links")} className="text-xs font-bold text-red-600">
              {isPekerja ? "Lihat jurnal" : "Buka tautan"}
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {isPekerja ? (
              recentJurnal.length === 0 ? (
                <p className="text-xs font-semibold text-slate-400">Belum ada jurnal PA.</p>
              ) : recentJurnal.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-bold text-slate-900">{item.theme}</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-500">{item.menteeName} · {item.scripture}</p>
                </div>
              ))
            ) : (
              [
                { label: "Tautan Sumber", icon: Link2, tab: "links" },
                { label: "Pekerjaan", icon: Briefcase, tab: "pekerjaan" },
                { label: "Sion AI", icon: Sparkles, tab: "ai" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => onNavigateToTab(item.tab)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left hover:bg-slate-100"
                  >
                    <Icon className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-bold text-slate-800">{item.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
