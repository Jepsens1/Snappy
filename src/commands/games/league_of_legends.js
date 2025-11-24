const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const {
  getChampionBuild,
  getChampionCounters,
  getSummonerStats,
} = require("../../utils/fetch_league_information");
const { EmbedBuilder } = require("discord.js");

function formatTier(tier) {
  if (!tier || tier === "UNRANKED") return "Unranked";
  if (["MASTER", "GRANDMASTER", "CHALLENGER"].includes(tier)) return tier;

  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

/**
 * Creates Discord embed with LoL stats for a Summoner.
 * Shows:
 * - Profile
 * - Summoner Level
 * - Region
 * - Ranked stats for Solo/Duo & Flex
 *
 * * @param {Summoner} player
 * @returns {EmbedBuilder}
 */
function createStatsEmbed(player) {
  const embed = new EmbedBuilder()
    .setTitle(`${player.gameName}#${player.tagLine}`)
    .setThumbnail(
      `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${player.profileIconId}.jpg`,
    )
    .setDescription(
      `Available information from Riot Games, Updates every **15 minutes**\nData fetched: <t:${Math.floor(player.updatedAt / 1000)}:R>`,
    )
    .addFields(
      {
        name: "Summoner Level",
        value: `${player.summonerLevel}`,
        inline: true,
      },
      {
        name: "Region",
        value: `${REGIONS.get(player.region)}`,
        inline: true,
      },
    )
    .setColor("#00AE86");

  player.rankedStats
    .sort((a, b) => (a.queueType === "RANKED_SOLO_5x5" ? -1 : 1))
    .forEach((stat) => {
      const queueName =
        stat.queueType === "RANKED_SOLO_5x5" ? "Solo/Duo" : "Flex 5v5";
      const rankText =
        stat.tier === "UNRANKED"
          ? "Unranked"
          : `${formatTier(stat.tier)} ${stat.rank}`;
      embed.addFields({
        name: `${queueName}`,
        value:
          `**${rankText}** ${stat.leaguePoints} LP\n` +
          `Wins: ${stat.wins} | Losses: ${stat.losses} | Winrate: ${stat.winrate}%\n` +
          `${stat.hotStreak ? "🔥 Currently in a Hot Streak" : ""}`,
        inline: false,
      });
    });
  if (!player.rankedStats || player.rankedStats.length === 0) {
    embed.addFields({
      name: "Ranked",
      value: "No Ranked played",
      inline: false,
    });
  }
  return embed;
}
const REGIONS = new Map([
  ["euw1", "Europe West"],
  ["eun1", "Europe Nordic & East"],
  ["na1", "North America"],
  ["kr", "Korea"],
  ["br1", "Brazil"],
  ["la1", "Latin America North"],
  ["la2", "Latin America South"],
  ["oc1", "Oceania"],
  ["ru", "Russia"],
  ["tr1", "Turkey"],
  ["jp1", "Japan"],
  ["sg2", "Southeast Asia"],
  ["ph2", "Philippines"],
  ["tw2", "Taiwan"],
  ["vn2", "Vietnam"],
  ["th2", "Thailand"],
]);
module.exports = {
  data: new SlashCommandBuilder()
    .setName("lol")
    .setDescription("Get build stats, best counters, stats and rank")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("build")
        .setDescription("Get best build for a champion")
        .addStringOption((option) =>
          option
            .setName("champion")
            .setDescription("LoL champion")
            .setMaxLength(25)
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("role")
            .setDescription("Role you are playing")
            .setRequired(true)
            .addChoices(
              { name: "Top", value: "top" },
              { name: "Jungle", value: "jungle" },
              { name: "Midlane", value: "midlane" },
              { name: "Adc", value: "adc" },
              { name: "Support", value: "support" },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("counters")
        .setDescription("best counters for champion")
        .addStringOption((option) =>
          option
            .setName("champion")
            .setDescription("LoL champion")
            .setRequired(true)
            .setMaxLength(25),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stats")
        .setDescription(
          "Get relevant stats for a summoner such as rank,rank, winrate etc.",
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
    .addSubcommand((subcommand) =>
      subcommand
        .setName("all")
        .setDescription(
          "Display all information for a summoner includes match-history and rank",
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
    .setContexts(InteractionContextType.Guild),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    try {
      await interaction.deferReply();
      const subcommand = interaction.options.getSubcommand();
      if (subcommand === "build") {
        // const champion = interaction.options.getString("champion");
        // const role = interaction.options.getString("role");
        // const build = await getChampionBuild(champion, role);
        await interaction.editReply("`/lol build` is under development");
      } else if (subcommand === "counters") {
        // const champion = interaction.options.getString("champion");
        // const counters = await getChampionCounters(champion);
        await interaction.editReply("`/lol counters` is under development");
      } else if (subcommand === "stats") {
        const summoner = interaction.options.getString("summoner");
        const tagLine = interaction.options.getString("tagline");
        const player = await getSummonerStats(summoner, tagLine);
        const embed = createStatsEmbed(player);
        await interaction.editReply({ embeds: [embed] });
      } else if (subcommand === "all") {
        //const summoner = interaction.options.getString("summoner");
        //const tagLine = interaction.options.getString("tagline");
        await interaction.editReply("`/lol all` is under development");
      } else if (subcommand === "history") {
        //const summoner = interaction.options.getString("summoner");
        //const tagLine = interaction.options.getString("tagline");
        await interaction.editReply("`/lol history` is under development");
      }
    } catch (error) {
      await interaction.editReply("Unexpected error during /lol");
      console.error("Unexpected error during /lol", error);
    }
  },
};
