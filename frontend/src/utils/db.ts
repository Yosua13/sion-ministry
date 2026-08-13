import { Member, MemberDuplicateCandidate, MemberHistoryResult, MemberListResult, BeritaAcara, JurnalPA, DonationCampaign, DonationRecord, City, DiscipleshipLink, DiscipleshipModule, SyncPendingChange, SyncState, JobOpportunity, JobApplication, AuthRole, AuthSession, AuthUser, AccessContext, RoleAssignment, ScopeCatalog, AuditLog, DeviceSession } from "../types";
import { initialCities, initialModules, initialMembers, initialBeritaAcara, initialJurnalPA, initialDonationCampaigns, initialLinks, initialJobs } from "../data/initialData";

const STORAGE_KEYS = {
  CITIES: "sion_cities",
  MODULES: "sion_modules",
  MEMBERS: "sion_members",
  BERITA: "sion_berita",
  JURNAL_PA: "sion_jurnal_pa",
  CAMPAIGNS: "sion_campaigns",
  DONATIONS: "sion_donations",
  LINKS: "sion_links",
  SYNC_STATE: "sion_sync_state",
  JOBS: "sion_jobs",
  APPLICATIONS: "sion_applications",
  AUTH_SESSION: "sion_auth_session",
};

export class SionDatabase {
  private static clearScopedOperationalData() {
    [STORAGE_KEYS.CITIES, STORAGE_KEYS.MEMBERS, STORAGE_KEYS.BERITA, STORAGE_KEYS.JURNAL_PA, STORAGE_KEYS.DONATIONS, STORAGE_KEYS.APPLICATIONS].forEach((key) => localStorage.setItem(key, "[]"));
  }

  private static async readApiError(response: Response): Promise<string> {
    try {
      const payload = await response.json();
      if (typeof payload?.error === "string") return payload.error;
      if (typeof payload?.error?.message === "string") return payload.error.message;
      return typeof payload?.message === "string" ? payload.message : "";
    } catch {
      return "";
    }
  }

  private static toUserFriendlyAuthError(message: string): string {
    const normalized = message.toLowerCase();
    if (normalized.includes("belum diverifikasi") || normalized.includes("belum aktif") || normalized.includes("pending")) {
      return "Akun ini belum diverifikasi oleh admin. Silakan tunggu persetujuan admin sebelum masuk.";
    }
    if (normalized.includes("dinonaktifkan") || normalized.includes("disabled")) {
      return "Akun ini sedang dinonaktifkan. Silakan hubungi admin pelayanan.";
    }
    if (normalized.includes("email") || normalized.includes("password")) {
      return "Email atau password belum sesuai.";
    }
    return message || "Login gagal. Silakan coba lagi atau hubungi admin.";
  }

  private static normalizeMemberStage(stage?: string): Member["discipleshipStage"] {
    if (stage === "Pekerja" || stage === "Pembuat Murid") return "Pekerja";
    return "Jemaat";
  }

  private static normalizeMembers(members: Member[]): Member[] {
    return members.map((member) => ({
      ...member,
      discipleshipStage: this.normalizeMemberStage(member.discipleshipStage)
    }));
  }

