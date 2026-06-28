import dynamic from 'next/dynamic';
import NavBar from './components/NavBar';
import HeroSection from './components/HeroSection';
import StickyEnvelope from './components/StickyEnvelope';
import FeaturesSection from './components/FeaturesSection';
import HowItWorks from './components/HowItWorks';
import CTASection from './components/CTASection';

// Three.js relies on browser APIs — load client-side only
const FlyCanvas = dynamic(() => import('./components/FlyCanvas'), { ssr: false });

export const metadata = {
  title: 'Evenzi — Plan, Celebrate, Remember',
  description: 'India\'s most loved event planning platform.',
};

export default function WebsiteThemeFramer() {
  return (
    <main style={{ fontFamily: 'var(--font-poppins), Poppins, sans-serif', overflowX: 'hidden' }}>
      <FlyCanvas />
      <NavBar />
      <HeroSection />
      <StickyEnvelope />
      <FeaturesSection />
      <HowItWorks />
      <CTASection />
    </main>
  );
}
