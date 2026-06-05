import moment from "moment";
import { GetCurrentPrice } from "../libs/exchange.js";
import type { ITrade } from "../libs/interfaces.js";
import prisma from "../libs/prisma.js";
import { SendTelegramMessage } from "../libs/messages.js";
import type { Prisma } from "@prisma/client";

export const CreateBulkOrder = async (payload: ITrade[]) => {
  for (const data of payload) {
    await prisma.$transaction(async (tx) => {
      const findOrSavePair = await tx.pair.upsert({
        where: { name: data.Pair.name },
        update: {},
        create: { name: data.Pair.name },
      });
      const { Pair, ...d } = data;
      await prisma.trade.create({
        data: { ...d, pairId: findOrSavePair.id },
      });
      return true;
    });
  }
  return payload;
};

export const CreateOrder = async (payload: ITrade) => {
  const { id, Pair, ...data } = payload;
  const result = await prisma.$transaction(async (tx) => {
    const findOrSavePair = await tx.pair.upsert({
      where: { name: Pair.name },
      update: {},
      create: { name: Pair.name },
    });
    const saved = await tx.trade.create({
      data: { ...data, pairId: findOrSavePair.id },
    });
    return saved;
  });
  return result;
};

export const CloseOrder = async (payload: ITrade) => {
  if (payload.close_time) return payload;
  const { Pair, ...data } = payload;
  await prisma.trade.update({ where: { id: payload.id }, data: data });
  return payload;
};

export const UpsertOrders = async (payload: ITrade[]) => {
  const mapping = payload.map((m) => {
    const { Pair, ...data } = m;
    return data;
  });
  await prisma.$transaction(
    mapping.map((p) =>
      prisma.trade.upsert({ where: { id: p.id }, create: p, update: p }),
    ),
  );
  return mapping;
};

export const GetActiveTrades = async (
  symbol: string,
  side?: "buy" | "sell",
) => {
  const where: Prisma.TradeWhereInput = {
    Pair: { name: symbol },
    close_time: null,
    ...(side && { side }),
  };

  const finds = await prisma.trade.findMany({
    where,
    include: { Pair: true },
  });
  return finds;
};

export function CalcPnl(
  side: "buy" | "sell",
  open: number,
  close: number,
  amount: number,
) {
  if (side === "buy") {
    return Number(((close - open) * amount).toFixed(4));
  }

  return Number(((open - close) * amount).toFixed(4));
}
export const GetAllActiveTrades = async () => {
  const where: Prisma.TradeWhereInput = {
    close_time: null,
  };

  const finds = await prisma.trade.findMany({
    where,
    include: { Pair: true },
  });
  return finds;
};

export const ValidateActiveTrades = async () => {
  try {
    const data = await prisma.trade.findMany({
      where: { close_time: null },
      include: { Pair: true },
    });
    const updated: ITrade[] = [];
    for (const trade of data) {
      const currPrice = await GetCurrentPrice(trade.Pair.name);
      if (!currPrice || !trade.sl_price || !trade.tp_price) continue;
      if (trade.side === "buy") {
        if (currPrice > trade.tp_price || currPrice < trade.sl_price) {
          updated.push({
            ...trade,
            close: currPrice,
            close_time: new Date(),
            reason: currPrice > trade.tp_price ? "TP" : "SL",
            pnl: CalcPnl(trade.side, trade.open, currPrice, trade.amount),
          });
        }
      } else {
        if (currPrice < trade.tp_price || currPrice > trade.sl_price) {
          updated.push({
            ...trade,
            close: currPrice,
            close_time: new Date(),
            reason: currPrice < trade.tp_price ? "TP" : "SL",
            pnl: CalcPnl(
              trade.side as "buy" | "sell",
              trade.open,
              currPrice,
              trade.amount,
            ),
          });
        }
      }
    }
    if (updated.length !== 0) {
      await prisma.$transaction(
        updated
          .map((d) => {
            const { Pair, ...data } = d;
            return data;
          })
          .map((d) =>
            prisma.trade.updateMany({ where: { id: d.id }, data: d }),
          ),
      );
      SendTelegramMessage(`
        📋 <b>Closed Trade</b>
        ${updated.map((d) => `${d.side} (${d.reason}) ${d.Pair.name}: ${d.pnl.toFixed(2)}`).join("\n")}
        `);
    }
  } catch (err) {
    console.log(err);
    SendTelegramMessage(`
⚠️ <b>VALIDATE ACTIVE TRADES FAILED</b>
Time: <b>${new Date().toLocaleDateString()}</b>
Error: <code>${err instanceof Error ? err.message : String(err)}</code>
    `);
  }
};

export const GetHourslyReport = async () => {
  try {
    const actives = await prisma.trade.findMany({
      where: { close_time: null },
      include: { Pair: true },
    });
    const todays = await prisma.trade.findMany({
      where: {
        close_time: { not: null },
        open_time: {
          gte: moment().startOf("day").toDate(),
          lte: moment().endOf("day").toDate(),
        },
      },
      include: { Pair: true },
    });
    const PnL = todays.reduce((acc, curr) => acc + curr.pnl, 0);

    SendTelegramMessage(`
📊 <b>REPORT (4 HOURS)</b>

✅ Active Trade: ${actives.length}
📋 Closed Trade: ${todays.length}
💰 PnL : ${PnL}
    `);
  } catch (err) {
    console.log(err);
    SendTelegramMessage(`
⚠️ <b>HOURLY REPORT FAILED</b>
Time: <b>${new Date().toLocaleDateString()}</b>
Error: <code>${err instanceof Error ? err.message : String(err)}</code>
    `);
  }
};
