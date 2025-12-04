const { EmbedBuilder, Client } = require("discord.js");
const LeagueOfLegends = require("../../models/league_of_legends_schema");
/**
 * Scaffold base layer for league embed
 * @param {Summoner} player
 * @returns {EmbedBuilder}
 */
function createBaseEmbed(player) {
  const { wins, losses, total, winrate } = getWinrateStats(player.matchHistory);
  return new EmbedBuilder()
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
}

function getWinrateStats(matchHistory) {
  const wins = matchHistory?.filter((match) => match.win === true).length;
  const losses = matchHistory?.filter((match) => match.win === false).length;
  const total = wins + losses;
  const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return { wins, losses, total, winrate };
}

/**
 * @param {Client} client
 */
async function getChampionEmoji(client, name = null, id = null) {
  const champName = name ? name : await convertChampionIdToName(id);
  if (client.application.emojis.cache.size === 0) {
    await client.application.emojis.fetch();
  }
  const emoji = client.application.emojis.cache.find(
    (e) => e.name === `lol_${champName}`,
  );
  return emoji;
}

async function getQueueType(match) {
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

module.exports = { createBaseEmbed, getChampionEmoji, getQueueType };
