/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - The required column `referralCode` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE `review` ADD COLUMN `isRedFlag` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `submission` ADD COLUMN `durationSeconds` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isSuspicious` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `onboardingIP` VARCHAR(191) NULL,
    ADD COLUMN `referralCode` VARCHAR(191) NOT NULL,
    ADD COLUMN `referredBy` VARCHAR(191) NULL,
    ADD COLUMN `signedContract` DATETIME(3) NULL,
    ADD COLUMN `signedNDA` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `wallet` ADD COLUMN `payoutDetails` JSON NULL,
    ADD COLUMN `payoutMethod` ENUM('NONE', 'PAYPAL', 'BANK_STRIPE') NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE `workerprofile` ADD COLUMN `totalAudits` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `SupportTicket` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `adminReply` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SupportTicket_submissionId_key`(`submissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `User_referralCode_key` ON `User`(`referralCode`);

-- AddForeignKey
ALTER TABLE `SupportTicket` ADD CONSTRAINT `SupportTicket_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTicket` ADD CONSTRAINT `SupportTicket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
