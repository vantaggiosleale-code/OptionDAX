/**
 * Black-Scholes Option Pricing Module (Corrected Implementation)
 *
 * This module provides Black-Scholes pricing and Greeks calculations
 * optimized for DAX Total Return index (dividend yield = 0).
 *
 * All formulas are verified against industry-standard implementations.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Days in a year (accounts for leap years) */
export const DAYS_PER_YEAR = 365.25;

/** Minimum time to expiry to avoid division by zero */
export const MIN_TIME_TO_EXPIRY = 0.000001;

/** Maximum volatility for IV calculation convergence check */
export const MAX_VOLATILITY = 5; // 500%

/** Minimum volatility to avoid numerical issues */
export const MIN_VOLATILITY = 0.0001;

// ============================================================================
// MATH UTILITIES
// ============================================================================

/**
 * Standard Normal Probability Density Function
 */
export function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Cumulative Standard Normal Distribution
 * Uses polynomial approximation for accuracy
 */
export function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014337 * Math.exp(-x * x / 2);
  const prob = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x > 0 ? 1 - prob : prob;
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

export interface BlackScholesInput {
  spotPrice: number;      // S: Underlying Price
  strikePrice: number;    // K: Strike Price
  timeToExpiry: number;   // t: Time to maturity in years
  riskFreeRate: number;   // r: Risk-free rate (decimal, e.g., 0.05 for 5%)
  volatility: number;     // sigma: Volatility (decimal)
  optionType: 'call' | 'put';
}

export interface BlackScholesResult {
  optionPrice: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
  d1: number;
  d2: number;
}

export class BlackScholesValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlackScholesValidationError';
  }
}

/**
 * Validates Black-Scholes input parameters
 * @throws BlackScholesValidationError if inputs are invalid
 */
export function validateInputs(params: BlackScholesInput): void {
  const { spotPrice, strikePrice, timeToExpiry, volatility } = params;

  if (spotPrice <= 0) {
    throw new BlackScholesValidationError('Spot price must be positive');
  }
  if (strikePrice <= 0) {
    throw new BlackScholesValidationError('Strike price must be positive');
  }
  if (timeToExpiry < 0) {
    throw new BlackScholesValidationError('Time to expiry cannot be negative');
  }
  if (volatility < 0) {
    throw new BlackScholesValidationError('Volatility cannot be negative');
  }
}

// ============================================================================
// BLACK-SCHOLES CALCULATION
// ============================================================================

/**
 * Calculate d1 and d2 parameters for Black-Scholes
 * Simplified for DAX Total Return (dividend yield q = 0)
 */
