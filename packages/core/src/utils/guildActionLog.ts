import { TextChannel, EmbedBuilder, ColorResolvable } from 'discord.js';
import { PrismaClient, GuildCategory } from '../../prisma/global';
import { CartiqoClient, logger, config } from '@cartiqo-framework/core';

const prisma = new PrismaClient();

type LogOptions = {
	title?: string;
	description: string;
	color?: string;
	category?: GuildCategory;
};

/**
 * Sends an action log to a guild of a specific category.
 * Defaults to HEAD_SUPPORT if no category is provided.
 */
export async function sendGuildActionLog(client: CartiqoClient, options: LogOptions) {
	const { title, description, color = config.colors.primary, category = GuildCategory.HEAD_SUPPORT } = options;

	try {
		const guildEntry = await prisma.supportGuilds.findFirst({
			where: { category },
		});

		if (!guildEntry) {
			logger.warn(`[GUILDLOG] No guild found for category ${category}.`);
			return;
		}

		// Fetch the guild from Discord
		const guild = await client.guilds.fetch(guildEntry.guildId);
		if (!guild) {
			logger.warn(`[GUILDLOG] Guild ${guildEntry.guildId} not found.`);
			return;
		}

		// Use the logChannelId from SupportGuilds
		if (!guildEntry.logChannelId) {
			logger.warn(`[GUILDLOG] No logChannelId configured for guild ${guildEntry.guildId}.`);
			return;
		}

		const channel = guild.channels.cache.get(guildEntry.logChannelId) as TextChannel;
		if (!channel) {
			logger.warn(
				`[GUILDLOG] Log channel ${guildEntry.logChannelId} not found in cache for guild ${guildEntry.guildId}.`,
			);
			return;
		}

		const embed = new EmbedBuilder().setDescription(description).setColor(color as ColorResolvable);

		if (title) {
			embed.setTitle(title);
		}

		await channel.send({ embeds: [embed] });
	} catch (err) {
		console.log(err);
		logger.error(`[GUILDLOG] Failed to send log for category ${category}:`, err);
	}
}
