import "dotenv/config";
import "./main.js";
import express, { type Request, type Response } from "express";
import cors from "cors";
import moment from "moment";

import TradeRoute from "./api/trades/route.js";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

app.use("/", async (req: Request, res: Response) => {
  return res.status(200).json({
    msg: "OK",
    trade_bot: true,
    server_time: moment().format("DD/MM/YYYY HH:mm"),
  });
});

app.use("/trade", TradeRoute);

const PORT = process.env.APP_PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Server ready at port: ${PORT}`);
});
