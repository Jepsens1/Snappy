const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const SteamService = require("../../services/CS2/steam-service");
const createSteamEmbed = require("../../embeds/CS2/steamProfileEmbed");
const FaceitService = require("../../services/CS2/faceit-service");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("cs2")
    .setDescription("Get steam profile & cs2 stats or faceit stats")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("steamprofile")
        .setDescription("Get information about a steam profile and cs2 stats")
        .addStringOption((option) =>
          option
            .setName("steamid")
            .setDescription("64-bit steamID or custom ID")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("faceit")
        .setDescription("Get faceit stats for a player")
        .addStringOption((option) =>
          option
            .setName("nickname")
            .setDescription("Faceit nickname")
            .setRequired(true),
        ),
    )
    .setContexts(InteractionContextType.Guild),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    try {
      await interaction.deferReply();
      const subcommand = interaction.options.getSubcommand();
      if (subcommand === "steamprofile") {
        const steamId = interaction.options.getString("steamid");
        const steamService = new SteamService();
        const profile = await steamService.getSteamProfile(steamId);
        const embed = createSteamEmbed(profile);
        await interaction.editReply({ embeds: [embed] });
      } else if (subcommand === "faceit") {
        const nickname = interaction.options.getString("nickname");
        const faceitService = new FaceitService();
        const profile = await faceitService.getFaceitProfile(nickname);
        console.log(profile);
        await interaction.editReply(`Hello ${profile.nickname}`);
      }
    } catch (error) {
      await interaction.editReply(error.message);
      console.error("Unexpected error during /cs2", error);
    }
  },
};
