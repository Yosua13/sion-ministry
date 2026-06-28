import { DiscipleshipModule, Member, City, BeritaAcara, JurnalPA, DonationCampaign, DiscipleshipLink, JobOpportunity } from "../types";

export const initialCities: City[] = [
  {
    id: "city-1",
    name: "Surabaya",
    region: "Jawa Timur",
    reachedDate: "2021-03-15",
    workersCount: 8,
    membersCount: 45,
    journalsCount: 24,
  },
  {
    id: "city-2",
    name: "Kupang",
    region: "Nusa Tenggara Timur",
    reachedDate: "2022-07-20",
    workersCount: 5,
    membersCount: 32,
    journalsCount: 18,
  },
  {
    id: "city-3",
    name: "Pontianak",
    region: "Kalimantan Barat",
    reachedDate: "2023-01-10",
    workersCount: 4,
    membersCount: 22,
    journalsCount: 12,
  },
  {
    id: "city-4",
    name: "Toraja",
    region: "Sulawesi Selatan",
    reachedDate: "2023-09-05",
    workersCount: 6,
    membersCount: 29,
    journalsCount: 15,
  },
  {
    id: "city-5",
    name: "Manokwari",
    region: "Papua Barat",
    reachedDate: "2024-02-18",
    workersCount: 3,
    membersCount: 15,
    journalsCount: 8,
  }
];

