// src/lib/ai-accessibility-sanitizer.ts
import { CanonicalBusinessProfile, AIAccessibilityPreviewDiff } from '../types/ai-accessibility.ts';

export class AIAccessibilitySanitizer {
  /**
   * Sanitizes generated HTML/XML markup to prevent script injection while preserving valid JSON-LD.
   */
  public static sanitizeMarkup(rawMarkup: string): string {
    if (!rawMarkup) return '';

    let clean = rawMarkup;

    // 1. Remove inline event handlers (e.g., onload=..., onclick=...)
    clean = clean.replace(/\s+on\w+\s*=\s*(["'])[\s\S]*?\1/gi, '');
    clean = clean.replace(/\s+on\w+\s*=\s*[^>\s]+/gi, '');

    // 2. Remove javascript: URLs
    clean = clean.replace(/href\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, 'href="#"');

    // 3. Remove executable <script> tags EXCEPT type="application/ld+json"
    clean = clean.replace(/<script\b(?!.*?type=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/gi, '<!-- Removed unsafe script -->');

    // 4. Remove dangerous tags: iframe, embed, object, applet
    clean = clean.replace(/<\/?(iframe|embed|object|applet)\b[^>]*>/gi, '');

    return clean;
  }

  /**
   * Masks secret tokens, internal keys, private credentials, and PII patterns in string payloads or JSON.
   */
  public static sanitizeSecretsAndPII(input: string): { sanitized: string; secretDetected: boolean } {
    if (!input) return { sanitized: '', secretDetected: false };

    let secretDetected = false;
    let sanitized = input;

    // Sensitive keyword patterns
    const secretRegex = /(api[_-]?key|secret|password|access[_-]?token|bearer\s+[a-zA-Z0-9_\-\.]+)\s*[:=]\s*(["']?)([^\s"',}]+)\2/gi;
    if (secretRegex.test(sanitized)) {
      secretDetected = true;
      sanitized = sanitized.replace(new RegExp(secretRegex.source, 'gi'), '$1: "[REDACTED_SECRET]"');
    }

    // Direct API key patterns (e.g. sk_live_..., ghp_..., etc.)
    const apiKeyPattern = /\b(sk_live_|sk_test_|pk_live_|ghp_|xoxb-|xoxp-)[a-zA-Z0-9_-]+\b/gi;
    if (apiKeyPattern.test(sanitized)) {
      secretDetected = true;
      sanitized = sanitized.replace(new RegExp(apiKeyPattern.source, 'gi'), '[REDACTED_API_KEY]');
    }

    // Credit card number pattern (basic 16 digit pattern)
    const cardRegex = /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g;
    if (cardRegex.test(sanitized)) {
      secretDetected = true;
      sanitized = sanitized.replace(new RegExp(cardRegex.source, 'g'), '[REDACTED_CARD_NUMBER]');
    }

    return { sanitized, secretDetected };
  }

  /**
   * Filters a CanonicalBusinessProfile to output only public fields for JSON-LD structured data generation.
   * Strips all fields marked with visibility: 'private' or unconfirmed/private credentials.
   */
  public static extractPublicJsonLd(profile: CanonicalBusinessProfile): Record<string, any> {
    const publicProfile: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": profile.businessIdentity.visibility === 'public' ? profile.businessIdentity.value.publicName : undefined,
      "legalName": profile.businessIdentity.visibility === 'public' ? profile.businessIdentity.value.legalName : undefined,
      "description": profile.businessIdentity.visibility === 'public' ? profile.businessIdentity.value.description : undefined,
      "url": profile.businessIdentity.visibility === 'public' ? profile.businessIdentity.value.websiteUrl : undefined,
    };

    if (profile.locations.visibility === 'public' && profile.locations.value.length > 0) {
      const loc = profile.locations.value[0];
      publicProfile["address"] = {
        "@type": "PostalAddress",
        "streetAddress": loc.address,
        "addressLocality": loc.city,
        "addressRegion": loc.state,
        "postalCode": loc.zip,
        "addressCountry": loc.country
      };
      if (loc.geoCoordinates) {
        publicProfile["geo"] = {
          "@type": "GeoCoordinates",
          "latitude": loc.geoCoordinates.latitude,
          "longitude": loc.geoCoordinates.longitude
        };
      }
    }

    if (profile.contacts.visibility === 'public') {
      publicProfile["email"] = profile.contacts.value.publicEmail;
      publicProfile["telephone"] = profile.contacts.value.publicPhone;
    }

    if (profile.hours.visibility === 'public' && profile.hours.value.length > 0) {
      publicProfile["openingHoursSpecification"] = profile.hours.value.map(h => ({
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": h.dayOfWeek,
        "opens": h.opens,
        "closes": h.closes
      }));
    }

    if (profile.faqs.visibility === 'public' && profile.faqs.value.length > 0) {
      publicProfile["hasFAQPage"] = {
        "@type": "FAQPage",
        "mainEntity": profile.faqs.value.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      };
    }

    if (profile.services.visibility === 'public' && profile.services.value.length > 0) {
      publicProfile["hasOfferCatalog"] = {
        "@type": "OfferCatalog",
        "name": "Services Catalog",
        "itemListElement": profile.services.value.map(srv => ({
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": srv.name,
            "description": srv.description
          },
          "price": srv.price,
          "priceCurrency": srv.currency || "USD"
        }))
      };
    }

    // Provenance stamp
    publicProfile["dateModified"] = profile.provenance.lastVerifiedDate;

    return publicProfile;
  }

  /**
   * Constructs a safe, sanitized preview diff.
   */
  public static createSanitizedPreviewDiff(params: {
    improvementId: string;
    title: string;
    originalMarkup?: string;
    proposedMarkup: string;
    proposedJsonLd?: Record<string, any>;
    diffSummary: string[];
  }): AIAccessibilityPreviewDiff {
    const { sanitized: sanitizedProposed, secretDetected } = this.sanitizeSecretsAndPII(params.proposedMarkup);
    const cleanMarkup = this.sanitizeMarkup(sanitizedProposed);

    return {
      improvementId: params.improvementId,
      title: params.title,
      originalMarkup: params.originalMarkup ? this.sanitizeMarkup(params.originalMarkup) : undefined,
      proposedMarkup: cleanMarkup,
      proposedJsonLd: params.proposedJsonLd,
      sanitizedHtml: cleanMarkup,
      diffSummary: params.diffSummary,
      containsSecretsOrPrivateData: secretDetected
    };
  }
}
