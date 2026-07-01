import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | JobFusion',
  description: 'Read the terms and conditions that govern your use of JobFusion.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl p-8 sm:p-12">
          <h1 className="text-4xl font-bold mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <span className="gradient-brand-text">Terms </span>
            of Service
          </h1>
          <p className="text-muted-foreground mb-10">Last Updated: July 1, 2026</p>
          
          <div className="space-y-8 text-foreground/90 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Agreement to Terms</h2>
              <p>By viewing or using our platform, JobFusion, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Use License</h2>
              <p>Permission is granted to temporarily download one copy of the materials (information or software) on JobFusion's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                <li>Modify or copy the materials;</li>
                <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                <li>Attempt to decompile or reverse engineer any software contained on JobFusion's website;</li>
                <li>Remove any copyright or other proprietary notations from the materials; or</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
              </ul>
              <p className="mt-4">This license shall automatically terminate if you violate any of these restrictions and may be terminated by JobFusion at any time.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Disclaimer</h2>
              <p>The materials on JobFusion's website are provided on an 'as is' basis. JobFusion makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Limitations</h2>
              <p>In no event shall JobFusion or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on JobFusion's website, even if JobFusion or a JobFusion authorized representative has been notified orally or in writing of the possibility of such damage.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Accuracy of Materials</h2>
              <p>The materials appearing on JobFusion's website could include technical, typographical, or photographic errors. JobFusion does not warrant that any of the materials on its website are accurate, complete or current. JobFusion may make changes to the materials contained on its website at any time without notice.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Modifications</h2>
              <p>JobFusion may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Contact Information</h2>
              <p>If you have any questions about these Terms, please contact us at support@jobfusion.com.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
