const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Flip a coin, heads or tails")
    .setContexts(InteractionContextType.Guild),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    try {
      const coin = Math.floor(Math.random() * 2);
      if (coin === 0) {
        await interaction.reply(`${interaction.user.toString()} heads`);
      } else {
        await interaction.reply(`${interaction.user.toString()} tails`);
      }
    } catch (error) {
      console.error("Unexpected error during /coinflip", error);
      await interaction.reply({
        content: "Unexpected error happened during coinflip",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
