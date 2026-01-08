const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const fetchTodaysFact = require("../../utils/fetch-todays-fact.js");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("fact")
    .setDescription("Get today's fact")
    .setContexts(InteractionContextType.Guild)
    .addBooleanOption((option) =>
      option
        .setName("ephemeral")
        .setDescription("Hide message response (only visible to you)")
        .setRequired(false),
    ),
  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    try {
      const ephemeral = interaction.options.getBoolean("ephemeral") ?? false;
      await interaction.deferReply({ ephemeral: ephemeral });
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
