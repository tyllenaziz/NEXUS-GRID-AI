-- AlterTable
ALTER TABLE `workerprofile` ADD COLUMN `category` VARCHAR(191) NULL,
    ADD COLUMN `experienceYears` VARCHAR(191) NULL,
    ADD COLUMN `githubUrl` VARCHAR(191) NULL,
    ADD COLUMN `linkedinUrl` VARCHAR(191) NULL,
    ADD COLUMN `primaryLanguage` VARCHAR(191) NULL,
    ADD COLUMN `profilePicture` TEXT NULL,
    ADD COLUMN `university` VARCHAR(191) NULL;
