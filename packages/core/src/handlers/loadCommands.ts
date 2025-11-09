import { CartiqoClient, logger } from '@cartiqo-framework/core';
import { SlashCommandInterface, ObjectNameIDArray } from '@cartiqo-framework/shared';
import { ApplicationCommandDataResolvable, REST, Routes, Events } from 'discord.js';
import path from 'node:path';
import { readdirSync, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

async function processFolder(
	client: CartiqoClient,
	folder: string,
	isPrefix: boolean,
	output: { global: ApplicationCommandDataResolvable[]; dev: ApplicationCommandDataResolvable[] },
) {
	if (!existsSync(folder)) return;

	const files = readdirSync(folder);

	await Promise.all(
		files.map(async (file) => {
			const filePath = path.join(folder, file);
			const fileStat = await stat(filePath);

			if (fileStat.isDirectory()) return processFolder(client, filePath, isPrefix, output);
			if (!file.endsWith('.js')) return;

			const command = (await import(pathToFileURL(filePath).toString())).default;

			// ✅ Attach the file path to every loaded command
			if (command) (command as any).filePath = filePath;

			if (isPrefix) {
				if (!command?.name || typeof command.execute !== 'function') {
					logger.warn(`Invalid prefix command skipped: ${filePath}`);
					return;
				}

				client.prefixCommands.set(command.name, command);

				if (command.aliases && Array.isArray(command.aliases)) {
					for (const alias of command.aliases) {
						client.prefixCommands.set(alias, command);
					}
				}
				return;
			}

			const slashCommand: SlashCommandInterface = command;
			if (!slashCommand?.data?.name) {
				logger.warn(`Invalid slash command skipped: ${filePath}`);
				return;
			}

			client.slashCommands.set(slashCommand.data.name, slashCommand);
			(slashCommand.isDeveloperOnly ? output.dev : output.global).push(slashCommand.data.toJSON());
		}),
	);
}

export async function loadCommands(
	client: CartiqoClient,
	rootDir: string,
	token: string,
	clientId: string,
	guilds?: ObjectNameIDArray[],
) {
	const prefixFolder = path.join(rootDir, 'commands/prefix');
	const slashFolder = path.join(rootDir, 'commands/slash');

	const output = { global: [], dev: [] } as {
		global: ApplicationCommandDataResolvable[];
		dev: ApplicationCommandDataResolvable[];
	};

	await processFolder(client, prefixFolder, true, output);
	await processFolder(client, slashFolder, false, output);

	client.once(Events.ClientReady, async () => {
		const rest = new REST({ version: '10' }).setToken(token);

		try {
			// ----------------- GLOBAL COMMANDS -----------------
			const currentGlobal = await rest.get(Routes.applicationCommands(clientId));
			const currentGlobalIds = (currentGlobal as any[]).map((cmd) => cmd.id);

			// Delete old global commands
			for (const id of currentGlobalIds) {
				await rest.delete(Routes.applicationCommand(clientId, id));
			}

			// Register new global commands
			if (output.global.length) {
				await rest.put(Routes.applicationCommands(clientId), { body: output.global });
				logger.info(`Registered ${output.global.length} global slash commands.`);
			}

			// ----------------- DEV / GUILD COMMANDS -----------------
			let allGuilds: ObjectNameIDArray[] = guilds || [];

			const supporterGuilds = await client.db.global.supportGuilds.findMany({
				select: { guildId: true, guildName: true },
			});

			if (supporterGuilds.length) {
				allGuilds = [...allGuilds, ...supporterGuilds.map((g) => ({ id: g.guildId, name: g.guildName }))];
				logger.info(`Loaded ${supporterGuilds.length} supporter guilds from database.`);
			}

			for (const guild of allGuilds) {
				// Clear old guild commands first
				const guildCommands = await rest.get(Routes.applicationGuildCommands(clientId, guild.id));
				for (const cmd of guildCommands as any[]) {
					await rest.delete(Routes.applicationGuildCommand(clientId, guild.id, cmd.id));
				}

				// Register new dev commands
				if (output.dev.length) {
					await rest.put(Routes.applicationGuildCommands(clientId, guild.id), { body: output.dev });
					logger.info(`Registered ${output.dev.length} dev slash commands in guild ${guild.name} (${guild.id})`);
				}
			}
		} catch (err) {
			logger.error('Error registering slash commands', err);
		}
	});
}
