import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://raasutsav.in';

  const routes = [
    '',
    '/about',
    '/services',
    '/pricing',
    '/booking',
    '/contact',
    '/terms-and-conditions',
    '/privacy-policy',
    '/refund-and-cancellation',
    '/shipping-policy',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route.startsWith('/terms') || route.startsWith('/privacy') ? 'monthly' : 'weekly',
    priority: route === '' ? 1.0 : route === '/booking' || route === '/pricing' ? 0.9 : 0.7,
  }));
}