export function calculateD1D2(
  spotPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  riskFreeRate: number,
  volatility: number
): { d1: number; d2: number } {
  // Protect against division by zero
  const T = Math.max(timeToExpiry, MIN_TIME_TO_EXPIRY);
  const sigma = Math.max(volatility, MIN_VOLATILITY);

  const sqrtT = Math.sqrt(T);
  
  // Formula for q=0 (DAX Total Return)
  const d1 = (Math.log(spotPrice / strikePrice) + (riskFreeRate + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  return { d1, d2 };
}

/**
 * Main Black-Scholes calculation function
 * Returns option price and all Greeks
 * Optimized for DAX Total Return (dividend yield q = 0)
 */
export function calculateBlackScholes(params: BlackScholesInput): BlackScholesResult {
  validateInputs(params);

  const { spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, optionType } = params;

  // Handle expired options
  if (timeToExpiry <= 0) {
    const intrinsic = optionType === 'call' ? Math.max(0, spotPrice - strikePrice) : Math.max(0, strikePrice - spotPrice);
    return {
      optionPrice: intrinsic,
      delta: optionType === 'call' ? (spotPrice > strikePrice ? 1 : 0) : (spotPrice < strikePrice ? -1 : 0),
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
      d1: 0,
      d2: 0,
    };
  }

  // Protect against edge cases
  const T = Math.max(timeToExpiry, MIN_TIME_TO_EXPIRY);
  const sigma = Math.max(volatility, MIN_VOLATILITY);

  const { d1, d2 } = calculateD1D2(spotPrice, strikePrice, T, riskFreeRate, sigma);
  const sqrtT = Math.sqrt(T);
  
  // Discount factor
  const expRT = Math.exp(-riskFreeRate * T);

  let optionPrice: number;
  let delta: number;
  let theta: number;
  let rho: number;

  if (optionType === 'call') {
    // Call option pricing (q=0)
    optionPrice = spotPrice * normalCDF(d1) - strikePrice * expRT * normalCDF(d2);
    
    // Delta for call (q=0 → e^(-q*t) = 1)
    delta = normalCDF(d1);
    
    // Theta for call (per day)
    // Formula: [-(S*σ*pdf(d1))/(2√t) - r*K*e^(-r*t)*N(d2)] / 365
    const thetaTerm1 = -(spotPrice * sigma * normalPDF(d1)) / (2 * sqrtT);
    const thetaTerm2 = -riskFreeRate * strikePrice * expRT * normalCDF(d2);
    theta = (thetaTerm1 + thetaTerm2) / DAYS_PER_YEAR;

    // Rho for call (per 1% change in rate)
    rho = (strikePrice * T * expRT * normalCDF(d2)) * 0.01;

  } else {
    // Put option pricing (q=0)
    optionPrice = strikePrice * expRT * normalCDF(-d2) - spotPrice * normalCDF(-d1);
    
    // Delta for put (q=0 → e^(-q*t) = 1)
    delta = -normalCDF(-d1);

    // Theta for put (per day)
    // Formula: [-(S*σ*pdf(d1))/(2√t) + r*K*e^(-r*t)*N(-d2)] / 365
    const thetaTerm1 = -(spotPrice * sigma * normalPDF(d1)) / (2 * sqrtT);
    const thetaTerm2 = riskFreeRate * strikePrice * expRT * normalCDF(-d2);
    theta = (thetaTerm1 + thetaTerm2) / DAYS_PER_YEAR;

    // Rho for put (per 1% change in rate)
    rho = (-strikePrice * T * expRT * normalCDF(-d2)) * 0.01;
  }

  // Ensure non-negative price
  optionPrice = Math.max(0, optionPrice);

  // Greeks (same for call and put)
  const npd1 = normalPDF(d1);

  // Gamma (scaled by 100 for readability)
  // Formula: pdf(d1) / (S * σ * √t) * 100
  const gamma = (npd1 / (spotPrice * sigma * sqrtT)) * 100;

  // Vega (per 1% volatility change)
  // Formula: S * pdf(d1) * √t * 0.01
  const vega = spotPrice * npd1 * sqrtT * 0.01;

  return {
    optionPrice: roundTo(optionPrice, 2),
    delta: roundTo(delta, 4),
    gamma: roundTo(gamma, 6),
    vega: roundTo(vega, 2),
    theta: roundTo(theta, 2),
    rho: roundTo(rho, 2),
    d1,
    d2,
  };
}

// ============================================================================
// IMPLIED VOLATILITY
// ============================================================================

export interface ImpliedVolatilityInput {
  targetPrice: number;
  spotPrice: number;
  strikePrice: number;
  timeToExpiry: number;
  riskFreeRate: number;
  optionType: 'call' | 'put';
}

export interface ImpliedVolatilityResult {
  impliedVolatility: number | null;
  converged: boolean;
  iterations: number;
}

/**
 * Calculate Implied Volatility using Newton-Raphson method
 * Given a Market Price, find the Sigma that generates that price.
 */
export function calculateImpliedVolatility(
  params: ImpliedVolatilityInput,
  options: { maxIterations?: number; epsilon?: number } = {}
): ImpliedVolatilityResult {
  const { targetPrice, spotPrice, strikePrice, timeToExpiry, riskFreeRate, optionType } = params;
  const { maxIterations = 20, epsilon = 0.0001 } = options;

  // Validate target price
  if (targetPrice <= 0) {
    return { impliedVolatility: null, converged: false, iterations: 0 };
  }

  // Initial guess
  let sigma = 0.3;
  let iterations = 0;

  for (let i = 0; i < maxIterations; i++) {
    iterations = i + 1;

    const result = calculateBlackScholes({
      spotPrice,
      strikePrice,
      timeToExpiry,
      riskFreeRate,
      volatility: sigma,
      optionType,
    });

    const priceDiff = result.optionPrice - targetPrice;

    // Check convergence
    if (Math.abs(priceDiff) < epsilon) {
      return { impliedVolatility: roundTo(sigma * 100, 2), converged: true, iterations };
    }

    // result.vega is "Change per 1% vol".
    // For Newton-Raphson we need dPrice/dSigma.
    // Since result.vega = dPrice / dSigma * 0.01, then dPrice/dSigma = result.vega * 100
    const vega = result.vega * 100;

    if (Math.abs(vega) < 0.00001) {
      break; // Vega too low, avoid division by zero
    }

    sigma = sigma - (priceDiff / vega);

    // Clamp sigma to reasonable bounds
    if (sigma <= 0) sigma = 0.001;
    if (sigma > MAX_VOLATILITY) sigma = MAX_VOLATILITY;
  }

  // Did not converge
  return { impliedVolatility: null, converged: false, iterations };
}

// ============================================================================
// TIME UTILITIES
// ============================================================================

/**
 * Calculate time to expiry in years from expiry date
 */
export function getTimeToExpiry(expiryDate: string | Date): number {
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const now = new Date();

  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 0; // Expired
  }

  return diffMs / (DAYS_PER_YEAR * 24 * 60 * 60 * 1000);
}

// ============================================================================
// BREAK-EVEN CALCULATION
// ============================================================================

export interface PayoffPoint {
  spotPrice: number;
  payoff: number;
}

/**
 * Calculate break-even points using linear interpolation
 * This provides more accurate break-even values than simple filtering
 */
export function calculateBreakEvenPoints(payoffData: PayoffPoint[]): number[] {
  const breakEvenPoints: number[] = [];

  for (let i = 1; i < payoffData.length; i++) {
    const prev = payoffData[i - 1];
    const curr = payoffData[i];

    // Check if payoff crosses zero between these points
    if ((prev.payoff < 0 && curr.payoff >= 0) || (prev.payoff >= 0 && curr.payoff < 0)) {
      // Linear interpolation to find exact break-even
      const ratio = Math.abs(prev.payoff) / (Math.abs(prev.payoff) + Math.abs(curr.payoff));
      const breakEven = prev.spotPrice + ratio * (curr.spotPrice - prev.spotPrice);
      breakEvenPoints.push(roundTo(breakEven, 2));
    }
  }

  return breakEvenPoints;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Round a number to a specified number of decimal places
 */
function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Convert percentage to decimal (e.g., 5 -> 0.05)
 */
export function percentToDecimal(percent: number): number {
  return percent / 100;
}

/**
 * Convert decimal to percentage (e.g., 0.05 -> 5)
 */
export function decimalToPercent(decimal: number): number {
  return decimal * 100;
}
