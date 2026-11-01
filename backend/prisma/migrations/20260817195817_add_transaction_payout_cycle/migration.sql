-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `payoutCycleId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_payoutCycleId_fkey` FOREIGN KEY (`payoutCycleId`) REFERENCES `PayoutCycle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
