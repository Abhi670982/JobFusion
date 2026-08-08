import { Metadata } from 'next';
import AboutContent from './about-content';

export const metadata: Metadata = {
  title: 'About Us | Gohyred',
  description: 'Learn more about Gohyred, our mission, and why we are the best platform for job discovery.',
};

export default function AboutUsPage() {
  return <AboutContent />;
}
