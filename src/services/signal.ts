import { bearish, bullish } from "technicalindicators";

export const PriceCross = (
  fast: number,
  slow: number,
  type: "over" | "under",
) => {
  switch (type) {
    case "over":
      return fast > slow;
    case "under":
      return fast < slow;
    default:
      false;
  }
};

export const StockHasticCross = (
  K: {
    fast: number;
    slow: number;
  },
  D: {
    fast: number;
    slow: number;
  },
  tolerance: {
    over: number;
    under: number;
  },
  type: "over" | "under",
) => {
  switch (type) {
    case "over":
      return K.slow < D.slow && K.fast > D.fast && K.fast < tolerance.over;
    case "under":
      return K.slow > D.slow && K.fast < D.fast && K.fast > tolerance.under;
    default:
      return false;
  }
};

const average = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

export const isVolumeSpike = (
  volumes: number[],
  period = 20,
  multiplier = 1.5,
) => {
  if (volumes.length < period + 1) return false;

  const lastVolume = volumes.at(-1) || 0;
  const avgVolume = average(volumes.slice(-period - 1, -1));

  return lastVolume > avgVolume * multiplier;
};

const getSwingHighs = (highs: number[], lookback = 3) => {
  const swings: number[] = [];

  for (let i = lookback; i < highs.length - lookback; i++) {
    const left = highs.slice(i - lookback, i);
    const right = highs.slice(i + 1, i + lookback + 1);

    if (highs[i] > Math.max(...left) && highs[i] > Math.max(...right)) {
      swings.push(highs[i]);
    }
  }

  return swings;
};
const getSwingLows = (lows: number[], lookback = 3) => {
  const swings: number[] = [];

  for (let i = lookback; i < lows.length - lookback; i++) {
    const left = lows.slice(i - lookback, i);
    const right = lows.slice(i + 1, i + lookback + 1);

    if (lows[i] < Math.min(...left) && lows[i] < Math.min(...right)) {
      swings.push(lows[i]);
    }
  }

  return swings;
};

export const getMarketStructure = (highs: number[], lows: number[]) => {
  const swingHighs = getSwingHighs(highs).slice(-2);
  const swingLows = getSwingLows(lows).slice(-2);

  if (swingHighs.length < 2 || swingLows.length < 2) return "SIDEWAYS";

  const higherHigh = swingHighs[1] > swingHighs[0];
  const higherLow = swingLows[1] > swingLows[0];

  const lowerHigh = swingHighs[1] < swingHighs[0];
  const lowerLow = swingLows[1] < swingLows[0];

  if (higherHigh && higherLow) return "BULLISH";
  if (lowerHigh && lowerLow) return "BEARISH";

  return "SIDEWAYS";
};

export const hasBullishDivergence = (
  lows: number[],
  rsi: number[],
  lookback = 30,
) => {
  if (lows.length < lookback || rsi.length < lookback) return false;

  const recentLows = lows.slice(-lookback);
  const recentRsi = rsi.slice(-lookback);

  const firstLowIndex = recentLows.indexOf(
    Math.min(...recentLows.slice(0, 15)),
  );
  const secondLowIndex =
    15 + recentLows.slice(15).indexOf(Math.min(...recentLows.slice(15)));

  const priceLowerLow = recentLows[secondLowIndex] < recentLows[firstLowIndex];
  const rsiHigherLow = recentRsi[secondLowIndex] > recentRsi[firstLowIndex];

  return priceLowerLow && rsiHigherLow;
};

export const hasBearishDivergence = (
  highs: number[],
  rsi: number[],
  lookback = 30,
) => {
  if (highs.length < lookback || rsi.length < lookback) return false;

  const recentHighs = highs.slice(-lookback);
  const recentRsi = rsi.slice(-lookback);

  const firstHighIndex = recentHighs.indexOf(
    Math.max(...recentHighs.slice(0, 15)),
  );
  const secondHighIndex =
    15 + recentHighs.slice(15).indexOf(Math.max(...recentHighs.slice(15)));

  const priceHigherHigh =
    recentHighs[secondHighIndex] > recentHighs[firstHighIndex];
  const rsiLowerHigh = recentRsi[secondHighIndex] < recentRsi[firstHighIndex];

  return priceHigherHigh && rsiLowerHigh;
};

export const FindDefaultTrend = (
  open: number[],
  high: number[],
  low: number[],
  close: number[],
) => {
  const bull = bullish({ open, high, low, close, reversedInput: false });
  const bear = bearish({ open, high, low, close, reversedInput: false });

  return bull ? "LONG" : bear ? "SHORT" : "WAIT";
};

export const LastNumber = (nums: number[]) => nums.at(-1) || 0;
