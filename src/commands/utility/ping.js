const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  /**
   *
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    await interaction.reply("🏓 Pong!");
  },
};
