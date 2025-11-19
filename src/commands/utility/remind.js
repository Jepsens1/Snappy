const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
} = require("discord.js");

const Remind = require("../../models/remind_schema");
const chrono = require("chrono-node");
const { EmbedBuilder } = require("discord.js");
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
        return;
      }
      const remind = new Remind({
        userId: interaction.user.id,
        guildId: interaction.guildId,
        content: content,
        expiresAt: parseDate,
      });
      await remind.save();

      const embed = new EmbedBuilder()
        .setColor("Random")
        .setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .addFields({
          name: `Reminder ${content}`,
          value: `<t:${Math.floor(parseDate / 1000)}:F>`,
          inline: false,
        });
      await interaction.reply({
        embeds: [embed],
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
