import { SlashCommandInterface } from '@cartiqo-framework/shared';
import {
	CartiqoClient,
	createBanRecord,
	deactivateBanRecord,
	syncBans,
	getOrCreateBanProfile,
	getBanRecords,
	getBanById,
	validBanCategories,
	validBanStatuses,
	validBanTypes,
} from '@cartiqo-framework/core';
import {
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	PermissionFlagsBits,
	EmbedBuilder,
	ApplicationIntegrationType,
} from 'discord.js';
import type { BanCategory, BanType, BanStatus } from '../../../../../../packages/core/prisma/cartiqo-bans/index.js';

const command: SlashCommandInterface = {
	cooldown: 2,
	isDeveloperOnly: true,
	data: new SlashCommandBuilder()
		.setName('cartiqo')
		.setDescription('Cartiqo management tools')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
		.addSubcommandGroup((group) =>
			group
				.setName('ban')
				.setDescription('Manage user bans in Cartiqo')
				// CREATE
				.addSubcommand((sub) =>
					sub
						.setName('create')
						.setDescription('Create a new ban')
						.addUserOption((opt) => opt.setName('user').setDescription('User to ban').setRequired(true))
						.addStringOption((opt) =>
							opt
								.setName('category')
								.setDescription('Ban category')
								.setRequired(true)
								.addChoices(...Array.from(validBanCategories).map((c) => ({ name: c, value: c }))),
						)
						.addStringOption((opt) =>
							opt.setName('type').setDescription('Ban type').setRequired(true).setAutocomplete(true),
						)
						.addStringOption((opt) =>
							opt
								.setName('status')
								.setDescription('Ban status')
								.setRequired(true)
								.addChoices(...Array.from(validBanStatuses).map((s) => ({ name: s, value: s }))),
						)
						.addStringOption((opt) => opt.setName('reason').setDescription('Reason').setRequired(true))
						.addStringOption((opt) => opt.setName('evidence').setDescription('Evidence URL'))
						.addStringOption((opt) => opt.setName('expires').setDescription('Expiration (YYYY-MM-DD)')),
				)
				// DEACTIVATE
				.addSubcommand((sub) =>
					sub
						.setName('deactivate')
						.setDescription('Deactivate an existing ban')
						.addIntegerOption((opt) => opt.setName('banid').setDescription('Ban ID').setRequired(true)),
				)
				// UPDATE
				.addSubcommand((sub) =>
					sub
						.setName('update')
						.setDescription('Update a ban')
						.addIntegerOption((opt) => opt.setName('banid').setDescription('Ban ID').setRequired(true))
						.addStringOption((opt) =>
							opt
								.setName('category')
								.setDescription('New category')
								.addChoices(...Array.from(validBanCategories).map((c) => ({ name: c, value: c }))),
						)
						.addStringOption((opt) => opt.setName('type').setDescription('New type').setAutocomplete(true))
						.addStringOption((opt) =>
							opt
								.setName('status')
								.setDescription('New status')
								.addChoices(...Array.from(validBanStatuses).map((s) => ({ name: s, value: s }))),
						)
						.addStringOption((opt) => opt.setName('reason').setDescription('New reason'))
						.addStringOption((opt) => opt.setName('evidence').setDescription('New evidence URL'))
						.addStringOption((opt) => opt.setName('expires').setDescription('New expiration (YYYY-MM-DD)')),
				)
				// CHECK
				.addSubcommand((sub) =>
					sub
						.setName('check')
						.setDescription('Check all bans for a user')
						.addUserOption((opt) => opt.setName('user').setDescription('User to check').setRequired(true)),
				)
				// INFO
				.addSubcommand((sub) =>
					sub
						.setName('info')
						.setDescription('Show ban info')
						.addIntegerOption((opt) => opt.setName('banid').setDescription('Ban ID').setRequired(true)),
				)
				// SYNC
				.addSubcommand((sub) => sub.setName('sync').setDescription('Synchronize ban records across guilds')),
		),
	async execute(client: CartiqoClient, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: ['Ephemeral'] });

		const group = interaction.options.getSubcommandGroup(true);
		const sub = interaction.options.getSubcommand(true);

		if (group === 'ban') {
			// CREATE -----------------------
			if (sub === 'create') {
				const user = interaction.options.getUser('user', true);
				const category = interaction.options.getString('category') as BanCategory;
				const type = interaction.options.getString('type') as BanType;
				const status = interaction.options.getString('status') as BanStatus;
				const reason = interaction.options.getString('reason', true);
				const evidence = interaction.options.getString('evidence') ?? '';
				const expiresInput = interaction.options.getString('expires');
				const expiresAt = expiresInput ? new Date(expiresInput) : null;

				if (!validBanCategories.has(category))
					return interaction.editReply({ content: `\`⚠️\` Invalid category: ${category}` });

				if (!validBanTypes.has(type)) return interaction.editReply({ content: `\`⚠️\` Invalid type: ${type}` });

				if (!validBanStatuses.has(status))
					return interaction.editReply({ content: `\`⚠️\` Invalid status: ${status}` });

				const profile = await getOrCreateBanProfile(client, user.id, user.username, user.displayAvatarURL());

				await createBanRecord(client, profile.id, {
					category,
					type,
					status,
					reason,
					evidenceUrl: evidence,
					expiresAt,
					issuedBy: interaction.user.id,
					community: interaction.guild?.name ?? 'Unknown',
				});

				return interaction.editReply({
					content: `\`✅\` Ban created for **${user.tag}** — ${type} / ${category}`,
				});
			}
			// DEACTIVATE -------------------
			if (sub === 'deactivate') {
				const banId = interaction.options.getInteger('banid', true);

				const result = await deactivateBanRecord(client, banId);
				if (!result)
					return interaction.editReply({
						content: `\`⚠️\` No ban found with ID **${banId}**.`,
					});

				return interaction.editReply({
					content: `\`🗑️\` Deactivated ban **#${banId}**.`,
				});
			}
			// UPDATE -----------------------
			if (sub === 'update') {
				const banId = interaction.options.getInteger('banid', true);
				const updateData: any = {};

				const keys = ['category', 'type', 'status', 'reason', 'evidence', 'expires'] as const;

				for (const key of keys) {
					const val = interaction.options.getString(key);
					if (val) {
						updateData[key === 'evidence' ? 'evidenceUrl' : key] = key === 'expires' ? new Date(val) : val;
					}
				}

				const record = await getBanById(client, banId);
				if (!record)
					return interaction.editReply({
						content: `\`⚠️\` No ban found with ID **${banId}**.`,
					});

				await client.db.bans.banRecord.update({
					where: { id: banId },
					data: updateData,
				});

				return interaction.editReply({
					content: `\`✅\` Updated ban **#${banId}**.`,
				});
			}
			// CHECK ------------------------
			if (sub === 'check') {
				const user = interaction.options.getUser('user', true);
				const profile = await getOrCreateBanProfile(client, user.id, user.username, user.displayAvatarURL());

				const records = await getBanRecords(client, profile.id);
				if (!records.length)
					return interaction.editReply({
						content: `\`✅\` No bans found for **${user.tag}**.`,
					});

				const embed = new EmbedBuilder()
					.setColor('#ff4747')
					.setTitle(`Ban Records: ${user.tag}`)
					.setThumbnail(user.displayAvatarURL())
					.setDescription(
						records
							.map((r) => `**#${r.id}** — ${r.category}/${r.type} | ${r.isActive ? '🟢 Active' : '🔴 Inactive'}`)
							.join('\n'),
					)
					.setFooter({ text: `Total bans: ${records.length}` });

				return interaction.editReply({ embeds: [embed] });
			}
			// INFO -------------------------
			if (sub === 'info') {
				const banId = interaction.options.getInteger('banid', true);
				const record = await getBanById(client, banId);

				if (!record)
					return interaction.editReply({
						content: `\`⚠️\` No ban found with ID **${banId}**.`,
					});

				const embed = new EmbedBuilder()
					.setColor(record.isActive ? '#ff4747' : '#808080')
					.setTitle(`Ban #${record.id}`)
					.setDescription(record.reason || 'No reason provided')
					.addFields(
						{ name: 'Category', value: record.category, inline: true },
						{ name: 'Type', value: record.type, inline: true },
						{ name: 'Status', value: record.status, inline: true },
						{ name: 'Issued By', value: `<@${record.issuedBy}>`, inline: true },
						{
							name: 'Expires',
							value: record.expiresAt ? `<t:${Math.floor(record.expiresAt.getTime() / 1000)}:R>` : 'Indefinite',
							inline: true,
						},
					)
					.setThumbnail(record.profile.avatarUrl || null);

				return interaction.editReply({ embeds: [embed] });
			}
			// SYNC -------------------------
			if (sub === 'sync') {
				await syncBans(client);
				return interaction.editReply({
					content: '\`🔄\` Bans synchronized across all guilds.',
				});
			}
		}
	},
};

export default command;
