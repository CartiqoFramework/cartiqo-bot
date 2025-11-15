export const validBanCategories = new Set(['Global', 'Discord', 'FiveM', 'Marketplace', 'Community']);
export const validBanStatuses = new Set(['Permanent', 'Temporary', 'Indefinite']);
export const validBanTypes = new Set([
  'Toxicity', 'Harassment', 'HateSpeech', 'Discrimination', 'Bullying', 'Impersonation',
  'Threats', 'Spamming', 'Advertising', 'Phishing', 'DataLeak', 'Doxxing', 'DDoS',
  'ServerRaid', 'NSFWDistribution', 'AlternateAccount', 'Evasion', 'PrivacyViolation',
  'Cheating', 'MacroUsage', 'ExploitUsage', 'ExploitDevelopment', 'Duping', 'ModMenuUsage',
  'GameTampering', 'DeveloperAbuse', 'Scam', 'Chargeback', 'FraudulentActivity', 'AccountSales',
  'UnauthorizedResale', 'FakeProof', 'FalseClaims', 'PaymentEvasion', 'CryptoScam', 
  'StaffImpersonation', 'UnauthorizedAccess', 'TokenAbuse', 'BotAbuse', 'APIAbuse', 
  'DataManipulation', 'PolicyViolation', 'BlacklistedEntity', 'FalseReporting', 
  'ExploitDistribution', 'BanEvasion', 'PlatformAbuse', 'UnauthorizedAutomation', 
  'ExploitSharing', 'SecurityThreat', 'Infiltration', 'InsiderThreat'
]);


// Re-export the client class
export * from './CartiqoClient.js';

// Re-export config + logger
export * from './config.js';
export * from './logger.js';

// Re-export transcript server
export * from './transcriptServer.js';

// Version Functions
export * from './version.js';

// Utils
export * from './utils/guildActionLog.js';
export * from './utils/guildErrLogger.js';
export * from './utils/permissionGuard.js';

// Database Services
export * from './database/bans/bans.service.js';
export * from './database/bans/profiles.service.js';
export * from './database/cartiqo/globalBanConfig.service.js';
export * from './database/cartiqo/guildConfig.service.js';

// Re-export all handlers
export * from './handlers/errors.js';
export * from './handlers/loadEvents.js';
export * from './handlers/loadCommands.js';
