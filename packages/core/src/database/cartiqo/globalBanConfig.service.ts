import { CartiqoClient } from '../../CartiqoClient.js';
import { BanAction } from '../../../prisma/cartiqo/index.js';
import type { Prisma } from '../../../prisma/cartiqo/index.js';

//
// -----------------------------
// Global Ban Config Functions
// -----------------------------
//

export async function getGlobalBanConfig(cartiqo: CartiqoClient, guildId: string) {
	return cartiqo.db.cartiqo.globalBanConfig.findUnique({
		where: { guildId },
	});
}

export async function getOrCreateGlobalBanConfig(cartiqo: CartiqoClient, guildId: string) {
	let cfg = await getGlobalBanConfig(cartiqo, guildId);

	if (!cfg) {
		cfg = await cartiqo.db.cartiqo.globalBanConfig.create({
			data: { guildId },
		});
	}

	return cfg;
}

export async function updateGlobalBanConfig(
	cartiqo: CartiqoClient,
	guildId: string,
	data: Prisma.GlobalBanConfigUpdateInput,
) {
	return cartiqo.db.cartiqo.globalBanConfig.update({
		where: { guildId },
		data,
	});
}

//
// -----------------------------
// Punishment Mapping
// -----------------------------
//

const punishmentFieldMap = {
	Global: 'punishGlobal',
	Discord: 'punishDiscord',
	FiveM: 'punishFiveM',
	Marketplace: 'punishMarketplace',
	Community: 'punishCommunity',
} as const;

export async function setCategoryPunishment(
	cartiqo: CartiqoClient,
	guildId: string,
	category: keyof typeof punishmentFieldMap,
	action: BanAction,
) {
	const field = punishmentFieldMap[category];

	return updateGlobalBanConfig(cartiqo, guildId, {
		[field]: action,
	});
}

//
// -----------------------------
// Extra Config
// -----------------------------
//

export async function setNotifyOnBan(cartiqo: CartiqoClient, guildId: string, enabled: boolean) {
	return updateGlobalBanConfig(cartiqo, guildId, {
		notifyOnBan: enabled,
	});
}

export async function setNotifyChannel(cartiqo: CartiqoClient, guildId: string, channelId: string | null) {
	return updateGlobalBanConfig(cartiqo, guildId, {
		notifyChannelId: channelId,
	});
}
