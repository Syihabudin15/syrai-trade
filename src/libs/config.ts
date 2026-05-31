export const API_KEY = process.env.BITGET_API_KEY!;
export const API_PASSWORD = process.env.BITGET_API_PASSWORD!;
export const TIMEFRAME = process.env.BITGET_TIMEFRAME!;
export const TIMEFRAME_HIGHER = process.env.BITGET_TIMEFRAME_HIGHER!;

export const TOP_N = Number(process.env.TOP_N! as unknown as number);
export const MAX_LEV = Number(process.env.LEVERAGE! as unknown as number);
export const MAX_DAILY_LOST = Number(
  process.env.MAX_DAILY_LOST! as unknown as number,
);
export const ATR_MULTIPLIER = Number(
  process.env.ATR_MULTIPLIER! as unknown as number,
);
export const RISK_PERCENT = Number(
  process.env.RISK_PERCENT! as unknown as number,
);

export const T_BOT_TOKEN = process.env.T_BOT_TOKEN!;
export const T_CHAT_TOKEN = process.env.T_CHAT_TOKEN!;

export const PROJECT_MODE = process.env.PROJECT_MODE!;
