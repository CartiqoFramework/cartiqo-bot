import { CartiqoClient } from '@cartiqo-framework/core';
import { EventInterface } from '@cartiqo-framework/shared';
import { GuildMember, PartialGuildMember, EmbedBuilder, TextChannel, ColorResolvable } from 'discord.js';
import { customAlphabet } from 'nanoid';

const event: EventInterface<'guildMemberUpdate'> = {
	name: 'guildMemberUpdate',
	options: { once: false, rest: false },
	async execute(client: CartiqoClient, oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
		const supportGuildId = client.config.guilds[0].id;
		if (newMember.guild.id !== supportGuildId) return;

		const roles = {
			cartiqoPlus: process.env.CARTIQO_PLUS_ROLE_ID as string,
			booster: process.env.CARTIQO_BOOSTER_ROLE_ID as string,
		};

		const hadRole = (roleId: string) => oldMember.roles?.cache.has(roleId) ?? false;
		const hasRole = (roleId: string) => newMember.roles.cache.has(roleId);
		const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 10);

		const logChannel = client.channels.cache.get(process.env.CARTIQO_ANNOUNCEMENTS_CHANNEL_ID as string) as
			| TextChannel
			| undefined;

		const sendLog = async (emoji: string, message: string, color = '#5865F2') => {
			if (!logChannel) return;
			const embed = new EmbedBuilder().setDescription(`\`${emoji}\` ${message}`).setColor(color as ColorResolvable);
			await logChannel.send({ embeds: [embed] });
		};

		for (const [type, roleId] of Object.entries(roles)) {
			if (!hadRole(roleId) && hasRole(roleId)) {
				if (type === 'cartiqoPlus') {
					const code = nanoid();

					await client.db.global.cartiqoUser.upsert({
						where: { discordId: newMember.id },
						update: { premiumActive: true, premiumTier: 'CartiqoPlus' },
						create: {
							discordId: newMember.id,
							username: newMember.user.username,
							premiumActive: true,
							premiumTier: 'CartiqoPlus',
						},
					});

					await client.db.global.cartiqoCode.create({
						data: { code, tier: 'CartiqoPlus', redeemed: false },
					});

					const dmEmbed = new EmbedBuilder()
						.setDescription(
							`🌟 **Welcome to CɅRTIQO+!**\n\n` +
								`Here is your **activation code**:\n\`\`\`${code}\`\`\`\n` +
								`Use this in your guild to activate **CɅRTIQO+**.\n\n` +
								`> 💡 As long as you keep your CɅRTIQO+ role in the support server, your guild remains premium.`,
						)
						.setColor('#5865F2');

					await newMember.send({ embeds: [dmEmbed] }).catch(() => {
						console.log(`⚠️ Couldn't DM ${newMember.user.username} their CɅRTIQO+ code`);
					});

					await sendLog('✅', `**${newMember.user.username}** gained access to **CɅRTIQO+** tier.`, '#43B581');
				}

				if (type === 'booster') {
					await sendLog('🚀', `**${newMember.user.username}** started boosting the server.`, '#F47FFF');
				}
			} else if (hadRole(roleId) && !hasRole(roleId)) {
				if (type === 'cartiqoPlus') {
					await client.db.global.cartiqoUser.updateMany({
						where: { discordId: newMember.id },
						data: { premiumActive: false, premiumTier: 'Free' },
					});

					await client.db.global.cartiqoGuild.updateMany({
						where: { activatedByUserId: newMember.id },
						data: { tier: 'Free', expiresAt: new Date() },
					});

					await sendLog('❌', `**${newMember.user.username}** lost **CɅRTIQO+** privileges.`, '#ED4245');
				}

				if (type === 'booster') {
					await sendLog('📉', `**${newMember.user.username}** stopped boosting the server. 💔`, '#FAA61A');
				}
			}
		}
	},
};

export default event;
