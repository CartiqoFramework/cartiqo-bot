import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	CartiqoClient,
	registerErrorHandlers,
	loadCommands,
	loadEvents,
	logger,
	startTranscriptServer,
} from '@cartiqo-framework/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const basePath = path.resolve(__dirname, './');

const client = new CartiqoClient();

registerErrorHandlers(client);
startTranscriptServer();

try {
	await Promise.all([
		loadEvents(client, basePath),
		loadCommands(
			client,
			basePath,
			client.config.cartiqo.client_token,
			client.config.cartiqo.client_id,
			client.config.guilds,
		),
	]);

	await client.login(client.config.cartiqo.client_token);
	logger.info('✅ Client login successful');
} catch (err) {
	logger.error('❌ Failed to initialize client:', err);
	console.log(err);
	process.exit(1);
}
