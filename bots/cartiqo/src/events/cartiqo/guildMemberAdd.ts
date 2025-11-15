import { EventInterface } from '@cartiqo-framework/shared';
import { GuildMember } from 'discord.js';
import { CartiqoClient, actionUser } from '@cartiqo-framework/core';

const event: EventInterface<'guildMemberAdd'> = {
	name: 'guildMemberAdd',
	options: { once: false, rest: false },
	async execute(client: CartiqoClient, member: GuildMember) {
		await actionUser(client, member.id, member.user.username, member);
	},
};

export default event;
