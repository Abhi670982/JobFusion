import { Metadata } from 'next';
import Link from 'next/link';
import { Search, Clock, Database, MonitorSmartphone, GraduationCap, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | JobFusion',
  description: 'Learn more about JobFusion, our mission, and why we are the best platform for job discovery.',
};

export default function AboutUsPage() {
  const whyChooseUs = [
    {
      title: 'Unified Search',
      description: 'Search jobs from multiple platforms in one place.',
      icon: Search,
    },
    {
      title: 'Time Saving',
      description: 'Save time with a unified job search experience.',
      icon: Clock,
    },
    {
      title: 'Vast Opportunities',
      description: 'Access thousands of updated job opportunities.',
      icon: Database,
    },
    {
      title: 'Modern Interface',
      description: 'Clean, fast, and responsive interface.',
      icon: MonitorSmartphone,
    },
    {
      title: 'For Everyone',
      description: 'Designed for students, freshers, and experienced professionals.',
      icon: GraduationCap,
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Hero Section */}
        <div className="text-center mb-20 mt-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            About <span className="gradient-brand-text">JobFusion</span>
          </h1>
          <p className="text-xl text-foreground font-medium mb-8">
            Your career journey starts with one search.
          </p>
          <div className="text-muted-foreground text-lg max-w-3xl mx-auto space-y-6 leading-relaxed">
            <p>
              JobFusion is a job discovery platform that brings together opportunities from multiple job portals and company career pages into one seamless search experience. Instead of searching across different websites, users can explore thousands of opportunities from a single platform, making the job search faster, easier, and more organized.
            </p>
            <p>
              Whether you're a student, a recent graduate, or an experienced professional, JobFusion helps you discover opportunities that align with your skills, interests, and career goals.
            </p>
          </div>
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-24">
          <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl p-10 hover:border-primary/30 transition-all duration-300 shadow-sm">
            <h2 className="text-3xl font-bold mb-4 gradient-brand-text inline-block" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Our Mission</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              To simplify the job search process by bringing opportunities from multiple trusted sources into one reliable platform, helping people discover their next career opportunity with ease.
            </p>
          </div>
          <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl p-10 hover:border-primary/30 transition-all duration-300 shadow-sm">
            <h2 className="text-3xl font-bold mb-4 gradient-brand-text inline-block" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Our Vision</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              To become the most trusted destination for job discovery by providing a simple, fast, and unified search experience for job seekers worldwide.
            </p>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Why Choose JobFusion?
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="bg-card/20 border border-border/50 rounded-2xl p-6 flex flex-col items-center text-center hover:bg-card/40 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-secondary/50 to-primary/50"></div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Ready to find your next role?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 font-medium">
            JobFusion — One Search. Every Opportunity.
          </p>
          <Link 
            href="/jobs" 
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/25"
          >
            Start Searching Jobs
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
