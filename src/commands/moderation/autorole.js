const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const AutoRole = require("../../models/autorole-schema");
/**
 * @param {import("discord.js").Interaction} interaction
 */
async function configureAutoRole(interaction) {
  const role = await interaction.options.getRole("role");
  let autoRole = await AutoRole.findOne({ guildId: interaction.guildId });

  if (autoRole) {
    if (autoRole.roleId === role.id) {
      await interaction.editReply({
        content:
          "Auto role has already been configured for that role. To disable run `/autorole disable`",
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
      "Autorole has now been configured. To disable run `/autorole disable`",
  });
}

/**
 * @param {import("discord.js").Interaction} interaction
 */
async function disableAutoRole(interaction) {
  if (!(await AutoRole.exists({ guildId: interaction.guildId }))) {
    await interaction.editReply({
      content:
        "Autorole has not been configured for this guild. Use `/autorole configure` to set it up",
    });
    return;
  }
  await AutoRole.findOneAndDelete({ guildId: interaction.guildId });
  await interaction.editReply({
    content:
      "Autorole has now been disabled for this guild. Use `/autorole configure` to set it up again",
  });
}
module.exports = {
  data: new SlashCommandBuilder()
    .setName("autorole")
    .setDescription("Configure or disable autorole when new guild members join")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("configure")
        .setDescription("configure a role to assign new guild members")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Role to assign new members")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("disable").setDescription("disable autorole"),
    )
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      if (subcommand === "configure") {
        await configureAutoRole(interaction);
      } else {
        await disableAutoRole(interaction);
      }
    } catch (error) {
      console.error("Unexpected error during /autorole", error);
      await interaction.editReply({
        content: "Unexpected error during /autorole",
      });
    }
  },
};
