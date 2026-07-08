// ─── Types ───────────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  companyColor: string;
  location: string;
  locationType: 'remote' | 'hybrid' | 'onsite';
  salary: string;
  salaryMin: number;
  salaryMax: number;
  experience: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  skills: string[];
  matchScore: number;
  postedAt: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  applicants: number;
  saved: boolean;
  featured: boolean;
  category: string;
}

export interface Candidate {
  id: string;
  name: string;
  title: string;
  avatar: string;
  initials: string;
  location: string;
  experience: string;
  skills: string[];
  matchScore: number;
  availability: 'immediately' | 'two-weeks' | 'one-month' | 'not-looking';
  education: string;
  salary: string;
  bio: string;
}

export interface Notification {
  id: string;
  type: 'job_match' | 'application' | 'recruiter' | 'ai_recommendation' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
  icon?: string;
}

export interface Activity {
  id: string;
  type: 'applied' | 'saved' | 'viewed' | 'interview' | 'offer' | 'rejected';
  jobTitle: string;
  company: string;
  time: string;
  status?: string;
}



// ─── Jobs ────────────────────────────────────────────────────────────────────

export const jobs: Job[] = [];

// ─── Candidates ───────────────────────────────────────────────────────────────

export const candidates: Candidate[] = [
  {
    id: 'c1',
    name: 'Rahul Sharma',
    title: 'Senior Frontend Engineer',
    avatar: '',
    initials: 'RS',
    location: 'Bengaluru, Karnataka',
    experience: '6 years',
    skills: ['React', 'TypeScript', 'Next.js', 'GraphQL', 'Tailwind CSS'],
    matchScore: 96,
    availability: 'two-weeks',
    education: 'B.Tech CSE, IIT Delhi',
    salary: '₹28L – ₹45L',
    bio: 'Passionate frontend engineer with expertise in building scalable, performant web applications. Previously at Razorpay and Flipkart. Open to senior IC and lead roles.',
  },
  {
    id: 'c2',
    name: 'Priya Verma',
    title: 'Full Stack Developer',
    avatar: '',
    initials: 'PV',
    location: 'Gurugram, Haryana',
    experience: '4 years',
    skills: ['Node.js', 'React', 'PostgreSQL', 'AWS', 'Docker'],
    matchScore: 89,
    availability: 'immediately',
    education: 'B.Tech IT, DTU Delhi',
    salary: '₹18L – ₹28L',
    bio: 'Full-stack developer specialising in building robust APIs and delightful frontend experiences. Open source contributor with 3 popular npm packages.',
  },
  {
    id: 'c3',
    name: 'Ananya Gupta',
    title: 'Machine Learning Engineer',
    avatar: '',
    initials: 'AG',
    location: 'Hyderabad, Telangana',
    experience: '5 years',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'Kubernetes', 'MLOps'],
    matchScore: 85,
    availability: 'one-month',
    education: 'M.Tech AI, IIIT Hyderabad',
    salary: '₹35L – ₹55L',
    bio: 'ML engineer with deep expertise in NLP and recommendation systems. Previously built search ranking at Amazon India. Published researcher with 6 papers.',
  },
  {
    id: 'c4',
    name: 'Arjun Nair',
    title: 'Product Designer',
    avatar: '',
    initials: 'AN',
    location: 'Bengaluru, Karnataka',
    experience: '7 years',
    skills: ['Figma', 'User Research', 'Design Systems', 'Prototyping', 'Motion Design'],
    matchScore: 91,
    availability: 'two-weeks',
    education: 'B.Des, NID Ahmedabad',
    salary: '₹22L – ₹38L',
    bio: 'Product designer who shipped features used by 30M+ users at CRED and Swiggy. Led design teams of 8 and built end-to-end design systems from scratch.',
  },
  {
    id: 'c5',
    name: 'Vikram Singh',
    title: 'DevOps & Platform Engineer',
    avatar: '',
    initials: 'VS',
    location: 'Pune, Maharashtra',
    experience: '8 years',
    skills: ['Kubernetes', 'Terraform', 'AWS', 'Go', 'Prometheus'],
    matchScore: 78,
    availability: 'one-month',
    education: 'B.Tech CSE, NIT Trichy',
    salary: '₹30L – ₹50L',
    bio: 'Platform engineer who built and scaled infrastructure serving 50M+ daily requests at Zomato. AWS Certified Solutions Architect – Professional.',
  },
  {
    id: 'c6',
    name: 'Sneha Reddy',
    title: 'Senior Data Scientist',
    avatar: '',
    initials: 'SR',
    location: 'Hyderabad, Telangana',
    experience: '5 years',
    skills: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics'],
    matchScore: 83,
    availability: 'immediately',
    education: 'M.Sc Statistics, University of Hyderabad',
    salary: '₹22L – ₹38L',
    bio: 'Data scientist specialising in credit risk modelling and fraud detection. Helped reduce fraud losses by ₹40Cr/year at a leading NBFC through ML-driven decisions.',
  },
];

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'job_match',
    title: 'New Job Match',
    message: 'Senior Frontend Engineer at Razorpay matches 94% of your profile',
    time: '2 min ago',
    read: false,
    actionUrl: '/jobs/j1',
  },
  {
    id: 'n2',
    type: 'ai_recommendation',
    title: 'AI Recommendation',
    message: 'Based on your activity, 14 new positions match your skills this week',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 'n3',
    type: 'application',
    title: 'Application Viewed',
    message: 'Your application to Flipkart was viewed by a recruiter',
    time: '3 hours ago',
    read: false,
  },
  {
    id: 'n4',
    type: 'recruiter',
    title: 'New Message',
    message: 'Neha from Zoho wants to connect about a Senior Engineer role in Chennai',
    time: '5 hours ago',
    read: true,
  },
  {
    id: 'n5',
    type: 'application',
    title: 'Interview Scheduled',
    message: 'Your interview with CRED is confirmed for tomorrow at 11:00 AM IST',
    time: '1 day ago',
    read: true,
  },
  {
    id: 'n6',
    type: 'system',
    title: 'Profile Reminder',
    message: 'Complete your profile to increase your match rate by 40%',
    time: '2 days ago',
    read: true,
  },
  {
    id: 'n7',
    type: 'job_match',
    title: 'Job Alert',
    message: '11 new Senior Engineer roles posted in Bengaluru today',
    time: '2 days ago',
    read: true,
  },
];

