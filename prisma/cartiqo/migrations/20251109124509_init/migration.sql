-- CreateTable
CREATE TABLE `GuildConfig` (
    `guildId` VARCHAR(191) NOT NULL,
    `guildName` VARCHAR(191) NULL,
    `language` VARCHAR(191) NOT NULL DEFAULT 'en-US',
    `errorLogChannelId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GuildConfig_guildId_key`(`guildId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
