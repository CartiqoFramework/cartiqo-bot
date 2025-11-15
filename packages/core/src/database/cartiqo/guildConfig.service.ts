import { CartiqoClient } from '../../CartiqoClient.js';
import type { Prisma } from '../../../prisma/cartiqo/index.js';

//
// -----------------------------
// Guild Config Service (function-style)
// -----------------------------
//

export async function getGuildConfig(cartiqo: CartiqoClient, guildId: string) {
	return cartiqo.db.cartiqo.guildConfig.findUnique({
		where: { guildId },
		include: { banConfig: true },
	});
}

export async function getOrCreateGuildConfig(cartiqo: CartiqoClient, guildId: string, guildName?: string) {
	let cfg = await getGuildConfig(cartiqo, guildId);

	if (!cfg) {
		cfg = await cartiqo.db.cartiqo.guildConfig.create({
			data: {
				guildId,
				guildName,
				language: 'en-US',
				banConfig: {
					create: {},
				},
			},
			include: { banConfig: true },
		});
	}

	return cfg;
}

export async function updateGuildConfig(cartiqo: CartiqoClient, guildId: string, data: Prisma.GuildConfigUpdateInput) {
	return cartiqo.db.cartiqo.guildConfig.update({
		where: { guildId },
		data,
	});
}

export async function setGuildLanguage(cartiqo: CartiqoClient, guildId: string, language: string) {
	return updateGuildConfig(cartiqo, guildId, { language });
}

export async function setErrorLogChannel(cartiqo: CartiqoClient, guildId: string, channelId: string | null) {
	return updateGuildConfig(cartiqo, guildId, {
		errorLogChannelId: channelId,
	});
}
