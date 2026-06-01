import { ATR_MULTIPLIER, MAX_LEV, RISK_PERCENT } from "../libs/config.js";

export interface RiskMetrics {
  totalOpenPositions: number;
  totalOpenRisk: number;
  totalOpenProfit: number;
  dailyPnL: number;
  winRate: number;
  maxDrawdown: number;
}

export const GetSLTPPrice = (
  price: number,
  atr: number,
  signal: "buy" | "sell",
) => {
  const entryPrice = price;

  const slDistance = atr * ATR_MULTIPLIER;
  const riskRewardRatio = ATR_MULTIPLIER + 0.5;

  let stopLossPrice = 0;
  let takeProfitPrice = 0;

  if (signal === "buy") {
    stopLossPrice = entryPrice - slDistance;
    takeProfitPrice = entryPrice + slDistance * riskRewardRatio;
  } else {
    stopLossPrice = entryPrice + slDistance;
    takeProfitPrice = entryPrice - slDistance * riskRewardRatio;
  }

  const riskUSDT = 10 * (RISK_PERCENT / 100);

  const amount = riskUSDT / Math.abs(entryPrice - stopLossPrice);

  return {
    open: Number(entryPrice.toFixed(4)),
    sl: Number(stopLossPrice.toFixed(4)),
    tp: Number(takeProfitPrice.toFixed(4)),
    margin: Number(((amount * entryPrice) / MAX_LEV).toFixed(4)),
    amount: Number(amount.toFixed(6)),
    lev: MAX_LEV,
  };
};
