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
