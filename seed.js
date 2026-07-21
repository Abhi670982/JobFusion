// seed.js — Prisma/Supabase seed script (rewritten from MongoDB version)
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const jobsData = [
  {
    title: "Senior Frontend Engineer",
    company: "Razorpay",
    companyLogo: "R",
    companyColor: "#2D6BE4",
    location: "Bengaluru, Karnataka",
    locationType: "hybrid",
    salary: "₹28L – ₹45L",
    salaryMin: 2800000,
    salaryMax: 4500000,
    experience: "4–7 years",
    experienceLevel: "senior",
    type: "full_time",
    skills: ["React", "TypeScript", "Next.js", "GraphQL", "Node.js"],
    matchScore: 94,
    postedAt: "2 hours ago",
    description:
      "Join Razorpay's world-class frontend team to build the financial infrastructure of India. You'll work on products used by 8M+ businesses and 100M+ customers across the country.",
    requirements: [
      "4+ years of frontend development experience",
      "Expert knowledge of React and TypeScript",
      "Experience with Next.js and modern build tools",
      "Strong understanding of web performance optimization",
      "Experience with GraphQL and REST APIs",
    ],
    responsibilities: [
      "Build and maintain Razorpay's core product interfaces",
      "Collaborate with design and product teams to ship features",
      "Drive frontend architecture decisions",
      "Mentor junior engineers on the team",
      "Improve developer experience and tooling",
    ],
    benefits: [
      "Competitive salary + ESOPs",
      "Comprehensive health & family insurance",
      "Flexible WFH policy",
      "Annual learning budget ₹50,000",
      "Cab facility & meal allowance",
      "24 paid leaves per year",
    ],
    applicants: 312,
    featured: true,
    category: "Engineering",
    source: "careers",
    applyUrl: "https://razorpay.com/jobs/",
  },
  {
    title: "Product Designer",
    company: "CRED",
    companyLogo: "C",
    companyColor: "#1A1A2E",
    location: "Bengaluru, Karnataka",
    locationType: "onsite",
    salary: "₹20L – ₹32L",
    salaryMin: 2000000,
    salaryMax: 3200000,
    experience: "3–5 years",
    experienceLevel: "mid",
    type: "full_time",
    skills: ["Figma", "Prototyping", "User Research", "Design Systems", "Motion Design"],
    matchScore: 87,
    postedAt: "5 hours ago",
    description:
      "Help shape the future of premium consumer experiences at CRED. You'll design delightful, high-quality interfaces for India's most premium fintech platform.",
    requirements: [
      "3+ years of product design experience",
      "Expert-level Figma skills",
      "Experience with design systems",
      "Strong portfolio demonstrating end-to-end design process",
      "Understanding of front-end development principles",
    ],
    responsibilities: [
      "Own the design for key product areas",
      "Create wireframes, prototypes, and high-fidelity designs",
      "Conduct user research and usability testing",
      "Contribute to and evolve the design system",
      "Collaborate with PMs and engineers",
    ],
    benefits: [
      "Competitive salary + ESOPs",
      "Health, dental & vision insurance",
      "Flexible PTO",
      "₹30,000/year wellness stipend",
      "Home office budget",
      "Friday team lunches",
    ],
    applicants: 204,
    featured: true,
    category: "Design",
    source: "careers",
    applyUrl: "https://careers.cred.club/",
  },
  {
    title: "Staff ML Engineer",
    company: "Flipkart",
    companyLogo: "F",
    companyColor: "#F74E1F",
    location: "Bengaluru, Karnataka",
    locationType: "hybrid",
    salary: "₹45L – ₹80L",
    salaryMin: 4500000,
    salaryMax: 8000000,
    experience: "7+ years",
    experienceLevel: "lead",
    type: "full_time",
    skills: ["Python", "PyTorch", "Spark", "Distributed Systems", "LLMs"],
    matchScore: 76,
    postedAt: "1 day ago",
    description:
      "Work on AI/ML systems powering India's largest e-commerce platform. Help build recommendation engines, search ranking, and personalisation systems at massive scale.",
    requirements: [
      "7+ years of ML engineering experience",
      "Deep expertise in PyTorch or TensorFlow",
      "Experience with large-scale distributed training",
      "Publications in top ML venues preferred",
      "Strong Python and systems programming skills",
    ],
    responsibilities: [
      "Design and implement ML infrastructure at scale",
      "Optimise training and inference pipelines",
      "Collaborate with research team on model deployment",
      "Drive technical roadmap for ML systems",
    ],
    benefits: [
      "Industry-leading CTC + ESOPs",
      "Full health coverage for family",
      "Generous leave policy",
      "Conference & certification budget",
      "State-of-the-art compute resources",
    ],
    applicants: 489,
    featured: false,
    category: "Engineering",
    source: "careers",
    applyUrl: "https://www.flipkartcareers.com/",
  },
  {
    title: "Head of Growth Marketing",
    company: "Zoho",
    companyLogo: "Z",
    companyColor: "#E42527",
    location: "Chennai, Tamil Nadu",
    locationType: "onsite",
    salary: "₹22L – ₹35L",
    salaryMin: 2200000,
    salaryMax: 3500000,
    experience: "6+ years",
    experienceLevel: "senior",
    type: "full_time",
    skills: ["Growth Strategy", "SEO", "Product Marketing", "Analytics", "B2B SaaS"],
    matchScore: 71,
    postedAt: "2 days ago",
    description:
      "Lead growth initiatives at Zoho, a global SaaS company headquartered in Chennai. Build and execute strategies to accelerate user acquisition across 55+ product offerings.",
    requirements: [
      "6+ years in B2B SaaS marketing",
      "Proven track record of driving growth",
      "Experience with product-led growth strategies",
      "Strong analytical skills with data-driven approach",
      "Experience managing marketing teams",
    ],
    responsibilities: [
      "Own and execute growth strategy",
      "Build and lead a high-performing marketing team",
      "Drive demand generation programs",
      "Collaborate with product on PLG initiatives",
    ],
    benefits: [
      "Competitive CTC",
      "Employee stock options",
      "Comprehensive health benefits",
      "Generous learning budget",
      "Annual retreat",
    ],
    applicants: 147,
    featured: false,
    category: "Marketing",
    source: "careers",
    applyUrl: "https://www.zoho.com/careers/",
  },
  {
    title: "Backend Engineer (Go)",
    company: "Swiggy",
    companyLogo: "S",
    companyColor: "#FC8019",
    location: "Bengaluru, Karnataka",
    locationType: "hybrid",
    salary: "₹18L – ₹30L",
    salaryMin: 1800000,
    salaryMax: 3000000,
    experience: "3–6 years",
    experienceLevel: "mid",
    type: "full_time",
    skills: ["Go", "Microservices", "Kafka", "PostgreSQL", "Kubernetes"],
    matchScore: 82,
    postedAt: "3 days ago",
    description:
      "Build the backend systems that power food delivery at scale for 100M+ Swiggy users. You'll work on high-throughput, low-latency microservices handling millions of orders daily.",
    requirements: [
      "3+ years of backend engineering experience",
      "Proficiency in Go or Java",
      "Experience with microservices architecture",
      "Knowledge of event-driven systems (Kafka)",
      "Strong understanding of distributed systems",
    ],
    responsibilities: [
      "Build and scale Swiggy's order management systems",
      "Optimize performance-critical code paths",
      "Design reliable distributed services",
      "Contribute to internal platform improvements",
    ],
    benefits: [
      "Competitive salary",
      "ESOPs",
      "Health & wellness benefits",
      "Free Swiggy credits ₹3,000/month",
      "Team retreats",
    ],
    applicants: 276,
    featured: false,
    category: "Engineering",
    source: "careers",
    applyUrl: "https://careers.swiggy.com/",
  },
  {
    title: "Senior Data Scientist",
    company: "Paytm",
    companyLogo: "P",
    companyColor: "#00BAF2",
    location: "Noida, Uttar Pradesh",
    locationType: "hybrid",
    salary: "₹25L – ₹40L",
    salaryMin: 2500000,
    salaryMax: 4000000,
    experience: "4–7 years",
    experienceLevel: "senior",
    type: "full_time",
    skills: ["Python", "SQL", "Machine Learning", "A/B Testing", "Spark"],
    matchScore: 88,
    postedAt: "4 days ago",
    description:
      "Help Paytm make smarter financial decisions through data. Work on fraud detection, credit scoring, and personalisation models serving 350M+ registered users.",
    requirements: [
      "4+ years of data science experience",
      "Strong ML and statistics background",
      "Expert SQL and Python skills",
      "Experience with large-scale data systems",
      "M.Tech / PhD in quantitative field preferred",
    ],
    responsibilities: [
      "Build and deploy ML models for core products",
      "Design and analyse A/B experiments",
      "Collaborate with product teams on data strategy",
      "Mentor junior data scientists",
    ],
    benefits: [
      "Competitive CTC + ESOPs",
      "Health insurance for family",
      "Flexible leave policy",
      "₹25,000 annual learning budget",
      "Relocation assistance",
    ],
    applicants: 341,
    featured: false,
    category: "Data",
    source: "careers",
    applyUrl: "https://careers.paytm.com/",
  },
];

