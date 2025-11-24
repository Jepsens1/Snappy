const Summoner = require("../models/summoner_schema");

const API_KEY = process.env.LEAGUE_OF_LEGENDS_API_KEY;
class Champion {
  constructor(name) {
    this.name = name;
  }
}

function isOlderThan15Minutes(date) {
  if (!date) return true;
  return Date.now() - date.getTime() > 15 * 60 * 1000;
}
/**
 * Fetch summoner from database or RIOT API
 * Case-insensitive match on gameName + tagLine using collation
 * If data in database is less than 15 minutes old -> return cache data from DB
 * Else fetch Account, Region and Summoner info from RIOT API
 *
 *
 * @param {String} summonerName
 * @param {String} tagLine
 * @returns {Promise<Summoner>}
 */
async function fetchSummoner(summonerName, tagLine) {
  // Case-insensitive lookup in DB (strength 2 = ignore case, but don't ignore accent)
  const summoner = await Summoner.findOne({
    gameName: summonerName,
    tagLine: tagLine,
  }).collation({ locale: "en", strength: 2 });

  // Use cached data from DB if data is less than 15 minutes old
  if (summoner && !isOlderThan15Minutes(summoner.updatedAt)) {
    console.log("Found cache data in database");
    return summoner;
  }
  console.log("Player Cache is outdated, calling RIOT API's");
  let accountData, summonerData, regionData;

  try {
    // 1. Fetch Riot Account Data (Retrieve puuid)
    const accountRes = await fetch(
      `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${tagLine}`,
      { headers: { "X-Riot-Token": API_KEY } },
    );
    if (!accountRes.ok) {
      throw new Error(`RIOT Account API: ${accountRes.status}`);
    }
    accountData = await accountRes.json();

    // 2. Fetch region for Summoner
    const regionRes = await fetch(
      `https://europe.api.riotgames.com/riot/account/v1/region/by-game/lol/by-puuid/${accountData.puuid}`,
      { headers: { "X-Riot-Token": API_KEY } },
    );

    if (!regionRes.ok) {
      throw new Error(`RIOT Region API: ${regionRes.status}`);
    }
    regionData = await regionRes.json();

    // 3. Fetch Summoner Data (profileIcondId + level)
    const summonerRes = await fetch(
      `https://${regionData.region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${accountData.puuid}`,
      { headers: { "X-Riot-Token": API_KEY } },
    );

    if (!summonerRes.ok) {
      throw new Error(`RIOT Summoner API: ${summonerRes.status}`);
    }

    summonerData = await summonerRes.json();
  } catch (error) {
    // Soft fail: If RIOT API's are down, use old data as fallback
    if (summoner) {
      console.warn(
        "Riot API Error – returning cached summoner:",
        error.message,
      );
      return summoner;
    }
    // If not rethrow error
    throw error;
  }
  // Upsert Summoner in database (create if not exist)
  return await Summoner.findOneAndUpdate(
    {
      puuid: accountData.puuid,
    },
    {
      $set: {
        gameName: accountData.gameName,
        tagLine: accountData.tagLine,
        region: regionData.region,
        summonerLevel: summonerData.summonerLevel,
        profileIconId: summonerData.profileIconId,
      },
      $setOnInsert: {
        puuid: accountData.puuid,
      },
    },
    { upsert: true, new: true },
  );
}
/**
 * @param {String} role
 * @param {String} champion
 * @returns {Champion}
 */
async function getChampionBuild(champion, role) {
  return new Champion("hello");
}

/**
 * @param {String} champion
 * @returns {Champion}
 */
async function getChampionCounters(champion) {
  return new Champion("hello");
}

/**
 *
 * Fetch Summoner's ranked data
 * If cached ranked data is less than 15 minutes -> return cache data from DB
 * Else fetch from RIOT API
 * If API returns empty array -> Summoner is unranked (cache dummy data)
 * @param {Summoner} summoner
 * @returns {Promise<Summoner>}
 */
async function fetchSummonerRank(summoner) {
  // Summoner can't play ranked until level 30
  if (summoner.summonerLevel < 30) {
    console.log("Summoner not able to play ranked yet");
    return summoner;
  }

  // Use ranked cache data if less than 15 minutes
  const latestData = summoner.rankedStats?.[0];
  if (latestData && !isOlderThan15Minutes(latestData.updatedAt)) {
    console.log("Using cached Ranked Data");
    return summoner;
  }
  try {
    console.log("Ranked Cache is outdated, calling RIOT API's");

    // Fetch ranked data from RIOT API
    const res = await fetch(
      `https://${summoner.region}.api.riotgames.com/lol/league/v4/entries/by-puuid/${summoner.puuid}`,
      { headers: { "X-Riot-Token": API_KEY } },
    );
    if (!res.ok) {
      // Soft fail - return old data
      console.warn(`RIOT Ranked API failed (${res.status})`);
      return summoner;
    }
    const data = await res.json();

    // Check if Summoner has no ranked data (unranked)
    if (!Array.isArray(data) || data.length === 0) {
      // Cache UNRANKED for both solo & flex to avoid re-fetching and spamming API
      summoner.rankedStats = [
        {
          queueType: "RANKED_SOLO_5x5",
          tier: "UNRANKED",
          rank: "",
          leaguePoints: 0,
          wins: 0,
          losses: 0,
          hotStreak: false,
          winrate: 0,
        },
        {
          queueType: "RANKED_FLEX_SR",
          tier: "UNRANKED",
          rank: "",
          leaguePoints: 0,
          wins: 0,
          losses: 0,
          hotStreak: false,
          winrate: 0,
        },
      ];
      console.log(
        "Player is unranked, stored dummy rankedStats entry to avoid re-fetching.",
      );
    } else {
      // Maps API response to rankedStats format
      const rankedStats = data
        .filter(
          (entry) =>
            entry.queueType === "RANKED_SOLO_5x5" ||
            entry.queueType === "RANKED_FLEX_SR",
        )
        .map((entry) => ({
          queueType: entry.queueType,
          tier: entry.tier || "UNRANKED",
          rank: entry.rank || "",
          leaguePoints: entry.leaguePoints || 0,
          wins: entry.wins || 0,
          losses: entry.losses || 0,
          hotStreak: entry.hotStreak,
          winrate:
            entry.wins + entry.losses > 0
              ? Math.round((entry.wins / (entry.wins + entry.losses)) * 100)
              : 0,
        }));
      summoner.rankedStats = rankedStats;
    }
    await summoner.save();
    return summoner;
  } catch (error) {
    console.log(error.stack);
    throw error;
  }
}
/**
 * Fetch Summoner + ranked stats in one function
 * @param {String} summonerName
 * @param {String} tagLine
 * @returns {Promise<Summoner>}
 */
async function getSummonerStats(summonerName, tagLine) {
  try {
    // 1. Fetch Summoner + cache result
    let summoner = await fetchSummoner(summonerName, tagLine);
    // 2. Fetch ranked stats + cache result
    summoner = await fetchSummonerRank(summoner);
    return summoner;
  } catch (error) {
    console.log(error.stack);
    throw error;
  }
}

module.exports = {
  getChampionBuild,
  getChampionCounters,
  getSummonerStats,
};
