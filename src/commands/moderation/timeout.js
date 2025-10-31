const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	InteractionContextType,
	MessageFlags,
} = require('discord.js');
const {
	REASONS,
	PermissionRequest,
	doesHaveSufficientPermission,
} = require('../../utils/checkPermissions');
const data = new SlashCommandBuilder()
	.setName('timeout')
	.setDescription('Timeout a user')
	.addUserOption((option) =>
		option
			.setName('target')
			.setDescription('Member to timeout')
			.setRequired(true),
	)
	.addStringOption((option) =>
		option
			.setName('duration')
			.setDescription('Timeout duration (30m, 1h, 1 day)')
			.setRequired(true)
			.addChoices(
				{ name: '30m', value: '1800000' },
				{ name: '1h', value: '3600000' },
				{ name: '2h', value: '7200000' },
				{ name: '1 day', value: '86400000' },
			),
	)
	.addStringOption((option) =>
		option.setName('reason').setDescription('Reason for timeout user'),
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
	.setContexts(InteractionContextType.Guild);

module.exports = {
	data: data,
	/**
	 *
	 * @param {import('discord.js').Interaction} interaction
	 */
	async execute(interaction) {
		const target = interaction.options.getMember('target');
		const reason = interaction.options.getString('reason') ?? 'Reason not provided';
		const duration = interaction.options.getString('duration');

		console.log(duration);

		// Ignore if the target user is a bot
		if (target.user.bot) {
			await interaction.reply({
				content: `You can't timeout ${target.user.tag} because it's a bot`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		if (target.user.id === interaction.guild.ownerId) {
			await interaction.reply(
				'You can\'t timeout that user because they\'re the server owner.',
			);
			return;
		}
		// If the request user is the owner then no need to check hiearchy
		if (!interaction.member.user.id == interaction.guild.ownerId) {
			const targetUserRolePosition = target.guild.roles.highest.position;
			const requestUserRolePosition =
				interaction.member.roles.highest.position;
			const botRolePosition =
				interaction.guild.members.me.roles.highest.position;
			const result = doesHaveSufficientPermission(
				new PermissionRequest(
					targetUserRolePosition,
					requestUserRolePosition,
					botRolePosition,
				),
			);
			if (!result.allowed) {
				if (result.reason === REASONS.TARGET_HIGHER_OR_EQUAL_REQUEST) {
					await interaction.reply({
						content:
							'You can\'t kick that user because they have same/higher role than you',
						flags: MessageFlags.Ephemeral,
					});
					return;
				}
				if (result.reason == REASONS.TARGET_HIGHER_OR_EQUAL_BOT) {
					await interaction.reply({
						content:
							'I can\'t timeout that user because they have same/higher role as me.',
						flags: MessageFlags.Ephemeral,
					});
					return;
				}
			}
		}
		try {
			const text = target.isCommunicationDisabled()
				? `${target.user.tag} timeout has been updated to ${duration}, reason: ${reason}`
				: `${target.user.tag} was timed out for ${duration}, reason: ${reason}`;
			await target.timeout(Number.parseInt(duration), reason);
			await interaction.reply(text);
		} catch (error) {
			console.error(`There was an erorr when timing out: ${error}`);
		}
	},
};
