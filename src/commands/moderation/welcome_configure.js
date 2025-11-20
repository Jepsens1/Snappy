const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const Welcome = require("../../models/welcome_schema");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("welcome-configure")
    .setDescription("Configures a welcome message to new guild members")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("message to send to new guild members DM")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(255),
    )
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    const msg = interaction.options.getString("message");
    try {
      await interaction.deferReply();

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
          "Welcome message has now been configured. To disable run `/welcome-disable`",
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Unexpected error during /welcome-configure", error);
      await interaction.editReply({
        content: "Unexpected error during /welcome-configure",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
