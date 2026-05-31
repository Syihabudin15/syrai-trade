import sharp from "sharp";
import type { ICandle } from "./interfaces.js";

type ChartParams = {
  symbol: string;
  signal: "buy" | "sell";
  candles: ICandle[];
  ema20?: number[];
  ema50?: number[];
  vwap?: number[];
  rsi?: number[];
  openPrice?: number;
  slPrice?: number;
  tpPrice?: number;
};

function yScale(
  value: number,
  min: number,
  max: number,
  height: number,
  top: number,
) {
  return top + ((max - value) / (max - min)) * height;
}

function linePath(
  values: number[],
  candles: ICandle[],
  min: number,
  max: number,
  width: number,
  height: number,
  top: number,
) {
  const gap = width / candles.length;

  return values
    .map((v, i) => {
      if (!Number.isFinite(v)) return "";
      const x = i * gap + gap / 2;
      const y = yScale(v, min, max, height, top);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function priceLine(
  label: string,
  price: number | undefined,
  min: number,
  max: number,
  width: number,
  height: number,
  top: number,
  color: string,
) {
  if (!price || !Number.isFinite(price)) return "";

  const y = yScale(price, min, max, height, top);

  return `
    <line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${color}" stroke-width="1.5" stroke-dasharray="8 6"/>
    <rect x="${width - 165}" y="${y - 15}" width="155" height="24" rx="6" fill="${color}"/>
    <text x="${width - 156}" y="${y + 2}" fill="#020617" font-size="13" font-weight="700" font-family="Arial">
      ${label}: ${price.toFixed(6)}
    </text>
  `;
}

export async function GenerateTradeChart(params: ChartParams) {
  const width = 1100;
  const height = 760;

  const chartTop = 55;
  const chartHeight = 485;

  const rsiTop = 585;
  const rsiHeight = 120;

  const candles = params.candles.slice(-90);

  const extraPrices = [params.openPrice, params.slPrice, params.tpPrice].filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v),
  );

  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const max = Math.max(...highs, ...extraPrices);
  const min = Math.min(...lows, ...extraPrices);

  const padding = (max - min) * 0.08 || max * 0.01;
  const priceMax = max + padding;
  const priceMin = min - padding;

  const gap = width / candles.length;
  const candleWidth = Math.max(4, gap * 0.55);

  let svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#020617"/>

    <text x="24" y="34" fill="#f8fafc" font-size="22" font-weight="700" font-family="Arial">
      ${params.symbol} • ${params.signal}
    </text>

    <text x="24" y="54" fill="#94a3b8" font-size="13" font-family="Arial">
      Dark chart • EMA20 yellow • EMA50 blue • VWAP purple • RSI orange
    </text>

    <line x1="0" y1="${chartTop}" x2="${width}" y2="${chartTop}" stroke="#1e293b"/>
    <line x1="0" y1="${chartTop + chartHeight}" x2="${width}" y2="${chartTop + chartHeight}" stroke="#1e293b"/>
  `;

  for (let i = 0; i <= 4; i++) {
    const y = chartTop + (chartHeight / 4) * i;
    svg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#0f172a"/>`;
  }

  candles.forEach((c, i) => {
    const x = i * gap + gap / 2;

    const yHigh = yScale(c.high, priceMin, priceMax, chartHeight, chartTop);
    const yLow = yScale(c.low, priceMin, priceMax, chartHeight, chartTop);
    const yOpen = yScale(c.open, priceMin, priceMax, chartHeight, chartTop);
    const yClose = yScale(c.close, priceMin, priceMax, chartHeight, chartTop);

    const bullish = c.close >= c.open;
    const color = bullish ? "#22c55e" : "#ef4444";

    const bodyY = Math.min(yOpen, yClose);
    const bodyH = Math.max(2, Math.abs(yClose - yOpen));

    svg += `
      <line x1="${x}" y1="${yHigh}" x2="${x}" y2="${yLow}" stroke="${color}" stroke-width="1.2"/>
      <rect x="${x - candleWidth / 2}" y="${bodyY}" width="${candleWidth}" height="${bodyH}" rx="1.5" fill="${color}"/>
    `;
  });

  if (params.ema20) {
    svg += `
      <path d="${linePath(params.ema20.slice(-90), candles, priceMin, priceMax, width, chartHeight, chartTop)}"
        stroke="#facc15" fill="none" stroke-width="2"/>
    `;
  }

  if (params.ema50) {
    svg += `
      <path d="${linePath(params.ema50.slice(-90), candles, priceMin, priceMax, width, chartHeight, chartTop)}"
        stroke="#38bdf8" fill="none" stroke-width="2"/>
    `;
  }

  if (params.vwap) {
    svg += `
      <path d="${linePath(params.vwap.slice(-90), candles, priceMin, priceMax, width, chartHeight, chartTop)}"
        stroke="#a78bfa" fill="none" stroke-width="2.2"/>
    `;
  }

  svg += priceLine(
    "OPEN",
    params.openPrice,
    priceMin,
    priceMax,
    width,
    chartHeight,
    chartTop,
    "#eab308",
  );

  svg += priceLine(
    "SL",
    params.slPrice,
    priceMin,
    priceMax,
    width,
    chartHeight,
    chartTop,
    "#ef4444",
  );

  svg += priceLine(
    "TP",
    params.tpPrice,
    priceMin,
    priceMax,
    width,
    chartHeight,
    chartTop,
    "#22c55e",
  );

  if (params.rsi) {
    const rsiValues = params.rsi.slice(-90);

    const rsiPath = rsiValues
      .map((v, i) => {
        if (!Number.isFinite(v)) return "";
        const x = i * gap + gap / 2;
        const y = rsiTop + ((100 - v) / 100) * rsiHeight;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    const rsi70 = rsiTop + ((100 - 70) / 100) * rsiHeight;
    const rsi30 = rsiTop + ((100 - 30) / 100) * rsiHeight;

    svg += `
      <rect x="0" y="${rsiTop}" width="${width}" height="${rsiHeight}" fill="#020617"/>
      <line x1="0" y1="${rsiTop}" x2="${width}" y2="${rsiTop}" stroke="#1e293b"/>
      <line x1="0" y1="${rsiTop + rsiHeight}" x2="${width}" y2="${rsiTop + rsiHeight}" stroke="#1e293b"/>

      <line x1="0" y1="${rsi70}" x2="${width}" y2="${rsi70}" stroke="#334155" stroke-dasharray="6 6"/>
      <line x1="0" y1="${rsi30}" x2="${width}" y2="${rsi30}" stroke="#334155" stroke-dasharray="6 6"/>

      <text x="24" y="${rsiTop - 12}" fill="#f8fafc" font-size="15" font-weight="700" font-family="Arial">
        RSI
      </text>

      <text x="${width - 48}" y="${rsi70 - 5}" fill="#64748b" font-size="12" font-family="Arial">70</text>
      <text x="${width - 48}" y="${rsi30 - 5}" fill="#64748b" font-size="12" font-family="Arial">30</text>

      <path d="${rsiPath}" stroke="#f97316" fill="none" stroke-width="2"/>
    `;
  }

  svg += `
    <text x="24" y="735" fill="#64748b" font-size="12" font-family="Arial">
      Generated by Syrai Trade Bot
    </text>
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}
