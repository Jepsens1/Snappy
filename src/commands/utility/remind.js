const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
} = require("discord.js");

const Remind = require("../../models/remind_schema");
const chrono = require("chrono-node");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("remind")
    .setDescription("Set reminder for one-time use or recurring")
    .addStringOption((option) =>
      option
        .setName("content")
        .setDescription("Reminder text")
        .setMinLength(1)
        .setMaxLength(20)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription("when reminder should be sent out")
        .setMinLength(1)
        .setMaxLength(25)
        .setRequired(true),
    )
    .setContexts(InteractionContextType.Guild),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    const content = interaction.options.getString("content");
    const time = interaction.options.getString("time");

    try {
      const parseDate = chrono.parseDate(time, {
        timezone: interaction.locale,
      });
      if (!parseDate) {
        await interaction.reply({
          content: "Please provide a valid date format, ie. 3pm tomorrow",
          flags: MessageFlags.Ephemeral,
        });
      }
      const remind = new Remind({
        userId: interaction.user.id,
        guildId: interaction.guildId,
        content: content,
        expiresAt: parseDate,
      });
      await remind.save();
      await interaction.reply({
        content: `I'll remind you on ${parseDate}, ${content}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Unexpected error during /remind", error);
      await interaction.reply({
        content: "Unexpected error during /remind",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
