const {
  SlashCommandBuilder,
  InteractionContextType,
  EmbedBuilder,
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
    await interaction.deferReply();

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
      await interaction.editReply({ embeds: [roleEmbed] });
    } catch (error) {
      await interaction.editReply("Unknown error occured during /roles");
      console.error("Error happened", error);
    }
  },
};
