import { CartiqoClient } from '../../CartiqoClient.js';

export async function getOrCreateBanProfile(
	cartiqo: CartiqoClient,
	discordId: string,
	username: string,
	avatarUrl?: string,
) {
	let profile = await cartiqo.db.bans.banProfile.findUnique({
		where: { discordId },
	});

	if (!profile) {
		profile = await cartiqo.db.bans.banProfile.create({
			data: { discordId, username, avatarUrl },
		});
	}

	return profile;
}

export async function updateBanProfile(
	cartiqo: CartiqoClient,
	discordId: string,
	data: Partial<{ username: string; avatarUrl: string }>,
) {
	return cartiqo.db.bans.banProfile.update({
		where: { discordId },
		data,
	});
}

export async function getBanProfile(cartiqo: CartiqoClient, discordId: string) {
	return cartiqo.db.bans.banProfile.findUnique({
		where: { discordId },
		include: { records: true },
	});
}

export async function findBanProfileById(cartiqo: CartiqoClient, id: number) {
	return cartiqo.db.bans.banProfile.findUnique({
		where: { id },
		include: { records: true },
	});
}

export async function deleteBanProfile(cartiqo: CartiqoClient, discordId: string) {
	return cartiqo.db.bans.banProfile.delete({
		where: { discordId },
	});
}

/** Search for profiles by partial username */
export async function searchBanProfiles(cartiqo: CartiqoClient, query: string, limit = 10) {
	return cartiqo.db.bans.banProfile.findMany({
		where: { username: { contains: query} },
		take: limit,
		orderBy: { updatedAt: 'desc' },
	});
}

export async function getBanProfileStats(cartiqo: CartiqoClient, discordId: string) {
	const profile = await cartiqo.db.bans.banProfile.findUnique({
		where: { discordId },
		include: { records: true },
	});
	if (!profile) return null;

	const active = profile.records.filter((r) => r.isActive).length;
	return {
		total: profile.records.length,
		active,
		inactive: profile.records.length - active,
	};
}

export async function pruneInactiveProfiles(cartiqo: CartiqoClient, olderThanDays = 180) {
	const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

	const profiles = await cartiqo.db.bans.banProfile.findMany({
		where: {
			updatedAt: { lt: cutoff },
			records: { none: { isActive: true } },
		},
	});

	for (const p of profiles) {
		await cartiqo.db.bans.banProfile.delete({ where: { id: p.id } });
	}

	return profiles.length;
}
