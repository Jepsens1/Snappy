const {
  SlashCommandBuilder,
  InteractionContextType,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roles")
    .setDescription("display roles for this guild")
    .setContexts(InteractionContextType.Guild),
  /**
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    try {
      const roles = await interaction.guild.roles.fetch();
      const roleNames = roles.map((role) => role.toString());
      const roleEmbed = new EmbedBuilder()
        .setTitle(`Roles [${roles.size}]`)
        .setColor("Blue")
        .addFields({
          name: "",
          value: `${roleNames}`,
        });
      await interaction.reply({
        embeds: [roleEmbed],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      await interaction.reply({
        content: "Unexpected error during /roles",
        flags: MessageFlags.Ephemeral,
      });
      console.error("Unexpected error during /roles", error);
    }
  },
};
