const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const AutoRole = require("../../models/autorole");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("autorole-configure")
    .setDescription("Configures a role to assign new guild members")
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("Role to assign new members")
        .setRequired(true),
    )
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    const role = await interaction.options.getRole("role");

    try {
      await interaction.deferReply();

      let autoRole = await AutoRole.findOne({ guildId: interaction.guildId });

      if (autoRole) {
        if (autoRole.roleId === role.id) {
          await interaction.editReply({
            content:
              "Auto role has already been configured for that role. To disable run `/autorole-disable`",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        autoRole.roleId = role.id;
      } else {
        autoRole = new AutoRole({
          guildId: interaction.guildId,
          roleId: role.id,
        });
      }
      await autoRole.save();
      await interaction.editReply({
        content:
          "Autorole has now been configured. To disable run `/autorole-disable`",
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Unexpected error during /autorole-configure", error);
      await interaction.editReply({
        content: "Unexpected error during /autorole-configure",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
