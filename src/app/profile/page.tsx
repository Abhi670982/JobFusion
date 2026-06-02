'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, MapPin, Briefcase, GraduationCap, Award, Code2,
  Upload, Plus, Edit3, Star, CheckCircle2,
  Link2, ExternalLink, Globe, Camera, Phone, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';

const skills = [
  { name: 'React', level: 95 },
  { name: 'TypeScript', level: 90 },
  { name: 'Next.js', level: 88 },
  { name: 'Node.js', level: 78 },
  { name: 'GraphQL', level: 72 },
  { name: 'PostgreSQL', level: 65 },
];

const experiences = [
  {
    id: 1,
    company: 'Razorpay',
    role: 'Senior Frontend Engineer',
    period: 'Jan 2023 – Present',
    duration: '2 yrs 5 mos',
    description:
      'Led frontend architecture for Razorpay\'s payment dashboard. Built core UI components used by 8M+ merchants. Reduced page load time by 40% through code splitting and optimisations.',
    skills: ['React', 'TypeScript', 'Next.js'],
    companyColor: '#2D6BE4',
    logo: 'R',
  },
  {
    id: 2,
    company: 'Flipkart',
    role: 'Frontend Engineer',
    period: 'Jun 2021 – Dec 2022',
    duration: '1 yr 7 mos',
    description:
      "Worked on Flipkart's seller portal and checkout flows. Contributed to the Flipkart UI design system and improved mobile conversion rate by 12%.",
    skills: ['React', 'Redux', 'WebPerf'],
    companyColor: '#F74E1F',
    logo: 'F',
  },
  {
    id: 3,
    company: 'Zoho',
    role: 'Software Engineer',
    period: 'Jul 2019 – May 2021',
    duration: '1 yr 11 mos',
    description:
      'Built features for Zoho CRM and Zoho Creator. Owned the SaaS analytics dashboard that served 50K+ enterprise customers globally.',
    skills: ['JavaScript', 'Java', 'MySQL'],
    companyColor: '#E42527',
    logo: 'Z',
  },
];

const education = [
  {
    school: 'IIT Delhi',
    degree: 'B.Tech Computer Science & Engineering',
    period: '2015 – 2019',
    logo: 'IIT',
    color: '#003580',
  },
  {
    school: 'Delhi Public School, R.K. Puram',
    degree: 'CBSE Class XII – Science',
    period: '2013 – 2015',
    logo: 'DPS',
    color: '#8B1A1A',
  },
];

const certifications = [
  { name: 'AWS Solutions Architect – Professional', issuer: 'Amazon Web Services', year: '2023', icon: '☁️' },
  { name: 'Meta Frontend Developer Certificate', issuer: 'Meta', year: '2022', icon: '📱' },
  { name: 'Google UX Design Certificate', issuer: 'Google', year: '2021', icon: '🎨' },
];

const projects = [
  {
    name: 'PayTrack',
    description: 'Open-source payment analytics dashboard with 2.8k GitHub stars. Used by 200+ Indian startups.',
    tech: ['TypeScript', 'Next.js', 'Prisma'],
    link: '#',
    stars: '2.8k',
  },
  {
    name: 'RupeeUI',
    description: 'India-focused React component library with INR formatting, GST calculators, and UPI flows.',
    tech: ['React', 'Storybook', 'Tailwind'],
    link: '#',
    stars: '1.4k',
  },
];

const completionItems = [
  { label: 'Basic information', done: true },
  { label: 'Work experience', done: true },
  { label: 'Education', done: true },
  { label: 'Skills', done: true },
  { label: 'Resume uploaded', done: false },
  { label: 'Projects', done: false },
  { label: 'Profile photo', done: false },
];

