const { EmbedBuilder } = require('@discordjs/builders');
const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('invite').setDescription('create a invite link to this channel')
		.addChannelOption((option) => option.setName('channel').setDescription('channel to create invite to').setRequired(true))
		.addStringOption((option) => option.setName('expire').setDescription('when invite should expire')
			.addChoices(
				{ name: '30m', value: '1800' },
				{ name: '1h', value: '3600' },
				{ name: '6h', value: '21600' },
				{ name: '12h', value: '43200' },
				{ name: '1 day', value: '86400' },
				{ name: '7 days', value: '604800' },
				{ name: 'Never', value: '0' },
			).setRequired(true))
		.addStringOption((option) => option.setName('maxuser').setDescription('max invites allowed')
			.addChoices(
				{ name: 'No limit', value: '0' },
				{ name: 'Max 1', value: '1' },
				{ name: 'Max 5', value: '5' },
				{ name: 'Max 10', value: '10' },
				{ name: 'Max 25', value: '25' },
				{ name: 'Max 50', value: '50' },
				{ name: 'Max 100', value: '100' },
			).setRequired(true))
		.addBooleanOption((option) => option.setName('temp').setDescription('Should this invite be temporary')
			.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.CreateInstantInvite)
		.setContexts(InteractionContextType.Guild),
	/**
	 *
	 * @param {import("discord.js").Interaction} interaction
	 */
	async execute(interaction) {
		await interaction.deferReply();
		const channel = interaction.options.getChannel('channel');
		const expire = interaction.options.getString('expire');
		const maxInvites = Number.parseInt(interaction.options.getString('maxuser'));
		const isTemp = interaction.options.getBoolean('temp');
		try {
			const expireSeconds = Number(expire);
			const invite = await interaction.guild.invites.create(channel, { maxAge: expireSeconds, maxUses: maxInvites, temporary: isTemp });

			let expireText;
			if (expireSeconds === 0) {
				expireText = 'Never';
			} else {
				const expireTimestamp = Math.floor(Date.now() / 1000) + expireSeconds;
				// Discord timestamp format – Shows time "in X hours"
				expireText = `<t:${expireTimestamp}:R>`;
			}
			const inviteEmbed = new EmbedBuilder()
				.setColor(0x1099ff)
				.setAuthor(
					{ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() },
				)
				.setThumbnail(interaction.guild.iconURL())
				.addFields(
					{ name: 'Recap', value: `Created a invite for ${channel.toString()}
						Expires: ${expireText}\nMax invites: ${maxInvites === 0 ? 'No Limit' : maxInvites}\nTemporary invite: ${isTemp ? 'Yes' : 'No'}` },
					{ name: 'Invite Link', value: invite.toString() },
				)
				.setTimestamp();
			await interaction.editReply({ embeds: [inviteEmbed] });
		} catch (error) {
			await interaction.editReply('Failed to create a invite link for this guild.');
			console.error(error);
		}
	},
};