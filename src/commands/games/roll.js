const { SlashCommandBuilder, InteractionContextType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roll")
    .setDescription("roles a dice with a given sides and count")
    .addIntegerOption((option) =>
      option
        .setName("sides")
        .setDescription("Size of the dice")
        .setRequired(true)
        .addChoices(
          { name: "d4", value: 4 },
          { name: "d6", value: 6 },
          { name: "d8", value: 8 },
          { name: "d10", value: 10 },
          { name: "d12", value: 12 },
          { name: "d20", value: 20 },
          { name: "d100", value: 100 },
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("number of times to roll a dice")
        .setRequired(false)
        .setMaxValue(10)
        .setMinValue(1),
    )
    .setContexts(InteractionContextType.Guild),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    const sides = interaction.options.getInteger("sides");
    const count = interaction.options.getInteger("count") ?? 1;

    try {
      if (count === 1) {
        const rolled = Math.floor(Math.random() * sides) + 1;
        await interaction.reply(
          `${interaction.member.toString()} You rolled ${rolled}`,
        );
      } else {
        const result = [];
        for (let i = 0; i < count; i++) {
          const rolled = Math.floor(Math.random() * sides) + 1;
          result.push(rolled);
        }
        await interaction.reply(
          `${interaction.member.toString()} You rolled ${result.join(", ")}`,
        );
      }
    } catch (error) {
      console.error("Unexpected error happened during /roll", error);
    }
  },
};
