const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Displays the guild member avatar")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("member to display")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("size")
        .setDescription("avatar size")
        .addChoices(
          { name: "64px", value: 64 },
          { name: "128px", value: 128 },
          { name: "256px", value: 256 },
          { name: "512px", value: 512 },
          { name: "1024px", value: 1024 },
          { name: "2048px", value: 2048 },
          { name: "4096px", value: 4096 },
        ),
    )
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
  /**
   *
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    const member = interaction.options.getMember("member");
    const sizeInPixels = interaction.options.getInteger("size") || 1024;
    try {
      const avatarEmbed = new EmbedBuilder()
        .setColor("Random")
        .setAuthor({
          name: member.user.tag,
          iconURL: member.displayAvatarURL(),
        })
        .setImage(member.displayAvatarURL({ size: sizeInPixels }));
      await interaction.reply({ embeds: [avatarEmbed] });
    } catch (error) {
      console.error("Unexpected error during /avatar", error);
      await interaction.reply({
        content: "Unexpected error during /avatar",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
