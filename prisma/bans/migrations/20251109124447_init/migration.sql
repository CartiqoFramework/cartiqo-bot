-- CreateTable
CREATE TABLE `BanProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `discordId` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BanProfile_discordId_key`(`discordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BanRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profileId` INTEGER NOT NULL,
    `category` ENUM('Global', 'Discord', 'FiveM', 'Marketplace', 'Community') NOT NULL DEFAULT 'Global',
    `type` ENUM('Toxicity', 'Harassment', 'HateSpeech', 'Discrimination', 'Bullying', 'Impersonation', 'Threats', 'Spamming', 'Advertising', 'Phishing', 'DataLeak', 'Doxxing', 'DDoS', 'ServerRaid', 'NSFWDistribution', 'AlternateAccount', 'Evasion', 'PrivacyViolation', 'Cheating', 'MacroUsage', 'ExploitUsage', 'ExploitDevelopment', 'Duping', 'ModMenuUsage', 'GameTampering', 'DeveloperAbuse', 'Scam', 'Chargeback', 'FraudulentActivity', 'AccountSales', 'UnauthorizedResale', 'FakeProof', 'FalseClaims', 'PaymentEvasion', 'CryptoScam', 'StaffImpersonation', 'UnauthorizedAccess', 'TokenAbuse', 'BotAbuse', 'APIAbuse', 'DataManipulation', 'PolicyViolation', 'BlacklistedEntity', 'FalseReporting', 'ExploitDistribution', 'BanEvasion', 'PlatformAbuse', 'UnauthorizedAutomation', 'ExploitSharing', 'SecurityThreat', 'Infiltration', 'InsiderThreat') NOT NULL DEFAULT 'Toxicity',
    `status` ENUM('Permanent', 'Temporary', 'Indefinite') NOT NULL DEFAULT 'Indefinite',
    `reason` VARCHAR(191) NULL,
    `community` VARCHAR(191) NULL,
    `issuedBy` VARCHAR(191) NULL,
    `evidenceUrl` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BanRecord` ADD CONSTRAINT `BanRecord_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `BanProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