export const initialModules: DiscipleshipModule[] = [
  {
    id: "mod-1",
    title: "Dasar Keselamatan: Kasih Allah yang Mengubah",
    category: "Dasar Iman",
    scripture: "Yohanes 3:16, Efesus 2:8-9",
    description: "Memahami esensi kasih Allah melalui pengorbanan Yesus Kristus di kayu salib dan bagaimana keselamatan diperoleh murni karena anugerah-Nya.",
    outline: [
      "1. Keadaan manusia sebelum mengenal Kristus (Roma 3:23)",
      "2. Solusi Allah atas dosa manusia melalui kematian Kristus (Roma 5:8)",
      "3. Keselamatan adalah Anugerah melalui Iman (Efesus 2:8-9)",
      "4. Respon manusia: Bertobat dan Percaya (Yohanes 1:12)"
    ],
    content: `### Dasar Keselamatan: Kasih Allah yang Mengubah

Keselamatan adalah pondasi utama dari kehidupan seorang pengikut Kristus. Sebagai pekerja Sion Ministry, memahami dan mampu menjelaskan kebenaran ini adalah langkah awal yang mutlak dalam pemuridan Amanat Agung.

#### 1. Keadaan Manusia yang Berdosa
Semua manusia telah berbuat dosa dan telah kehilangan kemuliaan Allah (Roma 3:23). Dosa mengakibatkan pemisahan rohani antara manusia dengan Allah yang Kudus. Upaya manusia melalui amal, moralitas, maupun ritual agama tidak akan pernah cukup untuk menjembatani jurang pemisah ini.

#### 2. Karya Salib Kristus
Allah menunjukkan kasih-Nya kepada kita dalam hal ini: Ketika kita masih berdosa, Kristus telah mati untuk kita (Roma 5:8). Yesus Kristus mengambil alih hukuman dosa kita di kayu salib. Kebangkitan-Nya membuktikan kemenangan atas maut dan dosa.

#### 3. Anugerah dan Iman
Sebab karena kasih karunia kamu diselamatkan oleh iman; itu bukan hasil usahamu, tetapi pemberian Allah (Efesus 2:8-9). Kita diselamatkan bukan karena perbuatan baik kita, melainkan agar kita dapat melakukan perbuatan baik yang telah Allah persiapkan sebelumnya.

#### 4. Respon Kita
Untuk mengalami keselamatan ini, manusia harus meresponi panggilan Allah dengan bertobat dari jalan yang salah dan menerima Yesus Kristus sebagai Tuhan dan Juru Selamat pribadi secara pribadi (Yohanes 1:12).`,
    readingTime: 8,
    isDownloaded: true,
  },
  {
    id: "mod-2",
    title: "Amanat Agung: Memuridkan Bangsa-bangsa",
    category: "Amanat Agung",
    scripture: "Matius 28:19-20, Kisah Para Rasul 1:8",
    description: "Menggali makna panggilan Amanat Agung sebagai gaya hidup, bukan sekadar program gerejawi, serta bagaimana menerapkannya secara lokal.",
    outline: [
      "1. Otoritas penuh Kristus sebagai dasar utusan (Matius 28:18)",
      "2. Perintah Utama: 'Jadikanlah Semua Bangsa Murid-Ku'",
      "3. Tiga pilar praktis: Pergi, Membaptis, dan Mengajar",
      "4. Janji Penyertaan Kristus sampai akhir zaman (Matius 28:20)"
    ],
    content: `### Amanat Agung: Memuridkan Bangsa-bangsa

Amanat Agung dalam Matius 28:19-20 adalah kompas dan DNA dari Sion Ministry. Setiap pekerja dipanggil bukan hanya untuk menjadi pengamat rohani, melainkan pengambil bagian aktif dalam melipatgandakan murid Yesus.

#### 1. Dasar Pemuridan: Otoritas Kristus
"Kepada-Ku telah diberikan segala kuasa di sorga dan di bumi." (Matius 28:18). Kita melangkah melakukan pemuridan bukan dengan kekuatan, talenta, atau otoritas pribadi, melainkan di bawah otoritas kedaulatan Kristus yang telah mengalahkan kuasa kegelapan.

#### 2. Perintah Utama: Menjadikan Murid
Kata kerja aktif utama dalam Amanat Agung bahasa Yunani adalah *matheteuo* yang berarti "jadikanlah murid". Fokus utama kita adalah membantu seseorang bertumbuh meniru Kristus secara utuh dalam hidup sehari-hari, bukan sekadar mencatat keputusan petobat baru di atas kertas.

#### 3. Tiga Aktivitas Pendukung
- **Pergi (Going):** Memiliki inisiatif keluar menjangkau jiwa-jiwa baru di kota-kota kita.
- **Membaptis (Baptizing):** Menuntun mereka masuk dalam komitmen yang sah dengan Allah Tritunggal dan tubuh Kristus (Gereja).
- **Mengajar (Teaching):** Melatih mereka untuk melakukan segala sesuatu yang telah diperintahkan-Nya, bukan sekadar transfer pengetahuan kognitif rohani.

#### 4. Penyertaan yang Sempurna
"Dan ketahuilah, Aku menyertai kamu senantiasa sampai kepada akhir zaman." Janji ini memberikan jaminan dan keberanian bagi para pekerja yang melayani bahkan di area terpencil sekalipun.`,
    readingTime: 10,
    isDownloaded: true,
  },
  {
    id: "mod-3",
    title: "Karakter Kristus: Integritas & Kerendahan Hati",
    category: "Karakter Kristus",
    scripture: "Filipi 2:1-8, Galatia 5:22-23",
    description: "Mempelajari pentingnya pertumbuhan karakter batiniah seorang pemurid yang menyerupai karakter Kristus sendiri, khususnya kerendahan hati.",
    outline: [
      "1. Pikiran dan perasaan yang terdapat juga dalam Kristus (Filipi 2:5)",
      "2. Melepaskan hak demi melayani sesama (Filipi 2:6-7)",
      "3. Ketaatan total kepada kehendak Bapa (Filipi 2:8)",
      "4. Buah Roh sebagai indikator karakter yang matang"
    ],
    content: `### Karakter Kristus: Integritas & Kerendahan Hati

Pelayanan yang berbuah lebat mengalir dari kehidupan batiniah yang sehat. Karakter seorang pemurid jauh lebih bersuara dibanding khotbahnya. Kita harus memuridkan dengan keteladanan karakter.

#### 1. Pikiran dan Perasaan Kristus
"Hendaklah kamu dalam hidupmu bersama, menaruh pikiran dan perasaan yang terdapat juga dalam Kristus Yesus" (Filipi 2:5). Ini berarti memiliki perspektif hidup, prioritas, dan belas kasihan yang sejalan dengan Kristus.

#### 2. Teladan Pengosongan Diri (*Kenosis*)
Yesus yang walaupun dalam rupa Allah, tidak menganggap kesetaraan dengan Allah itu sebagai milik yang harus dipertahankan, melainkan telah mengosongkan diri-Nya sendiri, dan mengambil rupa seorang hamba (Filipi 2:6-7). Kerendahan hati rohani berarti bersedia merendahkan hati untuk menolong jiwa yang paling terpuruk sekalipun.

#### 3. Integritas dan Ketaatan
Yesus taat sampai mati, bahkan sampai mati di kayu salib. Integritas berarti melakukan kebenaran saat tidak ada orang lain yang melihat. Pekerja Sion Ministry menjaga kemurnian hidup rohani, keuangan, dan relasi sosial.

#### 4. Buah Roh dalam Pemuridan
Buah Roh (kasih, sukacita, damai sejahtera, kesabaran, kemurahan, kebaikan, kesetiaan, kelemahlembutan, penguasaan diri) adalah buah alami dari persekutuan intim dengan Roh Kudus. Karakter inilah yang menarik jemaat untuk rindu dimuridkan.`,
    readingTime: 12,
    isDownloaded: false,
  },
  {
    id: "mod-4",
    title: "Kepemimpinan Pelayan: Memimpin seperti Yesus",
    category: "Kepemimpinan",
    scripture: "Markus 10:42-45, Yohanes 13:13-17",
    description: "Mendefinisikan kepemimpinan kristiani yang berfokus pada melayani, membimbing, dan memberdayakan murid-murid baru untuk menjadi pemimpin berikutnya.",
    outline: [
      "1. Perbedaan kepemimpinan sekuler dan kepemimpinan kerajaan Allah",
      "2. Yesus sebagai teladan Pemimpin yang Membasuh Kaki",
      "3. Membangun kepercayaan melalui kredibilitas rohani",
      "4. Melakukan delegasi dan multiplikasi kepemimpinan"
    ],
    content: `### Kepemimpinan Pelayan: Memimpin seperti Yesus

Di Sion Academy, tujuan akhir dari pemuridan adalah melahirkan pemimpin-pemimpin pelayan (servant leaders) yang siap diutus ke kota-kota lain untuk mereplikasi siklus Amanat Agung ini.

#### 1. Model Kepemimpinan Kerajaan Allah
Yesus menegaskan bahwa pemimpin di dunia memerintah dengan tangan besi, "Tidaklah demikian di antara kamu. Barangsiapa ingin menjadi besar di antara kamu, hendaklah ia menjadi pelayanmu." (Markus 10:43-44). Esensi kepemimpinan kita adalah melayani pertumbuhan rohani orang-orang yang kita pimpin.

#### 2. Pembasuhan Kaki Murid
Yohanes 13 mencatat Yesus membasuh kaki murid-murid-Nya. Sebagai Guru dan Tuhan, Yesus mengambil peran sebagai hamba yang paling rendah. Tindakan membasuh kaki melambangkan kesediaan kita untuk menanggung kelemahan murid, membersihkan dan memulihkan mereka dengan kasih rohani.

#### 3. Multiplikasi Pemimpin
Tujuan pemuridan bukan membuat murid bergantung selamanya pada mentor mereka, melainkan mendewasakan mereka agar mereka sendiri mampu memimpin orang lain. Model ini kita sebut model multiplikasi 4 generasi (2 Timotius 2:2).`,
    readingTime: 9,
    isDownloaded: false,
  }
];

