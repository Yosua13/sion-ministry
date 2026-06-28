import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Building, 
  Search, 
  FileText, 
  Send, 
  ChevronRight, 
  Plus, 
  ArrowLeft, 
  CheckCircle, 
  Phone, 
  Mail,
  SlidersHorizontal,
  Bookmark,
  Share2,
  Users2,
  AlertCircle
} from "lucide-react";
import { JobOpportunity, JobApplication } from "../types";
import { SionDatabase } from "../utils/db";

interface PekerjaanProps {
  onBackToMain: () => void;
}

export default function Pekerjaan({ onBackToMain }: PekerjaanProps) {
  // Navigation tabs in Jobs Header
  const [jobTab, setJobTab] = useState<"search" | "post" | "applicants">("search");
  
  // Data State
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobOpportunity | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");

  // Apply Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyingJob, setApplyingJob] = useState<JobOpportunity | null>(null);
  
  // Apply Form Inputs
  const [applicantName, setApplicantName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantResume, setApplicantResume] = useState("");
  const [applicantNotes, setApplicantNotes] = useState("");
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);

  // New Job Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [newJobType, setNewJobType] = useState<JobOpportunity["jobType"]>("Full-time");
  const [newCategory, setNewCategory] = useState<JobOpportunity["category"]>("Administrasi");
  const [newDescription, setNewDescription] = useState("");
  const [newRequirements, setNewRequirements] = useState("");
  const [newResponsibilities, setNewResponsibilities] = useState("");
  const [newContact, setNewContact] = useState("");
  const [isPostSuccess, setIsPostSuccess] = useState(false);

  // Load Data on Load
  useEffect(() => {
    const loadedJobs = SionDatabase.getJobs();
    setJobs(loadedJobs);
    setApplications(SionDatabase.getApplications());
    if (loadedJobs.length > 0) {
      setSelectedJob(loadedJobs[0]);
    }
  }, []);

  const refreshJobsData = () => {
    const loadedJobs = SionDatabase.getJobs();
    setJobs(loadedJobs);
    setApplications(SionDatabase.getApplications());
    // Maintain or adjust selected job
    if (selectedJob) {
      const current = loadedJobs.find(j => j.id === selectedJob.id);
      if (current) {
        setSelectedJob(current);
      }
    }
  };

  // Filter Jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || job.category === selectedCategory;
    const matchesType = selectedType === "All" || job.jobType === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  // Handle Apply Job Submission
  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob) return;

    if (!applicantName || !applicantPhone || !applicantEmail) {
      alert("Mohon isi nama, nomor telepon, dan email Anda.");
      return;
    }

    SionDatabase.addApplication({
      jobId: applyingJob.id,
      applicantName,
      applicantPhone,
      applicantEmail,
      applicantResume,
      notes: applicantNotes
    });

    setIsSubmitSuccess(true);
    setTimeout(() => {
      setIsApplyModalOpen(false);
      setIsSubmitSuccess(false);
      // Reset fields
      setApplicantName("");
      setApplicantPhone("");
      setApplicantEmail("");
      setApplicantResume("");
      setApplicantNotes("");
      setApplyingJob(null);
      refreshJobsData();
    }, 2000);
  };

  // Handle Post New Job Submission
  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCompany || !newLocation || !newSalary || !newDescription || !newContact) {
      alert("Mohon lengkapi seluruh field wajib lowongan pekerjaan.");
      return;
    }

    const requirementsArray = newRequirements
      .split("\n")
      .map(item => item.trim())
      .filter(item => item.length > 0);

    const responsibilitiesArray = newResponsibilities
      .split("\n")
      .map(item => item.trim())
      .filter(item => item.length > 0);

    SionDatabase.addJob({
      title: newTitle,
      company: newCompany,
      location: newLocation,
      salary: newSalary,
      jobType: newJobType,
      category: newCategory,
      description: newDescription,
      requirements: requirementsArray.length > 0 ? requirementsArray : ["Memiliki integritas dan dedikasi pelayanan yang tinggi"],
      responsibilities: responsibilitiesArray.length > 0 ? responsibilitiesArray : ["Melaksanakan tanggung jawab pelayanan sesuai arahan pimpinan"],
      contactInfo: newContact
    });

    setIsPostSuccess(true);
    setTimeout(() => {
      setIsPostSuccess(false);
      setNewTitle("");
      setNewCompany("");
      setNewLocation("");
      setNewSalary("");
      setNewDescription("");
      setNewRequirements("");
      setNewResponsibilities("");
      setNewContact("");
      setJobTab("search");
      refreshJobsData();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* EXCLUSIVE JOBS PORTAL HEADER NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo & Subtitle */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 text-white rounded-xl">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <span className="font-display font-black text-base text-slate-900 tracking-tight block">Sion Careers</span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider block">PORTAL KARIR & MISI SIONERS</span>
              </div>
            </div>

            {/* Support Tabs in the Header Navbar */}
            <nav className="hidden md:flex space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setJobTab("search")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  jobTab === "search" 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Cari Lowongan
              </button>
              <button
                onClick={() => setJobTab("post")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  jobTab === "post" 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Pasang Lowongan
              </button>
              <button
                onClick={() => setJobTab("applicants")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  jobTab === "applicants" 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Daftar Pelamar ({applications.length})
              </button>
            </nav>

            {/* Back Button to Main Board */}
            <button
              onClick={onBackToMain}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer shadow-md shadow-slate-900/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Sion Ministry</span>
            </button>

          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-2 flex space-x-1 justify-center">
          <button
            onClick={() => setJobTab("search")}
            className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-all ${
              jobTab === "search" ? "bg-indigo-50 text-indigo-600 font-bold" : "text-slate-500"
            }`}
          >
            Cari Lowongan
          </button>
          <button
            onClick={() => setJobTab("post")}
            className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-all ${
              jobTab === "post" ? "bg-indigo-50 text-indigo-600 font-bold" : "text-slate-500"
            }`}
          >
            Pasang
          </button>
          <button
            onClick={() => setJobTab("applicants")}
            className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-all ${
              jobTab === "applicants" ? "bg-indigo-50 text-indigo-600 font-bold" : "text-slate-500"
            }`}
          >
            Pelamar ({applications.length})
          </button>
        </div>
      </header>

      {/* DETAILED CONTENT VIEWS */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">

        {jobTab === "search" && (
          <div className="space-y-6">
            
            {/* Banner Section */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-indigo-950">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl -ml-20 -mb-20"></div>
              
              <div className="relative z-10 max-w-2xl space-y-3">
                <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
                  Sion Employment Hub
                </span>
                <h1 className="text-xl sm:text-2xl font-display font-bold leading-tight">
                  Hubungkan Potensi & Pelayanan dalam Amanat Agung
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-light">
                  Temukan pekerjaan profesional, kontrak kerja yayasan, hingga perintisan misi lapangan di berbagai wilayah Nusantara. Dirancang khusus untuk mendukung kemandirian ekonomi para Sioners.
                </p>
              </div>
            </div>

            {/* Advanced Search & Filtering Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center">
              
              {/* Search text input */}
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Cari lowongan berdasarkan keahlian, jabatan, atau instansi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              {/* Filter Category */}
              <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
                <div className="w-full sm:w-44">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    <option value="All">Semua Kategori</option>
                    <option value="Administrasi">Administrasi</option>
                    <option value="Pendidikan">Pendidikan</option>
                    <option value="Media & Kreatif">Media & Kreatif</option>
                    <option value="Sosial & Misi">Sosial & Misi</option>
                    <option value="Teknologi">Teknologi</option>
                    <option value="Layanan Umum">Layanan Umum</option>
                  </select>
                </div>

                {/* Filter Job Type */}
                <div className="w-full sm:w-40">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    <option value="All">Semua Tipe Kerja</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Kontrak</option>
                    <option value="Misi / Relawan">Misi / Relawan</option>
                    <option value="Remote">Remote / WFH</option>
                    <option value="Internship">Magang</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Split Screen Glints/Jobstreet style */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Job Cards List (5 cols) */}
              <div className="lg:col-span-5 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {filteredJobs.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
                    <AlertCircle className="h-8 w-8 text-slate-400 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-800">Tidak ada lowongan ditemukan</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Coba ganti kata kunci pencarian Anda atau ubah filter kategori dan tipe kerja.
                    </p>
                  </div>
                ) : (
                  filteredJobs.map((job) => {
                    const isSelected = selectedJob?.id === job.id;
                    return (
                      <div
                        key={job.id}
                        onClick={() => setSelectedJob(job)}
                        className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer text-left relative ${
                          isSelected 
                            ? "border-indigo-600 shadow-md ring-2 ring-indigo-500/10" 
                            : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                        }`}
                      >
                        {/* Type Badge */}
                        <span className={`absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                          job.jobType === "Misi / Relawan"
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : job.jobType === "Full-time"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                        }`}>
                          {job.jobType}
                        </span>

                        <div className="flex items-start space-x-3.5">
                          {/* Logo */}
                          <div className="h-11 w-11 rounded-xl bg-slate-100 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {job.logoUrl ? (
                              <img src={job.logoUrl} alt={job.company} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                            ) : (
                              <Building className="h-5 w-5 text-slate-400" />
                            )}
                          </div>

                          {/* Title & Info */}
                          <div className="space-y-1 pr-16">
                            <h3 className="text-xs font-bold text-slate-900 leading-tight line-clamp-1 hover:text-indigo-600 transition-colors">
                              {job.title}
                            </h3>
                            <p className="text-[11px] text-slate-600 font-semibold line-clamp-1">{job.company}</p>
                            
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1.5 text-[10px] text-slate-400 font-medium">
                              <span className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                                <span className="truncate max-w-[120px]">{job.location}</span>
                              </span>
                              <span className="flex items-center space-x-0.5">
                                <DollarSign className="h-3 w-3 shrink-0 text-slate-400" />
                                <span>{job.salary}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3.5 pt-3 border-t border-dashed border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-mono">
                            Kategori: <strong className="text-slate-600 font-semibold">{job.category}</strong>
                          </span>
                          <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full font-mono text-[9px]">
                            {job.applicantsCount || 0} Pelamar
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Detailed View Pane (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm min-h-[50vh] flex flex-col justify-between">
                {selectedJob ? (
                  <div className="space-y-6">
                    {/* Job Title Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-100">
                      <div className="flex items-start space-x-4">
                        <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                          {selectedJob.logoUrl ? (
                            <img src={selectedJob.logoUrl} alt={selectedJob.company} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                          ) : (
                            <Building className="h-7 w-7 text-slate-400" />
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <h2 className="text-base font-bold text-slate-900 leading-tight">
                            {selectedJob.title}
                          </h2>
                          <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                            <span>{selectedJob.company}</span>
                            <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                            <span className="text-indigo-600 text-[10px] bg-indigo-50 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">{selectedJob.jobType}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 pt-1 font-semibold">
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              <span>{selectedJob.location}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                              <span className="text-slate-600 font-bold">{selectedJob.salary}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              <span>Diposting: {selectedJob.postedDate}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer">
                          <Bookmark className="h-4.5 w-4.5" />
                        </button>
                        <button className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer">
                          <Share2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>

                    {/* Job Details Grid */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Tipe Pekerjaan</span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedJob.jobType}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Kategori</span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedJob.category}</span>
                      </div>
                    </div>

                    {/* Job Description Section */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Deskripsi Pekerjaan</h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {selectedJob.description}
                      </p>
                    </div>

                    {/* Job Requirements Section */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Kualifikasi / Persyaratan</h3>
                      <ul className="space-y-1.5 pl-1">
                        {selectedJob.requirements.map((req, i) => (
                          <li key={i} className="flex items-start text-xs text-slate-600 leading-relaxed">
                            <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full mt-1.5 mr-2.5 shrink-0"></span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Job Responsibilities Section */}
                    {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Tanggung Jawab Pekerjaan</h3>
                        <ul className="space-y-1.5 pl-1">
                          {selectedJob.responsibilities.map((resp, i) => (
                            <li key={i} className="flex items-start text-xs text-slate-600 leading-relaxed">
                              <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full mt-1.5 mr-2.5 shrink-0"></span>
                              <span>{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Contact & Recruitment Info */}
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-2">
                      <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 text-indigo-500 shrink-0" />
                        <span>Informasi Kontak & Penerimaan Rekrutmen</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Silakan hubungi kontak penanggung jawab di bawah ini atau lampirkan berkas secara langsung melalui formulir lamaran digital di sebelah kanan.
                      </p>
                      <div className="text-xs text-slate-700 font-mono font-bold pt-1 flex items-center space-x-1">
                        <Phone className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span>{selectedJob.contactInfo}</span>
                      </div>
                    </div>

                    {/* Bottom Apply Action Area */}
                    <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400 font-medium">
                        Sudah ada <strong className="text-indigo-600 font-bold">{selectedJob.applicantsCount} pelamar</strong> tertarik dengan lowongan ini.
                      </div>
                      
                      <button
                        onClick={() => {
                          setApplyingJob(selectedJob);
                          setIsApplyModalOpen(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/15 flex items-center space-x-2 cursor-pointer"
                      >
                        <span>Lamar Sekarang</span>
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-2 text-slate-400 py-12">
                    <Briefcase className="h-10 w-10 text-slate-300" />
                    <p className="text-xs font-semibold">Pilih lowongan untuk melihat deskripsi lengkap</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: PASANG LOWONGAN FORM */}
        {jobTab === "post" && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="font-display font-bold text-base text-slate-900">Pasang Lowongan Pekerjaan Baru</h2>
              <p className="text-xs text-slate-400 mt-1">Cari pekerja bertalenta, staf yayasan, pengajar sekolah, atau misionaris dari sesama rekan Sioners.</p>
            </div>

            {isPostSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 p-6 rounded-2xl text-center space-y-3">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
                <h3 className="text-sm font-bold text-emerald-800">Lowongan Berhasil Dipasang!</h3>
                <p className="text-xs text-emerald-600/90 leading-relaxed font-medium">
                  Lowongan Anda sedang didaftarkan ke dalam Sion Careers database. Halaman akan otomatis dialihkan kembali ke bursa cari lowongan dalam beberapa saat.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePostSubmit} className="space-y-4">
                
                {/* Two-column details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Job Title */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Nama Pekerjaan / Lowongan <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Guru Honorer Bahasa Inggris"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Instansi / Nama Organisasi <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Sekolah Kristen Sion Kupang"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Job Category */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Kategori Pekerjaan <span className="text-rose-500">*</span></label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as JobOpportunity["category"])}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      <option value="Administrasi">Administrasi</option>
                      <option value="Pendidikan">Pendidikan</option>
                      <option value="Media & Kreatif">Media & Kreatif</option>
                      <option value="Sosial & Misi">Sosial & Misi</option>
                      <option value="Teknologi">Teknologi</option>
                      <option value="Layanan Umum">Layanan Umum</option>
                    </select>
                  </div>

                  {/* Job Type */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Tipe Kerja <span className="text-rose-500">*</span></label>
                    <select
                      value={newJobType}
                      onChange={(e) => setNewJobType(e.target.value as JobOpportunity["jobType"])}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Misi / Relawan">Misi / Relawan</option>
                      <option value="Remote">Remote</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Lokasi Kerja <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kupang, NTT (On-site)"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Salary range */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Kompensasi / Gaji <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Rp 2.500.000 - Rp 3.500.000"
                      value={newSalary}
                      onChange={(e) => setNewSalary(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Deskripsi Pekerjaan <span className="text-rose-500">*</span></label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tuliskan overview tugas utama dan gambaran lingkungan kerja secara informatif..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-normal text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed"
                  />
                </div>

                {/* Requirements */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Persyaratan / Kualifikasi (Satu baris untuk setiap poin)</label>
                  <textarea
                    rows={3}
                    placeholder="Satu kualifikasi per baris. Contoh:&#10;Pendidikan minimal D3 Keguruan&#10;Memiliki pengalaman minimal 1 tahun mengajar"
                    value={newRequirements}
                    onChange={(e) => setNewRequirements(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed"
                  />
                </div>

                {/* Responsibilities */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Tanggung Jawab Harian (Satu baris untuk setiap poin)</label>
                  <textarea
                    rows={3}
                    placeholder="Satu tanggung jawab per baris. Contoh:&#10;Mengajar murid kelas 1-3&#10;Menyusun rencana pembelajaran mingguan"
                    value={newResponsibilities}
                    onChange={(e) => setNewResponsibilities(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed"
                  />
                </div>

                {/* Contact Info */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Kontak Rekrutmen & Hubungi <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pdt. Samuel (0812-3456-7890) atau hrd@sion.org"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center space-x-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Pasang Lowongan Sekarang</span>
                  </button>
                </div>

              </form>
            )}
          </div>
        )}

        {/* TAB 3: DAFTAR PELAMAR VIEWS */}
        {jobTab === "applicants" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="font-display font-bold text-base text-slate-900">Daftar Pengajuan Lamaran Pekerjaan</h2>
              <p className="text-xs text-slate-400 mt-1">Daftar lengkap rekan-rekan Sioners yang melamar pekerjaan yang terpasang di database.</p>
              
              {applications.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Users2 className="h-10 w-10 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold">Belum ada pelamar yang mengajukan lamaran saat ini.</p>
                </div>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-3 px-4 text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Pelamar</th>
                        <th className="py-3 px-4 text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Posisi Pekerjaan</th>
                        <th className="py-3 px-4 text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Kontak Hubung</th>
                        <th className="py-3 px-4 text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Tanggal Apply</th>
                        <th className="py-3 px-4 text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Bio / Portofolio Singkat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {applications.map((app) => {
                        const associatedJob = jobs.find(j => j.id === app.jobId);
                        return (
                          <tr key={app.id} className="hover:bg-slate-50/50 transition-all text-xs">
                            <td className="py-4 px-4">
                              <div className="font-bold text-slate-900">{app.applicantName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{app.applicantEmail}</div>
                            </td>
                            <td className="py-4 px-4 font-semibold text-indigo-600">
                              {associatedJob ? associatedJob.title : "Pekerjaan Dihapus"}
                              <div className="text-[10px] text-slate-400 font-medium">{associatedJob?.company}</div>
                            </td>
                            <td className="py-4 px-4 font-mono font-medium text-slate-600">
                              {app.applicantPhone}
                            </td>
                            <td className="py-4 px-4 text-slate-500">
                              {app.appliedDate}
                            </td>
                            <td className="py-4 px-4 max-w-sm">
                              <div className="font-normal text-slate-600 line-clamp-2">
                                {app.applicantResume || "Tidak melampirkan berkas ringkasan."}
                              </div>
                              {app.notes && (
                                <div className="text-[10px] text-slate-400 italic mt-1 font-light">
                                  Catatan: "{app.notes}"
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* LAMAR LOWONGAN MODAL DIALOG */}
      {isApplyModalOpen && applyingJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl relative overflow-hidden p-6 sm:p-8 space-y-5">
            
            {/* Modal Title */}
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-mono">Formulir Pengajuan Lamaran</h3>
              <h2 className="text-base font-bold text-indigo-600 mt-1">{applyingJob.title}</h2>
              <p className="text-xs text-slate-500 font-medium">{applyingJob.company} - {applyingJob.location}</p>
            </div>

            {isSubmitSuccess ? (
              <div className="py-10 text-center space-y-3">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
                <h3 className="text-sm font-bold text-emerald-800">Lamaran Terkirim Sukses!</h3>
                <p className="text-xs text-emerald-600/90 leading-relaxed font-semibold">
                  Lamaran pekerjaan Anda telah dicatatkan dan dialokasikan ke perekrut {applyingJob.company}. Perekrut akan menghubungi nomor Anda segera.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                {/* Applicant Name */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Nama Lengkap Pelamar <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Maria Alexandra"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Nomor WA / Telepon <span className="text-rose-500">*</span></label>
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 0812-3456-7890"
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Alamat Email <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      placeholder="Contoh: maria@mail.com"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Short Resume/Bio */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Ringkasan Riwayat Pengalaman & Portofolio Singkat</label>
                  <textarea
                    rows={3}
                    placeholder="Tuliskan singkat perihal pengalaman Anda (pendidikan, keahlian mengajar, atau kualifikasi pendukung lainnya)..."
                    value={applicantResume}
                    onChange={(e) => setApplicantResume(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-normal text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed"
                  />
                </div>

                {/* Additional notes */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Pesan / Catatan Tambahan untuk Perekrut</label>
                  <input
                    type="text"
                    placeholder="Contoh: Siap diinterview kapan saja atau siap ditempatkan segera"
                    value={applicantNotes}
                    onChange={(e) => setApplicantNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsApplyModalOpen(false);
                      setApplyingJob(null);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/15 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Send className="h-3 w-3" />
                    <span>Kirim Lamaran</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
