import { TIMEFRAME, TIMEFRAME_HIGHER, TOP_N } from "./libs/config.js";
import { GetCandles, GetTopFutureVolume } from "./libs/exchange.js";
import type { ITrade } from "./libs/interfaces.js";
import {
  GetActiveTrades,
  GetHourslyReport,
  ValidateActiveTrades,
} from "./services/order.js";
import { FirstStrategy } from "./services/strategy.js";
import { ClosePositions, OpenOrders } from "./services/trades.js";

const MainTrade = async () => {
  const tradedata: ITrade[] = [];
  const topVolumeData = await GetTopFutureVolume(TOP_N);
  for (const symbol of topVolumeData) {
    try {
      const c1 = await GetCandles(symbol.symbol, TIMEFRAME, 200);
      const c2 = await GetCandles(symbol.symbol, TIMEFRAME_HIGHER, 200);
      if (c1.candles.length < 200 || c2.candles.length < 200) continue;

      const signal = await FirstStrategy(symbol.symbol, c1, c2);
      if (!signal) continue;

      const actives = await GetActiveTrades(symbol.symbol);
      const longs = actives.filter((a) => a.side === "buy");
      const shorts = actives.filter((a) => a.side === "sell");
      if (signal.side === "buy" && shorts.length !== 0) {
        ClosePositions(shorts, signal.open);
      } else if (signal.side === "sell" && longs.length !== 0) {
        ClosePositions(longs, signal.open);
      }

      if (
        (signal.side === "buy" && longs.length !== 0) ||
        (signal.side === "sell" && shorts.length !== 0)
      )
        continue;
      tradedata.push(signal);
    } catch (err) {
      console.log(err);
      continue;
    }
  }
  if (tradedata.length !== 0) {
    OpenOrders(tradedata);
  }
};

(async () => {
  console.log("Automatic Trade is starting with FirstStrategy Function");
  await MainTrade();
  await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 5));
  setInterval(
    async () => {
      await MainTrade();
    },
    1000 * 60 * 5,
  );
})();

(async () => {
  await ValidateActiveTrades();
  await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 3));
  setInterval(
    async () => {
      await ValidateActiveTrades();
    },
    1000 * 60 * 3,
  );
})();

(async () => {
  setInterval(
    async () => {
      await GetHourslyReport();
    },
    1000 * 60 * 60 * 1,
  );
})();
