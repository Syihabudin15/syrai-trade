/*
  Warnings:

  - You are about to alter the column `lev` on the `trade` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.

*/
-- AlterTable
ALTER TABLE `trade` MODIFY `open` DOUBLE NOT NULL,
    MODIFY `close` DOUBLE NULL,
    MODIFY `amount` DOUBLE NOT NULL,
    MODIFY `lev` DOUBLE NOT NULL,
    MODIFY `tp_price` DOUBLE NULL,
    MODIFY `sl_price` DOUBLE NULL,
    MODIFY `pnl` DOUBLE NOT NULL DEFAULT 0;
