const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const AutoRole = require("../../models/autorole");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("autorole-disable")
    .setDescription("Disable autoole assign new guild members")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    try {
      await interaction.deferReply();

      if (!(await AutoRole.exists({ guildId: interaction.guildId }))) {
        await interaction.editReply({
          content:
            "Autorole has not been configured for this guild. Use `/autorole-configure` to set it up",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await AutoRole.findOneAndDelete({ guildId: interaction.guildId });
      await interaction.editReply({
        content:
          "Autorole has now been disabled for this guild. Use `/autorole-configure` to set it up again",
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Unexpected error during /autorole-disable", error);
      await interaction.editReply({
        content: "Unexpected error during /autorole-disable",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
