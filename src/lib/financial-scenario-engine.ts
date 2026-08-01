// src/lib/financial-scenario-engine.ts
import {
  FinancialAssumption,
  FinancialScenario,
  EvidenceClassification
} from '../types/deployable-improvement.ts';

export interface FinancialCalculationInput {
  baseMonthlySavings?: number;
  baseMonthlyRevenueIncrease?: number;
  implementationCost?: number;
  monthlyOperatingCost?: number;
  assumptions: FinancialAssumption[];
}

export class FinancialScenarioEngine {
  /**
   * Generates conservative, expected, and upside scenarios based on input values and assumptions.
   * Ensures every value preserves formula, evidence classification, confidence scores, and unknown flags.
   */
  public static calculateScenarios(input: FinancialCalculationInput): FinancialScenario[] {
    const {
      baseMonthlySavings = 0,
      baseMonthlyRevenueIncrease = 0,
      implementationCost = 0,
      monthlyOperatingCost = 0,
      assumptions
    } = input;

    // Check if any assumptions are classified as "unknown"
    const hasUnknowns = assumptions.some(a => a.classification === 'unknown');
    const unconfirmedAssumptions = assumptions.filter(a => a.requiresConfirmation && !a.isConfirmed);

    // Multipliers for scenario tiers
    const scenariosConfig: Array<{
      type: "conservative" | "expected" | "upside";
      savingsMult: number;
      revenueMult: number;
      costMult: number;
      confidence: number;
    }> = [
      { type: "conservative", savingsMult: 0.7, revenueMult: 0.6, costMult: 1.15, confidence: 0.85 },
      { type: "expected", savingsMult: 1.0, revenueMult: 1.0, costMult: 1.0, confidence: 0.70 },
      { type: "upside", savingsMult: 1.3, revenueMult: 1.4, costMult: 0.9, confidence: 0.50 }
    ];

    return scenariosConfig.map(config => {
      const monthlySavings = Number((baseMonthlySavings * config.savingsMult).toFixed(2));
      const monthlyRevenueIncrease = Number((baseMonthlyRevenueIncrease * config.revenueMult).toFixed(2));
      const implCost = Number((implementationCost * config.costMult).toFixed(2));
      const mthlyOpCost = Number((monthlyOperatingCost * config.costMult).toFixed(2));

      const totalMonthlyGain = monthlySavings + monthlyRevenueIncrease;
      const monthlyNetBenefit = Number((totalMonthlyGain - mthlyOpCost).toFixed(2));
      const annualNetBenefit = Number(((monthlyNetBenefit * 12) - implCost).toFixed(2));

      let paybackPeriodMonths = 0;
      if (implCost > 0) {
        paybackPeriodMonths = monthlyNetBenefit > 0
          ? Number((implCost / monthlyNetBenefit).toFixed(1))
          : 999;
      }

      let roiPercent = 0;
      const totalFirstYearInvestment = implCost + (mthlyOpCost * 12);
      if (totalFirstYearInvestment > 0) {
        roiPercent = Number(((annualNetBenefit / totalFirstYearInvestment) * 100).toFixed(1));
      } else if (annualNetBenefit > 0) {
        roiPercent = 100;
      }

      const formulaStr = `NetMonthly = (Savings * ${config.savingsMult} + Revenue * ${config.revenueMult}) - (OpCost * ${config.costMult}); Annual = (NetMonthly * 12) - ImplCost; ROI = (Annual / TotalInv) * 100`;

      // If unconfirmed or unknown, penalize confidence score
      let adjustedConfidence = config.confidence;
      if (hasUnknowns) adjustedConfidence *= 0.5;
      if (unconfirmedAssumptions.length > 0) adjustedConfidence *= 0.8;

      return {
        scenario: config.type,
        monthlySavings,
        monthlyRevenueIncrease,
        monthlyImplementationCost: implCost,
        monthlyOperatingCost: mthlyOpCost,
        monthlyNetBenefit,
        annualNetBenefit,
        paybackPeriodMonths,
        roiPercent,
        formulaDetails: {
          inputs: {
            baseMonthlySavings,
            baseMonthlyRevenueIncrease,
            implementationCost,
            monthlyOperatingCost,
            savingsMult: config.savingsMult,
            revenueMult: config.revenueMult,
            costMult: config.costMult,
            unconfirmedCount: unconfirmedAssumptions.length
          },
          formula: formulaStr,
          confidenceScore: Number(adjustedConfidence.toFixed(2)),
          hasUnknowns
        }
      };
    });
  }

  /**
   * Helper to derive aggregate evidence classification from assumptions.
   */
  public static deriveAggregateClassification(assumptions: FinancialAssumption[]): EvidenceClassification {
    if (assumptions.some(a => a.classification === 'unknown')) return 'unknown';
    if (assumptions.some(a => a.classification === 'assumption' && !a.isConfirmed)) return 'assumption';
    if (assumptions.every(a => a.classification === 'verified' || a.isConfirmed)) return 'verified';
    if (assumptions.some(a => a.classification === 'connected_data')) return 'connected_data';
    if (assumptions.some(a => a.classification === 'owner_provided')) return 'owner_provided';
    return 'calculated';
  }
}
