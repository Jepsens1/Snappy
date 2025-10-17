const { EmbedBuilder } = require('@discordjs/builders');
const formatTime = require('../../utils/formatTime');
const { SlashCommandBuilder, InteractionContextType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('uptime').setDescription('Display in date format how long bot has been running')
		.setContexts(InteractionContextType.Guild),
	/**
	 *
	 * @param {import("discord.js").Interaction} interaction
	 */
	async execute(interaction) {
		await interaction.deferReply();
		const uptime = formatTime(interaction.client.uptime);

		const uptimeEmbed = new EmbedBuilder()
			.setColor(0x9900ff)
			.setAuthor({
				name: interaction.client.user.tag,
				iconURL: interaction.client.user.displayAvatarURL(),
			})
			.setThumbnail(interaction.guild.iconURL())
			.addFields(
				{ name: 'Uptime', value: uptime },
			);
		await interaction.editReply({ embeds: [uptimeEmbed] });
	},
};