import { EmbedBuilder, WebhookClient } from 'discord.js';
import { CartiqoClient, logger } from '@cartiqo-framework/core';

interface DevNotificationOptions {
	webhookUrl?: string;
}

/**
 * Registers global Node.js and Discord.js error handlers.
 * Controlled via .env:
 *   ENABLE_ERROR_HANDLER=true
 *   ENABLE_SEND_TO_WEBHOOK=true
 *   ERROR_WEBHOOK_URL=https://discord.com/api/webhooks/...
 */
export function registerErrorHandlers(client: CartiqoClient, options?: DevNotificationOptions) {
	const enabled = process.env.ENABLE_ERROR_HANDLER === 'true';
	const sendToWebhook = process.env.ENABLE_SEND_TO_WEBHOOK === 'true';
	const webhookUrl = options?.webhookUrl || process.env.ERROR_WEBHOOK_URL;

	const notifyWebhook = async (content: string) => {
		if (!enabled || !sendToWebhook || !webhookUrl) return;

		try {
			const webhookClient = new WebhookClient({ url: webhookUrl });
			webhookClient.send({
				username: `${client.user?.username} - Error Handler`,
				avatarURL: client.user?.displayAvatarURL(),
				embeds: [new EmbedBuilder().setColor(client.config.colors.error).setDescription(content)],
			});
		} catch (err) {
			logger.error('[ErrorHandler] Failed to send webhook notification:', err);
		}
	};

	if (!enabled) {
		logger.info('[ErrorHandler] Disabled via .env (ENABLE_ERROR_HANDLER=false)');
		return;
	}

	// ===== Node.js =====
	process.on('unhandledRejection', (reason) => {
		logger.error('[Node] Unhandled Promise Rejection:', reason);
		notifyWebhook(`[Node] Unhandled Promise Rejection: ${reason}`);
	});

	process.on('uncaughtException', (error) => {
		logger.error('[Node] Uncaught Exception:', error);
		notifyWebhook(`[Node] Uncaught Exception: ${error.stack || error}`);
	});

	process.on('uncaughtExceptionMonitor', (error) => {
		logger.warn('[Node] Uncaught Exception Monitor:', error);
	});

	process.on('warning', (warning) => {
		logger.warn('[Node] Warning:', warning);
	});

	// ===== Discord.js Client =====
	client.on('error', (error) => {
		logger.error('[Discord] Client Error:', error);
		notifyWebhook(`[Discord] Client Error: ${error.stack || error}`);
	});

	client.on('shardError', (error) => {
		logger.error('[Discord] Shard Error:', error);
		notifyWebhook(`[Discord] Shard Error: ${error.stack || error}`);
	});

	client.on('warn', (warn) => {
		logger.warn('[Discord] Client Warning:', warn);
	});

	// client.on('debug', (info) => {
	// 	logger.debug('[Discord] Debug:', info);
	// });

	client.rest.on('rateLimited', (info) => {
		logger.warn(`[Discord] Rate Limited: Limit ${info.limit}, Route ${info.route}`);
		notifyWebhook(`[Discord] Rate Limited: Route: ${info.route}`);
	});

	// ===== Event wrapper =====
	const wrapEvent =
		(fn: Function) =>
		async (...args: any[]) => {
			try {
				await fn(...args);
			} catch (err: unknown) {
				const error = err instanceof Error ? err : new Error(String(err));
				logger.error('[EventHandler] Event execution failed:', error);

				const eventInfo = args[0]?.constructor?.name || 'UnknownEvent';
				notifyWebhook(`[EventHandler] Event ${eventInfo} failed: ${error.stack || error.message}`);
			}
		};

	// Override client.on for critical events
	const originalOn = client.on.bind(client);
	client.on = (event: string | symbol, listener: (...args: any[]) => void) => {
		const criticalEvents = ['interactionCreate', 'messageCreate', 'guildMemberAdd'];
		if (criticalEvents.includes(String(event))) {
			return originalOn(event, wrapEvent(listener));
		}
		return originalOn(event, listener);
	};
}
