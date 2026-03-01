import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoProps {
  title: string;
  description: string;
  keywords?: string;
  ogType?: string;
  ogImage?: string;
  twitterCard?: string;
  canonicalUrl?: string;
  personSchema?: object;
  schema?: object;
}

const Seo: React.FC<SeoProps> = ({
  title,
  description,
  keywords,
  ogType,
  ogImage,
  twitterCard,
  canonicalUrl,
  personSchema,
  schema,
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {ogType && <meta property="og:type" content={ogType} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {twitterCard && <meta name="twitter:card" content={twitterCard} />}
      {personSchema && (
        <script type="application/ld+json">
          {JSON.stringify(personSchema)}
        </script>
      )}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default Seo;
