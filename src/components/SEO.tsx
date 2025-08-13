import React from "react";

type JsonLdProps = { data: Record<string, unknown> };

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function websiteJsonLd(baseUrl?: string) {
  if (!baseUrl) return null;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: baseUrl,
    name: "Arcade",
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  } as const;
}

export function organizationJsonLd(baseUrl?: string) {
  if (!baseUrl) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Arcade",
    url: baseUrl,
    logo: `${baseUrl}/vercel.svg`,
  } as const;
}

export function videoGameJsonLd(params: {
  baseUrl?: string;
  id: string;
  name: string;
  description?: string;
  image?: string;
  genres?: string[];
  urlPath: string; // e.g. /play/slug
  ratingValue?: number;
  ratingCount?: number;
}) {
  const { baseUrl, id, name, description, image, genres, urlPath, ratingValue, ratingCount } = params;
  const url = baseUrl ? `${baseUrl}${urlPath}` : urlPath;
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name,
    description,
    genre: genres && genres.length ? genres : undefined,
    identifier: id,
    url,
    image,
    operatingSystem: "Web",
    applicationCategory: "GameApplication",
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
    aggregateRating: ratingValue ? {
      "@type": "AggregateRating",
      ratingValue: ratingValue.toFixed(1),
      ratingCount: ratingCount ?? 1,
    } : undefined,
  } as const;
}

export function breadcrumbsJsonLd(baseUrl: string | undefined, crumbs: Array<{ name: string; path: string }>) {
  if (!baseUrl) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${baseUrl}${c.path}`,
    })),
  } as const;
}
