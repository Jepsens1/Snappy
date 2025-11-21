const {
  SlashCommandBuilder,
  InteractionContextType,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const pJson = require("../../../package.json");
const formatTime = require("../../utils/formatTime");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("about")
    .setDescription("Shows bot-version, server count, developer")
    .setContexts(InteractionContextType.Guild),
  /**
   *
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    try {
      const serverCount = (await interaction.client.guilds.fetch()).size;
      const uptime = formatTime(interaction.client.uptime);
      const developerAccount =
        await interaction.client.users.fetch("220901252777639936");
      const aboutEmbed = new EmbedBuilder()
        .setColor(0x9900ff)
        .setAuthor({
          name: interaction.client.user.tag,
          iconURL: interaction.client.user.displayAvatarURL(),
        })
        .setImage(developerAccount.displayAvatarURL())
        .setThumbnail(interaction.guild.iconURL())
        .addFields(
          { name: "Bot Version", value: pJson.version },
          { name: "Server count", value: `${serverCount}`, inline: true },
          { name: "Uptime", value: uptime, inline: true },
          { name: "Developed by", value: `${developerAccount.toString()}` },
        )
        .setTimestamp()
        .setFooter({ text: `ID: ${interaction.client.user.id}` });
      await interaction.reply({
        embeds: [aboutEmbed],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Unexpected error during /about", error);
      await interaction.reply({
        content: "Unexpected error during /about",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