  // Initialize standard data if empty
  static init() {
    if (!localStorage.getItem(STORAGE_KEYS.CITIES)) {
      localStorage.setItem(STORAGE_KEYS.CITIES, JSON.stringify(initialCities));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MODULES)) {
      localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(initialModules));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(initialMembers));
    }
    const storedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (storedMembers) {
      try {
        const parsedMembers = JSON.parse(storedMembers) as Member[];
        const normalizedMembers = this.normalizeMembers(parsedMembers);
        const hasLegacyStage = parsedMembers.some((member, index) => member.discipleshipStage !== normalizedMembers[index].discipleshipStage);
        if (hasLegacyStage) {
          localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(normalizedMembers));
        }
      } catch {
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(initialMembers));
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.BERITA)) {
      localStorage.setItem(STORAGE_KEYS.BERITA, JSON.stringify(initialBeritaAcara));
    }
    if (!localStorage.getItem(STORAGE_KEYS.JURNAL_PA)) {
      localStorage.setItem(STORAGE_KEYS.JURNAL_PA, JSON.stringify(initialJurnalPA));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CAMPAIGNS)) {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(initialDonationCampaigns));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DONATIONS)) {
      localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LINKS)) {
      localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(initialLinks));
    }
    if (!localStorage.getItem(STORAGE_KEYS.JOBS)) {
      localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(initialJobs));
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
    }
    // Remove credentials created by vulnerable prototype versions. Authentication is
    // server-authoritative; local storage may only contain a server-issued session.
    localStorage.removeItem("sion_auth_users");
    if (!localStorage.getItem(STORAGE_KEYS.SYNC_STATE)) {
      const defaultSync: SyncState = {
        isOnline: navigator.onLine,
        lastSyncedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        pendingChanges: [],
      };
      localStorage.setItem(STORAGE_KEYS.SYNC_STATE, JSON.stringify(defaultSync));
    }
  }

  // --- Auth Helpers ---
  static getAuthSession(): AuthSession | null {
    this.init();
    const session = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (!session) return null;

    const parsed = JSON.parse(session) as AuthSession;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      return null;
    }
    return parsed;
  }

  static getAuthToken(): string | null {
    return this.getAuthSession()?.token || null;
  }

  static async login(email: string, password: string): Promise<AuthSession> {
    this.init();
    const previousUserId = this.getAuthSession()?.user.id;
    let response: Response;
    try {
      response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error("Server autentikasi tidak dapat dihubungi. Koneksi diperlukan untuk masuk.");
    }
    if (!response.ok) {
      throw new Error(this.toUserFriendlyAuthError(await this.readApiError(response)));
    }
    const session = await response.json() as AuthSession;
    if (previousUserId !== session.user.id) this.clearScopedOperationalData();
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    return session;
  }

  static async register(input: { name: string; email: string; password: string; role: AuthRole; cityId?: string; cityName?: string }): Promise<AuthUser> {
    this.init();
    let response: Response;
    try {
      response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    } catch {
      throw new Error("Server autentikasi tidak dapat dihubungi. Koneksi diperlukan untuk mendaftar.");
    }
    if (!response.ok) {
      throw new Error(await this.readApiError(response) || "Pendaftaran gagal. Silakan coba lagi.");
    }
    return await response.json() as AuthUser;
  }

  static async getAuthUsers(): Promise<AuthUser[]> {
    this.init();
    const token = this.getAuthToken();
    if (!token) {
      throw new Error("Sesi tidak ditemukan. Silakan masuk kembali.");
    }
    const response = await fetch("/api/auth/users", { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      throw new Error(await this.readApiError(response) || "Tidak dapat mengambil daftar pengguna.");
    }
    return await response.json() as AuthUser[];
  }

  static async approveUser(id: string): Promise<AuthUser> {
    this.init();
    const token = this.getAuthToken();
    if (!token) {
      throw new Error("Sesi tidak ditemukan. Silakan masuk kembali.");
    }
    const response = await fetch(`/api/auth/users/${id}/approve`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(await this.readApiError(response) || "Persetujuan pengguna gagal.");
    }
    return await response.json() as AuthUser;
  }

  private static async authenticatedJson<T>(url: string, init: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken();
    if (!token) throw new Error("Sesi tidak ditemukan. Silakan masuk kembali.");
    const response = await fetch(url, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error(await this.readApiError(response) || "Permintaan gagal diproses.");
    if (response.status === 204) return undefined as T;
    return await response.json() as T;
  }

  static getAccessContext(): Promise<AccessContext> {
    return this.authenticatedJson<AccessContext>("/api/auth/access");
  }

  static getRoleAssignments(): Promise<RoleAssignment[]> {
    return this.authenticatedJson<RoleAssignment[]>("/api/auth/role-assignments");
  }

  static createRoleAssignment(input: Pick<RoleAssignment, "userId" | "role" | "scopeType" | "scopeId"> & { validUntil?: string }): Promise<RoleAssignment> {
    return this.authenticatedJson<RoleAssignment>("/api/auth/role-assignments", { method: "POST", body: JSON.stringify(input) });
  }

  static approveRoleAssignment(id: string): Promise<RoleAssignment> {
    return this.authenticatedJson<RoleAssignment>(`/api/auth/role-assignments/${id}/approve`, { method: "PUT" });
  }

  static revokeRoleAssignment(id: string): Promise<void> {
    return this.authenticatedJson<void>(`/api/auth/role-assignments/${id}`, { method: "DELETE" });
  }

  static assignMentor(input: { memberId: string; mentorUserId: string; memberUserId?: string }): Promise<{ success: boolean }> {
    return this.authenticatedJson<{ success: boolean }>("/api/auth/mentorships", { method: "POST", body: JSON.stringify(input) });
  }

  static getScopedMembers(): Promise<Member[]> {
    return this.authenticatedJson<MemberListResult>("/api/members?pageSize=100").then((result) => result.items);
  }

  private static async memberJson<T>(url: string, init: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken();
    if (!token) throw new Error("Sesi tidak ditemukan. Silakan login kembali.");
    const response = await fetch(url, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      let payload: any = {};
      try { payload = await response.json(); } catch { /* response tanpa JSON */ }
      const error: any = new Error(payload?.error?.message || "Operasi Member 360 gagal diproses.");
      error.code = payload?.error?.code;
      error.fields = payload?.fields || {};
      error.candidates = payload?.candidates || [];
      error.status = response.status;
      throw error;
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  static listMembers(params: { page?: number; pageSize?: number; q?: string; cityId?: string; status?: string; includeArchived?: boolean } = {}): Promise<MemberListResult> {
    const query = new URLSearchParams();
    query.set("page", String(params.page || 1));
    query.set("pageSize", String(params.pageSize || 12));
    if (params.q?.trim()) query.set("q", params.q.trim());
    if (params.cityId) query.set("cityId", params.cityId);
    if (params.status) query.set("status", params.status);
    if (params.includeArchived) query.set("includeArchived", "true");
    return this.memberJson<MemberListResult>(`/api/members?${query.toString()}`);
  }

  static checkMemberDuplicates(member: Partial<Member>, excludeId?: string): Promise<MemberDuplicateCandidate[]> {
    const suffix = excludeId ? `?excludeId=${encodeURIComponent(excludeId)}` : "";
    return this.memberJson<{ candidates: MemberDuplicateCandidate[] }>(`/api/members/duplicates${suffix}`, {
      method: "POST", body: JSON.stringify(member),
    }).then((result) => result.candidates);
  }

  static createMember360(member: Omit<Member, "id">): Promise<Member> {
    return this.memberJson<Member>("/api/members", { method: "POST", body: JSON.stringify(member) });
  }

  static updateMember360(member: Member): Promise<Member> {
    return this.memberJson<Member>(`/api/members/${member.id}`, { method: "PUT", body: JSON.stringify(member) });
  }

  static archiveMember(id: string, reason: string): Promise<void> {
    return this.memberJson<void>(`/api/members/${id}/archive`, { method: "POST", body: JSON.stringify({ reason }) });
  }

  static getMemberHistory(id: string): Promise<MemberHistoryResult> {
    return this.memberJson<MemberHistoryResult>(`/api/members/${id}/history`);
  }

  static async exportMembersMasked(reason: string, filters: { q?: string; cityId?: string; status?: string } = {}): Promise<void> {
    const token = this.getAuthToken();
    if (!token) throw new Error("Sesi tidak ditemukan. Silakan login kembali.");
    const query = new URLSearchParams({ reason });
    if (filters.q?.trim()) query.set("q", filters.q.trim());
    if (filters.cityId) query.set("cityId", filters.cityId);
    if (filters.status) query.set("status", filters.status);
    const response = await fetch(`/api/members/export?${query.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(await this.readApiError(response) || "Export anggota gagal.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "member-360-masked.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  static getScopeCatalog(): Promise<ScopeCatalog> {
    return this.authenticatedJson<ScopeCatalog>("/api/auth/scopes");
  }

  static getProvinces(query?: string): Promise<{ id: string; name: string }[]> {
    const url = query && query.trim().length > 0
      ? `/api/reference/provinces?q=${encodeURIComponent(query.trim())}`
      : "/api/reference/provinces";
    return this.authenticatedJson<{ id: string; name: string }[]>(url);
  }

  static getCitiesByProvince(province: string, query?: string): Promise<{ id: string; name: string; provinceId: string; provinceName: string }[]> {
    const params = new URLSearchParams();
    if (province) params.append("province", province.trim());
    if (query && query.trim().length > 0) params.append("q", query.trim());
    return this.authenticatedJson<{ id: string; name: string; provinceId: string; provinceName: string }[]>(`/api/reference/cities?${params.toString()}`);
  }

  static getAuditLogs(): Promise<AuditLog[]> {
    return this.authenticatedJson<AuditLog[]>("/api/auth/audit-logs");
  }

  static getDeviceSessions(userId?: string): Promise<DeviceSession[]> {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    return this.authenticatedJson<DeviceSession[]>(`/api/auth/sessions${query}`);
  }

  static revokeDeviceSession(id: string): Promise<void> {
    return this.authenticatedJson<void>(`/api/auth/sessions/${id}`, { method: "DELETE" });
  }

  static logout() {
    const token = this.getAuthToken();
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    this.clearScopedOperationalData();
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
  }

  // --- API Helper ---
  private static async apiRequest(url: string, method: string, data?: any): Promise<boolean> {
    try {
      const token = this.getAuthToken();
      const response = await fetch(url, {
        method,
        headers: {
          ...(data ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      return response.ok;
    } catch (err) {
      console.warn(`API Request failed: ${method} ${url}`, err);
      return false;
    }
  }

  // --- Pull Data from Go Backend ---
  static async fetchFromCloud() {
    const state = this.getSyncState();
    if (!state.isOnline) return;

    try {
      const token = this.getAuthToken();
      const requestInit: RequestInit = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const [cities, modules, members, berita, journals, campaigns, donations, links, jobs, applications] = await Promise.all([
        fetch("/api/cities", requestInit).then(res => res.ok ? res.json() : null),
        fetch("/api/modules", requestInit).then(res => res.ok ? res.json() : null),
        fetch("/api/members?pageSize=100", requestInit).then(res => res.ok ? res.json() : null),
        fetch("/api/berita", requestInit).then(res => res.ok ? res.json() : null),
        fetch("/api/jurnal-pa", requestInit).then(res => res.ok ? res.json() : null),
        fetch("/api/campaigns", requestInit).then(res => res.ok ? res.json() : null),
        fetch("/api/donations", requestInit).then(res => res.ok ? res.json() : null),
        fetch("/api/links", requestInit).then(res => res.ok ? res.json() : null),
        fetch("/api/jobs", requestInit).then(res => res.ok ? res.json() : null),
        fetch("/api/applications", requestInit).then(res => res.ok ? res.json() : null),
      ]);

      if (cities) localStorage.setItem(STORAGE_KEYS.CITIES, JSON.stringify(cities));
      if (modules) localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(modules));
      if (members?.items) localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(this.normalizeMembers(members.items)));
      if (berita) localStorage.setItem(STORAGE_KEYS.BERITA, JSON.stringify(berita));
      if (journals) localStorage.setItem(STORAGE_KEYS.JURNAL_PA, JSON.stringify(journals));
      if (campaigns) localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
      if (donations) localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(donations));
      if (links) localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
      if (jobs) localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
      if (applications) localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
    } catch (err) {
      console.error("Error fetching data from backend:", err);
    }
  }

  // --- Sync State Helpers ---
  static getSyncState(): SyncState {
    this.init();
    const str = localStorage.getItem(STORAGE_KEYS.SYNC_STATE);
    return str ? JSON.parse(str) : { isOnline: true, lastSyncedAt: "", pendingChanges: [] };
  }

  static saveSyncState(state: SyncState) {
    localStorage.setItem(STORAGE_KEYS.SYNC_STATE, JSON.stringify(state));
  }

  static toggleOnlineStatus(forceStatus?: boolean): SyncState {
    const state = this.getSyncState();
    state.isOnline = forceStatus !== undefined ? forceStatus : !state.isOnline;
    this.saveSyncState(state);
    return state;
  }

  static addPendingChange(change: Omit<SyncPendingChange, "timestamp">) {
    const state = this.getSyncState();
    const newChange: SyncPendingChange = {
      ...change,
      timestamp: new Date().toISOString(),
    };
    // Remove stale changes with the same item id if we are overriding
    state.pendingChanges = state.pendingChanges.filter(
      (c) => !(c.id === change.id && c.itemType === change.itemType)
    );
    state.pendingChanges.push(newChange);
    this.saveSyncState(state);
  }

  // --- Reached Cities Helpers ---
  static getCities(): City[] {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CITIES) || "[]");
  }

  static saveCities(cities: City[]) {
    localStorage.setItem(STORAGE_KEYS.CITIES, JSON.stringify(cities));
  }

  static addCity(city: Omit<City, "id" | "membersCount" | "journalsCount" | "beritaCount" | "jurnalPaCount">): City {
    const cities = this.getCities();
    const newCity: City = {
      ...city,
      id: "city-" + Date.now(),
      membersCount: 0,
      journalsCount: 0,
      beritaCount: 0,
      jurnalPaCount: 0
    };
    cities.push(newCity);
    this.saveCities(cities);

    const syncState = this.getSyncState();
    if (syncState.isOnline) {
      this.apiRequest("/api/cities", "POST", newCity);
    }
    return newCity;
  }

  // --- Discipleship Modules Helpers ---
  static getModules(): DiscipleshipModule[] {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MODULES) || "[]");
  }

  static saveModules(modules: DiscipleshipModule[]) {
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(modules));
  }

  static toggleModuleDownload(id: string): DiscipleshipModule[] {
    const mods = this.getModules();
    const updated = mods.map((m) =>
      m.id === id ? { ...m, isDownloaded: !m.isDownloaded } : m
    );
    this.saveModules(updated);

    const m = updated.find(x => x.id === id);
    const syncState = this.getSyncState();
    if (syncState.isOnline && m) {
      this.apiRequest(`/api/modules/${id}`, "PUT", m);
    }
    return updated;
  }

  static completeModule(id: string): DiscipleshipModule[] {
    const mods = this.getModules();
    const updated = mods.map((m) =>
      m.id === id ? { ...m, isCompleted: true } : m
    );
    this.saveModules(updated);

    const m = updated.find(x => x.id === id);
    const syncState = this.getSyncState();
    if (syncState.isOnline && m) {
      this.apiRequest(`/api/modules/${id}`, "PUT", m);
    }
    return updated;
  }

  // --- Members CRUD Helpers ---
  static getMembers(): Member[] {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS) || "[]");
  }

  // --- Berita Acara CRUD Helpers ---
  static getBerita(): BeritaAcara[] {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BERITA) || "[]");
  }

  static saveBerita(beritaList: BeritaAcara[]) {
    localStorage.setItem(STORAGE_KEYS.BERITA, JSON.stringify(beritaList));
    this.recalculateCityStats();
  }

  static addBerita(berita: Omit<BeritaAcara, "id" | "synced" | "action">): BeritaAcara {
    const beritaList = this.getBerita();
    const isOnline = this.getSyncState().isOnline;
    const newBerita: BeritaAcara = {
      ...berita,
      id: "ber-" + Date.now(),
      synced: isOnline,
      action: isOnline ? null : "create",
    };
    beritaList.unshift(newBerita);
    this.saveBerita(beritaList);

    if (isOnline) {
      this.apiRequest("/api/berita", "POST", newBerita).then((ok) => {
        if (!ok) {
          newBerita.synced = false;
          newBerita.action = "create";
          this.saveBerita(this.getBerita().map(b => b.id === newBerita.id ? newBerita : b));
          this.addPendingChange({ id: newBerita.id, itemType: "berita", action: "create", data: newBerita });
        }
      });
    } else {
      this.addPendingChange({ id: newBerita.id, itemType: "berita", action: "create", data: newBerita });
    }

    return newBerita;
  }

  static deleteBerita(id: string) {
    const beritaList = this.getBerita();
    const beritaToDelete = beritaList.find((b) => b.id === id);
    const updated = beritaList.filter((b) => b.id !== id);
    this.saveBerita(updated);

    const isOnline = this.getSyncState().isOnline;
    if (isOnline) {
      this.apiRequest(`/api/berita/${id}`, "DELETE").then((ok) => {
        if (!ok && beritaToDelete) {
          this.addPendingChange({ id: id, itemType: "berita", action: "delete", data: beritaToDelete });
        }
      });
    } else if (beritaToDelete) {
      this.addPendingChange({ id: id, itemType: "berita", action: "delete", data: beritaToDelete });
    }
  }

  // --- Jurnal PA CRUD Helpers ---
  static getJurnalPA(): JurnalPA[] {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.JURNAL_PA) || "[]");
  }

  static saveJurnalPA(jurnalList: JurnalPA[]) {
    localStorage.setItem(STORAGE_KEYS.JURNAL_PA, JSON.stringify(jurnalList));
    this.recalculateCityStats();
  }

  static addJurnalPA(jurnal: Omit<JurnalPA, "id" | "synced" | "action">): JurnalPA {
    const jurnalList = this.getJurnalPA();
    const isOnline = this.getSyncState().isOnline;
    const newJurnal: JurnalPA = {
      ...jurnal,
      id: "jpa-" + Date.now(),
      synced: isOnline,
      action: isOnline ? null : "create",
    };
    jurnalList.unshift(newJurnal);
    this.saveJurnalPA(jurnalList);

    if (isOnline) {
      this.apiRequest("/api/jurnal-pa", "POST", newJurnal).then((ok) => {
        if (!ok) {
          newJurnal.synced = false;
          newJurnal.action = "create";
          this.saveJurnalPA(this.getJurnalPA().map(j => j.id === newJurnal.id ? newJurnal : j));
          this.addPendingChange({ id: newJurnal.id, itemType: "jurnal_pa", action: "create", data: newJurnal });
        }
      });
    } else {
      this.addPendingChange({ id: newJurnal.id, itemType: "jurnal_pa", action: "create", data: newJurnal });
    }

    return newJurnal;
  }

  static deleteJurnalPA(id: string) {
    const jurnalList = this.getJurnalPA();
    const jurnalToDelete = jurnalList.find((j) => j.id === id);
    const updated = jurnalList.filter((j) => j.id !== id);
    this.saveJurnalPA(updated);

    const isOnline = this.getSyncState().isOnline;
    if (isOnline) {
      this.apiRequest(`/api/jurnal-pa/${id}`, "DELETE").then((ok) => {
        if (!ok && jurnalToDelete) {
          this.addPendingChange({ id: id, itemType: "jurnal_pa", action: "delete", data: jurnalToDelete });
        }
      });
    } else if (jurnalToDelete) {
      this.addPendingChange({ id: id, itemType: "jurnal_pa", action: "delete", data: jurnalToDelete });
    }
  }

  // --- Donations/Campaigns CRUD Helpers ---
  static getCampaigns(): DonationCampaign[] {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CAMPAIGNS) || "[]");
  }

  static saveCampaigns(campaigns: DonationCampaign[]) {
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
  }

  static updateCampaign(campaign: DonationCampaign): DonationCampaign {
    const campaigns = this.getCampaigns();
    const updated = campaigns.map((c) => (c.id === campaign.id ? campaign : c));
    this.saveCampaigns(updated);
    return campaign;
  }

  static addCampaign(campaign: Omit<DonationCampaign, "id">): DonationCampaign {
    const campaigns = this.getCampaigns();
    const newCampaign: DonationCampaign = {
      ...campaign,
      id: "cam-" + Date.now(),
    };
    campaigns.unshift(newCampaign);
    this.saveCampaigns(campaigns);

    const syncState = this.getSyncState();
    if (syncState.isOnline) {
      this.apiRequest("/api/campaigns", "POST", newCampaign);
    }
    return newCampaign;
  }

  static getDonationRecords(): DonationRecord[] {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DONATIONS) || "[]");
  }

  static saveDonationRecords(records: DonationRecord[]) {
    localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(records));
  }

  static addDonationRecord(record: Omit<DonationRecord, "id" | "date">): DonationRecord {
    const records = this.getDonationRecords();
    const newRecord: DonationRecord = {
      ...record,
      id: "don-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
    };
    records.unshift(newRecord);
    this.saveDonationRecords(records);

    // Update campaign locally
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find((c) => c.id === record.campaignId);
    if (campaign) {
      campaign.collectedAmount += record.amount;
      campaign.donorsCount += 1;
      this.updateCampaign(campaign);
    }

    const syncState = this.getSyncState();
    if (syncState.isOnline) {
      this.apiRequest("/api/donations", "POST", newRecord);
    }
    return newRecord;
  }

  // --- Links CRUD Helpers ---
  static getLinks(): DiscipleshipLink[] {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LINKS) || "[]");
  }

  static saveLinks(links: DiscipleshipLink[]) {
    localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
  }

  static addLink(link: Omit<DiscipleshipLink, "id">): DiscipleshipLink {
    const links = this.getLinks();
    const newLink: DiscipleshipLink = {
      ...link,
      id: "lnk-" + Date.now(),
    };
    links.unshift(newLink);
    this.saveLinks(links);

    const isOnline = this.getSyncState().isOnline;
    if (isOnline) {
      this.apiRequest("/api/links", "POST", newLink).then((ok) => {
        if (!ok) {
          this.addPendingChange({ id: newLink.id, itemType: "link", action: "create", data: newLink });
        }
      });
    } else {
      this.addPendingChange({ id: newLink.id, itemType: "link", action: "create", data: newLink });
    }

    return newLink;
  }

  static updateLink(link: DiscipleshipLink): DiscipleshipLink {
    const links = this.getLinks();
    const updated = links.map((l) => (l.id === link.id ? link : l));
    this.saveLinks(updated);

    const isOnline = this.getSyncState().isOnline;
    if (isOnline) {
      this.apiRequest(`/api/links/${link.id}`, "PUT", link).then((ok) => {
        if (!ok) {
          this.addPendingChange({ id: link.id, itemType: "link", action: "update", data: link });
        }
      });
    } else {
      this.addPendingChange({ id: link.id, itemType: "link", action: "update", data: link });
    }

    return link;
  }

  static deleteLink(id: string) {
    const links = this.getLinks();
    const linkToDelete = links.find((l) => l.id === id);
    const updated = links.filter((l) => l.id !== id);
    this.saveLinks(updated);

    const isOnline = this.getSyncState().isOnline;
    if (isOnline) {
      this.apiRequest(`/api/links/${id}`, "DELETE").then((ok) => {
        if (!ok && linkToDelete) {
          this.addPendingChange({ id: id, itemType: "link", action: "delete", data: linkToDelete });
        }
      });
    } else if (linkToDelete) {
      this.addPendingChange({ id: id, itemType: "link", action: "delete", data: linkToDelete });
    }
  }

  // --- Jobs CRUD Helpers ---
  static getJobs(): JobOpportunity[] {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || "[]");
  }

  static saveJobs(jobs: JobOpportunity[]) {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  }

  static addJob(job: Omit<JobOpportunity, "id" | "postedDate" | "status" | "applicantsCount">): JobOpportunity {
    const jobs = this.getJobs();
    const newJob: JobOpportunity = {
      ...job,
      id: "job-" + Date.now(),
      postedDate: new Date().toISOString().split("T")[0],
      status: "open",
      applicantsCount: 0,
    };
    jobs.unshift(newJob);
    this.saveJobs(jobs);

    const syncState = this.getSyncState();
    if (syncState.isOnline) {
      this.apiRequest("/api/jobs", "POST", newJob);
    }
    return newJob;
  }

  // --- Job Applications Helpers ---
  static getApplications(): JobApplication[] {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || "[]");
  }

  static saveApplications(apps: JobApplication[]) {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
  }

  static addApplication(app: Omit<JobApplication, "id" | "appliedDate">): JobApplication {
    const apps = this.getApplications();
    const newApp: JobApplication = {
      ...app,
      id: "app-" + Date.now(),
      appliedDate: new Date().toISOString().split("T")[0],
    };
    apps.unshift(newApp);
    this.saveApplications(apps);

    // Increment applicant count on job locally
    const jobs = this.getJobs();
    const updatedJobs = jobs.map((job) => {
      if (job.id === app.jobId) {
        return { ...job, applicantsCount: (job.applicantsCount || 0) + 1 };
      }
      return job;
    });
    this.saveJobs(updatedJobs);

    const syncState = this.getSyncState();
    if (syncState.isOnline) {
      this.apiRequest("/api/applications", "POST", newApp);
    }
    return newApp;
  }

  // --- Recalculate Stats Helper ---
  private static recalculateCityStats() {
    const cities = this.getCities();
    const members = this.getMembers();
    const berita = this.getBerita();
    const jurnalPa = this.getJurnalPA();

    const updatedCities = cities.map((city) => {
      const cityMembers = members.filter((m) => m.cityId === city.id || m.cityName.toLowerCase() === city.name.toLowerCase());
      const cityBerita = berita.filter((b) => b.cityId === city.id || b.cityName.toLowerCase() === city.name.toLowerCase());
      const cityJurnalPa = jurnalPa.filter((j) => j.cityId === city.id || j.cityName.toLowerCase() === city.name.toLowerCase());
      return {
        ...city,
        membersCount: cityMembers.length,
        beritaCount: cityBerita.length,
        jurnalPaCount: cityJurnalPa.length,
        journalsCount: cityBerita.length + cityJurnalPa.length,
      };
    });

    localStorage.setItem(STORAGE_KEYS.CITIES, JSON.stringify(updatedCities));
  }

  // --- Perform Cloud Sync ---
  static async syncWithCloud(): Promise<{ success: boolean; syncedItemsCount: number; lastSyncedAt: string }> {
    const state = this.getSyncState();
    if (!state.isOnline) {
      throw new Error("Cannot sync when offline!");
    }

    const itemsToSync = state.pendingChanges.length;

    if (itemsToSync > 0) {
      try {
        const response = await fetch("/api/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.getAuthToken() ? { Authorization: `Bearer ${this.getAuthToken()}` } : {}),
          },
          body: JSON.stringify({ pendingChanges: state.pendingChanges }),
        });

        if (!response.ok) {
          throw new Error("Sync failed on backend server");
        }

        // Pull latest state from cloud
        await this.fetchFromCloud();
      } catch (err) {
        console.error("Cloud sync error:", err);
        throw err;
      }
    } else {
      // If there are no pending changes, just pull latest data
      await this.fetchFromCloud();
    }

    // Update state
    const updatedState: SyncState = {
      isOnline: true,
      lastSyncedAt: new Date().toISOString(),
      pendingChanges: [],
    };
    this.saveSyncState(updatedState);

    // Recalculate stats to make sure everything matches
    this.recalculateCityStats();

    return {
      success: true,
      syncedItemsCount: itemsToSync,
      lastSyncedAt: updatedState.lastSyncedAt,
    };
  }
}
