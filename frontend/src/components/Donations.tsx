import React, { useState, useMemo } from "react";
import { 
  HeartHandshake, 
  Coins, 
  Plus, 
  Calendar, 
  Users, 
  X,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Heart,
  QrCode,
  DollarSign,
  Building2,
  CreditCard
} from "lucide-react";
import { DonationCampaign, DonationRecord } from "../types";

interface DonationsProps {
  campaigns: DonationCampaign[];
  donationRecords: DonationRecord[];
  onAddDonationRecord: (record: Omit<DonationRecord, "id" | "date">) => void;
  onAddCampaign: (campaign: Omit<DonationCampaign, "id">) => void;
}

// Preset banners for donation campaigns
const CAMPAIGN_PRESET_BANNERS = [
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=80", // helping children
  "https://images.unsplash.com/photo-1469571486040-afb503437397?w=800&auto=format&fit=crop&q=80", // humanitarian
  "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&auto=format&fit=crop&q=80", // relief
  "https://images.unsplash.com/photo-1497561813398-8fcc7a37b585?w=800&auto=format&fit=crop&q=80"  // education/classroom
];

export default function DonationsComponent({
  campaigns,
  donationRecords,
  onAddDonationRecord,
  onAddCampaign
}: DonationsProps) {
  const [campaignSearchTerm, setCampaignSearchTerm] = useState("");
  const [selectedCampaignCategory, setSelectedCampaignCategory] = useState<string>("All");

  // Active Campaign for donating
  const [selectedCampaign, setSelectedCampaign] = useState<DonationCampaign | null>(null);
  const [detailCampaign, setDetailCampaign] = useState<DonationCampaign | null>(null);
  
  // New Campaign Modal state
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);

  // Donation Form state
  const [donorName, setDonorName] = useState("");
  const [donationAmount, setDonationAmount] = useState<string>("");
  const [donorMessage, setDonorMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showThankYou, setShowThankYou] = useState(false);

  // New Campaign Form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTarget, setNewTarget] = useState<string>("");
  const [newCategory, setNewCategory] = useState<DonationCampaign["category"]>("" as any);
  const [newBanner, setNewBanner] = useState("");
  const [newBankName, setNewBankName] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newAccountName, setNewAccountName] = useState("");

  // Validation and alert states
  const [donateErrors, setDonateErrors] = useState<Record<string, string>>({});
  const [campaignErrors, setCampaignErrors] = useState<Record<string, string>>({});
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Helper to format string with thousand separators (e.g. 1000000 -> 1.000.000)
  const formatNumberWithDot = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (!digits) return "";
    return new Intl.NumberFormat("id-ID").format(Number(digits));
  };

  // Helper to parse the formatted string back to number
  const parseDotNumber = (val: string) => {
    const digits = val.replace(/\D/g, "");
    return digits ? Number(digits) : 0;
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const campaignCategories = useMemo(() => {
    return Array.from(new Set(campaigns.map((campaign) => campaign.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, "id-ID"));
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    const keyword = campaignSearchTerm.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesSearch =
        !keyword ||
        campaign.title.toLowerCase().includes(keyword) ||
        campaign.description.toLowerCase().includes(keyword) ||
        campaign.category.toLowerCase().includes(keyword) ||
        (campaign.bankName || "").toLowerCase().includes(keyword);

      const matchesCategory = selectedCampaignCategory === "All" || campaign.category === selectedCampaignCategory;

      return matchesSearch && matchesCategory;
    });
  }, [campaigns, campaignSearchTerm, selectedCampaignCategory]);

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewBanner(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenDonateModal = (campaign: DonationCampaign) => {
    setSelectedCampaign(campaign);
    setDonorName("");
    setDonationAmount("");
    setDonorMessage("");
    setPaymentMethod("");
    setShowThankYou(false);
    setDonateErrors({});
  };

  const handleSelectPresetAmount = (amount: number) => {
    setDonationAmount(new Intl.NumberFormat("id-ID").format(amount));
  };

  const handleDonateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericAmount = parseDotNumber(donationAmount);
    const errors: Record<string, string> = {};
    if (!donorName.trim()) errors.donorName = "Nama donatur wajib diisi";
    if (!donationAmount || numericAmount <= 0) {
      errors.amount = "Jumlah donasi wajib diisi dan lebih dari 0";
    }
    if (!paymentMethod) {
      errors.paymentMethod = "Metode pembayaran wajib dipilih";
    }

    if (Object.keys(errors).length > 0) {
      setDonateErrors(errors);
      return;
    }

    setDonateErrors({});

    if (!selectedCampaign) return;

    onAddDonationRecord({
      campaignId: selectedCampaign.id,
      campaignTitle: selectedCampaign.title,
      donorName: donorName,
      amount: numericAmount,
      message: donorMessage || "Kiranya menjadi berkat bagi pelayanan Sion.",
      paymentMethod: paymentMethod
    });

    setShowThankYou(true);
  };

  const handleCloseDonateModal = () => {
    setSelectedCampaign(null);
    setShowThankYou(false);
    setDonateErrors({});
  };

  const handleOpenNewCampaignModal = () => {
    setNewTitle("");
    setNewDescription("");
    setNewTarget("");
    setNewCategory("" as any);
    setNewBanner("");
    setNewBankName("");
    setNewAccountNumber("");
    setNewAccountName("");
    setCampaignErrors({});
    setIsNewCampaignModalOpen(true);
  };

  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericTarget = parseDotNumber(newTarget);
    const errors: Record<string, string> = {};
    if (!newTitle.trim()) errors.title = "Nama penggalangan/judul wajib diisi";
    if (!newCategory) errors.category = "Kategori wajib dipilih";
    if (!newTarget || numericTarget < 1000000) errors.target = "Target donasi wajib diisi (minimal Rp 1.000.000)";
    if (!newDescription.trim()) errors.description = "Deskripsi kampanye wajib diisi";
    if (!newBanner) errors.banner = "Banner dokumentasi kampanye wajib diunggah";
    if (!newBankName.trim()) errors.bankName = "Nama bank wajib diisi";
    if (!newAccountNumber.trim()) errors.accountNumber = "Nomor rekening wajib diisi";
    if (!newAccountName.trim()) errors.accountName = "Nama pemilik rekening wajib diisi";

    if (Object.keys(errors).length > 0) {
      setCampaignErrors(errors);
      return;
    }

    setCampaignErrors({});

    onAddCampaign({
      title: newTitle,
      description: newDescription,
      targetAmount: numericTarget,
      collectedAmount: 0,
      category: newCategory,
      bannerUrl: newBanner,
      bankName: newBankName,
      accountNumber: newAccountNumber,
      accountName: newAccountName,
      donorsCount: 0,
      daysRemaining: 45
    });

    setIsNewCampaignModalOpen(false);

    // Show centered success alert
    setShowSuccessAlert(true);
    setTimeout(() => {
      setShowSuccessAlert(false);
    }, 2000);
  };

  // Filter donation records for feed
  const recentDonations = useMemo(() => {
    return donationRecords.slice(0, 6);
  }, [donationRecords]);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Premium Header */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 material-shadow-2 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
            <Coins className="h-3.5 w-3.5" />
            <span>Sion Care & Philanthropy</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Salurkan Berkat & Kasih</h2>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            Membantu sesama jemaat, keluarga pelayanan, dan para pekerja Sion Ministry yang terkena bencana alam, membutuhkan dukungan biaya perawatan, atau dana beasiswa pendidikan anak pedalaman.
          </p>
        </div>
        
        <button
          onClick={handleOpenNewCampaignModal}
          className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md self-start md:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Penggalangan Dana</span>
        </button>
      </div>

      {/* Grid of Active Campaigns */}
      <div className="space-y-4">
        <h3 className="text-base font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <HeartHandshake className="h-5 w-5 text-indigo-600 animate-pulse" />
          <span>Program Penggalangan Dana Aktif</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_240px] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul, kategori, deskripsi, atau bank..."
              value={campaignSearchTerm}
              onChange={(e) => setCampaignSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedCampaignCategory}
              onChange={(e) => setSelectedCampaignCategory(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700"
            >
              <option value="All">Semua Kategori</option>
              {campaignCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredCampaigns.length === 0 ? (
            <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 p-10 text-center material-shadow-1">
              <HeartHandshake className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">Program donasi tidak ditemukan.</p>
              <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci lain atau pilih kategori berbeda.</p>
            </div>
          ) : filteredCampaigns.map((campaign) => {
            const percentage = Math.min(Math.round((campaign.collectedAmount / campaign.targetAmount) * 100), 100);
            
            return (
              <div
                key={campaign.id}
                onClick={() => setDetailCampaign(campaign)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setDetailCampaign(campaign);
                }}
                role="button"
                tabIndex={0}
                className="bg-white rounded-3xl border border-slate-100 material-shadow-2 overflow-hidden flex flex-col justify-between hover:border-indigo-100 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                
                {/* Banner & Badge */}
                <div className="relative aspect-video w-full bg-slate-50">
                  <img
                    src={campaign.bannerUrl}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[9px] font-extrabold uppercase px-3 py-1 rounded-full">
                    {campaign.category}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="font-display font-bold text-base text-slate-900 leading-snug">{campaign.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{campaign.description}</p>
                  </div>

                  {/* Progress Tracker */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-end justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Terkumpul</span>
                        <span className="font-bold text-indigo-600 text-sm">{formatRupiah(campaign.collectedAmount)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Target</span>
                        <span className="font-semibold text-slate-700 text-sm">{formatRupiah(campaign.targetAmount)}</span>
                      </div>
                    </div>

                    {/* Progress Bar container */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${percentage}%` }}
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      />
                    </div>

                    {/* Stats metrics */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-1">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>{campaign.donorsCount} Donatur</span>
                      </span>
                      <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {campaign.daysRemaining} hari tersisa
                      </span>
                    </div>
                  </div>

                  {(campaign.bankName || campaign.accountNumber || campaign.accountName) && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-indigo-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-[9px] font-bold uppercase text-slate-400">Rekening Transfer</span>
                        <span className="block text-[11px] font-bold text-slate-700 truncate">
                          {campaign.bankName || "Bank"} {campaign.accountNumber || "-"} a.n. {campaign.accountName || "Sion Ministry"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action row */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDonateModal(campaign);
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center space-x-2 mt-4 cursor-pointer"
                  >
                    <Heart className="h-4 w-4 fill-white" />
                    <span>Donasi Sekarang</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Donation Feed and Testimonials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Donor Feed (2 Columns) */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 material-shadow-2 lg:col-span-2 space-y-4">
          <h3 className="text-sm font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Coins className="h-4.5 w-4.5 text-indigo-600" />
            <span>Donasi & Doa Dukungan Terbaru</span>
          </h3>

          <div className="space-y-3.5">
            {recentDonations.map((rec) => (
              <div key={rec.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/60 flex items-start gap-3 transition-all hover:bg-slate-50">
                <div className="h-10 w-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 font-bold font-mono">
                  {rec.donorName.substring(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 block truncate">{rec.donorName}</span>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded shrink-0">
                      +{formatRupiah(rec.amount)}
                    </span>
                  </div>
                  <p className="text-[10px] text-indigo-600 font-semibold truncate leading-none">Ke: {rec.campaignTitle}</p>
                  <p className="text-[11px] text-slate-600 italic leading-relaxed font-medium">"{rec.message}"</p>
                  <span className="text-[9px] text-slate-400 font-mono block pt-1">{rec.date} • Melalui {rec.paymentMethod}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Generosity Card (1 Column) */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl text-white p-6 material-shadow-3 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="p-3 bg-white/10 rounded-2xl w-fit">
              <ShieldCheck className="h-6 w-6 text-indigo-400" />
            </div>
            <h4 className="font-display font-bold text-base leading-snug">Pemberian yang Tulus & Aman</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              "Hendaklah masing-masing memberikan menurut kerelaan hatinya, jangan dengan sedih hati atau karena paksaan, sebab Allah mengasihi orang yang memberi dengan sukacita." <br />
              <strong className="text-indigo-400 mt-1 block">— 2 Korintus 9:7</strong>
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" />
              <span className="text-slate-300">100% dana disalurkan langsung</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" />
              <span className="text-slate-300">Laporan pertanggungjawaban berkala</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" />
              <span className="text-slate-300">Tersinkronisasi otomatis secara offline</span>
            </div>
          </div>
        </div>

      </div>

      {detailCampaign && (() => {
        const percentage = Math.min(Math.round((detailCampaign.collectedAmount / detailCampaign.targetAmount) * 100), 100);
        const campaignDonations = donationRecords
          .filter((record) => record.campaignId === detailCampaign.id)
          .slice(0, 5);

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5" onClick={() => setDetailCampaign(null)}>
            <div className="relative bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden material-shadow-3 grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_420px] animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setDetailCampaign(null)}
                className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-slate-950/70 text-white hover:bg-slate-950 flex items-center justify-center transition-all"
                aria-label="Tutup detail donasi"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative min-h-[320px] lg:min-h-[82vh] bg-slate-950 flex items-center justify-center">
                <img
                  src={detailCampaign.bannerUrl}
                  alt={detailCampaign.title}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent p-6 text-white">
                  <span className="inline-flex bg-indigo-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
                    {detailCampaign.category}
                  </span>
                  <h3 className="mt-3 max-w-2xl font-display font-bold text-xl leading-tight">{detailCampaign.title}</h3>
                </div>
              </div>

              <div className="flex min-h-0 flex-col bg-white">
                <div className="p-5 border-b border-slate-100 flex items-start gap-3 pr-14">
                  <div className="h-11 w-11 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-base text-slate-950 leading-snug">{detailCampaign.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-semibold">
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{detailCampaign.donorsCount} donatur</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{detailCampaign.daysRemaining} hari tersisa</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-5 overflow-y-auto">
                  <div className="space-y-3">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Terkumpul</span>
                        <span className="font-bold text-indigo-600 text-base">{formatRupiah(detailCampaign.collectedAmount)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Target</span>
                        <span className="font-semibold text-slate-700 text-sm">{formatRupiah(detailCampaign.targetAmount)}</span>
                      </div>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                      />
                    </div>
                    <span className="block text-[10px] font-bold text-slate-400">{percentage}% dari target sudah terkumpul</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Rincian Kampanye</span>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{detailCampaign.description}</p>
                  </div>

                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                    <div className="flex items-center gap-2 text-indigo-600">
                      <Building2 className="h-4 w-4" />
                      <span className="text-[10px] uppercase font-extrabold tracking-wider">Rekening Transfer Donasi</span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500 font-semibold">Bank</span>
                        <span className="font-bold text-slate-900">{detailCampaign.bankName || "Belum diisi"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500 font-semibold">Nomor Rekening</span>
                        <span className="font-mono font-bold text-slate-900">{detailCampaign.accountNumber || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500 font-semibold">Atas Nama</span>
                        <span className="font-bold text-slate-900 text-right">{detailCampaign.accountName || "Sion Ministry"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Dukungan Terbaru</span>
                      <Coins className="h-4 w-4 text-indigo-600" />
                    </div>
                    {campaignDonations.length === 0 ? (
                      <p className="text-xs text-slate-500 leading-relaxed">Belum ada donasi baru pada program ini. Jadilah pendukung pertama untuk kampanye ini.</p>
                    ) : (
                      <div className="space-y-2">
                        {campaignDonations.map((record) => (
                          <div key={record.id} className="flex items-start justify-between gap-3 rounded-xl bg-white border border-slate-100 p-3">
                            <div className="min-w-0">
                              <span className="block text-xs font-bold text-slate-800 truncate">{record.donorName}</span>
                              <span className="block text-[10px] text-slate-400">{record.date} melalui {record.paymentMethod}</span>
                            </div>
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 shrink-0">
                              {formatRupiah(record.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleOpenDonateModal(detailCampaign);
                      setDetailCampaign(null);
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center space-x-2"
                  >
                    <Heart className="h-4 w-4 fill-white" />
                    <span>Donasi Sekarang</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Donation Action Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden material-shadow-3 max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div className="flex items-center space-x-2">
                <HeartHandshake className="h-5 w-5 text-indigo-400" />
                <h3 className="font-display font-bold text-sm">Donasi untuk Kasih</h3>
              </div>
              <button 
                onClick={handleCloseDonateModal}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!showThankYou ? (
              <form onSubmit={handleDonateSubmit} className="p-6 space-y-4">
                
                {/* Target info */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Program Tujuan</span>
                  <span className="text-xs font-bold text-slate-800 block leading-tight">{selectedCampaign.title}</span>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Donatur</label>
                  <input
                    type="text"
                    placeholder="Contoh: Roy Handoko, Shanti..."
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                      donateErrors.donorName ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                    }`}
                  />
                  {donateErrors.donorName && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{donateErrors.donorName}</span>
                  )}
                </div>

                {/* Amount Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jumlah Donasi (Rupiah)</label>
                  <input
                    type="text"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(formatNumberWithDot(e.target.value))}
                    placeholder="Contoh: 100.000"
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-600 bg-white ${
                      donateErrors.amount ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                    }`}
                  />
                  {donateErrors.amount && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{donateErrors.amount}</span>
                  )}

                  {/* Preset Quick selections */}
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[50000, 100000, 250000, 500000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleSelectPresetAmount(preset)}
                        className={`py-1.5 border rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                          parseDotNumber(donationAmount) === preset
                            ? "bg-indigo-50 text-indigo-600 border-indigo-600" 
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {formatRupiah(preset).replace(",00", "")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Metode Pembayaran</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800 ${
                      donateErrors.paymentMethod ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                    }`}
                  >
                    <option value="">-- Pilih Metode Pembayaran --</option>
                    <option value="QRIS (Gopay/OVO/Dana)">QRIS (Gopay / OVO / Dana / LinkAja)</option>
                    <option value={`Transfer Bank ${selectedCampaign.bankName || "Sion"}`}>Transfer Bank {selectedCampaign.bankName || "Sion"}</option>
                    <option value="Virtual Account">Virtual Account Bersama</option>
                  </select>
                  {donateErrors.paymentMethod && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{donateErrors.paymentMethod}</span>
                  )}
                </div>

                {paymentMethod.startsWith("Transfer Bank") && (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3 flex items-start gap-3">
                    <CreditCard className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div className="min-w-0 text-xs">
                      <span className="block text-[9px] uppercase tracking-wider font-bold text-indigo-600">Tujuan Transfer</span>
                      <span className="block mt-1 font-bold text-slate-900">{selectedCampaign.bankName || "Bank Sion"}</span>
                      <span className="block font-mono font-bold text-slate-800">{selectedCampaign.accountNumber || "-"}</span>
                      <span className="block text-slate-500">a.n. {selectedCampaign.accountName || "Sion Ministry"}</span>
                    </div>
                  </div>
                )}

                {/* Prayer / Support message */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Doa & Pesan Dukungan Anda</label>
                  <textarea
                    rows={2}
                    placeholder="Semoga lekas pulih, Tuhan Yesus memberkati jemaat Sion..."
                    value={donorMessage}
                    onChange={(e) => setDonorMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Coins className="h-4 w-4" />
                  <span>Proses Dukungan Kasih</span>
                </button>

              </form>
            ) : (
              /* Thank you view with QRIS barcode simulation */
              <div className="p-8 text-center space-y-6 flex flex-col items-center">
                <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                  <Heart className="h-7 w-7 fill-emerald-600" />
                </div>

                <div className="space-y-2">
                  <h4 className="font-display font-bold text-base text-slate-900">Donasi Terdaftar!</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Terima kasih atas kemurahan hati Anda, <span className="font-bold text-slate-800">{donorName || "Hamba Allah"}</span>. Donasi sebesar <span className="font-bold text-indigo-600">{formatRupiah(parseDotNumber(donationAmount))}</span> siap disalurkan.
                  </p>
                </div>

                {/* Simulation QR Code for payment */}
                {paymentMethod.includes("QRIS") && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 flex flex-col items-center">
                    <QrCode className="h-28 w-28 text-slate-800 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">PINDAI QRIS SION MINISTRY</span>
                  </div>
                )}

                {paymentMethod.startsWith("Transfer Bank") && (
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-left w-full">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">Instruksi Transfer</span>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">Bank</span>
                        <span className="font-bold text-slate-900">{selectedCampaign.bankName || "Bank Sion"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">No. Rekening</span>
                        <span className="font-mono font-bold text-slate-900">{selectedCampaign.accountNumber || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">Atas Nama</span>
                        <span className="font-bold text-slate-900 text-right">{selectedCampaign.accountName || "Sion Ministry"}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-slate-400 italic">
                  "Sebab jika kamu rela memberi, pemberianmu akan diterima, berdasarkan apa yang ada padamu..." <br />
                  <span className="font-semibold text-slate-500">— 2 Korintus 8:12</span>
                </div>

                <button
                  type="button"
                  onClick={handleCloseDonateModal}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      {isNewCampaignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden material-shadow-3 animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-indigo-400" />
                <h3 className="font-display font-bold text-sm">Buat Penggalangan Dana Baru</h3>
              </div>
              <button 
                onClick={() => setIsNewCampaignModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaignSubmit} className="p-6 space-y-4 overflow-y-auto">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Penggalangan Dana / Judul</label>
                <input
                  type="text"
                  placeholder="Contoh: Bantuan Sembako Banjir Pos Luwu, Beasiswa Siswa Terpencil..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                    campaignErrors.title ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                  }`}
                />
                {campaignErrors.title && (
                  <span className="text-red-500 text-[10px] mt-1 block font-semibold">{campaignErrors.title}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kategori Penggalangan</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as DonationCampaign["category"])}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800 ${
                      campaignErrors.category ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                    }`}
                  >
                    <option value="">-- Pilih Kategori --</option>
                    <option value="Bencana Alam">Bencana Alam</option>
                    <option value="Pembangunan Gereja">Pembangunan Gereja</option>
                    <option value="Beasiswa Pendidikan">Beasiswa Pendidikan</option>
                    <option value="Kesehatan Pekerja">Kesehatan Pekerja</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  {campaignErrors.category && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{campaignErrors.category}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Dana (Rupiah)</label>
                  <input
                    type="text"
                    value={newTarget}
                    onChange={(e) => setNewTarget(formatNumberWithDot(e.target.value))}
                    placeholder="Contoh: 150.000.000"
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                      campaignErrors.target ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                    }`}
                  />
                  {campaignErrors.target && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{campaignErrors.target}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bank</label>
                  <input
                    type="text"
                    placeholder="Contoh: BCA, Mandiri"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                      campaignErrors.bankName ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                    }`}
                  />
                  {campaignErrors.bankName && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{campaignErrors.bankName}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    placeholder="Contoh: 1234567890"
                    value={newAccountNumber}
                    onChange={(e) => setNewAccountNumber(e.target.value.replace(/[^\d -]/g, ""))}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                      campaignErrors.accountNumber ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                    }`}
                  />
                  {campaignErrors.accountNumber && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{campaignErrors.accountNumber}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Rekening</label>
                  <input
                    type="text"
                    placeholder="Contoh: Yayasan Sion Care"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                      campaignErrors.accountName ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                    }`}
                  />
                  {campaignErrors.accountName && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{campaignErrors.accountName}</span>
                  )}
                </div>
              </div>

              {/* Banner image selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Banner Penggalangan Dana</label>
                
                {/* Device Uploader */}
                <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <span className="text-[9px] text-slate-400 font-semibold block mb-1">Pilih berkas banner dari device Anda:</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleBannerFileChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"
                    />
                    {campaignErrors.banner && (
                      <span className="text-red-500 text-[10px] mt-1 block font-semibold">{campaignErrors.banner}</span>
                    )}
                  </div>
                  {newBanner && (
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 group">
                      <img 
                        src={newBanner} 
                        alt="Preview Banner" 
                        onClick={() => setZoomedImage(newBanner)}
                        className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-all" 
                      />
                      <button
                        type="button"
                        onClick={() => setNewBanner("")}
                        className="absolute inset-0 bg-black/50 text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-10"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Deskripsi & Rincian Penggunaan Dana</label>
                <textarea
                  rows={3}
                  placeholder="Rincikan mengenai kebutuhan dana, pos penyaluran, serta siapa saja yang akan menerima bantuan ini..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                    campaignErrors.description ? "border-red-400 focus:ring-red-500 bg-red-50/10" : "border-slate-200"
                  }`}
                />
                {campaignErrors.description && (
                  <span className="text-red-500 text-[10px] mt-1 block font-semibold">{campaignErrors.description}</span>
                )}
              </div>

              {/* Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Publikasikan Galang Dana
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {showSuccessAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col items-center max-w-xs w-full text-center material-shadow-3 animate-scale-up">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Coins className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-sm text-slate-900">Galang Dana Terbit</h3>
            <p className="text-xs text-slate-400 mt-1">Kampanye donasi baru berhasil dipublikasikan.</p>
          </div>
        </div>
      )}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setZoomedImage(null)}>
          <div className="relative max-w-3xl w-full max-h-[85vh] p-4 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 bg-slate-900/60 hover:bg-slate-900/80 text-white rounded-full p-2 transition-all cursor-pointer z-50"
            >
              <X className="h-6 w-6" />
            </button>
            <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-slate-800" />
          </div>
        </div>
      )}
    </div>
  );
}
