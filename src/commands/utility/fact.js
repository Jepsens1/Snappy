const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const fetchTodaysFact = require("../../utils/fetch-todays-fact.js");
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
      await interaction.deferReply();
      const todaysFact = await fetchTodaysFact().catch(console.error);
      await interaction.editReply(`Today's fact is: ${todaysFact}`);
    } catch (error) {
      console.error("Unexpected error during /fact", error);
      await interaction.editReply({
        content:
          "Ehhhm an unexpected error happened during /fact. Please try again",
      });
    }
  },
};
