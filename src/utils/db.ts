import { Member, BeritaAcara, JurnalPA, DonationCampaign, DonationRecord, City, DiscipleshipLink, DiscipleshipModule, SyncPendingChange, SyncState, JobOpportunity, JobApplication } from "../types";
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
};

export class SionDatabase {
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
    if (!localStorage.getItem(STORAGE_KEYS.SYNC_STATE)) {
      const defaultSync: SyncState = {
        isOnline: navigator.onLine,
        lastSyncedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        pendingChanges: [],
      };
      localStorage.setItem(STORAGE_KEYS.SYNC_STATE, JSON.stringify(defaultSync));
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
    return updated;
  }

  static completeModule(id: string): DiscipleshipModule[] {
    const mods = this.getModules();
    const updated = mods.map((m) =>
      m.id === id ? { ...m, isCompleted: true } : m
    );
    this.saveModules(updated);
    return updated;
  }

  // --- Members CRUD Helpers ---
  static getMembers(): Member[] {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS) || "[]");
  }

  static saveMembers(members: Member[]) {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    
    // Auto recalculate stats for cities
    this.recalculateCityStats();
  }

  static addMember(member: Omit<Member, "id">): Member {
    const members = this.getMembers();
    const newMember: Member = {
      ...member,
      id: "mem-" + Date.now(),
    };
    members.unshift(newMember);
    this.saveMembers(members);

    // Track offline change
    const syncState = this.getSyncState();
    if (!syncState.isOnline) {
      this.addPendingChange({
        id: newMember.id,
        itemType: "member",
        action: "create",
        data: newMember,
      });
    }

    return newMember;
  }

  static updateMember(member: Member): Member {
    const members = this.getMembers();
    const updated = members.map((m) => (m.id === member.id ? member : m));
    this.saveMembers(updated);

    // Track offline change
    const syncState = this.getSyncState();
    if (!syncState.isOnline) {
      this.addPendingChange({
        id: member.id,
        itemType: "member",
        action: "update",
        data: member,
      });
    }

    return member;
  }

  static deleteMember(id: string) {
    const members = this.getMembers();
    const memberToDelete = members.find((m) => m.id === id);
    const updated = members.filter((m) => m.id !== id);
    this.saveMembers(updated);

    // Track offline change
    const syncState = this.getSyncState();
    if (!syncState.isOnline && memberToDelete) {
      this.addPendingChange({
        id: id,
        itemType: "member",
        action: "delete",
        data: memberToDelete,
      });
    }
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

    if (!isOnline) {
      this.addPendingChange({
        id: newBerita.id,
        itemType: "berita",
        action: "create",
        data: newBerita,
      });
    }

    return newBerita;
  }

  static updateBerita(berita: BeritaAcara): BeritaAcara {
    const beritaList = this.getBerita();
    const isOnline = this.getSyncState().isOnline;
    
    const updatedBerita: BeritaAcara = {
      ...berita,
      synced: isOnline,
      action: isOnline ? null : (berita.action || "update"),
    };

    const updated = beritaList.map((b) => (b.id === berita.id ? updatedBerita : b));
    this.saveBerita(updated);

    if (!isOnline) {
      this.addPendingChange({
        id: berita.id,
        itemType: "berita",
        action: "update",
        data: updatedBerita,
      });
    }

    return updatedBerita;
  }

  static deleteBerita(id: string) {
    const beritaList = this.getBerita();
    const beritaToDelete = beritaList.find((b) => b.id === id);
    const updated = beritaList.filter((b) => b.id !== id);
    this.saveBerita(updated);

    const isOnline = this.getSyncState().isOnline;
    if (!isOnline && beritaToDelete) {
      this.addPendingChange({
        id: id,
        itemType: "berita",
        action: "delete",
        data: beritaToDelete,
      });
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

    if (!isOnline) {
      this.addPendingChange({
        id: newJurnal.id,
        itemType: "jurnal_pa",
        action: "create",
        data: newJurnal,
      });
    }

    return newJurnal;
  }

  static updateJurnalPA(jurnal: JurnalPA): JurnalPA {
    const jurnalList = this.getJurnalPA();
    const isOnline = this.getSyncState().isOnline;
    
    const updatedJurnal: JurnalPA = {
      ...jurnal,
      synced: isOnline,
      action: isOnline ? null : (jurnal.action || "update"),
    };

    const updated = jurnalList.map((j) => (j.id === jurnal.id ? updatedJurnal : j));
    this.saveJurnalPA(updated);

    if (!isOnline) {
      this.addPendingChange({
        id: jurnal.id,
        itemType: "jurnal_pa",
        action: "update",
        data: updatedJurnal,
      });
    }

    return updatedJurnal;
  }

  static deleteJurnalPA(id: string) {
    const jurnalList = this.getJurnalPA();
    const jurnalToDelete = jurnalList.find((j) => j.id === id);
    const updated = jurnalList.filter((j) => j.id !== id);
    this.saveJurnalPA(updated);

    const isOnline = this.getSyncState().isOnline;
    if (!isOnline && jurnalToDelete) {
      this.addPendingChange({
        id: id,
        itemType: "jurnal_pa",
        action: "delete",
        data: jurnalToDelete,
      });
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

    // Update campaign collected amount & donor count
    const campaigns = this.getCampaigns();
    const campaign = campaigns.find((c) => c.id === record.campaignId);
    if (campaign) {
      campaign.collectedAmount += record.amount;
      campaign.donorsCount += 1;
      this.updateCampaign(campaign);
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
    if (!isOnline) {
      this.addPendingChange({
        id: newLink.id,
        itemType: "link",
        action: "create",
        data: newLink,
      });
    }

    return newLink;
  }

  static updateLink(link: DiscipleshipLink): DiscipleshipLink {
    const links = this.getLinks();
    const updated = links.map((l) => (l.id === link.id ? link : l));
    this.saveLinks(updated);

    const isOnline = this.getSyncState().isOnline;
    if (!isOnline) {
      this.addPendingChange({
        id: link.id,
        itemType: "link",
        action: "update",
        data: link,
      });
    }

    return link;
  }

  static deleteLink(id: string) {
    const links = this.getLinks();
    const linkToDelete = links.find((l) => l.id === id);
    const updated = links.filter((l) => l.id !== id);
    this.saveLinks(updated);

    const isOnline = this.getSyncState().isOnline;
    if (!isOnline && linkToDelete) {
      this.addPendingChange({
        id: id,
        itemType: "link",
        action: "delete",
        data: linkToDelete,
      });
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
    return newJob;
  }

  static updateJob(job: JobOpportunity): JobOpportunity {
    const jobs = this.getJobs();
    const updated = jobs.map((j) => (j.id === job.id ? job : j));
    this.saveJobs(updated);
    return job;
  }

  static deleteJob(id: string) {
    const jobs = this.getJobs();
    const updated = jobs.filter((j) => j.id !== id);
    this.saveJobs(updated);
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

    // Increment applicant count on job
    const jobs = this.getJobs();
    const updatedJobs = jobs.map((job) => {
      if (job.id === app.jobId) {
        return { ...job, applicantsCount: (job.applicantsCount || 0) + 1 };
      }
      return job;
    });
    this.saveJobs(updatedJobs);

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

  // --- Perform Cloud Sync Simulation ---
  static async syncWithCloud(): Promise<{ success: boolean; syncedItemsCount: number; lastSyncedAt: string }> {
    const state = this.getSyncState();
    if (!state.isOnline) {
      throw new Error("Cannot sync when offline!");
    }

    const itemsToSync = state.pendingChanges.length;

    // Simulate sending changes to `/api/sion-proxy`
    if (itemsToSync > 0) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate networking delay
        
        // Mark all local berita as synced
        const berita = this.getBerita();
        const updatedBerita = berita.map((b) => ({ ...b, synced: true, action: null }));
        localStorage.setItem(STORAGE_KEYS.BERITA, JSON.stringify(updatedBerita));

        // Mark all local Jurnal PA as synced
        const jurnalPa = this.getJurnalPA();
        const updatedJurnalPa = jurnalPa.map((j) => ({ ...j, synced: true, action: null }));
        localStorage.setItem(STORAGE_KEYS.JURNAL_PA, JSON.stringify(updatedJurnalPa));
      } catch (err) {
        console.error("Cloud sync simulation error:", err);
        throw err;
      }
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