export const initialMembers: Member[] = [
  {
    id: "mem-1",
    name: "Yosua Reynaldi Manurun",
    cityId: "city-1",
    cityName: "Surabaya",
    phone: "081234567890",
    discipleshipStage: "Pembuat Murid",
    mentorName: "Ev. Stefanus",
    joinedDate: "2021-04-01",
    status: "active",
  },
  {
    id: "mem-2",
    name: "Maria Alexandra",
    cityId: "city-1",
    cityName: "Surabaya",
    phone: "085298765432",
    discipleshipStage: "Murid Bertumbuh",
    mentorName: "Yosua Reynaldi",
    joinedDate: "2022-02-15",
    status: "active",
  },
  {
    id: "mem-3",
    name: "Samuel Ndolu",
    cityId: "city-2",
    cityName: "Kupang",
    phone: "082111222333",
    discipleshipStage: "Murid Baru",
    mentorName: "Pdt. Markus",
    joinedDate: "2022-09-01",
    status: "active",
  },
  {
    id: "mem-4",
    name: "Yoseph Christo",
    cityId: "city-2",
    cityName: "Kupang",
    phone: "081344556677",
    discipleshipStage: "Pra-Murid",
    mentorName: "Samuel Ndolu",
    joinedDate: "2024-05-10",
    status: "active",
  },
  {
    id: "mem-5",
    name: "Christina Natalia",
    cityId: "city-3",
    cityName: "Pontianak",
    phone: "089677889900",
    discipleshipStage: "Murid Bertumbuh",
    mentorName: "Ev. Rachel",
    joinedDate: "2023-03-22",
    status: "active",
  },
  {
    id: "mem-6",
    name: "Lukas Tandirerung",
    cityId: "city-4",
    cityName: "Toraja",
    phone: "081122334455",
    discipleshipStage: "Pembuat Murid",
    mentorName: "Ev. Yulius",
    joinedDate: "2023-10-01",
    status: "active",
  }
];

