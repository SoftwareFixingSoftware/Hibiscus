import React from "react";
import { Helmet } from "react-helmet";

/**
 * Centralized SEO component
 * Uses existing PWA assets for consistency (logo512.png)
 */
const SEO = ({
  title = "Hibiscus | Audio Podcasts & Playbooks",
  description = "Discover high-quality audio podcasts, narrated playbooks, and spoken content on Hibiscus.",
  keywords = "audio podcasts, playbooks, audiobooks, spoken content, hibiscus audio",
  url = "https://hibiscus.breachpen.co.ke",
  image = "https://hibiscus.breachpen.co.ke/logo.png", // unified with manifest
  noIndex = false,
}) => {
  return (
    <Helmet>
      {/* Primary Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Index Control */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph (social platforms) */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default SEO;