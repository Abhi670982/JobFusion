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

// ─── Companies ───────────────────────────────────────────────────────────────

export const trustedCompanies = [
  { name: 'Razorpay', logo: 'R', color: '#2D6BE4' },
  { name: 'Flipkart', logo: 'F', color: '#F74E1F' },
  { name: 'Zoho', logo: 'Z', color: '#E42527' },
  { name: 'CRED', logo: 'C', color: '#1A1A2E' },
  { name: 'Swiggy', logo: 'S', color: '#FC8019' },
  { name: 'Zomato', logo: 'Z', color: '#E23744' },
  { name: 'Paytm', logo: 'P', color: '#00BAF2' },
  { name: 'Freshworks', logo: 'F', color: '#2BB34A' },
  { name: 'TCS', logo: 'T', color: '#0A2D6B' },
  { name: 'Infosys', logo: 'I', color: '#007CC3' },
  { name: 'Wipro', logo: 'W', color: '#341D63' },
  { name: 'HCL', logo: 'H', color: '#0F6CBD' },
];

// ─── Jobs ────────────────────────────────────────────────────────────────────

export const jobs: Job[] = [
  {
    id: 'j1',
    title: 'Senior Frontend Engineer',
    company: 'Razorpay',
    companyLogo: 'R',
    companyColor: '#2D6BE4',
    location: 'Bengaluru, Karnataka',
    locationType: 'hybrid',
    salary: '₹28L – ₹45L',
    salaryMin: 2800000,
    salaryMax: 4500000,
    experience: '4–7 years',
    experienceLevel: 'senior',
    type: 'full-time',
    skills: ['React', 'TypeScript', 'Next.js', 'GraphQL', 'Node.js'],
    matchScore: 94,
    postedAt: '2 hours ago',
    description:
      "Join Razorpay's world-class frontend team to build the financial infrastructure of India. You'll work on products used by 8M+ businesses and 100M+ customers across the country.",
    requirements: [
      '4+ years of frontend development experience',
      'Expert knowledge of React and TypeScript',
      'Experience with Next.js and modern build tools',
      'Strong understanding of web performance optimization',
      'Experience with GraphQL and REST APIs',
    ],
    responsibilities: [
      "Build and maintain Razorpay's core product interfaces",
      'Collaborate with design and product teams to ship features',
      'Drive frontend architecture decisions',
      'Mentor junior engineers on the team',
      'Improve developer experience and tooling',
    ],
    benefits: [
      'Competitive salary + ESOPs',
      'Comprehensive health & family insurance',
      'Flexible WFH policy',
      'Annual learning budget ₹50,000',
      'Cab facility & meal allowance',
      '24 paid leaves per year',
    ],
    applicants: 312,
    saved: true,
    featured: true,
    category: 'Engineering',
  },
  {
    id: 'j2',
    title: 'Product Designer',
    company: 'CRED',
    companyLogo: 'C',
    companyColor: '#1A1A2E',
    location: 'Bengaluru, Karnataka',
    locationType: 'onsite',
    salary: '₹20L – ₹32L',
    salaryMin: 2000000,
    salaryMax: 3200000,
    experience: '3–5 years',
    experienceLevel: 'mid',
    type: 'full-time',
    skills: ['Figma', 'Prototyping', 'User Research', 'Design Systems', 'Motion Design'],
    matchScore: 87,
    postedAt: '5 hours ago',
    description:
      "Help shape the future of premium consumer experiences at CRED. You'll design delightful, high-quality interfaces for India's most premium fintech platform.",
    requirements: [
      '3+ years of product design experience',
      'Expert-level Figma skills',
      'Experience with design systems',
      'Strong portfolio demonstrating end-to-end design process',
      'Understanding of front-end development principles',
    ],
    responsibilities: [
      'Own the design for key product areas',
      'Create wireframes, prototypes, and high-fidelity designs',
      'Conduct user research and usability testing',
      'Contribute to and evolve the design system',
      'Collaborate with PMs and engineers',
    ],
    benefits: [
      'Competitive salary + ESOPs',
      'Health, dental & vision insurance',
      'Flexible PTO',
      '₹30,000/year wellness stipend',
      'Home office budget',
      'Friday team lunches',
    ],
    applicants: 204,
    saved: false,
    featured: true,
    category: 'Design',
  },
  {
    id: 'j3',
    title: 'Staff ML Engineer',
    company: 'Flipkart',
    companyLogo: 'F',
    companyColor: '#F74E1F',
    location: 'Bengaluru, Karnataka',
    locationType: 'hybrid',
    salary: '₹45L – ₹80L',
    salaryMin: 4500000,
    salaryMax: 8000000,
    experience: '7+ years',
    experienceLevel: 'lead',
    type: 'full-time',
    skills: ['Python', 'PyTorch', 'Spark', 'Distributed Systems', 'LLMs'],
    matchScore: 76,
    postedAt: '1 day ago',
    description:
      "Work on AI/ML systems powering India's largest e-commerce platform. Help build recommendation engines, search ranking, and personalisation systems at massive scale.",
    requirements: [
      '7+ years of ML engineering experience',
      'Deep expertise in PyTorch or TensorFlow',
      'Experience with large-scale distributed training',
      'Publications in top ML venues preferred',
      'Strong Python and systems programming skills',
    ],
    responsibilities: [
      'Design and implement ML infrastructure at scale',
      'Optimise training and inference pipelines',
      'Collaborate with research team on model deployment',
      'Drive technical roadmap for ML systems',
    ],
    benefits: [
      'Industry-leading CTC + ESOPs',
      'Full health coverage for family',
      'Generous leave policy',
      'Conference & certification budget',
      'State-of-the-art compute resources',
    ],
    applicants: 489,
    saved: true,
    featured: false,
    category: 'Engineering',
  },
  {
    id: 'j4',
    title: 'Head of Growth Marketing',
    company: 'Zoho',
    companyLogo: 'Z',
    companyColor: '#E42527',
    location: 'Chennai, Tamil Nadu',
    locationType: 'onsite',
    salary: '₹22L – ₹35L',
    salaryMin: 2200000,
    salaryMax: 3500000,
    experience: '6+ years',
    experienceLevel: 'senior',
    type: 'full-time',
    skills: ['Growth Strategy', 'SEO', 'Product Marketing', 'Analytics', 'B2B SaaS'],
    matchScore: 71,
    postedAt: '2 days ago',
    description:
      "Lead growth initiatives at Zoho, a global SaaS company headquartered in Chennai. Build and execute strategies to accelerate user acquisition across 55+ product offerings.",
    requirements: [
      '6+ years in B2B SaaS marketing',
      'Proven track record of driving growth',
      'Experience with product-led growth strategies',
      'Strong analytical skills with data-driven approach',
      'Experience managing marketing teams',
    ],
    responsibilities: [
      'Own and execute growth strategy',
      'Build and lead a high-performing marketing team',
      'Drive demand generation programs',
      'Collaborate with product on PLG initiatives',
    ],
    benefits: [
      'Competitive CTC',
      'Employee stock options',
      'Comprehensive health benefits',
      'Generous learning budget',
      'Annual retreat',
    ],
    applicants: 147,
    saved: false,
    featured: false,
    category: 'Marketing',
  },
  {
    id: 'j5',
    title: 'Backend Engineer (Go)',
    company: 'Swiggy',
    companyLogo: 'S',
    companyColor: '#FC8019',
    location: 'Bengaluru, Karnataka',
    locationType: 'hybrid',
    salary: '₹18L – ₹30L',
    salaryMin: 1800000,
    salaryMax: 3000000,
    experience: '3–6 years',
    experienceLevel: 'mid',
    type: 'full-time',
    skills: ['Go', 'Microservices', 'Kafka', 'PostgreSQL', 'Kubernetes'],
    matchScore: 82,
    postedAt: '3 days ago',
    description:
      "Build the backend systems that power food delivery at scale for 100M+ Swiggy users. You'll work on high-throughput, low-latency microservices handling millions of orders daily.",
    requirements: [
      '3+ years of backend engineering experience',
      'Proficiency in Go or Java',
      'Experience with microservices architecture',
      'Knowledge of event-driven systems (Kafka)',
      'Strong understanding of distributed systems',
    ],
    responsibilities: [
      "Build and scale Swiggy's order management systems",
      'Optimize performance-critical code paths',
      'Design reliable distributed services',
      'Contribute to internal platform improvements',
    ],
    benefits: [
      'Competitive salary',
      'ESOPs',
      'Health & wellness benefits',
      'Free Swiggy credits ₹3,000/month',
      'Team retreats',
    ],
    applicants: 276,
    saved: false,
    featured: false,
    category: 'Engineering',
  },
  {
    id: 'j6',
    title: 'Senior Data Scientist',
    company: 'Paytm',
    companyLogo: 'P',
    companyColor: '#00BAF2',
    location: 'Noida, Uttar Pradesh',
    locationType: 'hybrid',
    salary: '₹25L – ₹40L',
    salaryMin: 2500000,
    salaryMax: 4000000,
    experience: '4–7 years',
    experienceLevel: 'senior',
    type: 'full-time',
    skills: ['Python', 'SQL', 'Machine Learning', 'A/B Testing', 'Spark'],
    matchScore: 88,
    postedAt: '4 days ago',
    description:
      "Help Paytm make smarter financial decisions through data. Work on fraud detection, credit scoring, and personalisation models serving 350M+ registered users.",
    requirements: [
      '4+ years of data science experience',
      'Strong ML and statistics background',
      'Expert SQL and Python skills',
      'Experience with large-scale data systems',
      'M.Tech / PhD in quantitative field preferred',
    ],
    responsibilities: [
      'Build and deploy ML models for core products',
      'Design and analyse A/B experiments',
      'Collaborate with product teams on data strategy',
      'Mentor junior data scientists',
    ],
    benefits: [
      'Competitive CTC + ESOPs',
      'Health insurance for family',
      'Flexible leave policy',
      '₹25,000 annual learning budget',
      'Relocation assistance',
    ],
    applicants: 341,
    saved: true,
    featured: false,
    category: 'Data',
  },
];

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
    icon: '🤖',
    title: 'AI-Powered Matching',
    description: 'Our proprietary AI analyses your skills, experience, and preferences to find your perfect role from India\'s top companies with up to 98% accuracy.',
    highlight: 'Up to 98% match accuracy',
  },
  {
    icon: '⚡',
    title: 'Instant Aggregation',
    description: 'We aggregate jobs from 500+ sources including LinkedIn, Naukri, company career pages, and niche tech job boards in real time.',
    highlight: '500+ sources aggregated',
  },
  {
    icon: '🎯',
    title: 'Smart Skill Gap Analysis',
    description: 'Understand exactly which skills you\'re missing for your dream role and get personalised learning recommendations to bridge the gap.',
    highlight: 'Personalised skill roadmap',
  },
  {
    icon: '📊',
    title: 'Salary Intelligence',
    description: 'Access real-time salary benchmarks in INR across cities and companies to negotiate with confidence and know your true market value.',
    highlight: 'Real-time ₹ salary data',
  },
  {
    icon: '🔔',
    title: 'Smart Alerts',
    description: 'Set personalised job alerts and get notified the moment a perfect opportunity appears — before it fills up. Never miss a hot role again.',
    highlight: 'Real-time notifications',
  },
  {
    icon: '📋',
    title: 'One-Click Apply',
    description: 'Apply to multiple jobs with your JobFusion profile. Track all applications in one beautiful dashboard. Built for the Indian job market.',
    highlight: 'Streamlined applications',
  },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────