export const initialBeritaAcara: BeritaAcara[] = [
  {
    id: "ber-1",
    cityId: "city-1",
    cityName: "Surabaya",
    title: "Kebaktian Umum Sion Raya Regional Jawa Timur",
    date: "2026-06-20",
    workerName: "Yosua Reynaldi",
    activityType: "Sion Raya (SR)",
    attendeesCount: 150,
    description: "Ibadah raya gabungan jemaat sel Surabaya, Sidoarjo, dan sekitarnya berjalan dengan penuh sukacita dan hadirat Tuhan. Dilaksanakan altar call bagi jemaat yang rindu memperbarui komitmen pemuridan dasar mereka.",
    images: [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1471623322304-7e9c9b9ce370?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&auto=format&fit=crop&q=80"
    ],
    synced: true
  },
  {
    id: "ber-2",
    cityId: "city-4",
    cityName: "Toraja",
    title: "Ekspedisi Pekabaran Injil & Doa Keliling Pedalaman Toraja Barat",
    date: "2026-06-25",
    workerName: "Lukas Tandirerung",
    activityType: "Misi Pedalaman",
    attendeesCount: 45,
    description: "Melakukan perjalanan misi sejauh 15 km melewati rute pegunungan untuk menjangkau jemaat pedalaman di Lembang Simbuang. Mengadakan doa keliling untuk pemulihan tanah, pertanian, dan kesiapan hati jemaat menerima pengajaran firman.",
    images: [
      "https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=80"
    ],
    synced: true
  },
  {
    id: "ber-3",
    cityId: "city-2",
    cityName: "Kupang",
    title: "Pertemuan Komsel & Persekutuan Doa Sion Kupang",
    date: "2026-06-22",
    workerName: "Samuel Ndolu",
    activityType: "Persekutuan Doa Sion (PDS)",
    attendeesCount: 22,
    description: "Melaksanakan persekutuan doa berkala kelompok sel jemaat Kupang. Mengangkat pokok-pokok doa bagi bangsa-negara, pelayanan misi Sion global, serta penggalangan beasiswa bagi anak asuh pemuridan.",
    images: [
      "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&auto=format&fit=crop&q=80"
    ],
    synced: true
  }
];

