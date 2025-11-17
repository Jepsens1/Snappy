const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
} = require("discord.js");
const fetchTodaysFact = require("../../utils/fetch_todays_fact");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("fact")
    .setDescription("Get today's fact")
    .setContexts(InteractionContextType.Guild),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    try {
      const todaysFact = await fetchTodaysFact().catch(console.error);
      await interaction.reply(`Today's fact is: ${todaysFact}`);
    } catch (error) {
      console.error("Unexpected error during /fact", error);
      await interaction.reply({
        content:
          "Ehhhm an unexpected error happened during /fact. Please try again",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
