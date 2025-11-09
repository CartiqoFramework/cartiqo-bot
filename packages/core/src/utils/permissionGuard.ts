import { GuildMember, PermissionsBitField, Role, GuildBasedChannel } from 'discord.js';
import { sendGuildErrorLog } from '@cartiqo-framework/core';

/**
 * Check if the bot can safely perform a guild action on a target or channel.
 * Returns `true` if allowed, or a string explaining why not.
 * Automatically logs failed checks to the guild's error log channel.
 */
export async function permissionGuard({
	action,
	botMember,
	targetMember,
	targetRole,
	channel,
	requiredPerms = [],
}: {
	action: string;
	botMember: GuildMember;
	targetMember?: GuildMember;
	targetRole?: Role;
	channel?: GuildBasedChannel;
	requiredPerms?: bigint[];
}): Promise<true | string> {
	const guild = botMember.guild;

	const fail = async (reason: string): Promise<string> => {
		sendGuildErrorLog(
			guild,
			'Permission Guard Triggered',
			`**Action:** ${action}\n**Guild:** ${guild.name} (${guild.id})\n**Reason:** ${reason}`,
		).catch(() => null);

		return reason;
	};

	// 1. Timeout check
	if (botMember.isCommunicationDisabled?.()) {
		return fail(`❌ Cannot perform "${action}" — bot is timed out.`);
	}

	// 2. Check required permissions
	if (requiredPerms.length > 0) {
		for (const perm of requiredPerms) {
			if (!botMember.permissions.has(perm)) {
				const permName = Object.entries(PermissionsBitField.Flags).find(([, value]) => value === perm)?.[0];
				return fail(`❌ Missing required permission ${permName ?? perm.toString()} for "${action}".`);
			}
		}
	}

	// 3. Channel permissions (Guild channels only)
	if (channel) {
		const chanPerms = channel.permissionsFor(botMember);
		if (!chanPerms) return fail(`❌ No permissions in channel for "${action}".`);

		for (const perm of requiredPerms) {
			if (!chanPerms.has(perm)) {
				const permName = Object.entries(PermissionsBitField.Flags).find(([, value]) => value === perm)?.[0];
				return fail(`❌ Missing channel permission ${permName ?? perm.toString()} in #${channel.name}.`);
			}
		}
	}

	// 4. Role hierarchy checks
	if (targetMember) {
		if (targetMember.id === guild.ownerId) return fail(`❌ Cannot ${action} the server owner.`);

		const botHighest = botMember.roles.highest.position;
		const targetHighest = targetMember.roles.highest.position;
		if (targetHighest >= botHighest) return fail(`❌ Cannot ${action} member with equal or higher role.`);
	}

	if (targetRole) {
		const botHighest = botMember.roles.highest.position;
		if (targetRole.managed) return fail(`❌ Cannot ${action} a managed role (${targetRole.name}).`);
		if (targetRole.position >= botHighest)
			return fail(`❌ Cannot ${action} a role higher or equal to bot's highest role.`);
	}

	// 5. Channel overwrite & ManageRoles safety check
	if (channel && requiredPerms.includes(PermissionsBitField.Flags.ManageRoles)) {
		const guildPerms = botMember.permissions;
		const channelPerms = channel.permissionsFor(botMember);

		const hasGlobal = guildPerms.has(PermissionsBitField.Flags.ManageRoles);
		const hasChannel = channelPerms?.has(PermissionsBitField.Flags.ManageRoles);

		if (!hasGlobal && !hasChannel) {
			return fail(`❌ Cannot ${action} — missing ManageRoles permission (globally and in #${channel.name}).`);
		}

		if (!channelPerms?.has(PermissionsBitField.Flags.ViewChannel)) {
			return fail(`❌ Cannot ${action} — missing ViewChannel permission for #${channel.name}.`);
		}
	}

	return true;
}