export const initialJurnalPA: JurnalPA[] = [
  {
    id: "pa-1",
    cityId: "city-1",
    cityName: "Surabaya",
    theme: "Lahir Baru dan Kepastian Keselamatan",
    scripture: "Yohanes 3:1-16 & Efesus 2:8-9",
    focus: "Menuntun mentee memahami esensi kelahiran kembali di dalam Kristus",
    date: "2026-06-21",
    mentorName: "Yosua Reynaldi",
    menteeName: "Maria Alexandra",
    notes: "Maria menunjukkan antusiasme yang luar biasa. Ia banyak bertanya perihal perbuatan baik vs anugerah keselamatan. Di akhir sesi, kami berdoa bersama dan Maria mendapatkan kepastian iman yang teguh.",
    image: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600&auto=format&fit=crop&q=80",
    synced: true
  },
  {
    id: "pa-2",
    cityId: "city-2",
    cityName: "Kupang",
    theme: "Membangun Mezbah Doa Keluarga",
    scripture: "Yosua 24:14-15",
    focus: "Mendorong mentee memimpin ibadah mezbah keluarga secara mandiri",
    date: "2026-06-24",
    mentorName: "Samuel Ndolu",
    menteeName: "Yoseph Christo",
    notes: "Yoseph siap berkomitmen untuk menginisiasi mezbah doa setiap malam bersama istri dan anaknya. Sesi PA dilakukan di kediamannya dengan sangat hangat.",
    image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&auto=format&fit=crop&q=80",
    synced: true
  }
];

export const initialDonationCampaigns: DonationCampaign[] = [
  {
    id: "cam-1",
    title: "Peduli Bencana Banjir Bandang & Tanah Longsor NTT",
    category: "Bencana Alam",
    targetAmount: 50000000,
    collectedAmount: 38750000,
    description: "Hujan deras berhari-hari memicu musibah banjir bandang di wilayah pinggiran Kupang. Beberapa rumah jemaat dan pos pemuridan Sion Ministry mengalami kerusakan berat. Mari bergotong-royong memberikan bantuan bahan makanan pokok, air bersih, pakaian layak pakai, dan dana renovasi pos pelayanan.",
    bannerUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=80",
    donorsCount: 48,
    daysRemaining: 15
  },
  {
    id: "cam-2",
    title: "Dana Beasiswa Misionaris & Anak Asuh Sion Academy",
    category: "Beasiswa Pendidikan",
    targetAmount: 40000000,
    collectedAmount: 18200000,
    description: "Investasi berharga untuk masa depan amanat agung. Program ini bertujuan menggalang dana pendidikan (beasiswa SPP, buku, penunjang belajar) bagi anak-anak pekerja misionaris di pelosok tanah air dan mentee muda berprestasi yang terkendala biaya sekolah.",
    bannerUrl: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&auto=format&fit=crop&q=80",
    donorsCount: 29,
    daysRemaining: 30
  },
  {
    id: "cam-3",
    title: "Pembangunan Kapel Misi & Sekolah Dasar Sion Papua",
    category: "Pembangunan Gereja",
    targetAmount: 150000000,
    collectedAmount: 45000000,
    description: "Mari bersama-sama mewujudkan sarana ibadah dan tempat belajar pemuridan yang layak di pedalaman Manokwari, Papua Barat. Tempat ini akan digunakan untuk pusat pembekalan pemuda, sekolah Alkitab anak-anak, dan pusat ketrampilan hidup jemaat lokal.",
    bannerUrl: "https://images.unsplash.com/photo-1541976844346-f18aeac57b06?w=800&auto=format&fit=crop&q=80",
    donorsCount: 15,
    daysRemaining: 45
  }
];

