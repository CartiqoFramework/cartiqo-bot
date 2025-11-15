import { SlashCommandInterface } from '@cartiqo-framework/shared';
import {
	CartiqoClient,
	getOrCreateGlobalBanConfig,
	updateGlobalBanConfig,
	setCategoryPunishment,
	setNotifyOnBan,
	setNotifyChannel,
	getOrCreateGuildConfig,
} from '@cartiqo-framework/core';
import {
	SlashCommandBuilder,
	ApplicationIntegrationType,
	ChatInputCommandInteraction,
	ChannelType,
	PermissionFlagsBits,
	EmbedBuilder,
} from 'discord.js';

import { BanAction } from '@cartiqo-framework/core/prisma/cartiqo/index.js';

const Categories = [
	{ name: 'Global', value: 'Global' },
	{ name: 'Discord', value: 'Discord' },
	{ name: 'FiveM', value: 'FiveM' },
	{ name: 'Marketplace', value: 'Marketplace' },
	{ name: 'Community', value: 'Community' },
];

const Punishments = [
	{ name: 'None', value: 'NONE' },
	{ name: 'Warn (DM only)', value: 'WARN' },
	{ name: 'Apply Banned Role', value: 'ROLE' },
	{ name: 'Kick User', value: 'KICK' },
	{ name: 'Ban User', value: 'BAN' },
];

const command: SlashCommandInterface = {
	cooldown: 3,
	isDeveloperOnly: false,

	data: new SlashCommandBuilder()
		.setName('banconfig')
		.setDescription('Configure global ban settings')
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand((sub) =>
			sub
				.setName('setup')
				.setDescription('Initial setup or quick update')
				.addStringOption((opt) =>
					opt
						.setName('category')
						.setDescription('Category to configure')
						.setRequired(true)
						.addChoices(...Categories),
				)
				.addStringOption((opt) =>
					opt
						.setName('action')
						.setDescription('Punishment applied')
						.setRequired(true)
						.addChoices(...Punishments),
				)
				.addBooleanOption((opt) => opt.setName('notify').setDescription('Enable / disable notifications'))
				.addChannelOption((opt) =>
					opt.setName('notify_channel').addChannelTypes(ChannelType.GuildText).setDescription('Notification channel'),
				)
				.addRoleOption((opt) => opt.setName('role').setDescription('Role used for ROLE punishment')),
		)
		.addSubcommand((sub) =>
			sub
				.setName('notify')
				.setDescription('Modify notification settings')
				.addBooleanOption((opt) =>
					opt.setName('enabled').setDescription('Enable / disable notifications').setRequired(true),
				)
				.addChannelOption((opt) =>
					opt
						.setName('channel')
						.setDescription('Notification channel (leave empty to unset)')
						.addChannelTypes(ChannelType.GuildText),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('role')
				.setDescription('Update or clear the banned role')
				.addRoleOption((opt) => opt.setName('role').setDescription('Role to set (leave empty to clear)')),
		)
		.addSubcommand((sub) =>
			sub
				.setName('punishment')
				.setDescription('Update punishment for any category')
				.addStringOption((opt) =>
					opt
						.setName('category')
						.setDescription('Category')
						.setRequired(true)
						.addChoices(...Categories),
				)
				.addStringOption((opt) =>
					opt
						.setName('action')
						.setDescription('Punishment')
						.setRequired(true)
						.addChoices(...Punishments),
				),
		)
		.addSubcommand((sub) => sub.setName('view').setDescription('View current ban configuration')),
	async execute(client: CartiqoClient, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: ['Ephemeral'] });

		const guildId = interaction.guildId!;
		const guildName = interaction.guild!.name ?? 'Unknown Guild';

		await getOrCreateGuildConfig(client, guildId, guildName);
		const config = await getOrCreateGlobalBanConfig(client, guildId);

		const sub = interaction.options.getSubcommand();

		if (sub === 'setup') {
			const category = interaction.options.getString('category', true) as any;
			const action = interaction.options.getString('action', true) as BanAction;

			const notify = interaction.options.getBoolean('notify');
			const notifyChannel = interaction.options.getChannel('notify_channel');
			const role = interaction.options.getRole('role');

			await setCategoryPunishment(client, guildId, category, action);

			if (notify !== null) await setNotifyOnBan(client, guildId, notify);
			if (notifyChannel) await setNotifyChannel(client, guildId, notifyChannel.id);
			if (role) await updateGlobalBanConfig(client, guildId, { roleId: role.id });

			return interaction.editReply(`\`✅\` Ban configuration updated.`);
		}

		if (sub === 'notify') {
			const enabled = interaction.options.getBoolean('enabled', true);
			const channel = interaction.options.getChannel('channel');

			await setNotifyOnBan(client, guildId, enabled);

			if (channel) {
				await setNotifyChannel(client, guildId, channel.id);
			} else {
				await setNotifyChannel(client, guildId, null);
			}

			return interaction.editReply(
				`\`🔔\` Notifications **${enabled ? 'enabled' : 'disabled'}**${channel ? ` \`→\` <#${channel.id}>` : ''}`,
			);
		}

		if (sub === 'role') {
			const role = interaction.options.getRole('role');

			await updateGlobalBanConfig(client, guildId, { roleId: role?.id ?? null });

			return interaction.editReply(role ? `\`🎭\` Role updated to <@&${role.id}>` : `\`🗑️\` Role removed.`);
		}

		if (sub === 'punishment') {
			const category = interaction.options.getString('category', true) as any;
			const action = interaction.options.getString('action', true) as BanAction;

			await setCategoryPunishment(client, guildId, category, action);

			return interaction.editReply(`\`⚙️\` Punishment for **${category}** updated to **${action}**.`);
		}

		if (sub === 'view') {
			const embed = new EmbedBuilder()
				.setTitle(`Ban Configuration - ${guildName}`)
				.setColor('#2b2d31')
				.addFields(
					{ name: 'Notify', value: String(config.notifyOnBan), inline: true },
					{
						name: 'Notify Channel',
						value: config.notifyChannelId ? `<#${config.notifyChannelId}>` : 'None',
						inline: true,
					},
					{ name: 'Role', value: config.roleId ? `<@&${config.roleId}>` : 'None', inline: true },
					{
						name: 'Punishments',
						value: [
							`**Global:** ${config.punishGlobal}`,
							`**Discord:** ${config.punishDiscord}`,
							`**FiveM:** ${config.punishFiveM}`,
							`**Marketplace:** ${config.punishMarketplace}`,
							`**Community:** ${config.punishCommunity}`,
						].join('\n'),
					},
				);

			return interaction.editReply({ embeds: [embed] });
		}
	},
};

export default command;
