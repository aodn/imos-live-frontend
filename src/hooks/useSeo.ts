import { useEffect } from 'react';

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  twitterHandle?: string;
}

export const useSEO = (seoData: SEOData) => {
  const {
    title = 'IMOS LIVE',
    description = 'Imos live web, visualize wave bouys, gsla data',
    keywords = 'AODN, IMOS, imos live',
    image = '/og-image.png',
    url = window.location.href,
    type = 'website',
    siteName = 'IMOS LIVE',
    twitterHandle = '@yourhandle',
  } = seoData;

  const fullTitle = title === 'IMOS LIVE' ? title : `${title} | IMOS LIVE`;

  useEffect(() => {
    // Store original values for cleanup
    const originalTitle = document.title;
    const addedElements: Element[] = [];

    // Update document title
    document.title = fullTitle;

    // Helper function to create and add meta tags
    const createMetaTag = (attributes: Record<string, string>) => {
      const meta = document.createElement('meta');
      Object.entries(attributes).forEach(([key, value]) => {
        meta.setAttribute(key, value);
      });
      document.head.appendChild(meta);
      addedElements.push(meta);
      return meta;
    };

    // Helper function to create and add link tags
    const createLinkTag = (attributes: Record<string, string>) => {
      const link = document.createElement('link');
      Object.entries(attributes).forEach(([key, value]) => {
        link.setAttribute(key, value);
      });
      document.head.appendChild(link);
      addedElements.push(link);
      return link;
    };

    // Remove existing dynamic meta tags (ones we might have added before)
    document.querySelectorAll('meta[data-seo="dynamic"]').forEach(el => el.remove());
    document.querySelectorAll('link[data-seo="dynamic"]').forEach(el => el.remove());

    // Basic SEO meta tags
    createMetaTag({ 'data-seo': 'dynamic', name: 'description', content: description });
    createMetaTag({ 'data-seo': 'dynamic', name: 'keywords', content: keywords });
    createMetaTag({ 'data-seo': 'dynamic', name: 'robots', content: 'index, follow' });

    // Open Graph meta tags
    createMetaTag({ 'data-seo': 'dynamic', property: 'og:type', content: type });
    createMetaTag({ 'data-seo': 'dynamic', property: 'og:title', content: fullTitle });
    createMetaTag({ 'data-seo': 'dynamic', property: 'og:description', content: description });
    createMetaTag({ 'data-seo': 'dynamic', property: 'og:image', content: image });
    createMetaTag({ 'data-seo': 'dynamic', property: 'og:url', content: url });
    createMetaTag({ 'data-seo': 'dynamic', property: 'og:site_name', content: siteName });

    // Twitter Card meta tags
    createMetaTag({ 'data-seo': 'dynamic', name: 'twitter:card', content: 'summary_large_image' });
    createMetaTag({ 'data-seo': 'dynamic', name: 'twitter:site', content: twitterHandle });
    createMetaTag({ 'data-seo': 'dynamic', name: 'twitter:title', content: fullTitle });
    createMetaTag({ 'data-seo': 'dynamic', name: 'twitter:description', content: description });
    createMetaTag({ 'data-seo': 'dynamic', name: 'twitter:image', content: image });

    // Canonical URL
    createLinkTag({ 'data-seo': 'dynamic', rel: 'canonical', href: url });

    // Cleanup function
    return () => {
      document.title = originalTitle;
      addedElements.forEach(el => el.remove());
    };
  }, [fullTitle, description, keywords, image, url, type, siteName, twitterHandle]);
};
