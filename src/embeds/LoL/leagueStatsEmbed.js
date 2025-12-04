const { Client } = require("discord.js");
const { createBaseEmbed, getChampionEmoji } = require("./leagueBaseEmbed");

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

/**
 * Creates Discord embed with LoL stats for a Summoner.
 * Shows:
 * - Profile
 * - Summoner Level
 * - Region
 * - Ranked stats for Solo/Duo & Flex
 *
 * @param {Summoner} player
 * @param {Client} client
 * @returns {Promise<EmbedBuilder>}
 */
async function createStatsEmbed(player, client) {
  const embed = createBaseEmbed(player);
  embed.addFields({
    name: "Level/Region",
    value: `${player.summonerLevel} / ${REGIONS.get(player.region)}`,
    inline: true,
  });
  if (!player.rankedStats || player.rankedStats.length === 0) {
    embed.addFields({
      name: "Ranked",
      value: "No Ranked played",
      inline: false,
    });
  } else {
    const stats = formatRank(player.rankedStats);
    stats.forEach((stat) => {
      embed.addFields({
        name: `${stat.queueType}`,
        value:
          `**${stat.rankText}** ${stat.LP} LP\n` +
          `Wins: ${stat.wins} | Losses: ${stat.losses} | Winrate: ${stat.winrate}%\n` +
          `${stat.hotStreak ? "🔥 Currently in a Hot Streak" : ""}`,
        inline: false,
      });
    });
  }
  const topChamps = await formatTopChamp(client, player.topChampions);
  embed.addFields({
    name: "**Top Champions**",
    value: topChamps,
  });
  return embed;
}

async function formatTopChamp(client, topChampions) {
  const topChamps = await Promise.all(
    topChampions.map(async (champ) => ({
      championPoints: champ.championPoints,
      emoji: await getChampionEmoji(client, null, champ.championId),
    })),
  );
  return topChamps.length > 0
    ? topChamps
        .map(
          (champ, i) =>
            `**${i + 1}.** ${champ.emoji} – ${champ.championPoints.toLocaleString()} pts`,
        )
        .join("\n")
    : "No Mastery Data";
}
function formatRank(rankedStats) {
  return rankedStats
    .sort((a, b) => (a.queueType === "RANKED_SOLO_5x5" ? -1 : 1))
    .map((stat) => ({
      queueType: stat.queueType === "RANKED_SOLO_5x5" ? "Solo/Duo" : "Flex 5v5",
      rankText:
        stat.tier === "UNRANKED"
          ? "Unranked"
          : `${formatTier(stat.tier)} ${stat.rank}`,
      LP: stat.leaguePoints,
      wins: stat.wins,
      losses: stat.losses,
      winrate: stat.winrate,
      hotStreak: stat.hotStreak,
    }));
}
function formatTier(tier) {
  if (!tier || tier === "UNRANKED") return "Unranked";
  if (["MASTER", "GRANDMASTER", "CHALLENGER"].includes(tier)) return tier;

  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

module.exports = createStatsEmbed;
