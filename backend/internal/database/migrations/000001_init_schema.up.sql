-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT,
    reached_date TEXT,
    workers_count INT DEFAULT 0,
    members_count INT DEFAULT 0,
    journals_count INT DEFAULT 0,
    berita_count INT DEFAULT 0,
    jurnal_pa_count INT DEFAULT 0
);

-- Create discipleship_modules table
CREATE TABLE IF NOT EXISTS discipleship_modules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    scripture TEXT,
    description TEXT,
    outline TEXT[], -- Array of outline steps
    content TEXT,
    reading_time INT DEFAULT 0,
    is_downloaded BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE
);

-- Create members table
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city_id TEXT REFERENCES cities(id) ON DELETE SET NULL,
    city_name TEXT,
    phone TEXT,
    discipleship_stage TEXT,
    mentor_name TEXT,
    joined_date TEXT,
    status TEXT
);

-- Create berita_acaras table
CREATE TABLE IF NOT EXISTS berita_acaras (
    id TEXT PRIMARY KEY,
    city_id TEXT REFERENCES cities(id) ON DELETE SET NULL,
    city_name TEXT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    worker_name TEXT,
    activity_type TEXT,
    attendees_count INT DEFAULT 0,
    description TEXT,
    images TEXT[] -- Array of image URLs
);

-- Create jurnal_pas table
CREATE TABLE IF NOT EXISTS jurnal_pas (
    id TEXT PRIMARY KEY,
    city_id TEXT REFERENCES cities(id) ON DELETE SET NULL,
    city_name TEXT,
    theme TEXT NOT NULL,
    scripture TEXT,
    focus TEXT,
    date TEXT NOT NULL,
    mentor_name TEXT,
    mentee_name TEXT,
    notes TEXT,
    image TEXT
);

-- Create donation_campaigns table
CREATE TABLE IF NOT EXISTS donation_campaigns (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    target_amount DOUBLE PRECISION DEFAULT 0.0,
    collected_amount DOUBLE PRECISION DEFAULT 0.0,
    description TEXT,
    banner_url TEXT,
    donors_count INT DEFAULT 0,
    days_remaining INT DEFAULT 0
);

-- Create donation_records table
CREATE TABLE IF NOT EXISTS donation_records (
    id TEXT PRIMARY KEY,
    campaign_id TEXT REFERENCES donation_campaigns(id) ON DELETE CASCADE,
    campaign_title TEXT,
    donor_name TEXT,
    amount DOUBLE PRECISION NOT NULL,
    message TEXT,
    date TEXT NOT NULL,
    payment_method TEXT
);

-- Create discipleship_links table
CREATE TABLE IF NOT EXISTS discipleship_links (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    category TEXT
);

-- Create job_opportunities table
CREATE TABLE IF NOT EXISTS job_opportunities (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    logo_url TEXT,
    location TEXT,
    salary TEXT,
    job_type TEXT,
    category TEXT,
    description TEXT,
    requirements TEXT[],
    responsibilities TEXT[],
    contact_info TEXT,
    posted_date TEXT NOT NULL,
    status TEXT,
    applicants_count INT DEFAULT 0
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
    id TEXT PRIMARY KEY,
    job_id TEXT REFERENCES job_opportunities(id) ON DELETE CASCADE,
    applicant_name TEXT NOT NULL,
    applicant_phone TEXT,
    applicant_email TEXT,
    applicant_resume TEXT,
    applied_date TEXT NOT NULL,
    notes TEXT
);
