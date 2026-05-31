/*
  Warnings:

  - The values [BONUS] on the enum `Transaction_type` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `fee` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `fee` INTEGER NOT NULL,
    MODIFY `type` ENUM('WITHDRAW', 'DEPOSIT', 'PROFIT', 'LOSS') NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `follow_bot` BOOLEAN NOT NULL DEFAULT false;
