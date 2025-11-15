import { SlashCommandInterface } from '@cartiqo-framework/shared';
import { CartiqoClient } from '@cartiqo-framework/core';
import { SlashCommandBuilder, ChatInputCommandInteraction, ApplicationIntegrationType } from 'discord.js';

const command: SlashCommandInterface = {
	cooldown: 2,
	isDeveloperOnly: false,
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('Replies with Pong!')
		.setIntegrationTypes(ApplicationIntegrationType.UserInstall),
	async execute(client: CartiqoClient, interaction: ChatInputCommandInteraction) {
		await interaction.reply({ content: 'THIS WAS SENT THOUGH A TEST!', flags: ['Ephemeral'] });
	},
};

export default command;