export const testimonials = [
  {
    id: 't1',
    name: 'Riya Kapoor',
    role: 'Software Engineer at Razorpay',
    avatar: 'RK',
    avatarColor: '#6366f1',
    rating: 5,
    text: 'JobFusion completely changed my job search. The AI matched me with my dream role in just 2 weeks. The skill gap analysis was incredibly actionable — I knew exactly what to work on.',
    outcome: 'Hired in 2 weeks',
  },
  {
    id: 't2',
    name: 'Aditya Mehta',
    role: 'Product Manager at Zoho',
    avatar: 'AM',
    avatarColor: '#8b5cf6',
    rating: 5,
    text: 'I was spending hours every week searching across Naukri, LinkedIn, and dozens of company sites. JobFusion consolidated everything beautifully. The match scores are surprisingly accurate.',
    outcome: '10× faster search',
  },
  {
    id: 't3',
    name: 'Divya Krishnan',
    role: 'Data Scientist at Paytm',
    avatar: 'DK',
    avatarColor: '#06b6d4',
    rating: 5,
    text: 'The salary intelligence feature helped me negotiate ₹8L more than my initial offer. Having real INR benchmarks in negotiations is a total game-changer in the Indian market.',
    outcome: '₹8L salary increase',
  },
  {
    id: 't4',
    name: 'Karthik Iyer',
    role: 'Senior Designer at CRED',
    avatar: 'KI',
    avatarColor: '#f59e0b',
    rating: 5,
    text: 'As a designer, I love that JobFusion itself looks beautiful. But beyond aesthetics, the recommendations are spot-on for Indian companies. Landed my dream role after just 3 weeks.',
    outcome: 'Dream role in 3 weeks',
  },
];

// ─── Stats ────────────────────────────────────────────────────────────────────

export const platformStats = {
  jobsAggregated: '2.4M+',
  companies: '50K+',
  placements: '1.25L+',
  avgTimeToHire: '18 days',
};

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