// ─── Activities ────────────────────────────────────────────────────────────────

export const activities: Activity[] = [
  { id: 'a1', type: 'applied', jobTitle: 'Staff Engineer', company: 'Razorpay', time: '2 hours ago', status: 'Under Review' },
  { id: 'a2', type: 'interview', jobTitle: 'Senior Frontend Engineer', company: 'CRED', time: '1 day ago', status: 'Interview Scheduled' },
  { id: 'a3', type: 'saved', jobTitle: 'Principal Engineer', company: 'Zoho', time: '2 days ago' },
  { id: 'a4', type: 'viewed', jobTitle: 'Engineering Manager', company: 'Freshworks', time: '3 days ago' },
  { id: 'a5', type: 'applied', jobTitle: 'Senior Software Engineer', company: 'Flipkart', time: '4 days ago', status: 'Screening' },
  { id: 'a6', type: 'offer', jobTitle: 'Frontend Lead', company: 'Swiggy', time: '5 days ago', status: 'Offer Received' },
];

// ─── Features ─────────────────────────────────────────────────────────────────

export const features = [
  {
    icon: 'search',
    title: 'Multi-Source Aggregator',
    description: 'Dynamically aggregate jobs from top channels including LinkedIn, Internshala, and remote directories (via Jobicy) in real time.',
    highlight: 'Real-time multi-source sync',
  },
  {
    icon: 'file-text',
    title: 'AI Resume Parser',
    description: 'Upload your PDF resume to automatically extract your core skills, experience, and projects to instantly build your professional profile.',
    highlight: 'Instant profile generation',
  },
  {
    icon: 'brain',
    title: 'AI Skill Match Engine',
    description: 'Compare your skills against job requirements dynamically to calculate precise match compatibility scores.',
    highlight: 'Gemini-powered compatibility match',
  },
  {
    icon: 'history',
    title: 'Visited Jobs Tracking',
    description: 'Keep a private history of job openings you have viewed or clicked on to easily track your pipeline and follow up.',
    highlight: 'Automated history logging',
  },
  {
    icon: 'bar-chart',
    title: 'Dashboard Analytics',
    description: 'Visualize your job search activity, visits, and application status over the last 7 days with clear interactive charts.',
    highlight: 'Interactive activity charts',
  },
];



export const dashboardStats = {
  applied: 24,
  interviews: 6,
  offers: 2,
  savedJobs: 47,
  profileViews: 183,
  matchScore: 87,
  responseRate: 42,
  avgSalary: '₹38L',
};

// ─── Resume versions ──────────────────────────────────────────────────────────

export const resumeVersions = [
  { id: 'r1', name: 'Engineering Focus', updatedAt: '2 days ago', size: '524 KB', isDefault: true },
  { id: 'r2', name: 'Full Stack Generalist', updatedAt: '1 week ago', size: '498 KB', isDefault: false },
  { id: 'r3', name: 'Lead / Management', updatedAt: '3 weeks ago', size: '512 KB', isDefault: false },
];
