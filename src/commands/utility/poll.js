const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
  PollLayoutType,
} = require("discord.js");

/**
 * @param {import("discord.js").Interaction} interaction
 */
function getChoices(interaction) {
  const NUMBER_WORDS = new Map([
    [1, "1️⃣"],
    [2, "2️⃣"],
    [3, "3️⃣"],
    [4, "4️⃣"],
    [5, "5️⃣"],
    [6, "6️⃣"],
    [7, "7️⃣"],
    [8, "8️⃣"],
    [9, "9️⃣"],
    [10, "🔟"],
  ]);
  const choices = [];

  const choice1 = interaction.options.getString("choice1");
  const choice2 = interaction.options.getString("choice2");

  choices.push({ text: choice1, emoji: NUMBER_WORDS.get(1) });
  choices.push({ text: choice2, emoji: NUMBER_WORDS.get(2) });

  for (let index = 3; index <= 10; index++) {
    const element = interaction.options.getString(`choice${index}`, false);
    if (element) {
      const emoji = NUMBER_WORDS.get(index);
      choices.push({ text: element, emoji: emoji });
    }
  }
  return choices;
}
module.exports = {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create or show poll")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a poll")
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("Poll message")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("choice1")
            .setDescription("first choice")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("choice2")
            .setDescription("second choice")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("duration")
            .setDescription("duration for poll")
            .addChoices(
              { name: "1 hour", value: 1 },
              { name: "2 hours", value: 2 },
              { name: "3 hours", value: 3 },
              { name: "6 hours", value: 6 },
              { name: "12 hours", value: 12 },
              { name: "1 day", value: 24 },
              { name: "2 days", value: 48 },
              { name: "3 days", value: 72 },
              { name: "1 week", value: 168 },
            ),
        )
        .addBooleanOption((option) =>
          option.setName("multiselect").setDescription("Allow multiselect"),
        )
        .addStringOption((option) =>
          option.setName("choice3").setDescription("third choice"),
        )
        .addStringOption((option) =>
          option.setName("choice4").setDescription("fourth choice"),
        )
        .addStringOption((option) =>
          option.setName("choice5").setDescription("fifth choice"),
        )
        .addStringOption((option) =>
          option.setName("choice6").setDescription("sixth choice"),
        )
        .addStringOption((option) =>
          option.setName("choice7").setDescription("seventh choice"),
        )
        .addStringOption((option) =>
          option.setName("choice8").setDescription("eighth choice"),
        )
        .addStringOption((option) =>
          option.setName("choice9").setDescription("ninth choice"),
        )
        .addStringOption((option) =>
          option.setName("choice10").setDescription("tenth choice"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("end")
        .setDescription("Ends a poll")
        .addStringOption((option) =>
          option
            .setName("messageid")
            .setDescription("Message id")
            .setRequired(true),
        ),
    )
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === "create") {
        const msg = interaction.options.getString("message");
        const choices = getChoices(interaction);
        const multiSelect =
          interaction.options.getBoolean("multiselect") ?? false;
        const duration = interaction.options.getInteger("duration");
        await interaction.channel.send({
          poll: {
            question: { text: msg },
            answers: choices,
            duration: duration,
            layoutType: PollLayoutType.Default,
            allowMultiselect: multiSelect,
          },
        });
        await interaction.reply({
          content: "Poll created :white_check_mark:",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        const msgId = interaction.options.getString("messageid");
        const targetMessage = await interaction.channel.messages.fetch(msgId);

        if (!targetMessage.poll) {
          await interaction.reply({
            content: "The provides messageId is not a poll",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        await targetMessage.poll.end();
        await interaction.reply({
          content: "Poll ended :x:",
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      console.error("Unexpected error during /poll", error);
      await interaction.reply({
        content: "Unexpected error during /poll",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
