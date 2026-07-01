import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | JobFusion',
  description: 'Terms of Service for JobFusion.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl p-8 sm:p-12">
          <h1 className="text-4xl font-bold mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <span className="gradient-brand-text">Terms of </span>
            Service
          </h1>
          <p className="text-muted-foreground mb-10">Last Updated: July 01, 2026</p>
          
          <div className="space-y-8 text-foreground/90 leading-relaxed">
            <p className="text-muted-foreground">Welcome to Job Fusion! These terms and conditions outline the rules and regulations for the use of Job Fusion's Website, located at job-fusion-omega.vercel.app.</p>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">By accessing this website, we assume you accept these terms and conditions. Do not continue to use Job Fusion if you do not agree to take all of the terms and conditions stated on this page.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. User Accounts</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>You must provide accurate, complete, and current information when creating an account.</li>
                <li>You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.</li>
                <li>Job Fusion reserves the right to terminate accounts that engage in fraudulent behavior, spamming, or posting fake job opportunities.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Acceptable Use Policy</h2>
              <p className="text-muted-foreground mb-4">As a user, you agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Post inaccurate, false, or misleading resume/job details.</li>
                <li>Post any defamatory, abusive, offensive, or unlawful material.</li>
                <li>Use any automated systems (robots, scrapers) to extract data from Job Fusion without prior written consent.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Limitation of Liability</h2>
              <p className="text-muted-foreground">Job Fusion acts as a platform to connect job seekers and employers. We do not screen or censor the listings, nor do we guarantee the validity of any job offers or candidate profiles. In no event shall Job Fusion, nor its directors or employees, be held liable for anything arising out of or in any way connected with your use of this website.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
