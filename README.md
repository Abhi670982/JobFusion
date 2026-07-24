# 🚀 JobFusion

**JobFusion** is an AI-powered job search platform that aggregates opportunities from multiple job portals into a single dashboard. It helps job seekers discover relevant opportunities, analyze resumes using AI, match jobs based on skills, and manage applications efficiently.

Built with **Next.js**, **TypeScript**, **Prisma**, **MongoDB**, **Clerk Authentication**, and **Dodo Payments**, JobFusion provides a modern, scalable, and intelligent job-hunting experience.

---

## ✨ Features

### 🔍 Unified Job Search
- Aggregate jobs from multiple job portals.
- Smart search and filtering.
- Duplicate job prevention.
- Personalized recommendations.

### 🤖 AI-Powered Features
- Resume Parsing
- Skill Extraction
- AI Job Matching
- Profile Extraction
- BYOK (Bring Your Own API Key)
- Support for:
  - Google Gemini
  - OpenAI
  - Anthropic Claude

### 👤 User Dashboard
- Personalized profile
- Saved jobs
- Applied jobs
- AI usage tracking
- Subscription management

### 💳 Subscription System
- Free & Premium plans
- Dodo Payments integration
- Secure webhook handling
- Billing management

### 🔐 Authentication
- Clerk Authentication
- Protected routes
- User profile management

### ⚡ Performance
- Centralized AI provider architecture
- Optimized database queries
- Secure API design
- Responsive UI
- TypeScript throughout

---

# 🛠 Tech Stack

### Frontend
- Next.js 15
- React
- TypeScript
- Tailwind CSS
- Framer Motion

### Backend
- Next.js Route Handlers
- Prisma ORM
- MongoDB

### Authentication
- Clerk

### AI
- Google Gemini
- OpenAI
- Anthropic Claude

### Payments
- Dodo Payments

### Deployment
- Vercel

---

# 📂 Project Structure

```
src/
├── app/
├── components/
├── lib/
├── hooks/
├── prisma/
├── types/
└── utils/
```

---

# 🚀 Getting Started

## Clone the repository

```bash
git clone https://github.com/your-username/JobFusion.git
cd JobFusion
```

## Install dependencies

```bash
npm install
```

## Configure Environment Variables

Create a `.env.local` file and add the required environment variables.

Example:

```env
DATABASE_URL=

CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

GOOGLE_GEMINI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

DODO_SECRET_KEY=
DODO_WEBHOOK_SECRET=
```

## Run Development Server

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

# 📸 Screenshots

> Add screenshots of:

- Home Page
- Dashboard
- Job Search
- Match My Skills
- AI Providers
- Pricing
- Billing

---

# 🔄 AI Provider Architecture

JobFusion supports a centralized AI provider system.

Priority Order:

```
User BYOK
      ↓
JobFusion Premium Provider
      ↓
Free Daily Credits
      ↓
Limit Reached
```

Once a user connects their own API key, all AI-powered features automatically use the user's provider without consuming JobFusion's AI quota.

---

# 🔐 Security

- Encrypted API key storage
- Secure authentication with Clerk
- Protected API routes
- Environment variable isolation
- Secure payment webhook verification

---

# 🌟 Future Roadmap

- AI Resume Review
- ATS Score Checker
- Resume Tailoring
- Cover Letter Generator
- Interview Preparation
- Job Alerts
- Recruiter Dashboard
- Analytics Dashboard

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/new-feature
```

3. Commit your changes

```bash
git commit -m "Add new feature"
```

4. Push the branch

```bash
git push origin feature/new-feature
```

5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Abhishek Chauhan**

- GitHub: https://github.com/Abhi670982
- LinkedIn: *(Add your LinkedIn profile link)*

---

⭐ If you like this project, consider giving it a **Star** on GitHub!
