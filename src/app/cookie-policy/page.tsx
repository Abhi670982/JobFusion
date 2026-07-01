import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | JobFusion',
  description: 'Cookie Policy for JobFusion.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl p-8 sm:p-12">
          <h1 className="text-4xl font-bold mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <span className="gradient-brand-text">Cookie </span>
            Policy
          </h1>
          <p className="text-muted-foreground mb-10">Last Updated: July 01, 2026</p>
          
          <div className="space-y-8 text-foreground/90 leading-relaxed">
            <p className="text-muted-foreground">This Cookie Policy explains what cookies are and how we use them on Job Fusion.</p>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">What Are Cookies?</h2>
              <p className="text-muted-foreground">Cookies are small text files that are used to store small pieces of information. They are stored on your device when the website is loaded on your browser. They help us make the website function properly, make it more secure, and provide a better user experience.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Cookies</h2>
              <ul className="list-disc pl-6 space-y-4 text-muted-foreground">
                <li><strong className="text-foreground">Essential/Authentication Cookies:</strong> These are necessary for the core functionality of our site. For example, staying logged into your Job Fusion account as you browse different pages requires these cookies.</li>
                <li><strong className="text-foreground">Preference Cookies:</strong> These allow our website to remember choices you make (like language preferences or dark/light mode configurations).</li>
                <li><strong className="text-foreground">Analytics & Performance Cookies:</strong> We may use third-party analytics services (such as Google Analytics) to monitor and analyze the use of our service, helping us improve the job-searching experience.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Managing Your Cookie Preferences</h2>
              <p className="text-muted-foreground">You can choose to disable cookies through your individual browser options. To know more detailed information about cookie management with specific web browsers, it can be found at the browsers' respective websites.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
