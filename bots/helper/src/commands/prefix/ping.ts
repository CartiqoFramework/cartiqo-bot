import { PrefixCommandInterface } from '@cartiqo-framework/shared';
import { CartiqoClient } from '@cartiqo-framework/core';
import { Message } from 'discord.js';

const command: PrefixCommandInterface = {
	name: 'ping',
	description: 'Replies with Pong!',
	aliases: ['p'],
	usage: '!ping',
	cooldown: 3,
	isDeveloperOnly: false,
	async execute(client: CartiqoClient, message: Message) {
		return message.reply('🏓 Pong!');
	},
};

export default command;
