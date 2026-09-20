import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.eventpointranchi.com';
  const lastMod = new Date();

  const pages: Array<{
    route: string;
    priority: number;
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  }> = [
    { route: '', priority: 1.0, changeFrequency: 'daily' },
    { route: '/pricing', priority: 0.95, changeFrequency: 'daily' },
    { route: '/booking', priority: 0.9, changeFrequency: 'daily' },
    { route: '/find-pass', priority: 0.85, changeFrequency: 'daily' },
    { route: '/about', priority: 0.8, changeFrequency: 'weekly' },
    { route: '/services', priority: 0.8, changeFrequency: 'weekly' },
    { route: '/faq', priority: 0.8, changeFrequency: 'weekly' },
    { route: '/contact', priority: 0.75, changeFrequency: 'weekly' },
    { route: '/policies', priority: 0.7, changeFrequency: 'monthly' },
    { route: '/terms-and-conditions', priority: 0.6, changeFrequency: 'monthly' },
    { route: '/privacy-policy', priority: 0.6, changeFrequency: 'monthly' },
    { route: '/refund-and-cancellation', priority: 0.6, changeFrequency: 'monthly' },
    { route: '/shipping-policy', priority: 0.6, changeFrequency: 'monthly' },
  ];

  return pages.map(({ route, priority, changeFrequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified: lastMod,
    changeFrequency,
    priority,
  }));
}
