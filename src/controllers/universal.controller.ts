// src/controllers/universal.controller.ts
import { Request, Response } from 'express';
import { OnboardingAnswers } from '../types/universal-onboarding.ts';
import { DEMO_PROFILES } from '../lib/demo-profiles.ts';
import {
  buildBusinessProfile,
  updateProfileFact,
  assessBusinessMaturity,
  identifyOpportunities,
  designWorkforce
} from '../lib/universal-business-engine.ts';
import { runUniversalityVerificationSuite } from '../tests/universality-verification.test.ts';
import { logger } from '../lib/logger.ts';

// In-memory session cache for active profile (backed by database if user is logged in)
const activeProfileCache = new Map<string, any>();

export class UniversalController {
  /**
   * Process Onboarding Answers and Generate Full Business & Workforce Architecture
   */
  public static async processOnboarding(req: Request, res: Response) {
    try {
      const answers: OnboardingAnswers = req.body;
      if (!answers || !answers.businessName) {
        return res.status(400).json({ error: 'Invalid onboarding payload. Business name is required.' });
      }

      const profile = buildBusinessProfile(answers);
      const maturity = assessBusinessMaturity(profile);
      const opportunities = identifyOpportunities(profile, maturity);
      const workforce = designWorkforce(profile, opportunities);

      const result = {
        profile,
        maturity,
        opportunities,
        workforce,
        processedAt: new Date().toISOString()
      };

      activeProfileCache.set(profile.id, result);

      res.json({
        success: true,
        data: result
      });
    } catch (err: any) {
      logger.error('Error in UniversalController.processOnboarding:', err);
      res.status(500).json({ error: err.message || 'Onboarding processing failed' });
    }
  }

  /**
   * Get Demo Presets
   */
  public static async getDemoProfiles(req: Request, res: Response) {
    res.json({
      success: true,
      presets: Object.values(DEMO_PROFILES)
    });
  }

  /**
   * Load and Execute Specific Demo Preset (e.g. joshua_jardin, ricardos_restaurant, apex_plumbing)
   */
  public static async loadDemoPreset(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const preset = DEMO_PROFILES[key];

      if (!preset) {
        return res.status(404).json({ error: `Demo profile preset "${key}" not found.` });
      }

      const profile = buildBusinessProfile(preset.answers);
      const maturity = assessBusinessMaturity(profile);
      const opportunities = identifyOpportunities(profile, maturity);
      const workforce = designWorkforce(profile, opportunities);

      const result = {
        presetKey: preset.key,
        presetName: preset.name,
        answers: preset.answers,
        profile,
        maturity,
        opportunities,
        workforce,
        processedAt: new Date().toISOString()
      };

      activeProfileCache.set(profile.id, result);

      res.json({
        success: true,
        data: result
      });
    } catch (err: any) {
      logger.error('Error in UniversalController.loadDemoPreset:', err);
      res.status(500).json({ error: err.message || 'Failed to load demo preset' });
    }
  }

  /**
   * Owner Fact Confirmation & Correction
   */
  public static async correctFact(req: Request, res: Response) {
    try {
      const { profileId, fieldPath, newValue, status } = req.body;
      const cached = activeProfileCache.get(profileId);

      if (!cached) {
        return res.status(404).json({ error: 'Profile session not found. Please re-run onboarding or load a preset.' });
      }

      const updatedProfile = updateProfileFact(cached.profile, fieldPath, newValue, status);
      const maturity = assessBusinessMaturity(updatedProfile);
      const opportunities = identifyOpportunities(updatedProfile, maturity);
      const workforce = designWorkforce(updatedProfile, opportunities);

      cached.profile = updatedProfile;
      cached.maturity = maturity;
      cached.opportunities = opportunities;
      cached.workforce = workforce;

      res.json({
        success: true,
        data: cached
      });
    } catch (err: any) {
      logger.error('Error in UniversalController.correctFact:', err);
      res.status(500).json({ error: err.message || 'Fact correction failed' });
    }
  }

  /**
   * Run 3-Business Universality Test Suite & Output Verification Evidence
   */
  public static async runUniversalityTest(req: Request, res: Response) {
    try {
      const suiteResults = runUniversalityVerificationSuite();
      res.json({
        success: suiteResults.passed,
        report: suiteResults
      });
    } catch (err: any) {
      logger.error('Error in UniversalController.runUniversalityTest:', err);
      res.status(500).json({ error: err.message || 'Universality test execution failed' });
    }
  }
}
