import {
  CalculateATR,
  CalculateEMA,
  CalculateRSI,
  CalculateStockRSI,
} from "../libs/indicators.js";
import type { IGetCandles, ITrade } from "../libs/interfaces.js";
import { GetSLTPPrice } from "./risks.js";
import {
  FindDefaultTrend,
  LastNumber,
  PriceCross,
  StockHasticCross,
} from "./signal.js";

export const FirstStrategy = async (
  symbol: string,
  c1: IGetCandles,
  c2: IGetCandles,
): Promise<ITrade | null> => {
  const ema20 = CalculateEMA(c1.closes, 20);
  const ema50 = CalculateEMA(c1.closes, 50);
  const ema200 = CalculateEMA(c1.closes, 200);
  const rsi14 = CalculateRSI(c1.closes, 14);
  const atr14 = CalculateATR(c1.highs, c1.lows, c1.closes, 14);
  const stockRSI = CalculateStockRSI(c1.closes, 14, 14, 3, 3);
  const stochRsiK = stockRSI.map((d) => d.k);
  const stochRsiD = stockRSI.map((d) => d.d);
  const close = LastNumber(c1.closes);
  const prevclose = c1.closes.at(-2) || 0;

  const emaFast = LastNumber(ema20);
  const emaMid = LastNumber(ema50);
  const emaSlow = LastNumber(ema200);
  const rsi = LastNumber(rsi14);

  // Trend confirmation
  const isMacroUptrend = PriceCross(close, emaSlow, "over");
  const isMacroDowntrend = PriceCross(close, emaSlow, "under");

  // EMA alignment for confluence
  const emaAgmBul =
    PriceCross(emaFast, emaMid, "over") && PriceCross(emaMid, emaSlow, "over");
  const emaAgmBear =
    PriceCross(emaFast, emaMid, "under") &&
    PriceCross(emaMid, emaSlow, "under");

  // RSI Strength
  const rsiStrBul = PriceCross(rsi, 45, "over") && PriceCross(rsi, 70, "under");
  const rsiStrBear =
    PriceCross(rsi, 55, "under") && PriceCross(rsi, 30, "over");

  // Stochastic cross
  const stochBul = StockHasticCross(
    { fast: stochRsiK.at(-1) || 0, slow: stochRsiK.at(-2) || 0 },
    { fast: stochRsiD.at(-1) || 0, slow: stochRsiD.at(-2) || 0 },
    { over: 25, under: 75 },
    "over",
  );
  const stochBear = StockHasticCross(
    { fast: stochRsiK.at(-1) || 0, slow: stochRsiK.at(-2) || 0 },
    { fast: stochRsiD.at(-1) || 0, slow: stochRsiD.at(-2) || 0 },
    { over: 25, under: 75 },
    "under",
  );

  // Trend Market
  const trendC1 = FindDefaultTrend(c1.opens, c1.highs, c1.lows, c1.closes);
  const trendC2 = FindDefaultTrend(c2.opens, c2.highs, c2.lows, c2.closes);

  // Volatility
  const atrPercent = ((atr14.at(-1) || 0) / close) * 100;
  const validVolatility = atrPercent >= 0.5 && atrPercent <= 2.0;

  const validLong =
    isMacroUptrend &&
    emaAgmBul &&
    rsiStrBul &&
    stochBul &&
    trendC1 === "LONG" &&
    trendC2 === "LONG" &&
    validVolatility &&
    PriceCross(close, emaFast, "over") &&
    PriceCross(close, emaMid, "over") &&
    PriceCross(close, prevclose, "over");

  const validShort =
    isMacroDowntrend &&
    emaAgmBear &&
    rsiStrBear &&
    stochBear &&
    trendC1 === "SHORT" &&
    trendC2 === "SHORT" &&
    validVolatility &&
    PriceCross(close, emaFast, "under") &&
    PriceCross(close, emaMid, "under") &&
    PriceCross(close, prevclose, "under");

  const signal = validLong ? "LONG" : validShort ? "SHORT" : "WAIT";
  const pricing = GetSLTPPrice(
    close,
    atr14.at(-1) || 0,
    signal === "LONG" ? "buy" : "sell",
  );

  if (signal !== "WAIT") {
    return {
      id: "",
      pairId: "",
      Pair: {
        name: symbol,
        id: "",
        status: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      side: signal === "LONG" ? "buy" : "sell",
      open_time: new Date(),
      open: pricing.open,
      amount: pricing.amount,
      sl_price: pricing.sl,
      tp_price: pricing.tp,
      pnl: 0,
      reason: null,
      lev: pricing.lev,
      close: null,
      close_time: null,
    };
  }
  return null;
};
