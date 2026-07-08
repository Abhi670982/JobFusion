import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy | JobFusion',
  description: 'Refund Policy for JobFusion services.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl p-8 sm:p-12">
          <h1 className="text-4xl font-bold mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <span className="gradient-brand-text">Refund </span>
            Policy
          </h1>
          <p className="text-muted-foreground mb-10">Last Updated: July 01, 2026</p>
          
          <div className="space-y-8 text-foreground/90 leading-relaxed">
            <p className="text-muted-foreground">
              Thank you for choosing JobFusion. If you are not entirely satisfied with your purchase, we're here to help.
            </p>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Refund Eligibility</h2>
              <ul className="list-disc pl-6 space-y-4 text-muted-foreground">
                <li><strong className="text-foreground">Premium Subscriptions:</strong> You have 7 calendar days to request a refund from the date you subscribed. To be eligible for a refund, your usage of the premium features must fall within our acceptable trial threshold.</li>
                <li><strong className="text-foreground">Non-refundable Services:</strong> One-time services, such as professional resume reviews or promoted job listings, are non-refundable once the service has been initiated or delivered.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Requesting a Refund</h2>
              <p className="text-muted-foreground">
                To request a refund, please contact our support team at support@jobfusion.com with your account details and the reason for the refund request. We will notify you of the approval or rejection of your refund within 3-5 business days.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
