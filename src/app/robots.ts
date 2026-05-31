import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/(dashboard)/'],
    },
    sitemap: 'https://growth-app.com/sitemap.xml',
  }
}
