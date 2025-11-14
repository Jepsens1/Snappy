const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const {
  doesHaveSufficientPermission,
  REASONS,
  PermissionRequest,
} = require("../../utils/checkPermissions");

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
    // If the member making the interaction is the guild owner. Skips checking permission rights
    if (!interaction.member.user.id == interaction.guild.ownerId) {
      const targetUserRolePosition = member.guild.roles.highest.position;
      const requestUserRolePosition = interaction.member.roles.highest.position;
      const botRolePosition =
        interaction.guild.members.me.roles.highest.position;
      const result = doesHaveSufficientPermission(
        new PermissionRequest(
          targetUserRolePosition,
          requestUserRolePosition,
          botRolePosition,
        ),
      );
      if (!result.allowed) {
        if (result.reason === REASONS.TARGET_HIGHER_OR_EQUAL_REQUEST) {
          await interaction.reply({
            content:
              "You can't remove timout for that member because they have same/higher role than you",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        if (result.reason == REASONS.TARGET_HIGHER_OR_EQUAL_BOT) {
          await interaction.reply({
            content:
              "I can't remove timeout for that user because they have same/higher role as me.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
      }
    }
    try {
      await member.timeout(null, reason);
    } catch (error) {
      console.error("Unknown error during untimeout", error);
    }
  },
};
