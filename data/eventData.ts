export interface PassTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  priceDisplay: string;
  category: string;
  admitCount: number;
  description: string;
  badge?: string;
  features: string[];
  inclusions: string[];
}

export interface ExperienceOffering {
  id: string;
  number: string;
  title: string;
  tagline: string;
  description: string;
  highlights?: string[];
  type?: 'image' | 'purple';
}

export interface FestivalPillar {
  id: string;
  title: string;
  subtitle: string;
  description: string;
}

export interface FestivalImageMetadata {
  src: string;
  alt: string;
  caption?: string;
  badge?: string;
}

export interface EventConfig {
  eventName: string;
  edition: string;
  year: string;
  tagline: string;
  heroSupportingText: string;
  organizer: {
    name: string;
    tagline: string;
  };
  
  dateDisplay: string;
  timeDisplay: string;
  venueDisplay: string;
  cityDisplay: string;

  dates: {
    display: string;
    note: string;
  };
  timing: {
    display: string;
    note: string;
  };
  venue: {
    name: string;
    city: string;
    addressNote: string;
  };

  ctas: {
    primary: string;
    secondary: string;
    contact: string;
  };

  about: {
    storyLead: string;
    storyParagraph1: string;
    storyParagraph2: string;
    pillars: FestivalPillar[];
  };

  experiences: ExperienceOffering[];
  passes: PassTier[];

  gallery: {
    crowdCelebration: FestivalImageMetadata;
    dandiyaAction: FestivalImageMetadata;
    liveDholMaster: FestivalImageMetadata;
    garbaDancers: FestivalImageMetadata;
    festivalVenueAmbiance: FestivalImageMetadata;
    festivalFood: FestivalImageMetadata;
  };

  contact: {
    enquiryEmail: string;
    alternateEmail: string;
    helplineNumber: string;
    phoneNumbers: string[];
    officeLocation: string;
    note: string;
  };

  contacts: {
    phones: string[];
    emails: string[];
  };

  socialLinks: Array<{ label: string; href: string }>;
}

/**
 * Centralized Event Data Store — RAAS UTSAV 2026
 * Confirmed client facts from the Sponsor Presentation, official Poster, and Hoarding.
 * Note: Internal quotation sheet contains conflicting 2024 date; prototype displays 2026.
 */
