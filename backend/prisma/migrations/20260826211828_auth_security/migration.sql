-- AlterTable
ALTER TABLE `user` ADD COLUMN `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `resetCode` VARCHAR(191) NULL,
    ADD COLUMN `resetExpires` DATETIME(3) NULL,
    ADD COLUMN `verificationCode` VARCHAR(191) NULL,
    ADD COLUMN `verificationExpires` DATETIME(3) NULL;
