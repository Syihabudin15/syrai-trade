import type { Request, Response } from "express";
import { ResponseServer } from "../../libs/util.js";
import type { Prisma } from "@prisma/client";
import moment from "moment";
import prisma from "../../libs/prisma.js";

export const GET = async (req: Request, res: Response) => {
  let { page = 1, limit = 100, pairId, search, backdate, status } = req.query;
  page = Number(page);
  limit = Number(limit);
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.TradeWhereInput = {
      ...(pairId && { pairId: pairId as string }),
      ...(status && { close_time: status === "active" ? { not: null } : null }),
      ...(backdate && {
        open_time: {
          gte: moment((backdate as string).split(",")[0])
            .startOf("day")
            .toDate(),
          lte: moment((backdate as string).split(",")[1])
            .endOf("day")
            .toDate(),
        },
      }),
      ...(search && { Pair: { name: { contains: search as string } } }),
    };
    const data = await prisma.trade.findMany({
      where,
      skip,
      take: limit,
      orderBy: { open_time: "desc" },
    });
    const profit = data
      .filter((d) => d.pnl > 0)
      .reduce((acc, curr) => acc + curr.pnl, 0);
    const loss = data
      .filter((d) => d.pnl < 0)
      .reduce((acc, curr) => acc + curr.pnl, 0);

    return ResponseServer(res, 200, {
      data,
      profit,
      loss,
      pnl: profit - loss,
    });
  } catch (err) {
    console.log(err);
    return ResponseServer(res, 500, { msg: err });
  }
};