export const eventData: EventConfig = {
  eventName: "RAAS UTSAV",
  edition: "JHARKHAND'S GRANDEST DANDIYA NIGHT",
  year: "2026",
  tagline: "Navratri Celebration like never before • Dance · Devotion · Celebration",
  heroSupportingText: "Experience the grandest festival night of dance and devotion at Upwan Lawn, Chanakya BNR Hotel, Ranchi. Immersive cultural atmosphere, live folk rhythms, and unforgettable festive memories under the starlit sky.",
  organizer: {
    name: "EVENT POINT",
    tagline: "A Shop for complete Event Solution. WE PLAN. YOU CELEBRATE.",
  },

  dateDisplay: "16 OCTOBER 2026",
  timeDisplay: "5:00 PM – 11:00 PM",
  venueDisplay: "UPWAN LAWN, CHANAKYA BNR HOTEL, RANCHI",
  cityDisplay: "RANCHI, JHARKHAND",

  dates: {
    display: "16 OCTOBER 2026",
    note: "Grand Friday celebration evening",
  },
  timing: {
    display: "5:00 PM – 11:00 PM",
    note: "Entry gates open at dusk",
  },
  venue: {
    name: "Upwan Lawn, Chanakya BNR Hotel, Ranchi",
    city: "Ranchi, Jharkhand",
    addressNote: "Upwan Lawn, Chanakya BNR Hotel, Ranchi",
  },

  ctas: {
    primary: "BOOK YOUR PASS",
    secondary: "EXPLORE EXPERIENCE",
    contact: "RESERVE & ENQUIRE",
  },

  about: {
    storyLead: "Blending heritage royal charm, fusion folk rhythms, and high-energy interactive entertainment in the heart of Ranchi.",
    storyParagraph1:
      "Raas Utsav 2026 transforms the historic grounds of Chanakya BNR Hotel into Jharkhand's grandest celebration of Navratri. Rooted in authentic folk traditions and elevated with themed royal decor, the festival brings together friends, families, and dance circles of all generations.",
    storyParagraph2:
      "Set against the vintage heritage railway architecture of BNR Chanakya, the evening unites pulsating dhol ensembles, traditional Garba circles, vibrant attire, and modern festival production for an unforgettable celebration of dance and devotion.",
    pillars: [
      {
        id: "heritage-decor",
        title: "HERITAGE & ROYAL DECOR",
        subtitle: "Vintage Charm",
        description: "Themed lighting, traditional glowing diyas, and colorful fabric drapes accenting the vintage heritage architecture.",
      },
      {
        id: "live-music",
        title: "LIVE MUSIC & DHOL FUSION",
        subtitle: "Heartbeat of the Arena",
        description: "High-energy performances combining master dhol percussion with popular Bollywood and traditional Garba rhythms.",
      },
      {
        id: "photo-booths",
        title: "ROYAL PHOTO BOOTHS",
        subtitle: "Memories in Frame",
        description: "Royal jharokha-style frames and decorated ethnic props curated for striking festive photographs.",
      },
      {
        id: "food-court",
        title: "FOOD & REFRESHMENTS",
        subtitle: "Festive Courtyard",
        description: "Curated food court featuring festive snacks, regional delicacies, hot chai, and refreshing coolers under the lanterns.",
      },
    ],
  },

  experiences: [
    {
      id: "dandiya-nights",
      number: "01",
      type: "image",
      title: "DANDIYA NIGHTS & GARBA CIRCLES",
      tagline: "Expansive Concentric Dance Arena",
      description:
        "Step into expansive multi-generational dance circles engineered for fluid movement, synchronized dandiya strikes, and celebratory unity under the stars.",
      highlights: [
        "Concentric Garba Circles",
        "Synchronised Dandiya Strikes",
        "Inclusive Family & Youth Dance Arena",
      ],
    },
    {
      id: "fusion-music",
      number: "02",
      type: "purple",
      title: "LIVE MUSIC & MASTER DHOL FUSION",
      tagline: "Thunderous Folk Percussion & DJ Sets",
      description:
        "Feel the pulse of live master dhol players paired with high-energy musical sets delivering timeless traditional Garba melodies and upbeat Bollywood dance anthems.",
      highlights: [
        "Master Dhol Ensembles",
        "High-Energy Fusion Music Sets",
        "Stage Sound Engineered for 2,000+ Guests",
      ],
    },
    {
      id: "royal-decor",
      number: "03",
      type: "image",
      title: "ROYAL DECOR & JHAROKHA BOOTHS",
      tagline: "Themed Lighting & Ethnic Backdrops",
      description:
        "Immerse in warm fairy lights, traditional brass diyas, and royal jharokha photo frames accenting the vintage heritage architecture of BNR Chanakya.",
      highlights: [
        "Heritage Architecture Lighting",
        "Royal Jharokha Photo Backdrops",
        "Traditional Diyas & Festive Fabric Drapes",
      ],
    },
    {
      id: "food-entertainment",
      number: "04",
      type: "purple",
      title: "FOOD COURT & CELEBRATION REFRESHMENTS",
      tagline: "Authentic Regional Savouries & Coolers",
      description:
        "Savor delicious festive street food, regional delicacies, cooling drinks, and hot masala chai in a dedicated festival courtyard alongside fun zones.",
      highlights: [
        "Dedicated Food & Beverage Stalls",
        "Festive Sweets & Traditional Coolers",
        "Comfortable Dining & Hospitality Areas",
      ],
    },
  ],

  // Exact 5 client pass tiers from Slide 6 of the Sponsor Presentation
  passes: [
    {
      id: "solo-female",
      name: "SOLO PASS FEMALE",
      price: 999,
      currency: "₹",
      priceDisplay: "₹999",
      category: "Entry Pass",
      admitCount: 1,
      description: "Entry Pass",
      badge: "SOLO ENTRY",
      features: [
        "Single entry pass for female attendee",
        "Access to main celebration arena",
        "Access to festival food court & photo zones",
      ],
      inclusions: [
        "Single entry pass for female attendee",
        "Access to main celebration arena",
        "Access to festival food court & photo zones",
      ],
    },
    {
      id: "couple",
      name: "COUPLE PASS",
      price: 1999,
      currency: "₹",
      priceDisplay: "₹1,999",
      category: "Entry for 2",
      admitCount: 2,
      description: "Entry for 2",
      badge: "POPULAR",
      features: [
        "Festival access pass for two attendees",
        "Access to main Garba & Dandiya dance floors",
        "Access to festival courtyard & amenities",
      ],
      inclusions: [
        "Festival access pass for two attendees",
        "Access to main Garba & Dandiya dance floors",
        "Access to festival courtyard & amenities",
      ],
    },
    {
      id: "family",
      name: "FAMILY PASS (4 PAX)",
      price: 3599,
      currency: "₹",
      priceDisplay: "₹3,599",
      category: "Up to 4 People",
      admitCount: 4,
      description: "Up to 4 People",
      badge: "FAMILY ACCESS",
      features: [
        "Entry pass for up to 4 family members",
        "Full access to festival grounds & dance arenas",
        "Access to family seating and photo booth areas",
      ],
      inclusions: [
        "Entry pass for up to 4 family members",
        "Full access to festival grounds & dance arenas",
        "Access to family seating and photo booth areas",
      ],
    },
    {
      id: "group",
      name: "GROUP PASS (6 PAX)",
      price: 4999,
      currency: "₹",
      priceDisplay: "₹4,999",
      category: "Up to 6 People",
      admitCount: 6,
      description: "Up to 6 People",
      badge: "BEST VALUE",
      features: [
        "Entry pass for a group of up to 6 attendees",
        "Access to main dance circle & event grounds",
        "Ideal for student groups & corporate friends",
      ],
      inclusions: [
        "Entry pass for a group of up to 6 attendees",
        "Access to main dance circle & event grounds",
        "Ideal for student groups & corporate friends",
      ],
    },
    {
      id: "vip",
      name: "VIP PASS",
      price: 1499,
      currency: "₹",
      priceDisplay: "₹1,499",
      category: "VIP Access",
      admitCount: 1,
      description: "VIP Access",
      badge: "VIP EXPERIENCE",
      features: [
        "Fast-track VIP entry lane",
        "Access to designated VIP seating & hospitality lounge",
        "Front-row view of stage performances",
      ],
      inclusions: [
        "Fast-track VIP entry lane",
        "Access to designated VIP seating & hospitality lounge",
        "Front-row view of stage performances",
      ],
    },
  ],

  gallery: {
    crowdCelebration: {
      src: "/images/festival-crowd.jpg",
      alt: "Vibrant promotional campaign photograph of festival attendees celebrating Garba under lights",
      caption: "Concentric circular dance rhythms under starlit festival lighting.",
      badge: "ATMOSPHERIC PREVIEW",
    },
    dandiyaAction: {
      src: "/images/dandiya-sticks.jpg",
      alt: "Close-up promotional photograph of colorful Dandiya sticks in motion",
      caption: "Synchronised stick beats and energetic folk choreography.",
      badge: "TRADITION",
    },
    liveDholMaster: {
      src: "/images/dhol-percussion.jpg",
      alt: "Promotional photograph of a live dhol percussionist performing on stage",
      caption: "Thunderous live dhol rhythms driving festival folk beats.",
      badge: "LIVE ENSEMBLE",
    },
    garbaDancers: {
      src: "/images/garba-dancers.jpg",
      alt: "Promotional campaign photograph of Garba dancers in colorful attire",
      caption: "Celebratory circular dance and vibrant festive attire.",
      badge: "THE SPIRIT",
    },
    festivalVenueAmbiance: {
      src: "/images/client/venue-bnr-chanakya.jpg",
      alt: "Authentic venue photography of Chanakya BNR Hotel heritage facade and Upwan Lawn, Ranchi",
      caption: "The vintage heritage grounds of Chanakya BNR Hotel, Ranchi at dusk.",
      badge: "OFFICIAL VENUE",
    },
    festivalFood: {
      src: "/images/festival-food.jpg",
      alt: "Promotional photograph of festive food courtyard illuminated by evening lanterns",
      caption: "Curated regional festive flavours, sweets, and refreshments under ambient string lights.",
      badge: "FESTIVAL COURTYARD",
    },
  },

  contact: {
    enquiryEmail: "eventpoint42@gmail.com",
    alternateEmail: "eventpointranchi18@gmail.com",
    helplineNumber: "+91 99315 03960",
    phoneNumbers: ["+91 99315 03960", "+91 85400 06033", "+91 94301 12440"],
    officeLocation: "Event Point, Ranchi, Jharkhand",
    note: "For pass enquiries, group bookings, and sponsorship opportunities, contact the Event Point team directly.",
  },

  contacts: {
    phones: ["+91 99315 03960", "+91 85400 06033", "+91 94301 12440"],
    emails: ["eventpoint42@gmail.com", "eventpointranchi18@gmail.com"],
  },

  socialLinks: [
    { label: "Instagram", href: "#" },
    { label: "YouTube", href: "#" },
    { label: "Facebook", href: "#" },
  ],
};
