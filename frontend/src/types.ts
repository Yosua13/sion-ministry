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

export type AuthRole = "admin" | "pekerja" | "jemaat";

export type AuthStatus = "active" | "pending" | "disabled";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  status: AuthStatus;
  cityId?: string;
  cityName?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: string;
}

export type ScopedRole = AuthRole | "mentor" | "content_publisher" | "auditor" | "donation_verifier";
export type ScopeType = "organization" | "ministry_unit" | "region" | "city" | "self";

export interface RoleAssignment {
  id: string;
  userId: string;
  role: ScopedRole;
  scopeType: ScopeType;
  scopeId: string;
  status: "pending" | "active" | "revoked" | "expired";
  validFrom: string;
  validUntil?: string;
  approvedBy?: string;
  approvedAt?: string;
  revokedAt?: string;
  createdAt: string;
}

export interface AccessContext {
  userId: string;
  permissions: string[];
  roles: ScopedRole[];
  cityIds: string[];
  allCities: boolean;
  assignments: RoleAssignment[];
}

export interface ScopeOption {
  id: string;
  name: string;
}

export interface ScopeCatalog {
  organizations: ScopeOption[];
  ministryUnits: Array<ScopeOption & { organizationId: string }>;
  regions: Array<ScopeOption & { ministryUnitId: string }>;
  cities: City[];
}

export interface DeviceSession {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  deviceName: string;
  userAgent: string;
  ipAddress: string;
  lastSeenAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  scopeType?: string;
  scopeId?: string;
  outcome: "success" | "denied" | "failure";
  requestId?: string;
  ipAddress?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
  phone: string;
  discipleshipStage: "Pekerja" | "Jemaat";
  mentorName: string;
  joinedDate: string;
  status: "active" | "inactive";
  userId?: string;
  mentorUserId?: string;
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
  organizationId?: string;
  ministryUnitId?: string;
  regionId?: string;
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
  isPublic?: boolean;
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
  menteeId?: string;
  mentorUserId?: string;
}

export interface DonationCampaign {
  id: string;
  title: string;
  category: string;
  targetAmount: number;
  collectedAmount: number;
  description: string;
  bannerUrl: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
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
  cityId?: string;
  userId?: string;
  status?: "pending" | "verified" | "rejected";
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface AttendanceCheckIn {
  id: string;
  eventId: string;
  memberId: string;
  cityId: string;
  checkedInBy: string;
  checkedInAt: string;
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
  cityId?: string;
  userId?: string;
}
