import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CartiqoClient, registerErrorHandlers, loadCommands, loadEvents, logger } from '@cartiqo-framework/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const basePath = path.resolve(__dirname, './');

const client = new CartiqoClient();

registerErrorHandlers(client);

try {
	await Promise.all([
		loadEvents(client, basePath),
		loadCommands(
			client,
			basePath,
			client.config.helper.client_token,
			client.config.helper.client_id,
			client.config.guilds,
		),
	]);

	await client.login(client.config.helper.client_token);
	logger.info('✅ Client login successful');
} catch (err) {
	logger.error('❌ Failed to initialize client:', err);
	process.exit(1);
}
