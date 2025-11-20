const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const Welcome = require("../../models/welcome_schema");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("welcome-disable")
    .setDescription("Disable welcome message to new guild members")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    try {
      await interaction.deferReply();

      if (!(await Welcome.exists({ guildId: interaction.guildId }))) {
        await interaction.editReply({
          content:
            "Welcome message has not been configured for this guild. Use `/welcome-configure` to set it up",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await Welcome.findOneAndDelete({ guildId: interaction.guildId });
      await interaction.editReply({
        content:
          "Welcome message has now been disabled for this guild. Use `/welcome-configure` to set it up again",
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Unexpected error during /welcome-disable", error);
      await interaction.editReply({
        content: "Unexpected error during /welcome-disable",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
