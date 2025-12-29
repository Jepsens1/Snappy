const { EmbedBuilder } = require("discord.js");
/**
 * Creates Discord embed with Faceit CS2 profile
 * Shows:
 * - Faceit name, Steam name, in game name
 * - Level, Elo, Matches, wins, winrate
 * - Avg kills, HS%, K/D, K/R, ADR
 * - Match results last 20 games
 * - Currently & Longest Win streak
 *   Region
 * - SteamId
 * - Created At
 * @param {FaceitProfile} player
 * @returns {EmbedBuilder}
 */
function createFaceitEmbed(player) {
  const embed = new EmbedBuilder()
    .setTitle("View profile on Faceit")
    .setThumbnail(player.avatar)
    .setURL(player.faceit_url)
    .setDescription(
      `**Last fetched: <t:${Math.floor(player.updatedAt / 1000)}:R>**`,
    )

    .addFields(
      {
        name: "Faceit",
        value: `${player.nickname}`,
        inline: true,
      },
      {
        name: "Steam",
        value: `${player.steam_nickname}`,
        inline: true,
      },
      {
        name: "In game",
        value: `${player.faceit_stats_cs2.game_player_name}`,
        inline: true,
      },
    )
    .addFields(
      {
        name: "Level & ELO",
        value: `**Level ${player.faceit_stats_cs2.skill_level} | ${player.faceit_stats_cs2.faceit_elo}**`,
        inline: true,
      },
      {
        name: "Matches & Wins",
        value: `**${player.lifetime_stats_cs2.totalMatches} / ${player.lifetime_stats_cs2.wins}**`,
        inline: true,
      },
      {
        name: "Wins %",
        value: `**${player.lifetime_stats_cs2.winrate_percentage}%**`,
        inline: true,
      },
      { name: "\u200b", value: "\u200b" },
    )
    .setFooter({
      text: `Created At: ${player.activated_at.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} | SteamId: ${player.steamId}`,
    })
    .setColor("#fe1f00");

  const averageStats = mapAverageMatchHistoryStats(player.match_history_cs2);

  embed.addFields(
    {
      name: "Avg Kills / HS%",
      value: `**${averageStats.averageKills} / ${averageStats.averageHsPercentage}%**`,
      inline: true,
    },
    {
      name: "Avg K/D / K/R",
      value: `**${averageStats.averageKdRatio} / ${averageStats.averageKrRatio}**`,
      inline: true,
    },
    { name: "ADR", value: `**${averageStats.averageAdr}**`, inline: true },
    {
      name: "Results",
      value: `${averageStats.matchResults}`,
    },
  );
  embed.addFields(
    { name: "\u200b", value: "\u200b" },
    {
      name: "Current & Longest Win Streak",
      value: `${player.lifetime_stats_cs2.current_win_streak} | ${player.lifetime_stats_cs2.longest_win_streak}`,
      inline: true,
    },
    {
      name: "Region",
      value: `${player.faceit_stats_cs2.region}`,
      inline: true,
    },
  );
  return embed;
}

function mapAverageMatchHistoryStats(match_history) {
  let totalKills = 0;
  let totalhs_percentage = 0;
  let matchResults = "";
  let totalkd_ratio = 0;
  let totalkr_ratio = 0;
  let totaladr_ratio = 0;

  for (let index = 0; index < match_history.length; index++) {
    totalKills += match_history[index].kills;
    totalhs_percentage += match_history[index].hs_percentage;
    matchResults +=
      match_history[index].match_result === 1 ? ":white_check_mark:" : ":x:";
    totalkd_ratio += match_history[index].kd_ratio;
    totalkr_ratio += match_history[index].kr_ratio;
    totaladr_ratio += match_history[index].adr_ratio;
  }
  const matchCount = match_history.length;
  if (matchCount === 0) {
    return {
      averageKills: 0,
      averageHsPercentage: 0,
      matchResults: "",
      averageKdRatio: 0,
      averageKrRatio: 0,
      averageAdr: 0,
    };
  }
  return {
    matchResults,
    averageKills: Math.round(totalKills / matchCount),
    averageHsPercentage: Math.round(totalhs_percentage / matchCount),
    averageKdRatio: (totalkd_ratio / matchCount).toFixed(2),
    averageKrRatio: (totalkr_ratio / matchCount).toFixed(2),
    averageAdr: (totaladr_ratio / matchCount).toFixed(1),
  };
}

module.exports = createFaceitEmbed;
