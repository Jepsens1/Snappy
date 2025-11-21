const {
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
  EmbedBuilder,
} = require("discord.js");

const Remind = require("../../models/remind_schema");
const chrono = require("chrono-node");

/**
 * @param {import("discord.js").Interaction} interaction
 */
async function createReminder(interaction) {
  const content = interaction.options.getString("content");
  const time = interaction.options.getString("time");

  const parseDate = chrono.parseDate(time, {
    timezone: interaction.locale,
  });
  if (!parseDate) {
    await interaction.editReply({
      content: "Please provide a valid date format, ie. 3pm tomorrow",
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
  await interaction.editReply({
    embeds: [embed],
  });
}

/**
 * @param {import("discord.js").Interaction} interaction
 */
async function listReminders(interaction) {
  const reminders = await Remind.find({ userId: interaction.user.id });
  if (reminders.length === 0) {
    await interaction.editReply({
      content: "You have no active reminders",
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
  await interaction.editReply({
    embeds: [embed],
  });
}

/**
 * @param {import("discord.js").Interaction} interaction
 */
async function removeReminders(interaction) {
  const reminders = await Remind.find({ userId: interaction.user.id });
  if (reminders.length === 0) {
    await interaction.editReply({
      content: "You have no active reminders",
    });
    return;
  }
  await Remind.deleteMany({ userId: interaction.user.id });
  await interaction.editReply({
    content: "All active reminders are now removed",
  });
}
module.exports = {
  data: new SlashCommandBuilder()
    .setName("remind")
    .setDescription("Create, list or remove reminders")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("create reminder")
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
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("list all active reminders"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("remove all active reminders"),
    )
    .setContexts(InteractionContextType.Guild),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      if (subcommand === "create") {
        await createReminder(interaction);
      } else if (subcommand === "list") {
        await listReminders(interaction);
      } else if (subcommand === "remove") {
        await removeReminders(interaction);
      }
    } catch (error) {
      console.error("Unexpected error during /remind", error);
      await interaction.editReply({
        content: "Unexpected error during /remind",
      });
    }
  },
};
