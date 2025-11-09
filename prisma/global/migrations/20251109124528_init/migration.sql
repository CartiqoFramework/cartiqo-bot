-- CreateTable
CREATE TABLE `SupportGuilds` (
    `guildId` VARCHAR(191) NOT NULL,
    `guildName` VARCHAR(191) NOT NULL,
    `language` VARCHAR(191) NOT NULL DEFAULT 'en-US',
    `category` ENUM('LANGUAGE', 'COMMUNITY', 'HEAD_SUPPORT') NOT NULL DEFAULT 'COMMUNITY',
    `logChannelId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SupportGuilds_guildId_key`(`guildId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffUsers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `guildId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NULL,
    `role` ENUM('Owner', 'Senior_Administrator', 'Administrator', 'Trial_Administrator', 'Senior_Moderator', 'Moderator', 'Trial_Moderator') NOT NULL DEFAULT 'Trial_Moderator',
    `departments` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PremiumCode` (
    `code` VARCHAR(191) NOT NULL,
    `tier` ENUM('Free', 'Silver', 'Gold', 'Platinum') NOT NULL,
    `duration` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `redeemed` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PremiumGuildConfig` (
    `guildId` VARCHAR(191) NOT NULL,
    `guildName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `premiumTier` ENUM('Free', 'Silver', 'Gold', 'Platinum') NOT NULL DEFAULT 'Free',
    `premiumExpiresAt` DATETIME(3) NULL,
    `redeemedPremiumCode` VARCHAR(191) NULL,

    UNIQUE INDEX `PremiumGuildConfig_guildId_key`(`guildId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StaffUsers` ADD CONSTRAINT `StaffUsers_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `SupportGuilds`(`guildId`) ON DELETE RESTRICT ON UPDATE CASCADE;
