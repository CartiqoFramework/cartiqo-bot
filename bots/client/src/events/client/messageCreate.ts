import { CartiqoClient, logger } from '@cartiqo-framework/core';
import { EventInterface } from '@cartiqo-framework/shared';
import { Message, Collection } from 'discord.js';

const cooldowns = new Collection<string, Collection<string, number>>();

const event: EventInterface<'messageCreate'> = {
	name: 'messageCreate',
	options: {
		once: false,
		rest: false,
	},
	async execute(client: CartiqoClient, message: Message) {
		if (!message.author || message.author.bot) return;

		const prefix = client.config.cartiqo.client_prefix || '!';
		if (!message.content.startsWith(prefix)) return;

		const args = message.content.slice(prefix.length).trim().split(/\s+/);
		const input = args.shift()?.toLowerCase();
		if (!input) return;

		const command = client.prefixCommands.get(input);
		if (!command) {
			logger.debug('Command not found for input:', input);
			return;
		}

		if (!cooldowns.has(command.name)) cooldowns.set(command.name, new Collection());
		const now = Date.now();
		const timestamps = cooldowns.get(command.name)!;
		const cooldownAmount = (command.cooldown || 3) * 1000;

		if (timestamps.has(message.author.id)) {
			const expirationTime = timestamps.get(message.author.id)! + cooldownAmount;
			if (now < expirationTime) {
				const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
				await message.reply(`⏳ Please wait ${timeLeft} seconds before using \`${command.name}\` again.`);
				return;
			}
		}

		timestamps.set(message.author.id, now);
		setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

		try {
			await command.execute(client, message, args);
		} catch (err) {
			logger.error(`Prefix command execution failed for ${command.name}:`, err);
		}
	},
};

export default event;
