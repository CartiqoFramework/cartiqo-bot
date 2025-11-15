import { CartiqoClient, logger, getAllVersions } from '@cartiqo-framework/core';
import { EventInterface } from '@cartiqo-framework/shared';
import { ActivityType, PresenceData, PresenceUpdateStatus } from 'discord.js';

const readyEvent: EventInterface<'clientReady'> = {
	name: 'clientReady',
	options: { once: true, rest: false },
	async execute(client: CartiqoClient) {
		const versions = getAllVersions();

		logger.info(`✅ Client ready as ${client.user?.tag}`);

		const formatted = Object.entries(versions)
			.map(([ws, v]) => `   • ${ws}: v${v}`)
			.join('\n');
		logger.info(`🔖 Workspace Versions:\n${formatted}`);
	},
};

export default readyEvent;
