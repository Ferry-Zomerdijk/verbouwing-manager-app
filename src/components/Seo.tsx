import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description: string;
  path: string; // e.g. "/pricing"
  ogType?: "website" | "article";
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const SITE_URL = "https://verbouwing-manager-app.lovable.app";

/**
 * Per-route SEO metadata. Sets title, meta description, canonical and Open Graph tags.
 * Use on every leaf page so each route has unique, accurate metadata.
 */
export const Seo = ({ title, description, path, ogType = "website", jsonLd }: SeoProps) => {
  const url = `${SITE_URL}${path}`;
  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      {jsonLdArray.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};
