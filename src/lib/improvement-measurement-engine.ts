// src/lib/improvement-measurement-engine.ts
import {
  DeployableBusinessImprovement,
  BusinessMetricDefinition,
  ImprovementPerformanceResult,
  ImprovementDecision,
  FinancialBenefitStatus,
  FinancialScenario
} from '../types/deployable-improvement.ts';

export interface MeasurementInputData {
  improvement: DeployableBusinessImprovement;
  actualMetrics: Record<string, number>; // metricId -> current value
  evaluationDate?: string;
}

export class ImprovementMeasurementEngine {
  /**
   * Evaluate actual post-deployment performance against baseline metrics and financial scenarios.
   */
  public static evaluatePerformance(input: MeasurementInputData): ImprovementPerformanceResult {
    const { improvement, actualMetrics, evaluationDate = new Date().toISOString() } = input;
    const { measurementPlan, scenarios } = improvement;

    const comparisonToBaseline: Record<string, number> = {};
    let totalTargetAttainmentSum = 0;
    let evaluatedMetricsCount = 0;

    // 1. Calculate metric deltas relative to baseline
    for (const metric of measurementPlan.outcomeMetrics) {
      const actualVal = actualMetrics[metric.id] ?? metric.currentActualValue;
      if (actualVal !== undefined && metric.baselineValue !== undefined) {
        const delta = actualVal - metric.baselineValue;
        const pctChange = metric.baselineValue !== 0
          ? Number(((delta / Math.abs(metric.baselineValue)) * 100).toFixed(2))
          : delta > 0 ? 100 : 0;

        comparisonToBaseline[metric.id] = pctChange;

        if (metric.targetValue !== undefined && metric.targetValue !== metric.baselineValue) {
          const targetDelta = metric.targetValue - metric.baselineValue;
          const attainmentRatio = Math.min(Math.max(delta / targetDelta, -1), 2);
          totalTargetAttainmentSum += attainmentRatio;
          evaluatedMetricsCount++;
        }
      }
    }

    const averageAttainment = evaluatedMetricsCount > 0
      ? totalTargetAttainmentSum / evaluatedMetricsCount
      : 0;

    // 2. Compare against financial scenarios
    const expectedScenario = scenarios.find(s => s.scenario === 'expected') || scenarios[0];
    const conservativeScenario = scenarios.find(s => s.scenario === 'conservative');
    const upsideScenario = scenarios.find(s => s.scenario === 'upside');

    const expectedBenefit = expectedScenario?.monthlyNetBenefit || 1;
    const conservativeBenefit = conservativeScenario?.monthlyNetBenefit || expectedBenefit * 0.7;
    const upsideBenefit = upsideScenario?.monthlyNetBenefit || expectedBenefit * 1.3;

    // Calculate actual estimated monthly benefit from metric deltas
    // E.g., if target revenue increase was achieved
    const actualMonthlyNetBenefit = Number((expectedBenefit * Math.max(averageAttainment, 0)).toFixed(2));

    const conservativeRatio = Number((actualMonthlyNetBenefit / (conservativeBenefit || 1)).toFixed(2));
    const expectedRatio = Number((actualMonthlyNetBenefit / (expectedBenefit || 1)).toFixed(2));
    const upsideRatio = Number((actualMonthlyNetBenefit / (upsideBenefit || 1)).toFixed(2));

    // 3. Determine Financial Benefit Verification Status
    let financialBenefitStatus: FinancialBenefitStatus = "inconclusive";
    if (evaluatedMetricsCount === 0) {
      financialBenefitStatus = "inconclusive";
    } else if (expectedRatio >= 0.85) {
      financialBenefitStatus = "verified";
    } else if (conservativeRatio >= 0.7) {
      financialBenefitStatus = "partially_verified";
    } else {
      financialBenefitStatus = "not_verified";
    }

    // 4. Formulate Decision Recommendation
    let recommendation: ImprovementDecision = "insufficient_data";

    if (evaluatedMetricsCount === 0) {
      recommendation = "insufficient_data";
    } else if (expectedRatio >= 1.25) {
      recommendation = "expand";
    } else if (expectedRatio >= 0.75) {
      recommendation = "continue";
    } else if (expectedRatio >= 0.4) {
      recommendation = "modify";
    } else if (expectedRatio < 0) {
      recommendation = "rollback";
    } else {
      recommendation = "pause";
    }

    return {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      improvementId: improvement.id,
      tenantId: improvement.tenantId,
      evaluationDate,
      status: improvement.deploymentStatus,
      comparisonToBaseline,
      comparisonToScenarios: {
        conservativeRatio,
        expectedRatio,
        upsideRatio
      },
      financialBenefitStatus,
      recommendation,
      notes: `Evaluated ${evaluatedMetricsCount} outcome metrics. Average target attainment: ${(averageAttainment * 100).toFixed(1)}%.`
    };
  }
}
