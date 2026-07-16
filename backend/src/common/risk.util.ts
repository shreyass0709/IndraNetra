/**
 * Shared crowd-density/risk helpers used by the mock analysis fallback paths
 * (when the AI service is unreachable). Thresholds mirror ai-service/prediction/risk.py
 * so risk levels stay consistent regardless of which path produced them.
 *
 * Bands follow Fruin's pedestrian Level-of-Service scale (people/m²):
 * LOW < 2, MEDIUM 2-4, HIGH 4-6, CRITICAL >= 6 (crush-risk territory).
 */

// Standard venue-planning assumption used only when an event has no measured area.
export const DEFAULT_PLANNING_DENSITY_PPL_PER_SQM = 2.0;

export function estimateAreaSqMeters(maxCapacity: number, areaSqMeters?: number | null): number {
  if (areaSqMeters && areaSqMeters > 0) return areaSqMeters;
  return Math.max(1, maxCapacity / DEFAULT_PLANNING_DENSITY_PPL_PER_SQM);
}

export function classifyRisk(densityPerSqm: number, utilization: number): string {
  if (densityPerSqm >= 6 || utilization >= 1.2) return 'CRITICAL';
  if (densityPerSqm >= 4 || utilization >= 0.95) return 'HIGH';
  if (densityPerSqm >= 2 || utilization >= 0.6) return 'MEDIUM';
  return 'LOW';
}
