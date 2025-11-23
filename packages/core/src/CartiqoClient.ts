import { SlashCommandInterface, EventInterface, PrefixCommandInterface } from '@cartiqo-framework/shared';

import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';

import { config, ProjectInterface } from './config.js';
import { logger } from './logger.js';

import { PrismaClient as CartiqoBansPrisma } from '../prisma/cartiqo-bans/index.js';
import { PrismaClient as CartiqoPrisma } from '../prisma/cartiqo/index.js';
import { PrismaClient as GlobalPrisma } from '../prisma/global/index.js';

import { PrismaMariaDb } from '@prisma/adapter-mariadb';

type PrismaMap = {
	bans: CartiqoBansPrisma;
	cartiqo: CartiqoPrisma;
	global: GlobalPrisma;
};

type PrismaEventClient = {
	$on(event: 'query' | 'info' | 'warn' | 'error', callback: (e: any) => void): void;
};

export class CartiqoClient extends Client {
	public slashCommands = new Collection<string, SlashCommandInterface>();
	public prefixCommands = new Collection<string, PrefixCommandInterface>();
	public events = new Collection<string, EventInterface>();

	public config: ProjectInterface;
	public db: PrismaMap;

	constructor() {
		super({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.GuildMessageReactions,
				GatewayIntentBits.GuildMessageTyping,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.DirectMessages,
				GatewayIntentBits.GuildModeration,
				GatewayIntentBits.GuildWebhooks,
				GatewayIntentBits.GuildPresences,
				GatewayIntentBits.GuildScheduledEvents,
				GatewayIntentBits.GuildIntegrations,
				GatewayIntentBits.GuildInvites,
				GatewayIntentBits.GuildVoiceStates,
			],
			partials: [
				Partials.User,
				Partials.Channel,
				Partials.Message,
				Partials.Reaction,
				Partials.GuildMember,
				Partials.ThreadMember,
				Partials.GuildScheduledEvent,
			],
		});

		this.config = config;

		const bansAdapter = new PrismaMariaDb({
			host: process.env.BANS_DB_HOST!,
			port: Number(process.env.BANS_DB_PORT!),
			user: process.env.BANS_DB_USER!,
			password: process.env.BANS_DB_PASSWORD!,
			database: process.env.BANS_DB_NAME!,
			connectionLimit: 5,
		});

		const cartiqoAdapter = new PrismaMariaDb({
			host: process.env.CARTIQO_DB_HOST!,
			port: Number(process.env.CARTIQO_DB_PORT!),
			user: process.env.CARTIQO_DB_USER!,
			password: process.env.CARTIQO_DB_PASSWORD!,
			database: process.env.CARTIQO_DB_NAME!,
			connectionLimit: 5,
		});

		const globalAdapter = new PrismaMariaDb({
			host: process.env.GLOBAL_DB_HOST!,
			port: Number(process.env.GLOBAL_DB_PORT!),
			user: process.env.GLOBAL_DB_USER!,
			password: process.env.GLOBAL_DB_PASSWORD!,
			database: process.env.GLOBAL_DB_NAME!,
			connectionLimit: 5,
		});

		this.db = {
			bans: new CartiqoBansPrisma({ adapter: bansAdapter }),
			cartiqo: new CartiqoPrisma({ adapter: cartiqoAdapter }),
			global: new GlobalPrisma({ adapter: globalAdapter }),
		};

		this.initializeDatabaseLogging();
	}

	/**
	 * Enable Prisma query logging on all schemas
	 */
	private initializeDatabaseLogging() {
		for (const [name, client] of Object.entries(this.db)) {
			const prisma = client as unknown as PrismaEventClient;

			prisma.$on('query', (e) => logger.debug(`[${name.toUpperCase()}] Query: ${e.query}`));
			prisma.$on('info', (e) => logger.info(`[${name.toUpperCase()}] Info: ${e.message}`));
			prisma.$on('warn', (e) => logger.warn(`[${name.toUpperCase()}] Warning: ${e.message}`));
			prisma.$on('error', (e) => logger.error(`[${name.toUpperCase()}] Error: ${e.message}`));
		}

		logger.info('✅ Prisma clients initialized with MariaDB adapters');
	}

	/**
	 * Clean shutdown for all Prisma clients
	 */
	public async disconnectDatabases() {
		logger.info('🧹 Disconnecting Prisma clients...');

		await Promise.all([this.db.bans.$disconnect(), this.db.cartiqo.$disconnect(), this.db.global.$disconnect()]);

		logger.info('✅ Prisma clients disconnected');
	}
}