export const initialLinks: DiscipleshipLink[] = [
  {
    id: "lnk-1",
    title: "Buku Saku Pekerja Sion Ministry",
    url: "https://sion-academy.org/resources/buku_saku_pekerja.pdf",
    description: "Pedoman praktis etika, visi, misi, dan doktrin utama Sion Ministry dalam melayani di lapangan.",
    category: "Buku Panduan",
  },
  {
    id: "lnk-2",
    title: "Formulir Pendaftaran Jemaat Baru",
    url: "https://sion-academy.org/forms/registrasi_jemaat",
    description: "Tautan cepat untuk mengisi data diri jemaat baru yang bergabung dalam persekutuan sel pemuridan.",
    category: "Formulir",
  },
  {
    id: "lnk-3",
    title: "Video Pembekalan Pemuridan Matius 28",
    url: "https://youtube.com/watch?v=sion_academy_training",
    description: "Video penjelasan dari Ev. Stefanus tentang cara efektif menggunakan kurikulum Sion Academy di lapangan.",
    category: "Video Pengajaran",
  }
];

export const initialJobs: JobOpportunity[] = [
  {
    id: "job-1",
    title: "Guru Pendidikan Anak Usia Dini (PAUD) Misi",
    company: "Sekolah Kasih Sion Kupang",
    logoUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop&q=80",
    location: "Kupang, NTT (On-site)",
    salary: "Rp 2.000.000 - Rp 3.000.000",
    jobType: "Misi / Relawan",
    category: "Pendidikan",
    description: "Membantu mendidik, membimbing, dan menanamkan nilai-nilai karakter Kristiani sejak usia dini bagi anak-anak jemaat dan warga lokal di pos misi Kupang. Peran ini sangat strategis dalam membangun fondasi iman generasi masa depan.",
    requirements: [
      "Memiliki hati yang rindu melayani anak-anak di daerah misi",
      "Pendidikan minimal D3/S1 PAUD, Keguruan, atau memiliki pengalaman mengajar",
      "Sabar, kreatif, komunikatif, dan mampu menyusun materi belajar menarik",
      "Bersedia ditempatkan di Kupang, NTT minimal selama 1 tahun pelayanan"
    ],
    responsibilities: [
      "Mengajar anak-anak usia 3-6 tahun dengan kurikulum terpadu akademis dan karakter",
      "Menyusun rencana pembelajaran mingguan (RPP)",
      "Berkoordinasi dengan orang tua murid perihal tumbuh kembang anak",
      "Mengadakan persekutuan doa dan ibadah kreatif kelas mingguan"
    ],
    contactInfo: "Hubungi Pdt. Samuel Ndolu (0812-3921-2345)",
    postedDate: "2026-06-20",
    status: "open",
    applicantsCount: 3
  },
  {
    id: "job-2",
    title: "Social Media & Video Creator Specialist",
    company: "Sion Creative Media Center",
    logoUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=200&auto=format&fit=crop&q=80",
    location: "Jakarta Barat (Hybrid)",
    salary: "Rp 5.500.000 - Rp 7.500.000",
    jobType: "Full-time",
    category: "Media & Kreatif",
    description: "Sion Creative Media membutuhkan seorang kreator konten yang bersemangat untuk memproduksi konten digital inovatif guna menyebarluaskan kesaksian, bahan pemuridan, dan kampanye donasi kemanusiaan melalui platform Instagram, TikTok, dan YouTube.",
    requirements: [
      "Menguasai software editing video seperti Premiere Pro, CapCut, atau After Effects",
      "Mampu membuat konsep konten visual/video yang kekinian dan komunikatif",
      "Terbiasa mengelola media sosial profesional dan membaca metrik performansi konten",
      "Memiliki portofolio video kreatif yang dapat dilampirkan"
    ],
    responsibilities: [
      "Membuat perencanaan kalender konten mingguan",
      "Melakukan shooting dan editing video pendek untuk reels, shorts, dan TikTok",
      "Menulis naskah konten dan mengarahkan pengisi suara / presenter",
      "Berkolaborasi dengan desainer grafis dan tim jurnalis misi lapangan"
    ],
    contactInfo: "Email HRD: media@sion-ministry.org (Subject: Kreator Media)",
    postedDate: "2026-06-25",
    status: "open",
    applicantsCount: 8
  },
  {
    id: "job-3",
    title: "Staf Administrasi & Pengolah Data Jemaat",
    company: "Yayasan Sion Care Indonesia",
    logoUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&auto=format&fit=crop&q=80",
    location: "Surabaya, Jawa Timur (On-site)",
    salary: "Rp 3.500.000 - Rp 4.500.000",
    jobType: "Contract",
    category: "Administrasi",
    description: "Bertanggung jawab atas kerapihan berkas administrasi yayasan, koordinasi donasi, serta pengolahan data jemaat binaan di seluruh Indonesia menggunakan platform Sion Academy database untuk memastikan pelaporan yang akurat.",
    requirements: [
      "Teliti, jujur, terorganisir, dan memiliki manajemen waktu yang baik",
      "Mahir menggunakan Microsoft Excel/Google Sheets dan database kearsipan",
      "Pendidikan minimal SMA/SMK dengan pengalaman administrasi 1 tahun",
      "Mampu berkomunikasi dengan baik dan bekerja sama dalam tim lintas divisi"
    ],
    responsibilities: [
      "Melakukan pencatatan administrasi surat masuk/keluar yayasan",
      "Memelihara database jemaat, mentor, dan mentee agar selalu mutakhir",
      "Menyusun laporan administrasi bulanan pengiriman bahan ajar ke daerah-daerah",
      "Membantu verifikasi pencatatan donasi masuk bersama tim keuangan"
    ],
    contactInfo: "Hubungi Ibu Maria (0857-1122-3344) atau kirim CV ke admin@sioncare.or.id",
    postedDate: "2026-06-26",
    status: "open",
    applicantsCount: 1
  },
  {
    id: "job-4",
    title: "Pekerja Misionaris Lapangan (Perintis Pos)",
    company: "Sion Mission Board",
    logoUrl: "https://images.unsplash.com/photo-1541976844346-f18aeac57b06?w=200&auto=format&fit=crop&q=80",
    location: "Manokwari Barat, Papua (On-site)",
    salary: "Komparasi Pelayanan & Tunjangan Hidup",
    jobType: "Misi / Relawan",
    category: "Sosial & Misi",
    description: "Tugas panggilan agung untuk melayani, merintis pos pemuridan baru, mendampingi masyarakat suku pedalaman, serta mendirikan bimbingan belajar gratis bagi anak-anak usia sekolah dasar di pedalaman Manokwari.",
    requirements: [
      "Lulusan Sekolah Teologia, Sekolah Alkitab, atau pelatihan pekerja misi Sion",
      "Memiliki ketahanan fisik yang kuat untuk tinggal di wilayah pedalaman",
      "Memiliki keterampilan hidup praktis (mengajar, berkebun, pertolongan pertama medis)",
      "Berkomitmen tinggi mendampingi masyarakat secara holistik minimal 2 tahun"
    ],
    responsibilities: [
      "Mengadakan bimbingan belajar baca-tulis-hitung bagi anak-anak sekitar pos misi",
      "Melakukan perkunjungan rumah jemaat secara konsisten dan membina kelompok PA",
      "Mengadakan ibadah hari Minggu dan mengoordinasikan kegiatan kemanusiaan",
      "Melaporkan berkala perkembangan jiwa ke pusat pelaporan Sion Academy"
    ],
    contactInfo: "Pdt. Yosua Reynaldi (0811-9988-7766)",
    postedDate: "2026-06-15",
    status: "open",
    applicantsCount: 5
  }
];

