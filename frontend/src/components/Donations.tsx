import React, { useState, useMemo } from "react";
import { 
  HeartHandshake, 
  Coins, 
  Plus, 
  Calendar, 
  Users, 
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Heart,
  QrCode,
  DollarSign
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
  // Active Campaign for donating
  const [selectedCampaign, setSelectedCampaign] = useState<DonationCampaign | null>(null);
  
  // New Campaign Modal state
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);

  // Donation Form state
  const [donorName, setDonorName] = useState("");
  const [donationAmount, setDonationAmount] = useState<number>(100000);
  const [donorMessage, setDonorMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("QRIS (Gopay/OVO/Dana)");
  const [showThankYou, setShowThankYou] = useState(false);

  // New Campaign Form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTarget, setNewTarget] = useState<number>(10000000);
  const [newCategory, setNewCategory] = useState<DonationCampaign["category"]>("Beasiswa Pendidikan");
  const [newBanner, setNewBanner] = useState(CAMPAIGN_PRESET_BANNERS[0]);

  // Validation and alert states
  const [donateErrors, setDonateErrors] = useState<Record<string, string>>({});
  const [campaignErrors, setCampaignErrors] = useState<Record<string, string>>({});
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleOpenDonateModal = (campaign: DonationCampaign) => {
    setSelectedCampaign(campaign);
    setDonorName("");
    setDonationAmount(100000);
    setDonorMessage("");
    setPaymentMethod("QRIS (Gopay/OVO/Dana)");
    setShowThankYou(false);
    setDonateErrors({});
  };

  const handleSelectPresetAmount = (amount: number) => {
    setDonationAmount(amount);
  };

  const handleDonateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    if (!donationAmount || donationAmount <= 0) {
      errors.amount = "Jumlah donasi harus lebih besar dari 0";
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
      donorName: donorName || "Hamba Allah (Anonim)",
      amount: Number(donationAmount),
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
    setNewTarget(10000000);
    setNewCategory("Beasiswa Pendidikan");
    setNewBanner(CAMPAIGN_PRESET_BANNERS[0]);
    setCampaignErrors({});
    setIsNewCampaignModalOpen(true);
  };

  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    if (!newTitle.trim()) errors.title = "Judul kampanye wajib diisi";
    if (!newDescription.trim()) errors.description = "Deskripsi kampanye wajib diisi";
    if (!newTarget || newTarget <= 0) errors.target = "Target donasi harus lebih besar dari 0";

    if (Object.keys(errors).length > 0) {
      setCampaignErrors(errors);
      return;
    }

    setCampaignErrors({});

    onAddCampaign({
      title: newTitle,
      description: newDescription,
      targetAmount: Number(newTarget),
      collectedAmount: 0,
      category: newCategory,
      bannerUrl: newBanner,
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {campaigns.map((campaign) => {
            const percentage = Math.min(Math.round((campaign.collectedAmount / campaign.targetAmount) * 100), 100);
            
            return (
              <div key={campaign.id} className="bg-white rounded-3xl border border-slate-100 material-shadow-2 overflow-hidden flex flex-col justify-between hover:border-indigo-100 transition-all">
                
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

                  {/* Action row */}
                  <button
                    onClick={() => handleOpenDonateModal(campaign)}
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

      {/* Donation Action Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden material-shadow-3 animate-in fade-in zoom-in duration-200">
            
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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Donatur (Isi kosong untuk Anonim)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Roy Handoko, Shanti..."
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                {/* Amount Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jumlah Donasi (Rupiah)</label>
                  <input
                    type="number"
                    min="10000"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-600 bg-white ${
                      donateErrors.amount ? "border-red-400 focus:ring-red-500" : "border-slate-200"
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
                          donationAmount === preset 
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
                  >
                    <option value="QRIS (Gopay/OVO/Dana)">QRIS (Gopay / OVO / Dana / LinkAja)</option>
                    <option value="Transfer Bank BCA">Transfer Bank BCA - Mandiri Sion</option>
                    <option value="Transfer Bank Mandiri">Transfer Bank Mandiri - Sion Care</option>
                    <option value="Virtual Account">Virtual Account Bersama</option>
                  </select>
                </div>

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
                    Terima kasih atas kemurahan hati Anda, <span className="font-bold text-slate-800">{donorName || "Hamba Allah"}</span>. Donasi sebesar <span className="font-bold text-indigo-600">{formatRupiah(donationAmount)}</span> siap disalurkan.
                  </p>
                </div>

                {/* Simulation QR Code for payment */}
                {paymentMethod.includes("QRIS") && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 flex flex-col items-center">
                    <QrCode className="h-28 w-28 text-slate-800 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">PINDAI QRIS SION MINISTRY</span>
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

            <form onSubmit={handleCreateCampaignSubmit} className="p-6 space-y-4">
              
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
                  >
                    <option value="Bencana Alam">Bencana Alam</option>
                    <option value="Pembangunan Gereja">Pembangunan Gereja</option>
                    <option value="Beasiswa Pendidikan">Beasiswa Pendidikan</option>
                    <option value="Kesehatan Pekerja">Kesehatan Pekerja</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Dana (Rupiah)</label>
                  <input
                    type="number"
                    min="1000000"
                    value={newTarget}
                    onChange={(e) => setNewTarget(Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 ${
                      campaignErrors.target ? "border-red-400 focus:ring-red-500" : "border-slate-200"
                    }`}
                  />
                  {campaignErrors.target && (
                    <span className="text-red-500 text-[10px] mt-1 block font-semibold">{campaignErrors.target}</span>
                  )}
                </div>
              </div>

              {/* Banner image selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pilih Tema Banner</label>
                <div className="grid grid-cols-4 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                  {CAMPAIGN_PRESET_BANNERS.map((url, idx) => {
                    const isSelected = newBanner === url;
                    return (
                      <div 
                        key={idx}
                        onClick={() => setNewBanner(url)}
                        className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          isSelected ? "border-indigo-600 scale-105 shadow" : "border-transparent opacity-60"
                        }`}
                      >
                        <img src={url} alt={`BannerPreset ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    );
                  })}
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
    </div>
  );
}
