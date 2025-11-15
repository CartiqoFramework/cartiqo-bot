import { CartiqoClient, validBanTypes } from '@cartiqo-framework/core';
import { EventInterface } from '@cartiqo-framework/shared';
import { Interaction } from 'discord.js';

const event: EventInterface<'interactionCreate'> = {
	name: 'interactionCreate',
	options: { once: false, rest: false },
	async execute(client: CartiqoClient, interaction: Interaction) {
		if (!interaction.isAutocomplete()) return;
		if (interaction.commandName !== 'cartiqo') return;

		const focusedValue = interaction.options.getFocused();
		const filtered = Array.from(validBanTypes)
			.filter((t) => t.toLowerCase().startsWith(focusedValue.toLowerCase()))
			.slice(0, 25);

		await interaction.respond(filtered.map((t) => ({ name: t, value: t })));
	},
};

export default event;
