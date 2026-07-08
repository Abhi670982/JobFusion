import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Company | JobFusion',
  description: 'Learn about JobFusion company information.',
};

export default function CompanyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl p-8 sm:p-12">
          <h1 className="text-4xl font-bold mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <span className="gradient-brand-text">Company </span>
            Information
          </h1>
          
          <div className="space-y-8 text-foreground/90 leading-relaxed">
            <p className="text-muted-foreground">
              JobFusion is dedicated to bringing you the best opportunities from across the web. Our company operates with the belief that finding a job should be a simple, unified process.
            </p>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Our Core Values</h2>
              <ul className="list-disc pl-6 space-y-4 text-muted-foreground">
                <li><strong className="text-foreground">Transparency:</strong> We strive to provide clear and accurate information about every job listing.</li>
                <li><strong className="text-foreground">Innovation:</strong> We continuously improve our AI algorithms to match candidates with their ideal roles.</li>
                <li><strong className="text-foreground">Empowerment:</strong> We equip job seekers with the tools they need to succeed in their career journey.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
