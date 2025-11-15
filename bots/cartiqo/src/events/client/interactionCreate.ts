import { CartiqoClient, logger } from '@cartiqo-framework/core';
import { EventInterface } from '@cartiqo-framework/shared';
import { Interaction, Collection } from 'discord.js';

const cooldowns = new Collection<string, Collection<string, number>>();

const event: EventInterface<'interactionCreate'> = {
	name: 'interactionCreate',
	async execute(client: CartiqoClient, interaction: Interaction) {
		try {
			if (!interaction.isChatInputCommand()) return;

			const command = client.slashCommands.get(interaction.commandName);
			if (!command) {
				logger.warn(`Slash command not found: ${interaction.commandName}`);
				return;
			}

			// Developer-only check (optional)
			// if (command.isDeveloperOnly && !client.config.developers.includes(interaction.user.id)) {
			// 	if (!interaction.replied && !interaction.deferred) {
			// 		await interaction.reply({
			// 			content: '🚫 This command is developer-only.',
			// 			flags: ['Ephemeral'],
			// 		});
			// 	}
			// 	return;
			// }

			if (!cooldowns.has(command.data.name)) {
				cooldowns.set(command.data.name, new Collection());
			}

			const now = Date.now();
			const timestamps = cooldowns.get(command.data.name)!;
			const cooldownAmount = (command.cooldown || 3) * 1000;

			if (timestamps.has(interaction.user.id)) {
				const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;
				if (now < expirationTime) {
					const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
					if (!interaction.replied && !interaction.deferred) {
						await interaction.reply({
							content: `⏳ Please wait **${timeLeft} seconds** before using \`${command.data.name}\` again.`,
							flags: ['Ephemeral'],
						});
					}
					return;
				}
			}

			timestamps.set(interaction.user.id, now);
			setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

			await command.execute(client, interaction);
		} catch (err) {
			logger.error(`❌ Error handling interaction:`, err);

			try {
				if (interaction.isRepliable()) {
					if (interaction.deferred || interaction.replied) {
						await interaction.editReply('⚠️ An error occurred while executing the command.');
					} else {
						await interaction.reply({
							content: '⚠️ An error occurred while executing the command.',
							flags: ['Ephemeral'],
						});
					}
				}
			} catch (replyErr) {
				logger.error('Failed to reply to interaction after error:', replyErr);
			}
		}
	},
};

export default event;
