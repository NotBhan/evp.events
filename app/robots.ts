import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://raasutsav.in';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/organiser'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
