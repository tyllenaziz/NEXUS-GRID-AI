-- AlterTable
ALTER TABLE `submission` ADD COLUMN `adminFeedback` TEXT NULL,
    ADD COLUMN `payoutCycleId` VARCHAR(191) NULL,
    ADD COLUMN `revisionCount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `carryForward` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- CreateTable
CREATE TABLE `PayoutCycle` (
    `id` VARCHAR(191) NOT NULL,
    `snapshotDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_payoutCycleId_fkey` FOREIGN KEY (`payoutCycleId`) REFERENCES `PayoutCycle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
