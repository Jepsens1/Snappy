const {
  createBaseEmbed,
  getChampionEmoji,
  getQueueType,
} = require("../LoL/league-base-embed");

/**
 * Creates Discord embed with Summoner match history
 * Shows:
 * - Profile
 * - Match history
 * @param {Summoner} player
 * @param {Client} client
 * @returns {EmbedBuilder}
 */
async function createMatchHistoryEmbed(player, client) {
  const embed = await createBaseEmbed(player);

  if (!player.matchHistory || player.matchHistory.length === 0) {
    embed.addFields({ name: "Match History", value: "No Data", inline: false });
  } else {
    const matchStats = await formatMatchHistory(client, player.matchHistory);
    embed.addFields({
      name: "**Match History**",
      value: matchStats,
    });
  }
  return embed;
}

async function formatMatchHistory(client, matchHistory) {
  const stats = await Promise.all(
    matchHistory.map(async (match) => ({
      queueType: await getQueueType(match),
      emoji: await getChampionEmoji(client, match.championName, null),
      kills: match.kills,
      deaths: match.deaths,
      assists: match.assists,
      win: match.win,
      teamEarlySurrendered: match.teamEarlySurrendered,
    })),
  );
  return stats
    .map(
      (match, index) =>
        `**${index + 1}.** ${match.emoji} - **${match.kills}/${match.deaths}/${match.assists}** - ${match.win ? "✅" : "❌"} ${match.teamEarlySurrendered ? "❌ Early surrender" : ""} - ${match.queueType}`,
    )
    .join("\n\n");
}
module.exports = createMatchHistoryEmbed;
