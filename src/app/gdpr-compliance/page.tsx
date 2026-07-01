import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GDPR Compliance | JobFusion',
  description: 'Information regarding JobFusion\'s compliance with the General Data Protection Regulation.',
};

export default function GDPRCompliancePage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl p-8 sm:p-12">
          <h1 className="text-4xl font-bold mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <span className="gradient-brand-text">GDPR </span>
            Compliance
          </h1>
          <p className="text-muted-foreground mb-10">Last Updated: July 1, 2026</p>
          
          <div className="space-y-8 text-foreground/90 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Commitment to GDPR</h2>
              <p>JobFusion is fully committed to complying with the General Data Protection Regulation (GDPR) to ensure the protection and privacy of personal data for all our users in the European Union (EU) and European Economic Area (EEA).</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Your GDPR Rights</h2>
              <p>Under the GDPR, you possess several rights regarding your personal data. We are dedicated to helping you exercise these rights seamlessly:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Right of Access:</strong> You can request a copy of the personal data we hold about you.</li>
                <li><strong className="text-foreground">Right to Rectification:</strong> You can ask us to correct inaccurate or incomplete data.</li>
                <li><strong className="text-foreground">Right to Erasure (Right to be Forgotten):</strong> You can request the deletion of your personal data under certain conditions.</li>
                <li><strong className="text-foreground">Right to Restrict Processing:</strong> You can request that we temporarily or permanently stop processing all or some of your personal data.</li>
                <li><strong className="text-foreground">Right to Data Portability:</strong> You can request a copy of your personal data in electronic format and the right to transmit that personal data for use in another party's service.</li>
                <li><strong className="text-foreground">Right to Object:</strong> You can object to us processing your personal data where we no longer have a legitimate or legal need to process it.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Data Processing Principles</h2>
              <p>We adhere to the fundamental principles of data processing outlined in the GDPR:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Lawfulness, Fairness, and Transparency:</strong> We process your data legally, fairly, and in a transparent manner.</li>
                <li><strong className="text-foreground">Purpose Limitation:</strong> We collect data only for specified, explicit, and legitimate purposes.</li>
                <li><strong className="text-foreground">Data Minimization:</strong> We only collect data that is adequate, relevant, and limited to what is necessary.</li>
                <li><strong className="text-foreground">Accuracy:</strong> We take reasonable steps to ensure your data is accurate and up to date.</li>
                <li><strong className="text-foreground">Storage Limitation:</strong> We keep your data only as long as necessary for the purposes we collected it for.</li>
                <li><strong className="text-foreground">Integrity and Confidentiality:</strong> We process your data securely, protecting against unauthorized processing, loss, or damage.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Data Transfers Outside the EU/EEA</h2>
              <p>If we transfer your personal data out of the EU/EEA, we ensure a similar degree of protection is afforded to it by ensuring at least one of the following safeguards is implemented: transferring to countries deemed to provide an adequate level of protection by the European Commission, or using specific contracts approved by the European Commission.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Contacting Our Data Protection Officer (DPO)</h2>
              <p>We have appointed a Data Protection Officer (DPO) to oversee compliance with this privacy notice. If you have any questions about this privacy notice or how we handle your personal data, please contact our DPO at dpo@jobfusion.com.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
