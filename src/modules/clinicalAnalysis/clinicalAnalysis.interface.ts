export type TestResult =
  | "Normal"
  | "Abnormal"
  | "Critical"
  | "Inconclusive";

export interface ClinicalSummary {
  totalTests: number;
  normal: number;
  abnormal: number;
  critical: number;
  inconclusive: number;
}

export interface AgeDistribution {
  ageGroup: string;
  count: number;
}

export interface TransitionRecord {
  motherId: string;
  motherName: string;
  motherAge: number;
  hospitalName: string;
  transitionPath: string;
  totalDays: number;
  testsInBetween: number;
}