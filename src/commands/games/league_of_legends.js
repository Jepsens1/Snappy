const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const {
  getChampionBuild,
  getChampionCounters,
  getSummonerStats,
  getSummonerMatchHistory,
} = require("../../utils/fetch_league_information");
const { EmbedBuilder } = require("discord.js");
const LeagueOfLegends = require("../../models/league_of_legends_schema");
const { Client } = require("discord.js");
function formatTier(tier) {
  if (!tier || tier === "UNRANKED") return "Unranked";
  if (["MASTER", "GRANDMASTER", "CHALLENGER"].includes(tier)) return tier;

  return tier.charAt(0) + tier.slice(1).toLowerCase();
}
async function formatQueueIdToGame(match) {
  const doc = await LeagueOfLegends.findOne(
    { "queues.queueId": match.queueId },
    { "queues.$": 1 },
  ).lean();

  if (!doc || !doc.queues || doc.queues.length === 0) {
    return "Unknown Gamemode";
  }

  return doc.queues[0].description || "Custom Game";
}

async function convertChampionIdToName(id) {
  const doc = await LeagueOfLegends.findOne(
    { "champions.key": id },
    { "champions.$": 1 },
  ).lean();
  if (!doc || !doc.champions || doc.champions.length === 0) {
    return "Unknown Champion";
  }

  return doc.champions[0].id || "Unknown Champion";
}
/**
 * @param {Client} client
 */
async function getChampionEmojiByName(client, champName) {
  const emojisCollection = await client.application.emojis.fetch();
  for (const emoji of emojisCollection.values()) {
    if (emoji.name === `lol_${champName}`) return emoji;
  }
}
/**
 * Creates Discord embed with Summoner match history
 * Shows:
 * - Profile
 * - Match history
 * @param {Summoner} player
 * @returns {EmbedBuilder}
 */
async function createHistoryEmbed(player, interaction) {
  const wins = player.matchHistory?.filter(
    (match) => match.win === true,
  ).length;
  const losses = player.matchHistory?.filter(
    (match) => match.win === false,
  ).length;
  const total = wins + losses;
  const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const embed = new EmbedBuilder()
    .setTitle(`${player.gameName}#${player.tagLine}`)
    .setThumbnail(
      `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${player.profileIconId}.jpg`,
    )
    .setDescription(
      `**Data fetched: <t:${Math.floor(player.updatedAt / 1000)}:R>**`,
    )
    .addFields({
      name: "Last Games",
      value: `${total}G ${wins}W ${losses}L / ${winrate}% WR`,
      inline: true,
    })
    .setColor("#00AE86");

  if (!player.matchHistory || player.matchHistory.length === 0) {
    embed.addFields({ name: "Match History", value: "No Data", inline: false });
  } else {
    const matchStats = await Promise.all(
      player.matchHistory.map(async (match, index) => {
        const gameType = await formatQueueIdToGame(match);
        const emoji = await getChampionEmojiByName(
          interaction.client,
          match.championName,
        );
        return `**${index + 1}.** ${emoji} - **${match.kills}/${match.deaths}/${match.assists}** - ${match.win ? "✅" : "❌"} ${match.teamEarlySurrendered ? "❌ Early surrender" : ""} - ${gameType}`;
      }),
    );
    embed.addFields({
      name: "**Match History**",
      value: matchStats.join("\n\n"),
    });
  }
  return embed;
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
async function createStatsEmbed(player, interaction) {
  const wins = player.matchHistory?.filter(
    (match) => match.win === true,
  ).length;
  const losses = player.matchHistory?.filter(
    (match) => match.win === false,
  ).length;
  const total = wins + losses;
  const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;
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
        name: "Level/Region",
        value: `${player.summonerLevel} / ${REGIONS.get(player.region)}`,
        inline: true,
      },
      {
        name: "Last Games",
        value: `${total}G ${wins}W ${losses}L / ${winrate}% WR`,
        inline: true,
      },
    )
    .setColor("#00AE86");
  if (!player.rankedStats || player.rankedStats.length === 0) {
    embed.addFields({
      name: "Ranked",
      value: "No Ranked played",
      inline: false,
    });
  } else {
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
  }
  const topChamps = await Promise.all(
    player.topChampions.map(async (champ, index) => {
      const champName = await convertChampionIdToName(champ.championId);
      const emoji = await getChampionEmojiByName(interaction.client, champName);
      return `**${index + 1}.** ${emoji} - ${champ.championPoints.toLocaleString("en-US")} points`;
    }),
  );

  embed.addFields({
    name: "**Top Champions**",
    value: topChamps.join("\n") || "No data",
  });
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
        const embed = await createStatsEmbed(player, interaction);
        await interaction.editReply({ embeds: [embed] });
      } else if (subcommand === "history") {
        const summoner = interaction.options.getString("summoner");
        const tagLine = interaction.options.getString("tagline");
        const player = await getSummonerMatchHistory(summoner, tagLine);
        const embed = await createHistoryEmbed(player, interaction);
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      await interaction.editReply("Unexpected error during /lol");
      console.error("Unexpected error during /lol", error);
    }
  },
};
