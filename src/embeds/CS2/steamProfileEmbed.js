const { EmbedBuilder, Client } = require("discord.js");

const StatusMap = new Map([
  [0, "Offline/Private"],
  [1, "Online"],
  [2, "Busy"],
  [3, "Away"],
  [4, "Snooze"],
  [5, "Looking to trade"],
  [6, "Looking to play"],
]);
/**
 * Creates Discord embed with Steam CS2 profile
 * Shows:
 * - Name, Level, Status
 * - Playtime (2 weeks, total, last time played)
 * - Currently Playing
 * - VAC Status
 * - Date created, Last time online (optional)
 * - SteamId
 * @param {SteamProfile} player
 * @returns {EmbedBuilder}
 */
function createSteamEmbed(player) {
  const embed = new EmbedBuilder()
    .setTitle(`View profile on Steam`)
    .setThumbnail(player.avatarUrl)
    .setURL(player.profileUrl)
    .setDescription(
      `**Last fetched: <t:${Math.floor(player.updatedAt / 1000)}:R>**`,
    )
    .addFields(
      { name: "Name", value: `${player.personaName}`, inline: true },
      {
        name: "Level",
        value: `${player.steamLevel}`,
        inline: true,
      },
      {
        name: "Status",
        value: `${StatusMap.get(player.personaState)}`,
        inline: true,
      },
    )
    .setFooter({ text: `SteamId: ${player.steamId}` })
    .setColor("#ffae01");

  if (player.hoursPlayed && player.hoursPlayed.length > 0) {
    const cs2Stats = player.hoursPlayed[0];
    embed.addFields(
      {
        name: "Last 2 weeks",
        value: `${Math.floor(cs2Stats.playtime_2weeks / 60)} Hours`,
        inline: true,
      },
      {
        name: "Total Playtime",
        value: `${Math.floor(cs2Stats.playtime_forever / 60)} Hours`,
        inline: true,
      },
    );
  } else {
    embed.addFields({
      name: "Hours played CS2",
      value: "No information",
      inline: true,
    });
  }
  embed.addFields({
    name: "Currently Playing",
    value: player.currentlyPlaying ? `${player.currentlyPlaying}` : "Nothing",
    inline: true,
  });
  embed.addFields({ name: "\u200b", value: "\u200b" });
  embed.addFields(
    {
      name: "VAC banned",
      value: player.vacBanned ? "Yes" : "No",
      inline: true,
    },
    {
      name: "Number of VAC bans",
      value: `${player.numberOfVacBans}`,
      inline: true,
    },
  );
  embed.addFields(
    { name: "\u200b", value: "\u200b" },
    {
      name: "Created",
      value: `**<t:${player.timeCreated}:R>**`,
      inline: true,
    },
  );
  if (player.lastLogOff) {
    embed.addFields({
      name: "Online",
      value: `**<t:${player.lastLogOff}:R>**`,
      inline: true,
    });
  }
  return embed;
}

module.exports = createSteamEmbed;
