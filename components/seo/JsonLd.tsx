import React from 'react';
import { eventData } from '@/data/eventData';

export default function JsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://raasutsav.in';

  // 1. Festival Event Schema
  const eventSchema = {
    '@context': 'https://schema.org',
    '@type': 'Festival',
    name: `${eventData.eventName} ${eventData.year} — ${eventData.edition}`,
    alternateName: 'Dandiya Raas Utsav Ranchi 2026',
    description: eventData.heroSupportingText,
    startDate: '2026-10-16T17:00:00+05:30',
    endDate: '2026-10-16T23:00:00+05:30',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: baseUrl,
    image: [
      `${baseUrl}/images/gallery/celebration.webp`,
      `${baseUrl}/images/gallery/ambiance.webp`,
    ],
    location: {
      '@type': 'Place',
      name: eventData.venue.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Station Road',
        addressLocality: 'Ranchi',
        addressRegion: 'Jharkhand',
        postalCode: '834001',
        addressCountry: 'IN',
      },
    },
    offers: eventData.passes.map((pass) => ({
      '@type': 'Offer',
      name: pass.name,
      description: pass.description,
      price: pass.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `${baseUrl}/booking`,
      validFrom: '2026-01-01T00:00:00+05:30',
    })),
    organizer: {
      '@type': 'Organization',
      name: eventData.organizer.name,
      legalName: eventData.business.legalName,
      url: baseUrl,
      telephone: eventData.business.phone,
      email: eventData.business.email,
    },
    performer: {
      '@type': 'PerformingGroup',
      name: 'Master Dhol & Folk Fusion Ensembles',
    },
  };

  // 2. Organization / Local Business Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: eventData.organizer.name,
    tradeName: eventData.business.tradeName,
    legalName: eventData.business.legalName,
    taxID: eventData.business.gstin,
    url: baseUrl,
    logo: `${baseUrl}/icon.svg`,
    email: eventData.business.email,
    telephone: eventData.business.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: eventData.business.address.street,
      addressLocality: eventData.business.address.city,
      addressRegion: eventData.business.address.state,
      postalCode: eventData.business.address.pincode,
      addressCountry: 'IN',
    },
    sameAs: [baseUrl],
  };

  // 3. WebSite Schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: `${eventData.eventName} ${eventData.year}`,
    url: baseUrl,
    description: eventData.tagline,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
