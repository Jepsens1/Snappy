const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");

const Remind = require("../../models/remind_schema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remindlist")
    .setDescription("List of active reminders")
    .setContexts(InteractionContextType.Guild),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    try {
      const reminders = await Remind.find({ userId: interaction.user.id });
      if (reminders.length === 0) {
        await interaction.reply({
          content: "You have no active reminders",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle("Active Reminders")
        .setColor("Random")
        .setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      const maxFields = 25;
      const remindersToShow = reminders.slice(0, maxFields);

      remindersToShow.forEach((r, idx) => {
        const time = `<t:${Math.floor(r.expiresAt / 1000)}:F>`;
        embed.addFields({
          name: `#${idx + 1}. ${time}`,
          value: r.content,
          inline: false,
        });
      });

      if (reminders.length > maxFields) {
        embed.setFooter({
          text: `... and ${reminders.length - maxFields} more (max 25 can be shown)`,
        });
      }
      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Unexpected error during /remind list", error);
      await interaction.reply({
        content: "Unexpected error during /remind list",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
