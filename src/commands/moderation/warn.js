const {
	SlashCommandBuilder,
	InteractionContextType,
	PermissionFlagsBits,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
} = require('discord.js');
const Warning = require('../../models/warning_schema');

async function createWarning(userId, guildId, reason, duration) {
	const warning = new Warning({
		userId: userId,
		guildId: guildId,
		reason: reason,
		expiresInSeconds: duration,
		active: true,
	});
	await warning.save();
}
module.exports = {
	data: new SlashCommandBuilder()
		.setName('warn')
		.setDescription('give member a written warning')
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addUserOption((option) =>
			option
				.setName('member')
				.setDescription('member to write warning')
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('reason')
				.setDescription('reason for member to recieve warning')
				.setRequired(true),
		)
		.addIntegerOption((option) =>
			option
				.setName('duration')
				.setDescription('duration for when the warning should expire')
				.setRequired(true)
				.addChoices(
					{ name: '30 minutes', value: 1800 },
					{ name: '1 hour', value: 3600 },
					{ name: '2 hours', value: 7200 },
					{ name: '4 hours', value: 14400 },
					{ name: '6 hours', value: 21600 },
					{ name: '1 day', value: 86400 },
					{ name: '7 days', value: 604800 },
				),
		),

	/**
	 * @param {import("discord.js").Interaction} interaction
	 */
	async execute(interaction) {
		const member = interaction.options.getMember('member');
		const reason = interaction.options.getString('reason');
		const duration = interaction.options.getInteger('duration');

		if (member.user.bot) {
			await interaction.editReply('You cannot warn a bot');
			return;
		}
		try {
			// Check if member already has a warning
			const warningExist = await Warning.findOne({
				userId: member.user.id,
				guildId: interaction.guildId,
			});

			if (warningExist) {
				// Ask author if a new warning should be issued

				const confirm = new ButtonBuilder()
					.setCustomId('confirm')
					.setLabel('Confirm Ban')
					.setStyle(ButtonStyle.Danger);

				const cancel = new ButtonBuilder()
					.setCustomId('cancel')
					.setLabel('Cancel')
					.setStyle(ButtonStyle.Secondary);

				const row = new ActionRowBuilder().addComponents(
					cancel,
					confirm,
				);
				const response = await interaction.reply({
					content: `${member.user.tag} has already been given a warning. Are you sure you want to issue a new warning?`,
					components: [row],
					withResponse: true,
				});
				const collectorFilter = (i) =>
					i.user.id === interaction.user.id;

				try {
					const confirmation =
						await response.resource.message.awaitMessageComponent({
							filter: collectorFilter,
							time: 60_000,
						});
					if (confirmation.customId === 'confirm') {
						await createWarning(
							member.user.id,
							interaction.guildId,
							reason,
							duration,
						);
						await confirmation.update({
							content: `${member.user.tag} has been given a new warning reason: ${reason}`,
							components: [],
						});
					} else if (confirmation.customId === 'cancel') {
						await confirmation.update({
							content: 'Action cancelled',
							components: [],
						});
					}
				} catch {
					await interaction.editReply({
						content:
							'Confirmation not received within 1 minute, cancelling',
						components: [],
					});
				}
			} else {
				await createWarning(
					member.user.id,
					interaction.guildId,
					reason,
					duration,
				);
				await interaction.reply('Created a new warning');
			}
		} catch (error) {
			console.error('Error happened during warn command', error);
		}
	},
};
