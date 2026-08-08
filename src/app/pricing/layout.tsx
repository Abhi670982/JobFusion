import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Gohyred | Simple, Transparent Plans',
  description:
    'Choose the plan that fits your job search goals. Start free, upgrade to Pro for unlimited AI resume building, ATS optimization, cover letters, and smart job matching.',
  keywords: ['job search pricing', 'resume AI subscription', 'ATS optimization plan', 'Gohyred Pro'],
  openGraph: {
    title: 'Gohyred Pricing — Invest in Your Career Growth',
    description:
      'Free, Pro, and Recruiter plans. Unlock unlimited AI features for ₹299/month or ₹2,999/year.',
    type: 'website',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
