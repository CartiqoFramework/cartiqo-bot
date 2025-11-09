import { CartiqoClient } from '../../CartiqoClient.js';
import type { BanCategory, BanType, BanStatus } from '../../../prisma/cartiqo-bans';
import { logger } from '@cartiqo-framework/core';

export async function checkUserBan(cartiqo: CartiqoClient, discordId: string, category?: BanCategory) {
	const profile = await cartiqo.db.bans.banProfile.findUnique({
		where: { discordId },
		include: {
			records: {
				where: {
					isActive: true,
					OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
					...(category ? { category } : {}),
				},
				orderBy: { createdAt: 'desc' },
			},
		},
	});

	if (!profile) return null;
	return profile.records.length > 0 ? profile.records[0] : null;
}

export async function actionUser(cartiqo: CartiqoClient, discordId: string, username: string, avatarUrl?: string) {
	const profile = await cartiqo.db.bans.banProfile.findUnique({
		where: { discordId },
		include: { records: true },
	});

	if (!profile) return { action: 'none', reason: null };

	const activeBan = profile.records.find((ban) => ban.isActive && (!ban.expiresAt || ban.expiresAt > new Date()));

	if (!activeBan) return { action: 'none', reason: null };

	logger.info(`[ACTION] Denied ${username} (${discordId}) — Active ban: ${activeBan.type}`);

	return {
		action: 'deny',
		reason: activeBan.reason || 'Active ban present',
		ban: activeBan,
	};
}

export async function syncBans(cartiqo: CartiqoClient) {
	const now = new Date();

	// Step 1: Deactivate expired bans
	const expired = await cartiqo.db.bans.banRecord.updateMany({
		where: {
			isActive: true,
			expiresAt: { lt: now },
		},
		data: { isActive: false },
	});

	// Step 2: Optional external sync (e.g., reapply Discord bans)
	// You could integrate Discord.js or another API here.
	// Example:
	// await reapplyDiscordBans(cartiqo);

	logger.info(`[SYNC] Ban sync complete — expired: ${expired.count}`);

	return {
		expiredCount: expired.count,
		timestamp: now,
	};
}

export async function createBanRecord(
	cartiqo: CartiqoClient,
	profileId: number,
	options: {
		category?: BanCategory;
		type?: BanType;
		status?: BanStatus;
		reason?: string;
		community?: string;
		issuedBy?: string;
		evidenceUrl?: string;
		expiresAt?: Date | null;
	},
) {
	return cartiqo.db.bans.banRecord.create({
		data: { profileId, ...options },
	});
}

export async function getBanRecords(cartiqo: CartiqoClient, profileId: number) {
	return cartiqo.db.bans.banRecord.findMany({
		where: { profileId },
		orderBy: { createdAt: 'desc' },
	});
}

export async function getBanById(cartiqo: CartiqoClient, id: number) {
	return cartiqo.db.bans.banRecord.findUnique({
		where: { id },
		include: { profile: true },
	});
}

export async function getActiveBans(cartiqo: CartiqoClient) {
	return cartiqo.db.bans.banRecord.findMany({
		where: {
			isActive: true,
			OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
		},
		include: { profile: true },
	});
}

export async function getExpiringBans(cartiqo: CartiqoClient, withinHours = 24) {
	const threshold = new Date(Date.now() + withinHours * 60 * 60 * 1000);
	return cartiqo.db.bans.banRecord.findMany({
		where: {
			isActive: true,
			expiresAt: { lte: threshold, gt: new Date() },
		},
		include: { profile: true },
	});
}

export async function extendBanDuration(cartiqo: CartiqoClient, id: number, extraDays: number) {
	const record = await cartiqo.db.bans.banRecord.findUnique({ where: { id } });
	if (!record?.expiresAt) return null;

	const newDate = new Date(record.expiresAt);
	newDate.setDate(newDate.getDate() + extraDays);

	return cartiqo.db.bans.banRecord.update({
		where: { id },
		data: { expiresAt: newDate },
	});
}

export async function deactivateBan(cartiqo: CartiqoClient, id: number) {
	return cartiqo.db.bans.banRecord.update({
		where: { id },
		data: { isActive: false },
	});
}

export async function deleteBan(cartiqo: CartiqoClient, id: number) {
	return cartiqo.db.bans.banRecord.delete({
		where: { id },
	});
}

export async function cleanupExpiredBans(cartiqo: CartiqoClient) {
	const now = new Date();

	const expired = await cartiqo.db.bans.banRecord.updateMany({
		where: {
			isActive: true,
			expiresAt: { lt: now },
		},
		data: { isActive: false },
	});

	return expired.count;
}

export async function countActiveBansByCategory(cartiqo: CartiqoClient) {
	const records = await cartiqo.db.bans.banRecord.groupBy({
		by: ['category'],
		_count: { category: true },
		where: { isActive: true },
	});

	return records.map((r) => ({
		category: r.category,
		activeCount: r._count.category,
	}));
}

export async function isUserBanned(cartiqo: CartiqoClient, discordId: string, category?: BanCategory) {
	const profile = await cartiqo.db.bans.banProfile.findUnique({
		where: { discordId },
		include: { records: true },
	});
	if (!profile) return false;

	const now = new Date();
	return profile.records.some(
		(r) => r.isActive && (!category || r.category === category) && (!r.expiresAt || r.expiresAt > now),
	);
}
