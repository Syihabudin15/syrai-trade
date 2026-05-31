import { MAX_LEV, RISK_PERCENT } from "../libs/config.js";

export interface RiskMetrics {
  totalOpenPositions: number;
  totalOpenRisk: number;
  totalOpenProfit: number;
  dailyPnL: number;
  winRate: number;
  maxDrawdown: number;
}

export const riskAmountUSDT = 10 * (RISK_PERCENT / 100);

export const GetSLTPPrice = (
  price: number,
  atr: number,
  signal: "buy" | "sell",
) => {
  // === VARIABEL ENTRY, SL, TP, AMOUNT ===
  let entryPrice = price;
  let stopLossPrice = 0;
  let takeProfitPrice = 0;

  // Tighter SL untuk reduce losses (1.0x ATR untuk high quality signals)
  const slDistance = atr * 1.0;
  // Better Risk/Reward ratio: 1:3 untuk more consistent profit
  const riskRewardRatio = 2.2;

  if (signal === "buy") {
    stopLossPrice = entryPrice - slDistance;
    takeProfitPrice = entryPrice + slDistance * riskRewardRatio;
  } else if (signal === "sell") {
    stopLossPrice = entryPrice + slDistance;
    takeProfitPrice = entryPrice - slDistance * riskRewardRatio;
  }
  return {
    open: Number(entryPrice.toFixed(4)),
    sl: Number(stopLossPrice.toFixed(4)),
    tp: Number(takeProfitPrice.toFixed(4)),
    margin: Number(riskAmountUSDT.toFixed(4)),
    amount: Number(((riskAmountUSDT * MAX_LEV) / entryPrice).toFixed(4)),
    lev: MAX_LEV,
  };
};
