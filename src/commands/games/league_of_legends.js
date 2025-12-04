const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const { Client } = require("discord.js");
const LeagueService = require("../../services/league-service");
const createStatsEmbed = require("../../embeds/LoL/leagueStatsEmbed");
const createMatchHistoryEmbed = require("../../embeds/LoL/leagueMatchHistoryEmbed");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("lol")
    .setDescription("Get build stats, best counters, stats and rank")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stats")
        .setDescription(
          "Get relevant stats for a summoner such as rank, rank, winrate etc.",
        )
        .addStringOption((option) =>
          option
            .setName("summoner")
            .setDescription("player to search for name#000")
            .setMaxLength(50)
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("tagline")
            .setDescription("player tagline")
            .setRequired(true)
            .setMaxLength(5),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("history")
        .setDescription("Get match history for a summoner")
        .addStringOption((option) =>
          option
            .setName("summoner")
            .setDescription("player to search for name#000")
            .setMaxLength(50)
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("tagline")
            .setDescription("player tagline")
            .setRequired(true)
            .setMaxLength(5),
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
      if (subcommand === "stats") {
        const summoner = interaction.options.getString("summoner");
        const tagLine = interaction.options.getString("tagline");
        const leagueService = new LeagueService();
        const player = await leagueService.getSummonerFullStats(
          summoner,
          tagLine,
        );
        const embed = await createStatsEmbed(player, interaction.client);
        await interaction.editReply({ embeds: [embed] });
      } else if (subcommand === "history") {
        const summoner = interaction.options.getString("summoner");
        const tagLine = interaction.options.getString("tagline");
        const leagueService = new LeagueService();
        const player = await leagueService.getSummonerFullStats(
          summoner,
          tagLine,
        );
        const embed = await createMatchHistoryEmbed(player, interaction.client);
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      await interaction.editReply(error.message);
      console.error("Unexpected error during /lol", error);
    }
  },
};
