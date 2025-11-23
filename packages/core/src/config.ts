import { ObjectNameIDArray } from '@cartiqo-framework/shared';
import 'dotenv/config';

interface BotInterface {
	client_username: string;
	client_token: string;
	client_id: string;
	client_secret: string;
	client_prefix: string;
}

export interface ProjectInterface {
	authio: BotInterface;
	monitio: BotInterface;
	sentio: BotInterface;
	stachio: BotInterface;
	cartiqo: BotInterface;
	helper: BotInterface;
	guilds: ObjectNameIDArray;
	colors: {
		success: number;
		error: number;
		warning: number;
		info: number;
		secondary: number;
		primary: number;
	};
}

export const config: ProjectInterface = {
	authio: {
		client_username: process.env.AUTHIO_CLIENT_USERNAME as string,
		client_token: process.env.AUTHIO_CLIENT_TOKEN as string,
		client_id: process.env.AUTHIO_CLIENT_ID as string,
		client_secret: process.env.AUTHIO_CLIENT_SECRET as string,
		client_prefix: process.env.AUTHIO_CLIENT_PREFIX as string,
	},
	monitio: {
		client_username: process.env.MONITIO_CLIENT_USERNAME as string,
		client_token: process.env.MONITIO_CLIENT_TOKEN as string,
		client_id: process.env.MONITIO_CLIENT_ID as string,
		client_secret: process.env.MONITIO_CLIENT_SECRET as string,
		client_prefix: process.env.MONITIO_CLIENT_PREFIX as string,
	},
	sentio: {
		client_username: process.env.SENTIO_CLIENT_USERNAME as string,
		client_token: process.env.SENTIO_CLIENT_TOKEN as string,
		client_id: process.env.SENTIO_CLIENT_ID as string,
		client_secret: process.env.SENTIO_CLIENT_SECRET as string,
		client_prefix: process.env.SENTIO_CLIENT_PREFIX as string,
	},
	stachio: {
		client_username: process.env.STACHIO_CLIENT_USERNAME as string,
		client_token: process.env.STACHIO_CLIENT_TOKEN as string,
		client_id: process.env.STACHIO_CLIENT_ID as string,
		client_secret: process.env.STACHIO_CLIENT_SECRET as string,
		client_prefix: process.env.STACHIO_CLIENT_PREFIX as string,
	},
	cartiqo: {
		client_username: process.env.CARTIQO_CLIENT_USERNAME as string,
		client_token: process.env.CARTIQO_CLIENT_TOKEN as string,
		client_id: process.env.CARTIQO_CLIENT_ID as string,
		client_secret: process.env.CARTIQO_CLIENT_SECRET as string,
		client_prefix: process.env.CARTIQO_CLIENT_PREFIX as string,
	},
	helper: {
		client_username: process.env.HELPER_CLIENT_USERNAME as string,
		client_token: process.env.HELPER_CLIENT_TOKEN as string,
		client_id: process.env.HELPER_CLIENT_ID as string,
		client_secret: process.env.HELPER_CLIENT_SECRET as string,
		client_prefix: process.env.HELPER_CLIENT_PREFIX as string,
	},
	guilds: [
		{
			name: 'CɅRTIQO.',
			id: '1044098950455627867',
		},
	],
	colors: {
		success: 0x57f287,
		error: 0xed4245,
		warning: 0xfaa61a,
		info: 0x5865f2,
		secondary: 0x37373d,
		primary: 0xaac49b,
	},
};
