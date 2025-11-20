const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const Welcome = require("../../models/welcome_schema");

/**
 * @param {import("discord.js").Interaction} interaction
 */
async function configureWelcome(interaction) {
  const msg = interaction.options.getString("message");
  let welcome = await Welcome.findOne({ guildId: interaction.guildId });

  if (welcome) {
    welcome.message = msg;
  } else {
    welcome = new Welcome({
      guildId: interaction.guildId,
      message: msg,
    });
  }
  await welcome.save();
  await interaction.editReply({
    content:
      "Welcome message has now been configured. To disable run `/welcome disable`",
    flags: MessageFlags.Ephemeral,
  });
}
/**
 * @param {import("discord.js").Interaction} interaction
 */
async function disableWelcome(interaction) {
  if (!(await Welcome.exists({ guildId: interaction.guildId }))) {
    await interaction.editReply({
      content:
        "Welcome message has not been configured for this guild. Use `/welcome configure` to set it up",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  await Welcome.findOneAndDelete({ guildId: interaction.guildId });
  await interaction.editReply({
    content:
      "Welcome message has now been disabled for this guild. Use `/welcome configure` to set it up again",
    flags: MessageFlags.Ephemeral,
  });
}
module.exports = {
  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Configure or disable welcome message to new guild members")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("configure")
        .setDescription("configure welcome message")
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("message to send to new guild members DM")
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(255),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("disable").setDescription("disable welcome message"),
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
        await configureWelcome(interaction);
      } else {
        await disableWelcome(interaction);
      }
    } catch (error) {
      console.error("Unexpected error during /welcome", error);
      await interaction.editReply({
        content: "Unexpected error during /welcome",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
