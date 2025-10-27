const { SlashCommandBuilder, InteractionContextType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('avatar').setDescription('Displays the guild member avatar')
		.addUserOption((option) => option.setName('member').setDescription('member to display').setRequired(true))
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
	/**
	 *
	 * @param {import('discord.js').Interaction} interaction
	 */
	async execute(interaction) {
		await interaction.deferReply();
		const member = interaction.options.getMember('member');
		try {
			const avatarEmbed = new EmbedBuilder()
				.setColor('Random')
				.setAuthor(
					{ name: member.user.tag, iconURL: member.displayAvatarURL() },
				).setImage(member.displayAvatarURL());
			await interaction.editReply({ embeds: [avatarEmbed] });
		} catch (error) {
			await interaction.editReply('Failed to display member\'s avatar url');
			console.error('Failed to display member\'s avatar url', error);
		}
	},
};