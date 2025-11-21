const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .addStringOption((option) =>
      option
        .setName("member")
        .setDescription("member to unban")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("reason for unbanning")
        .setRequired(false),
    )
    .setDescription("unbans a member from this guild")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    const userId = interaction.options.getString("member");
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";

    try {
      const result = await interaction.guild.members
        .unban(userId, reason)
        .catch(console.error);
      if (!result) {
        await interaction.reply({
          content:
            "Ehhhhm. this is a bit of a weird situation, because that provided user has not been banned on here. So i cannot unban a user that is not banned",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply(
          `Yaaaayyy. ${result.username} has been unbanned: ${reason}`,
        );
      }
    } catch (error) {
      await interaction.reply({
        content: "Unexpected error during /unban",
        flags: MessageFlags.Ephemeral,
      });
      console.log("Unexpected error during /unban", error);
    }
  },
};
