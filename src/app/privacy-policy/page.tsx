import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | JobFusion',
  description: 'Privacy Policy for JobFusion.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl p-8 sm:p-12">
          <h1 className="text-4xl font-bold mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <span className="gradient-brand-text">Privacy </span>
            Policy
          </h1>
          <p className="text-muted-foreground mb-10">Last Updated: July 01, 2026</p>
          
          <div className="space-y-8 text-foreground/90 leading-relaxed">
            <p className="text-muted-foreground">At Job Fusion, accessible from job-fusion-omega.vercel.app, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Job Fusion and how we use it.</p>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Information We Collect</h2>
              <ul className="list-disc pl-6 space-y-4 text-muted-foreground">
                <li><strong className="text-foreground">Account Information:</strong> When you register for an account (as a Job Seeker or Employer), we may ask for your contact information, including items such as name, company name, email address, and telephone number.</li>
                <li><strong className="text-foreground">Profile & Resume Data:</strong> Job Seekers may upload resumes, CVs, work experience, education history, and skills to build their profiles.</li>
                <li><strong className="text-foreground">Log Files:</strong> Job Fusion follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>To provide, operate, and maintain our job portal platform.</li>
                <li>To connect Job Seekers with prospective Employers.</li>
                <li>To improve, personalize, and expand our website features.</li>
                <li>To communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website.</li>
                <li>To send you automated emails regarding job alerts or application statuses.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Data Sharing and Disclosure</h2>
              <ul className="list-disc pl-6 space-y-4 text-muted-foreground">
                <li><strong className="text-foreground">With Employers/Recruiters:</strong> If you apply for a job, your profile and resume data will be shared with the respective employer.</li>
                <li><strong className="text-foreground">Third-Party Service Providers:</strong> We may share your data with trusted third-party services that host our infrastructure, handle analytics, or manage email dispatching. We do not sell or rent your personal information to third parties.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