function SectionCard({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="card-premium p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold flex items-center gap-2 text-sm">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const completedCount = completionItems.filter((i) => i.done).length;
  const completion = Math.round((completedCount / completionItems.length) * 100);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 mobile-header-offset page-content">
        <Navbar />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-5xl mx-auto w-full space-y-4 lg:space-y-5">
          <div className="mb-4">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-jakarta), sans-serif' }}>
              My Profile
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Keep your profile updated to get better job matches
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Profile Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-premium p-6 text-center"
              >
                <div className="relative inline-block mb-4">
                  <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                    <AvatarFallback className="text-2xl font-bold gradient-brand text-white">
                      RS
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h2
                  className="text-xl font-bold mb-1"
                  style={{ fontFamily: 'var(--font-jakarta), sans-serif' }}
                >
                  Rahul Sharma
                </h2>
                <p className="text-muted-foreground text-sm mb-1">Senior Frontend Engineer</p>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-4">
                  <MapPin className="w-3 h-3" />
                  Bengaluru, Karnataka · Open to Remote
                </div>
                <div className="flex justify-center gap-2 mb-5">
                  {[Link2, ExternalLink, Globe].map((Icon, i) => (
                    <a
                      key={i}
                      href="#"
                      className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
                <Separator className="mb-4" />
                <div className="text-left space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" /> Experience
                    </span>
                    <span className="font-medium">6 years</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </span>
                    <span className="font-medium text-xs">rahul@example.com</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone
                    </span>
                    <span className="font-medium text-xs">+91 98765 43210</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Salary</span>
                    <span className="font-medium">₹28L – ₹45L</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Notice Period</span>
                    <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 rounded-full px-2 border">
                      30 days
                    </Badge>
                  </div>
                </div>
              </motion.div>

              {/* Profile Completion */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card-premium p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Profile Strength</h3>
                  <span className="text-sm font-bold text-primary">{completion}%</span>
                </div>
                <Progress value={completion} className="h-2 mb-4" />
                <div className="space-y-2">
                  {completionItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      {item.done ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 flex-shrink-0" />
                      )}
                      <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Skills */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <SectionCard
                  title="Skills"
                  icon={Code2}
                  action={
                    <Button size="sm" variant="ghost" className="rounded-lg gap-1.5 text-xs h-8">
                      <Plus className="w-3.5 h-3.5" />
                      Add Skill
                    </Button>
                  }
                >
                  <div className="space-y-4">
                    {skills.map((skill) => (
                      <div key={skill.name}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium">{skill.name}</span>
                          <span className="text-muted-foreground text-xs">{skill.level}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.level}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="h-full rounded-full gradient-brand"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </motion.div>

              {/* Experience */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SectionCard
                  title="Work Experience"
                  icon={Briefcase}
                  action={
                    <Button size="sm" variant="ghost" className="rounded-lg gap-1.5 text-xs h-8">
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </Button>
                  }
                >
                  <div className="space-y-5">
                    {experiences.map((exp, i) => (
                      <div key={exp.id}>
                        <div className="flex gap-4">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: exp.companyColor }}
                          >
                            {exp.logo}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-sm">{exp.role}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {exp.company} · {exp.period} · {exp.duration}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="rounded-lg p-1 h-auto flex-shrink-0"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                              {exp.description}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {exp.skills.map((s) => (
                                <Badge key={s} variant="secondary" className="text-[10px] rounded-md px-2">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        {i < experiences.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </motion.div>

              {/* Education */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <SectionCard title="Education" icon={GraduationCap}>
                  <div className="space-y-4">
                    {education.map((edu) => (
                      <div key={edu.school} className="flex gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 text-center leading-tight"
                          style={{ backgroundColor: edu.color }}
                        >
                          {edu.logo}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{edu.school}</h4>
                          <p className="text-xs text-muted-foreground">
                            {edu.degree} · {edu.period}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </motion.div>

              {/* Certifications */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <SectionCard title="Certifications" icon={Award}>
                  <div className="space-y-3">
                    {certifications.map((cert) => (
                      <div
                        key={cert.name}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                      >
                        <span className="text-2xl">{cert.icon}</span>
                        <div>
                          <p className="text-sm font-medium">{cert.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {cert.issuer} · {cert.year}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </motion.div>

              {/* Projects */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <SectionCard
                  title="Projects"
                  icon={Code2}
                  action={
                    <Button size="sm" variant="ghost" className="rounded-lg gap-1.5 text-xs h-8">
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </Button>
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {projects.map((proj) => (
                      <div
                        key={proj.name}
                        className="border border-border rounded-xl p-4 hover:border-primary/40 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {proj.name}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-amber-500">
                            <Star className="w-3 h-3 fill-amber-500" />
                            {proj.stars}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                          {proj.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {proj.tech.map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px] rounded-md px-1.5">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
