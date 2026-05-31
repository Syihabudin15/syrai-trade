import moment from "moment";
import type { ITrade } from "../libs/interfaces.js";
import { SendTelegramMessage } from "../libs/messages.js";
import { CalcPnl, CreateOrder, UpsertOrders } from "./order.js";

export const OpenOrders = async (orders: ITrade[]) => {
  for (const order of orders) {
    try {
      await CreateOrder(order);
      // result.push(order);
      SendTelegramMessage(`
🚀 <b>ORDER CREATED</b>

Pair: <b>${order.Pair.name} - ${order.side} x${order.lev}</b>
Entry: <code>${order.open}</code>
SL/TP: <code>${order.sl_price || "-"} / ${order.tp_price || "-"}</code>
Amount: <code>${order.amount}</code>
      `);
    } catch (err) {
      console.log(err);
      SendTelegramMessage(`
⚠️ <b>TRADE EXECUTION FAILED</b>

Time: <b>${new Date().toLocaleDateString()}</b>
Pair: <b>${order.Pair.name}</b>
Error: <code>${err instanceof Error ? err.message : String(err)}</code>
        `);
    } finally {
      continue;
    }
  }
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
    const pnl = mapp.reduce((acc, curr) => acc + curr.pnl, 0);
    SendTelegramMessage(`
📋 <b>POSITION CLOSED</b>

Pair: ${mapp.map((o) => o.Pair.name).join("/")}
Reason: Revenge Signal
PnL: <code>${pnl.toFixed(4)}</code>
      `);
  } catch (err) {
    console.log(err);
    SendTelegramMessage(`
⚠️ <b>CLOSED ORDER FAILED</b>
Time: <b>${moment().format("DD/MM/YYYY HH:mm")}</b>
Error: <code>${err instanceof Error ? err.message : String(err)}</code>
      `);
  }
};
