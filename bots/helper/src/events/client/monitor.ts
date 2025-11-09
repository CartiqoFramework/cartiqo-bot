import { CartiqoClient } from '@cartiqo-framework/core';
import { EventInterface } from '@cartiqo-framework/shared';
import { TextChannel } from 'discord.js';

const WATCH_CHANNEL_ID = '1416874048159350894'; // channel where UptimeRobot posts
const ALERT_CHANNEL_ID = '1416015601859690616'; // channel where alerts go

const event: EventInterface<'messageCreate'> = {
	name: 'messageCreate',
	options: { once: false, rest: false },
	async execute(client: CartiqoClient, message) {
		if (message.channel.id !== WATCH_CHANNEL_ID) return;
		if (!message.author.bot) return;

		const content = message.content;
		const lower = content.toLowerCase();
		const alertChannel = client.channels.cache.get(ALERT_CHANNEL_ID) as TextChannel;
		if (!alertChannel) return;

		const match = content.match(/Monitor is (?:DOWN|UP): (.*?) \(/i);
		const serviceName = match ? match[1].trim() : 'Stachio';

		// ---- DOWN MESSAGE ----
		if (lower.includes('monitor is down')) {
			const statusMessage = [
				`## **\`⚠️ ${serviceName} Status Update\`**`,
				` `,
				`The hosting of **${serviceName}** is currently **experiencing downtime** due to connectivity issues.`,
				` `,
				`Reported by the monitoring system:`,
				`> 💻 Service: ${serviceName}`,
				`> 🕒 Time: <t:${Math.floor(Date.now() / 1000)}:F>`,
				`> ⚠️ Status: Host is unreachable`,
				` `,
				`🙏 We appreciate your patience — the team has been notified and is investigating the issue.`,
			].join('\n');

			await alertChannel.send(statusMessage);
		}

		// ---- UP MESSAGE ----
		else if (lower.includes('monitor is up')) {
			const statusMessage = [
				`## **\`✅ ${serviceName} Status Update\`**`,
				` `,
				`**${serviceName}** is now **back online** and operating normally.`,
				` `,
				`Recovery details:`,
				`> 💻 Service: ${serviceName}`,
				`> 🕒 Time: <t:${Math.floor(Date.now() / 1000)}:F>`,
				`> ⚙️ Status: Service restored successfully`,
				` `,
				`🟢 Everything should now be running smoothly — thank you for your patience!`,
			].join('\n');

			await alertChannel.send(statusMessage);
		}
	},
};

export default event;
