import {
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	ClientEvents,
	RESTEvents,
	Message,
	SlashCommandSubcommandsOnlyBuilder,
	InteractionResponse,
	SlashCommandOptionsOnlyBuilder,
} from 'discord.js';

export type ObjectNameIDArray = Array[{ name: string; id: string }];

export interface EventInterface<K extends keyof ClientEvents | keyof RESTEvents = keyof ClientEvents> {
	name: K;
	options?: { once?: boolean; rest?: boolean };
	execute: (
		...args: K extends 'interactionCreate'
			? [client: any, interaction: Interaction]
			: K extends keyof ClientEvents
				? [client: any, ...ClientEvents[K]]
				: K extends keyof RESTEvents
					? [client: any, ...RESTEvents[K]]
					: [client: any, ...any[]]
	) => any | Promise<any>;
}
export interface SlashCommandInterface {
	cooldown: number;
	isDeveloperOnly: boolean;
	data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder;
	execute: (
		client: any,
		interaction: ChatInputCommandInteraction,
	) => void | Promise<void | Message | InteractionResponse>;
}

export interface PrefixCommandInterface {
	name: string;
	description?: string;
	aliases?: string[];
	usage?: string;
	cooldown?: number;
	isDeveloperOnly?: boolean;
	execute: (client: any, message: Message, args: string[]) => void | Promise<void | Message>;
}
