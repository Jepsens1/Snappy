const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
	/**
	 *
	 * @param {import('discord.js').Interaction} interaction
	 */
	async execute(interaction) {
		await interaction.deferReply();

		const reply = await interaction.fetchReply();

		const ping = await reply.createdTimestamp - interaction.createdTimestamp;

		interaction.editReply(`Pong! Client ${ping}ms | Websocket ${interaction.client.ws.ping}ms`);
	},
};