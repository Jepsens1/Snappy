const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("list all availiable commands"),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setTitle(`Server: ${interaction.guild.name}`)
        .setThumbnail(interaction.guild.client.user.displayAvatarURL());

      let commandStr = "";
      const foldersPath = path.join(__dirname, "../../commands");
      const commandFolders = fs.readdirSync(foldersPath);

      for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs
          .readdirSync(commandsPath)
          .filter((file) => file.endsWith(".js"));
        for (const file of commandFiles) {
          const filePath = path.join(commandsPath, file);
          const command = require(filePath);
          commandStr += `**/${command.data.name}** -- ${command.data.description}\n\n`;
        }
      }
      embed.setDescription(commandStr);
      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      await interaction.reply({
        content: "Unexpected error during /help",
        flags: MessageFlags.Ephemeral,
      });
      console.error("Unexpected error during /help", error);
    }
  },
};
