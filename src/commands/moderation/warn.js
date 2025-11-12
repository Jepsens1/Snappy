const {
	SlashCommandBuilder,
	InteractionContextType,
	PermissionFlagsBits,
} = require('discord.js');

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
				.setRequired(false),
		),

	/**
	 * @param {import("discord.js").Interaction} interaction
	 */
	async execute(interaction) {
		await interaction.reply('hello');
	},
};
