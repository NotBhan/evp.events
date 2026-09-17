import Navbar from '@/components/Navbar';
import Hero from '@/components/hero/Hero';
import EditorialStatement from '@/components/sections/EditorialStatement';
import GrandestNightBanner from '@/components/sections/GrandestNightBanner';
import ExperienceMosaic from '@/components/sections/ExperienceMosaic';
import CampaignFeature from '@/components/sections/CampaignFeature';
import EventDateSchedule from '@/components/sections/EventDateSchedule';
import PassPreview from '@/components/sections/PassPreview';
import PaymentPolicySummary from '@/components/sections/PaymentPolicySummary';
import HeritageNightBanner from '@/components/sections/HeritageNightBanner';
import VenueFeature from '@/components/sections/VenueFeature';
import FinalBookingCTA from '@/components/sections/FinalBookingCTA';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-deep-plum text-warm-cream selection:bg-vermilion selection:text-warm-cream overflow-x-clip">
      <Navbar />
      {/* 1. Layered Deconstructed Hero (CSS-Sticky 200svh) */}
      <Hero />

      {/* 2. Editorial Festival Statement */}
      <EditorialStatement />

      {/* 3. Recomposed Campaign Banner: Grandest Night (RAASCDR) */}
      <GrandestNightBanner />

      {/* 4. Experience / Attractions Mosaic */}
      <ExperienceMosaic />

      {/* 5. Large Campaign Artwork + Statement Feature */}
      <CampaignFeature />

      {/* 6. Monumental Event Date & Schedule Display */}
      <EventDateSchedule />

      {/* 7. Festival Pass Preview */}
      <PassPreview />

      {/* 7b. Payment Options, Pay Later Deadline, Cancellation, Refunds & Entry */}
      <PaymentPolicySummary />

      {/* 8. Recomposed Heritage Transition Banner (RAASCDR) */}
      <HeritageNightBanner />

      {/* 9. Heritage Venue Feature */}
      <VenueFeature />

      {/* 10. Final Campaign Booking CTA */}
      <FinalBookingCTA />

      {/* 11. Comprehensive Footer */}
      <Footer />
    </main>
  );
}
