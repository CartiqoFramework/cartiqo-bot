import { CartiqoClient, logger, syncBans } from '@cartiqo-framework/core';
import { EventInterface } from '@cartiqo-framework/shared';
import { ActivityType } from 'discord.js';

const event: EventInterface<'ready'> = {
	name: 'ready',
	options: { once: true, rest: false },
	async execute(client: CartiqoClient) {
		logger.info(`[READY] Logged in as ${client.user?.tag}`);

		client.user?.setPresence({
			status: 'online',
			activities: [{ name: 'Cartiqo Security', type: ActivityType.Watching }],
		});

		const result = await syncBans(client);
		logger.info(`[SYNC] Initial ban cleanup complete — expired: ${result.expiredCount}`);

		setInterval(
			async () => {
				const r = await syncBans(client);
				logger.info(`[SYNC] Hourly ban sync — expired: ${r.expiredCount}`);
			},
			60 * 60 * 1000,
		);
	},
};

export default event;
