import { Guild, TextChannel, EmbedBuilder } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { logger, config } from '@cartiqo-framework/core';

const prisma = new PrismaClient();

/**
 * Sends an error embed to a guild's configured error log channel.
 * Automatically fetches the log channel ID from the database.
 */
export async function sendGuildErrorLog(guild: Guild, title: string, description: string, error?: unknown) {
	try {
		const guildConfig = await prisma.guildConfig.findUnique({
			where: { guildId: guild.id },
		});

		if (!guildConfig?.errorLogChannelId) {
			logger.warn(`[ERRORLOG] Guild ${guild.id} has no errorLogChannelId configured.`);
			return;
		}

		const channel = guild.channels.cache.get(guildConfig.errorLogChannelId) as TextChannel;
		if (!channel) {
			logger.warn(`[ERRORLOG] Configured error log channel for ${guild.id} not found in cache.`);
			return;
		}

		const embed = new EmbedBuilder()
			.setTitle(`❌ ${title}`)
			.setDescription(description)
			.setColor(config.colors.error)
			.setTimestamp();

		if (error instanceof Error) {
			embed.addFields({
				name: 'Error Message',
				value: `\`\`\`${error.message}\`\`\``,
			});

			if (error.stack) {
				embed.addFields({
					name: 'Stack Trace',
					value: `\`\`\`${error.stack.substring(0, 1000)}\`\`\``,
				});
			}
		} else if (error) {
			embed.addFields({
				name: 'Error Data',
				value: `\`\`\`${JSON.stringify(error, null, 2).substring(0, 1000)}\`\`\``,
			});
		}

		await channel.send({ embeds: [embed] });
	} catch (err) {
		logger.error(`[ERRORLOG] Failed to send error log for guild ${guild.id}:`, err);
	}
}
