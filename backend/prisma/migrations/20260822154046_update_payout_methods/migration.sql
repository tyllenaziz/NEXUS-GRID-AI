/*
  Warnings:

  - The values [BANK_STRIPE] on the enum `Wallet_payoutMethod` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `wallet` MODIFY `payoutMethod` ENUM('NONE', 'PAYPAL', 'BANK', 'STRIPE') NOT NULL DEFAULT 'NONE';
