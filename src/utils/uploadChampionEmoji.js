const { updateChampions } = require("../utils/champion");
const LeagueOfLegends = require("../models/league_of_legends_schema");
const { Client } = require("discord.js");

/**
 * @param {Client} client
 */
async function uploadChampionEmojis(client) {
  const { needsUpdate, version } = await updateChampions();
  // 1. Return if no new updates are available
  if (!needsUpdate) {
    console.log("Champion Emojis are already up to date");
    return;
  }
  // 2. Get Champions from Database
  const latestData = await LeagueOfLegends.findOne({ version: version });
  if (!latestData || latestData.champions.length === 0) {
    console.warn("Champion Emojis set to be updated, but database is empty?");
    return;
  }
  console.log("Updating Application Champion Emojis");
  const champions = latestData.champions;
  const applicationEmojis = await client.application.emojis.fetch();
  const PREFIX = "lol_";

  // 3. Create map of emojis starting with prefix
  const existingEmojiMap = new Map();
  for (const emoji of applicationEmojis.values()) {
    if (emoji.name.startsWith(PREFIX)) {
      const cleanName = emoji.name.slice(PREFIX.length);
      existingEmojiMap.set(cleanName.toLowerCase(), emoji);
    }
  }
  let updated = 0;
  let created = 0;
  let deleted = 0;

  // 3. Delete outdated application emojis
  for (const [champName, emoji] of existingEmojiMap) {
    const exists = champions.some((c) => c.id.toLowerCase() === champName);
    if (!exists) {
      try {
        // Delete old champion emoji
        await emoji.delete();
        console.log(`Deleted old champion emoji (${champName})`);
        deleted++;
      } catch (error) {
        console.warn(
          `Failed to delete application emoji (${emoji.name})`,
          error.message,
        );
      }
    }
  }
  // 4. Update or create new emojis
  for (const champ of champions) {
    const cleanName = champ.id.toLowerCase();
    const emojiName = `${PREFIX}${champ.id}`;

    const existing = existingEmojiMap.get(cleanName);

    // Update existing champion emoji (If RIOT has change icon)
    if (existing) {
      try {
        // Discord only allow to edit name and not iconUrl, so only solution currently is to delete and create
        await existing.delete();
        const newEmoji = await client.application.emojis.create({
          name: `${emojiName}`,
          attachment: `${champ.image}`,
        });
        console.log(`Updated (${newEmoji.name})`);
        updated++;
      } catch (error) {
        console.warn(
          `Failed to update champion emoji (${emojiName})`,
          error.message,
        );
      }
    } else {
      // Create new champion emoji
      try {
        const newEmoji = await client.application.emojis.create({
          name: `${emojiName}`,
          attachment: `${champ.image}`,
        });
        console.log(`Created (${newEmoji.name})`);
        created++;
      } catch (error) {
        console.warn(
          `Failed to create new champion emoji (${emojiName})`,
          error.message,
        );
      }
    }
  }
  console.log(
    `Done! Deleted: ${deleted} | Created: ${created} | Updated: ${updated}`,
  );
}

module.exports = { uploadChampionEmojis };
