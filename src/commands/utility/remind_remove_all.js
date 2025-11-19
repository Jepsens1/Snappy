const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
} = require("discord.js");
const Remind = require("../../models/remind_schema");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("remindremove")
    .setDescription("Removes all reminders")
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
      await Remind.deleteMany({ userId: interaction.user.id });
      await interaction.reply({
        content: "All active reminders are now removed",
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Unexpected error during /remindremove", error);
      await interaction.reply({
        content: "Unexpected error during /remindremove",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
