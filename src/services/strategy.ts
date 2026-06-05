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
  getMarketStructure,
  hasBearishDivergence,
  hasBullishDivergence,
  isVolumeSpike,
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
    { over: 40, under: 60 },
    "over",
  );
  const stochBear = StockHasticCross(
    { fast: stochRsiK.at(-1) || 0, slow: stochRsiK.at(-2) || 0 },
    { fast: stochRsiD.at(-1) || 0, slow: stochRsiD.at(-2) || 0 },
    { over: 40, under: 60 },
    "under",
  );

  // Trend Market
  const trendC1 = FindDefaultTrend(c1.opens, c1.highs, c1.lows, c1.closes);
  const trendC2 = FindDefaultTrend(c2.opens, c2.highs, c2.lows, c2.closes);

  // Volatility
  const atrPercent = ((atr14.at(-1) || 0) / close) * 100;
  const validVolatility = atrPercent >= 0.3 && atrPercent <= 1.5;

  const pullbackLong =
    close > emaMid && close >= emaFast * 0.995 && close <= emaFast * 1.01;
  const pullbackShort =
    close < emaMid && close <= emaFast * 1.005 && close >= emaFast * 0.99;

  const validLong =
    isMacroUptrend &&
    emaAgmBul &&
    rsiStrBul &&
    stochBul &&
    trendC1 === "LONG" &&
    trendC2 === "LONG" &&
    validVolatility &&
    pullbackLong;

  const validShort =
    isMacroDowntrend &&
    emaAgmBear &&
    rsiStrBear &&
    stochBear &&
    trendC1 === "SHORT" &&
    trendC2 === "SHORT" &&
    validVolatility &&
    pullbackShort;

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

export const TwoStarategy = (
  symbol: string,
  c1: IGetCandles,
  c2: IGetCandles,
): ITrade | null => {
  const ema20 = CalculateEMA(c1.closes, 20);
  const ema50 = CalculateEMA(c1.closes, 50);
  const ema200 = CalculateEMA(c1.closes, 200);
  const rsi14 = CalculateRSI(c1.closes, 14);
  const atr14 = CalculateATR(c1.highs, c1.lows, c1.closes, 14);
  const stockRSI = CalculateStockRSI(c1.closes, 14, 14, 3, 3);

  const stochRsiK = stockRSI.map((d) => d.k);
  const stochRsiD = stockRSI.map((d) => d.d);

  const close = LastNumber(c1.closes);
  const open = LastNumber(c1.opens);
  const emaFast = LastNumber(ema20);
  const emaMid = LastNumber(ema50);
  const emaSlow = LastNumber(ema200);
  const rsi = LastNumber(rsi14);
  const atr = LastNumber(atr14);

  const htfEma200 = CalculateEMA(c2.closes, 200);
  const htfEma50 = CalculateEMA(c2.closes, 50);
  const htfClose = LastNumber(c2.closes);
  const htfFast = LastNumber(htfEma50);
  const htfSlow = LastNumber(htfEma200);

  const htfTrendLong = htfClose > htfSlow && htfFast > htfSlow;

  const htfTrendShort = htfClose < htfSlow && htfFast < htfSlow;

  const emaBullish = emaFast > emaMid && emaMid > emaSlow;
  const emaBearish = emaFast < emaMid && emaMid < emaSlow;

  const rsiBullish = rsi > 50 && rsi < 72;
  const rsiBearish = rsi < 50 && rsi > 28;

  const stochBullish = StockHasticCross(
    { fast: stochRsiK.at(-1) || 0, slow: stochRsiK.at(-2) || 0 },
    { fast: stochRsiD.at(-1) || 0, slow: stochRsiD.at(-2) || 0 },
    { over: 40, under: 60 },
    "over",
  );

  const stochBearish = StockHasticCross(
    { fast: stochRsiK.at(-1) || 0, slow: stochRsiK.at(-2) || 0 },
    { fast: stochRsiD.at(-1) || 0, slow: stochRsiD.at(-2) || 0 },
    { over: 40, under: 60 },
    "under",
  );

  const atrPercent = (atr / close) * 100;
  const validVolatility = atrPercent >= 0.3 && atrPercent <= 1.8;

  const volumeSpike = isVolumeSpike(c1.volumes, 20, 1.2);
  const structure = getMarketStructure(c1.highs, c1.lows);

  const bullishDivergence = hasBullishDivergence(c1.lows, rsi14);
  const bearishDivergence = hasBearishDivergence(c1.highs, rsi14);

  const bullishCandle = close > open;
  const bearishCandle = close < open;
  const atrDistance = Math.abs(close - emaFast);
  const maxPullbackDistance = atr * 0.8;

  const pullbackLong = close > emaMid && atrDistance <= maxPullbackDistance;

  const pullbackShort = close < emaMid && atrDistance <= maxPullbackDistance;

  let longScore = 0;
  let shortScore = 0;

  if (htfTrendLong) longScore += 2;
  if (htfTrendShort) shortScore += 2;

  if (emaBullish) longScore += 2;
  if (emaBearish) shortScore += 2;

  if (close > emaSlow) longScore += 1;
  if (close < emaSlow) shortScore += 1;

  if (rsiBullish) longScore += 1;
  if (rsiBearish) shortScore += 1;

  if (stochBullish) longScore += 1;
  if (stochBearish) shortScore += 1;

  if (validVolatility) {
    longScore += 1;
    shortScore += 1;
  }

  if (volumeSpike) {
    longScore += 1;
    shortScore += 1;
  }

  if (structure === "BULLISH") longScore += 1;
  if (structure === "BEARISH") shortScore += 1;

  if (pullbackLong) longScore += 1;
  if (pullbackShort) shortScore += 1;

  if (bullishCandle) longScore += 1;
  if (bearishCandle) shortScore += 1;

  if (bearishDivergence) longScore -= 2;
  if (bullishDivergence) shortScore -= 2;
  const validLong = longScore >= 7 && longScore > shortScore;
  const validShort = shortScore >= 7 && shortScore > longScore;
  const signal = validLong ? "LONG" : validShort ? "SHORT" : "WAIT";

  if (signal === "WAIT") return null;

  const pricing = GetSLTPPrice(close, atr, signal === "LONG" ? "buy" : "sell");

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
};
