const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const { handlePermissionRights } = require("../../utils/check-permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Unmutes a guild member if they are currently timed out")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("member to unmute")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("reason for removing timeout")
        .setRequired(true),
    )
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    const member = interaction.options.getMember("member");
    const reason =
      interaction.options.getString("reason") ?? "No Reason Provided";
    // First checks if the member is currently timed out or not
    if (!member.isCommunicationDisabled()) {
      await interaction.reply({
        content: "Member is not currently timed out",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    // Check if interaction member has sufficient permission to execute this command
    const hasSufficientRights = await handlePermissionRights(
      interaction,
      member,
      "untimeout",
    );
    if (!hasSufficientRights) return;
    try {
      await member.timeout(null, reason);
      await interaction.reply(
        `${member.toString()} you timeout has now been removed: ${reason}`,
      );
    } catch (error) {
      await interaction.reply({
        content: "Unexpected error during /untimeout",
        flags: MessageFlags.Ephemeral,
      });
      console.error("Unexpected error during /untimeout", error);
    }
  },
};