async function seed() {
  console.log("🌱 Starting seed...");

  // Seed global settings
  await prisma.settings.upsert({
    where: { settingsId: "global" },
    update: {},
    create: { settingsId: "global" },
  });
  console.log("✅ Settings seeded.");

  // Clear existing jobs to avoid duplicates on re-run
  await prisma.job.deleteMany({});
  console.log("🗑️  Cleared existing jobs.");

  // Seed jobs
  const now = new Date();
  const getPostedDate = (postedAt, index) => {
    const d = new Date(now);
    if (postedAt === "2 hours ago") d.setHours(d.getHours() - 2);
    else if (postedAt === "5 hours ago") d.setHours(d.getHours() - 5);
    else if (postedAt === "1 day ago") d.setDate(d.getDate() - 1);
    else if (postedAt === "2 days ago") d.setDate(d.getDate() - 2);
    else if (postedAt === "3 days ago") d.setDate(d.getDate() - 3);
    else if (postedAt === "4 days ago") d.setDate(d.getDate() - 4);
    else d.setMinutes(d.getMinutes() - index);
    return d;
  };

  const seededJobs = [];
  for (let i = 0; i < jobsData.length; i++) {
    const jobData = jobsData[i];
    const postedAtDate = getPostedDate(jobData.postedAt, i);
    const job = await prisma.job.create({
      data: {
        ...jobData,
        postedAtDate,
        fetchedAt: postedAtDate,
        createdAt: postedAtDate,
      },
    });
    seededJobs.push(job);
    console.log(`  ✅ Job: ${job.title} @ ${job.company}`);
  }
  console.log(`✅ ${seededJobs.length} jobs seeded.`);

  // Seed a demo user + profile
  const demoUser = await prisma.user.upsert({
    where: { email: "rahul@example.com" },
    update: {},
    create: {
      clerkId: "user_demo_seed_123",
      fullName: "Rahul Sharma",
      email: "rahul@example.com",
      role: "jobseeker",
    },
  });
  console.log("✅ Demo user seeded:", demoUser.fullName);

  const existingProfile = await prisma.profile.findUnique({
    where: { userId: demoUser.id },
  });

  if (!existingProfile) {
    const profile = await prisma.profile.create({
      data: {
        userId: demoUser.id,
        headline: "Senior Frontend Engineer at Razorpay",
        bio: "Passionate frontend engineer with expertise in building scalable, performant web applications. Previously at Razorpay and Flipkart. Open to senior IC and lead roles.",
        location: "Bengaluru, Karnataka",
        experience: "6 years",
        resumeUrl: "https://jobfusion-resumes.s3.amazonaws.com/rahul-sharma-eng.pdf",
        expectedSalary: "₹28L – ₹45L",
        isOnboarded: true,
        skills: {
          create: [
            { name: "React", level: 95 },
            { name: "TypeScript", level: 90 },
            { name: "Next.js", level: 88 },
            { name: "Node.js", level: 78 },
            { name: "GraphQL", level: 72 },
            { name: "PostgreSQL", level: 65 },
          ],
        },
        experiences: {
          create: [
            {
              company: "Razorpay",
              role: "Senior Frontend Engineer",
              period: "Jan 2023 – Present",
              duration: "2 yrs 5 mos",
              description:
                "Led frontend architecture for Razorpay's payment dashboard. Built core UI components used by 8M+ merchants. Reduced page load time by 40% through code splitting and optimisations.",
              skills: ["React", "TypeScript", "Next.js"],
              companyColor: "#2D6BE4",
              logo: "R",
            },
            {
              company: "Flipkart",
              role: "Frontend Engineer",
              period: "Jun 2021 – Dec 2022",
              duration: "1 yr 7 mos",
              description:
                "Worked on Flipkart's seller portal and checkout flows. Contributed to the Flipkart UI design system and improved mobile conversion rate by 12%.",
              skills: ["React", "Redux", "WebPerf"],
              companyColor: "#F74E1F",
              logo: "F",
            },
            {
              company: "Zoho",
              role: "Software Engineer",
              period: "Jul 2019 – May 2021",
              duration: "1 yr 11 mos",
              description:
                "Built features for Zoho CRM and Zoho Creator. Owned the SaaS analytics dashboard that served 50K+ enterprise customers globally.",
              skills: ["JavaScript", "Java", "MySQL"],
              companyColor: "#E42527",
              logo: "Z",
            },
          ],
        },
        education: {
          create: [
            {
              school: "IIT Delhi",
              degree: "B.Tech Computer Science & Engineering",
              period: "2015 – 2019",
              logo: "IIT",
              color: "#003580",
            },
            {
              school: "Delhi Public School, R.K. Puram",
              degree: "CBSE Class XII – Science",
              period: "2013 – 2015",
              logo: "DPS",
              color: "#8B1A1A",
            },
          ],
        },
        certifications: {
          create: [
            { name: "AWS Solutions Architect – Professional", issuer: "Amazon Web Services", year: "2023", iconName: "cloud" },
            { name: "Meta Frontend Developer Certificate", issuer: "Meta", year: "2022", iconName: "smartphone" },
            { name: "Google UX Design Certificate", issuer: "Google", year: "2021", iconName: "palette" },
          ],
        },
        projects: {
          create: [
            {
              name: "PayTrack",
              description: "Open-source payment analytics dashboard with 2.8k GitHub stars. Used by 200+ Indian startups.",
              tech: ["TypeScript", "Next.js", "Prisma"],
              link: "#",
              stars: "2.8k",
            },
            {
              name: "RupeeUI",
              description: "India-focused React component library with INR formatting, GST calculators, and UPI flows.",
              tech: ["React", "Storybook", "Tailwind"],
              link: "#",
              stars: "1.4k",
            },
          ],
        },
      },
    });
    console.log("✅ Profile seeded for:", demoUser.fullName);

    // Seed applications for demo user
    await prisma.application.createMany({
      data: [
        {
          userId: demoUser.id,
          jobId: seededJobs[0].id,
          status: "Applied",
          appliedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          userId: demoUser.id,
          jobId: seededJobs[1].id,
          status: "Interview",
          appliedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        {
          userId: demoUser.id,
          jobId: seededJobs[2].id,
          status: "Under_Review",
          appliedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
      ],
    });
    console.log("✅ Applications seeded.");
  } else {
    console.log("ℹ️  Profile already exists, skipping profile & applications seed.");
  }

  console.log("\n🎉 Seed complete!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
