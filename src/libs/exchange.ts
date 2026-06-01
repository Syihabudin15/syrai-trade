import ccxt from "ccxt";
import type { ICandle } from "./interfaces.js";
import { RISK_PERCENT } from "./config.js";

export const exchange = new ccxt.bitget({
  enableRateLimit: true,
  options: {
    defaultType: "swap", // "spot" atau "swap"
  },
});
let marketsLoaded = false;

export async function ensureMarketsLoaded() {
  if (!marketsLoaded) {
    await exchange.loadMarkets();
    marketsLoaded = true;
  }
}

export async function GetTopFutureVolume(limit = 30) {
  try {
    await ensureMarketsLoaded();
    const tickers = await exchange.fetchTickers();

    const results = Object.values(tickers)
      .filter((ticker) => {
        const market = exchange.markets[ticker.symbol];

        if (!market) return false;

        return (
          market.active &&
          market.swap && // futures perpetual
          market.quote === "USDT"
        );
      })
      .map((ticker) => ({
        symbol: ticker.symbol,
        price: ticker.last,
        volumeUSDT: ticker.quoteVolume || 0,
        change24h: ticker.percentage || 0,
        funding: ticker.info?.fundingRate,
      }))
      .sort((a, b) => b.volumeUSDT - a.volumeUSDT)
      .slice(0, limit);
    return results;
  } catch (err) {
    console.log(
      "GetTopFutureVolume error:",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

export async function GetCandles(
  symbol: string,
  tf: string = "5m",
  limit: number,
) {
  try {
    await ensureMarketsLoaded();
    const candles = await exchange.fetchOHLCV(symbol, tf, undefined, limit);

    const candleMap: ICandle[] = candles.map((c) => ({
      open: Number(c[1]),
      high: Number(c[2]),
      low: Number(c[3]),
      close: Number(c[4]),
      volume: Number(c[5]),
      timestamp: Number(c[0]),
    }));
    const timestamps = candles.map((c) => c[0]) as number[];
    const opens = candles.map((c) => c[1]) as number[];
    const highs = candles.map((c) => c[2]) as number[];
    const lows = candles.map((c) => c[3]) as number[];
    const closes = candles.map((c) => c[4]) as number[];
    const volumes = candles.map((c) => c[5]) as number[];

    return {
      candles: candleMap,
      timestamps,
      opens,
      highs,
      lows,
      closes,
      volumes,
    };
  } catch (err) {
    console.log(
      `GetCandles(${symbol}, ${tf}) error:`,
      err instanceof Error ? err.message : err,
    );
    return {
      candles: [],
      timestamps: [],
      opens: [],
      highs: [],
      lows: [],
      closes: [],
      volumes: [],
    };
  }
}

export async function GetCurrentPrice(symbol: string): Promise<number | null> {
  try {
    await ensureMarketsLoaded();
    const ticker = await exchange.fetchTicker(symbol);

    return ticker?.last || null;
  } catch (err) {
    console.log(
      `GetCurrentPrice(${symbol}) error:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

export async function GetBalance(): Promise<number> {
  const balance = await exchange.fetchBalance({ type: "swap" });
  const total = balance.total.free;
  if (!total || total <= 0) throw new Error("USDT balance not found");
  return total;
}

export async function AmonutOfTrade(): Promise<number> {
  const balance = await GetBalance();
  return balance * (RISK_PERCENT / 100);
}
