# SEO Implementation

This document describes the SEO (Search Engine Optimization) implementation for Linite.

## Overview

Linite has comprehensive SEO optimization including metadata, Open Graph images, structured data, sitemaps, and robots.txt configuration.

## Components

### 1. Metadata (src/app/layout.tsx)

The root layout includes comprehensive metadata:

- **Title Template**: Dynamic titles with "| Linite" suffix
- **Description**: Detailed app description with keywords
- **Keywords**: Relevant search terms (linux, package installer, apt, dnf, etc.)
- **Open Graph**: Social media sharing metadata
- **Twitter Card**: Twitter-specific sharing metadata
- **Icons**: Favicon references (using /public/favicon.svg)
- **Robots**: Search engine crawler instructions
- **Canonical URLs**: Prevents duplicate content issues

### 2. Open Graph Image (src/app/opengraph-image.tsx)

Dynamically generated OG image (1200x630px) featuring:
- Modern gradient background with dot pattern
- Linite branding
- Key features highlighted
- Optimized for social media sharing (Twitter, Facebook, LinkedIn, etc.)

The image is automatically generated at build time and served at `/opengraph-image`.

### 3. Structured Data (src/components/structured-data.tsx)

JSON-LD structured data helps search engines understand:
- Application type (WebApplication)
- Operating system (Linux)
- Features and capabilities
- Pricing (free)
- Software requirements

This is included on the homepage for better search result appearance.

### 4. Sitemap (src/app/sitemap.ts)

Dynamic sitemap generation including:
- Homepage (priority: 1.0, changefreq: daily)
- All app detail pages (priority: 0.8, changefreq: weekly)
- Automatic revalidation every hour
- Available at `/sitemap.xml`

### 5. Robots.txt (public/robots.txt)

Crawler configuration:
- Allows all search engines
- Blocks admin and API routes from indexing
- References sitemap location

## Environment Variables

Required environment variable:

```bash
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

This is used for:
- Metadata base URL
- Open Graph URLs
- Sitemap URLs
- Canonical URLs

## Best Practices Implemented

1. **Mobile-First**: Responsive metadata and OG images
2. **Social Sharing**: Optimized for all major platforms
3. **Schema.org**: Structured data for rich snippets
4. **Performance**: Static generation where possible
5. **Accessibility**: Proper alt text and semantic HTML
6. **Security**: Admin routes excluded from search indexing

## Testing SEO

### Local Testing

1. Build the app: `bun run build`
2. View generated files:
   - `/opengraph-image` - OG image
   - `/sitemap.xml` - Sitemap
   - View page source to see metadata

### Production Testing

Use these tools to validate SEO:

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
4. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/
5. **Schema.org Validator**: https://validator.schema.org/

### Lighthouse SEO Audit

Run Lighthouse in Chrome DevTools:
1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Select "SEO" category
4. Click "Generate report"

Target: 95+ SEO score

## Future Enhancements

Potential improvements:
- [ ] Add breadcrumb structured data for app pages
- [ ] Implement blog/news section with article schema
- [ ] Add FAQ schema for common questions
- [ ] Implement hreflang tags for internationalization
- [ ] Add video schema if adding tutorials
- [ ] Generate RSS feed for app updates

## Monitoring

Monitor SEO performance with:
- Google Search Console
- Google Analytics
- Bing Webmaster Tools
- Check indexing status regularly
- Monitor Core Web Vitals

## Notes

- All metadata is defined in the root layout
- OG images are generated at build time
- Sitemap updates automatically with new apps
- Structured data is only on homepage (can be extended to app pages)
- Favicon is SVG for better quality across devices
