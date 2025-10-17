const { EmbedBuilder } = require('@discordjs/builders');
const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const pJson = require('../../../package.json');

function formatTime(ms) {
	const totalSeconds = Math.floor(ms / 1000);
  	const days = Math.floor(totalSeconds / 86400);
  	const hours = Math.floor((totalSeconds % 86400) / 3600);
  	const minutes = Math.floor((totalSeconds % 3600) / 60);
  	const seconds = totalSeconds % 60;

  	return [
    	days > 0 ? `${days}d` : null,
    	hours.toString().padStart(2, '0'),
    	minutes.toString().padStart(2, '0'),
    	seconds.toString().padStart(2, '0'),
  	]
    	.filter(Boolean)
    	.join(':');
}

module.exports = {
	data: new SlashCommandBuilder().setName('about').setDescription('Shows bot-version, server count, developer')
		.setContexts(InteractionContextType.Guild),
	/**
	 *
	 * @param {import('discord.js').Interaction} interaction
	 */
	async execute(interaction) {
		await interaction.deferReply();
		const serverCount = (await interaction.client.guilds.fetch()).size;
		const uptime = formatTime(interaction.client.uptime);
		const developerAccount = await interaction.client.users.fetch(process.env.DEV_ACCOUNT);
		const aboutEmbed = new EmbedBuilder()
			.setColor(0x9900ff)
			.setAuthor({
				name: interaction.client.user.tag,
				iconURL: interaction.client.user.displayAvatarURL(),
			})
			.setImage(developerAccount.displayAvatarURL())
			.setThumbnail(interaction.guild.iconURL())
			.addFields(
				{ name: 'Bot Version', value: pJson.version },
				{ name: 'Server count', value: `${serverCount}`, inline: true },
				{ name: 'Uptime', value: uptime, inline: true },
				{ name: 'Developed by', value: `${developerAccount.toString()}` },
			)
			.setTimestamp()
			.setFooter({ text: `ID: ${interaction.client.user.id}` });
		await interaction.editReply({ embeds: [aboutEmbed] });
	},
};