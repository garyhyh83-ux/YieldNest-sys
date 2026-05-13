export type RiskProfile = "conservative" | "moderate" | "aggressive";

export type StrategyId =
  | "treasury_core"
  | "treasury_plus"
  | "defi_prime"
  | "morpho_optimizer"
  | "basis_trade"
  | "composite";

export interface Strategy {
  id: StrategyId;
  name: string;
  description: string;
  underlyingProtocol: string;
  underlyingAsset: string;
  expectedApyMin: number;
  expectedApyMax: number;
  riskLevel: "very_low" | "low" | "low_medium" | "medium";
  withdrawalDelay: string;
  minAmount: string;
  active: boolean;
}

export interface AllocationState {
  strategyId: StrategyId;
  targetWeight: number; // basis points (e.g., 6000 = 60%)
  currentWeight: number;
  depositedAmount: string;
  active: boolean;
}

export interface AllocationConfig {
  enterpriseId: string;
  riskProfile: RiskProfile;
  allocations: AllocationState[];
  liquidityRatio: number;
  maxSingleExposure: number;
  rebalanceThreshold: number;
  minYieldDifferential: number;
  compoundFrequency: "daily" | "weekly";
  autoCompound: boolean;
}

export interface YieldRecord {
  id: string;
  enterpriseId: string;
  strategyId: StrategyId;
  snapshotAmount: string;
  grossYield: string;
  feeAmount: string;
  netYield: string;
  apyBps: number;
  recordDate: string;
  createdAt: string;
}

export interface YieldSummary {
  enterpriseId: string;
  totalAssets: string;
  yesterdayYield: string;
  cumulativeYield: string;
  averageApy: number;
  currentApy: number;
}

export interface YieldSimulateRequest {
  amount: string;
  strategyId: StrategyId;
  durationDays: number;
}
