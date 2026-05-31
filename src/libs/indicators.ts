import {
  bullish,
  bearish,
  vwap,
  ema,
  rsi,
  atr,
  stochasticrsi,
} from "technicalindicators";

export const CalculateEMA = (values: number[], period: number) => {
  return ema({ values, period });
};

export const CalculateRSI = (values: number[], period: number) => {
  return rsi({ values, period });
};

export const CalculateATR = (
  high: number[],
  low: number[],
  close: number[],
  period: number,
) => {
  return atr({ high, low, close, period });
};

export const CalculateVWAP = (
  high: number[],
  low: number[],
  close: number[],
  volume: number[],
) => {
  return vwap({ high, low, close, volume });
};

export const CalculateStockRSI = (
  close: number[],
  rsiPeriod = 14,
  stochasticPeriod = 14,
  kPeriod = 3,
  dPeriod = 3,
) => {
  return stochasticrsi({
    values: close,
    rsiPeriod,
    stochasticPeriod,
    kPeriod,
    dPeriod,
  });
};

export const CalculateTrend = (
  open: number[],
  high: number[],
  low: number[],
  close: number[],
) => {
  const bull = bullish({ open, high, low, close, reversedInput: false });
  const bear = bearish({ open, high, low, close, reversedInput: false });

  return bull ? "LONG" : bear ? "SHORT" : "HOLD";
};
