import moment from "moment";
import type { ITrade } from "../libs/interfaces.js";
import { SendTelegramMessage } from "../libs/messages.js";
import { CalcPnl, CreateOrder, UpsertOrders } from "./order.js";
import { error } from "node:console";

export const OpenOrders = async (orders: ITrade[]) => {
  const results: ITrade[] = [];
  for (const order of orders) {
    try {
      await CreateOrder(order);
      results.push(order);
    } finally {
      continue;
    }
  }
  return results;
};

export const ClosePositions = async (orders: ITrade[], price: number) => {
  try {
    const mapp = orders.map((o) => ({
      ...o,
      reason: "CLOSED",
      close: price,
      close_time: new Date(),
      pnl: CalcPnl(o.side as "buy" | "sell", o.open, price, o.amount),
    }));
    await UpsertOrders(mapp);
    return mapp;
  } catch (err) {
    console.log(err);
    throw error(err);
  }
};
