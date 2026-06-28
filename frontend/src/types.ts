export interface DiscipleshipModule {
  id: string;
  title: string;
  category: "Dasar Iman" | "Karakter Kristus" | "Amanat Agung" | "Kepemimpinan";
  scripture: string;
  description: string;
  outline: string[];
  content: string;
  readingTime: number; // in minutes
  isDownloaded: boolean;
  isCompleted?: boolean;
}

export interface Member {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
  phone: string;
  discipleshipStage: "Pra-Murid" | "Murid Baru" | "Murid Bertumbuh" | "Pembuat Murid";
  mentorName: string;
  joinedDate: string;
  status: "active" | "inactive";
}

export interface City {
  id: string;
  name: string;
  region: string;
  reachedDate: string;
  workersCount: number;
  membersCount: number;
  journalsCount: number;
  beritaCount?: number;
  jurnalPaCount?: number;
}

export interface BeritaAcara {
  id: string;
  cityId: string;
  cityName: string;
  title: string;
  date: string;
  workerName: string;
  activityType: "Sion Raya (SR)" | "Persekutuan Doa Sion (PDS)" | "Komsel" | "Misi Pedalaman" | "Doa Keliling" | "Lainnya";
  attendeesCount: number;
  description: string;
  images: string[]; // Supports multiple image paths (Instagram style)
  synced: boolean;
  action?: "create" | "update" | "delete" | null;
}

export interface JurnalPA {
  id: string;
  cityId: string;
  cityName: string;
  theme: string;
  scripture: string;
  focus: string;
  date: string;
  mentorName: string;
  menteeName: string;
  notes: string;
  image: string; // Documenting the bible study (single image upload)
  synced: boolean;
  action?: "create" | "update" | "delete" | null;
}

export interface DonationCampaign {
  id: string;
  title: string;
  category: string;
  targetAmount: number;
  collectedAmount: number;
  description: string;
  bannerUrl: string;
  donorsCount: number;
  daysRemaining: number;
}

export interface DonationRecord {
  id: string;
  campaignId: string;
  campaignTitle: string;
  donorName: string;
  amount: number;
  message: string;
  date: string;
  paymentMethod: string;
}

export interface DiscipleshipLink {
  id: string;
  title: string;
  url: string;
  description: string;
  category: "Bahan PA" | "Buku Panduan" | "Video Pengajaran" | "Formulir";
}

export interface SyncPendingChange {
  id: string;
  itemType: "member" | "berita" | "jurnal_pa" | "link";
  action: "create" | "update" | "delete";
  timestamp: string;
  data: any;
}

export interface SyncState {
  isOnline: boolean;
  lastSyncedAt: string;
  pendingChanges: SyncPendingChange[];
}

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  logoUrl?: string;
  location: string;
  salary: string;
  jobType: "Full-time" | "Part-time" | "Contract" | "Misi / Relawan" | "Remote" | "Internship";
  category: "Administrasi" | "Pendidikan" | "Media & Kreatif" | "Sosial & Misi" | "Teknologi" | "Layanan Umum";
  description: string;
  requirements: string[]; // List of required qualifications/requirements
  responsibilities: string[]; // List of responsibilities
  contactInfo: string;
  postedDate: string;
  status: "open" | "closed";
  applicantsCount: number;
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  applicantResume?: string; // Text or short description of bio
  appliedDate: string;
  notes?: string;
}
