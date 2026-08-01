// src/controllers/ai-accessibility.controller.ts
import { Request, Response } from 'express';
import { AIAccessibilityAssessmentService } from '../services/ai-accessibility-assessment.service.ts';
import { AIAccessibilitySanitizer } from '../lib/ai-accessibility-sanitizer.ts';
import { logger } from '../lib/logger.ts';

export class AIAccessibilityController {
  /**
   * Run AI Accessibility Assessment
   */
  public static async assessBusiness(req: Request, res: Response) {
    try {
      const tenantId = req.body.tenantId || (req.query.tenantId as string) || (req.headers['x-tenant-id'] as string) || 'joshua_jardin';
      const websiteUrl = req.body.websiteUrl || 'https://joshua-jardin-landscaping.com';

      const result = await AIAccessibilityAssessmentService.assessBusiness(tenantId, websiteUrl);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error('Error in assessBusiness:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Assessment failed' });
    }
  }

  /**
   * Get Canonical Business Profile
   */
  public static async getProfile(req: Request, res: Response) {
    try {
      const tenantId = (req.query.tenantId as string) || (req.headers['x-tenant-id'] as string) || 'joshua_jardin';
      const profile = AIAccessibilityAssessmentService.getProfile(tenantId);
      if (!profile) {
        // Trigger default assessment to hydrate profile
        const fresh = await AIAccessibilityAssessmentService.assessBusiness(tenantId);
        return res.json({ success: true, data: fresh.profile });
      }
      return res.json({ success: true, data: profile });
    } catch (err: any) {
      logger.error('Error in getProfile:', err);
      return res.status(500).json({ success: false, error: err?.message });
    }
  }

  /**
   * Update Canonical Business Profile
   */
  public static async updateProfile(req: Request, res: Response) {
    try {
      const tenantId = req.body.tenantId || (req.headers['x-tenant-id'] as string) || 'joshua_jardin';
      const { updates } = req.body;

      if (!updates) {
        return res.status(400).json({ success: false, error: 'Missing updates body parameter.' });
      }

      const updated = AIAccessibilityAssessmentService.updateProfile(tenantId, updates);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error('Error in updateProfile:', err);
      return res.status(500).json({ success: false, error: err?.message });
    }
  }

  /**
   * Generate Sanitized Proposed Diff Preview
   */
  public static async getPreviewDiff(req: Request, res: Response) {
    try {
      const tenantId = (req.query.tenantId as string) || (req.headers['x-tenant-id'] as string) || 'joshua_jardin';
      const { improvementId } = req.params;

      const profile = AIAccessibilityAssessmentService.getProfile(tenantId) || (await AIAccessibilityAssessmentService.assessBusiness(tenantId)).profile;
      const publicJsonLd = AIAccessibilitySanitizer.extractPublicJsonLd(profile);

      const proposedMarkup = `<script type="application/ld+json">\n${JSON.stringify(publicJsonLd, null, 2)}\n</script>`;

      const previewDiff = AIAccessibilitySanitizer.createSanitizedPreviewDiff({
        improvementId,
        title: "Proposed Schema.org JSON-LD & AI Accessibility Markup",
        originalMarkup: "<!-- No existing Schema.org JSON-LD header present -->",
        proposedMarkup,
        proposedJsonLd: publicJsonLd,
        diffSummary: [
          "Added Schema.org LocalBusiness structured identity metadata",
          "Added PostalAddress and GeoCoordinates schema",
          "Added OpeningHoursSpecification for AI operational hours matching",
          "Added FAQPage structured QA entities",
          "Added OfferCatalog with machine-readable prices"
        ]
      });

      return res.json({ success: true, data: previewDiff });
    } catch (err: any) {
      logger.error('Error in getPreviewDiff:', err);
      return res.status(500).json({ success: false, error: err?.message });
    }
  }
}
