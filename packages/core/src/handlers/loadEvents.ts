import { CartiqoClient } from '@cartiqo-framework/core';
import { EventInterface } from '@cartiqo-framework/shared';
import path from 'node:path';
import { readdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export async function loadEvents(client: CartiqoClient, rootDir: string) {
	const eventsFolder = path.join(rootDir, 'events');

	if (!existsSync(eventsFolder)) {
		console.warn(`[EVENTS] Folder not found: ${eventsFolder}`);
		return;
	}

	for (const folder of readdirSync(eventsFolder)) {
		const folderPath = path.join(eventsFolder, folder);

		for (const file of readdirSync(folderPath).filter((f) => f.endsWith('.js'))) {
			const filePath = path.join(folderPath, file);

			const event = (await import(pathToFileURL(filePath).toString())).default as EventInterface;

			const handler = (...args: unknown[]) => (event.execute as (...args: unknown[]) => Promise<void>)(client, ...args);

			if (event.options?.once) client.once(event.name as any, handler);
			else client.on(event.name as any, handler);

			if (event.options?.rest && client.rest) client.rest.on(event.name as any, handler);

			client.events.set(event.name as string, event);
		}
	}
}
