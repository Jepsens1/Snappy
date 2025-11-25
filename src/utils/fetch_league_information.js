const Summoner = require("../models/summoner_schema");

const API_KEY = process.env.LEAGUE_OF_LEGENDS_API_KEY;
class Champion {
  constructor(name) {
    this.name = name;
  }
}
/**
 * Converts region such as eun1 to EUROPE server
 * @param {String} region
 */
function routeServerValues(region) {
  switch (region) {
    case "na1":
    case "br1":
    case "la1":
    case "la2":
      return `https://americas.api.riotgames.com/lol/match/v5/matches`;

    case "kr":
    case "jp1":
      return `https://asia.api.riotgames.com/lol/match/v5/matches`;

    case "eun1":
    case "euw1":
    case "tr1":
    case "ru":
      return `https://europe.api.riotgames.com/lol/match/v5/matches`;

    case "oc1":
    case "sg2":
    case "ph2":
    case "tw2":
    case "vn2":
    case "th2":
      return `https://sea.api.riotgames.com/lol/match/v5/matches`;
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
 * Fetch match stats from RIOT API
 * @param {String} match
 */
async function fetchMatch(match) {
  const res = await fetch(match, { headers: { "X-Riot-Token": API_KEY } });

  if (!res.ok) {
    throw new Error(`RIOT match API (${res.status})`);
  }
  return await res.json();
}
/**
 * Fetch Summoner's match history (last 10 games)
 * If cached match data is less than 15 minutes -> return cached data from DB
 * Else fetch from RIOT API
 * @param {Summoner} summoner
 * @returns {Promise<Summoner>}
 */
async function fetchMatchHistory(summoner) {
  const latestData = summoner.matchHistory?.[0];

  // Use cached match history if data is fresh
  if (latestData && !isOlderThan15Minutes(latestData.updatedAt)) {
    console.log("Using cached match history");
    return summoner;
  }
  try {
    console.log("Match history Cache is outdated, calling RIOT API's");
    const matchHistoryAPI = routeServerValues(summoner.region);

    const matchidxRes = await fetch(
      `${matchHistoryAPI}/by-puuid/${summoner.puuid}/ids?start=0&count=10`,
      { headers: { "X-Riot-Token": API_KEY } },
    );
    if (!matchidxRes.ok) {
      throw new Error(`RIOT Match ids API (${matchidxRes.status})`);
    }

    const matchIdx = await matchidxRes.json();

    if (!Array.isArray(matchIdx) || matchIdx.length === 0) {
      summoner.matchHistory = [];
    } else {
      const matches = await Promise.all(
        matchIdx.map((matchId) => fetchMatch(`${matchHistoryAPI}/${matchId}`)),
      );
      const simplifiedMatches = matches.map((match) => ({
        matchId: match.metadata.matchId,
        queueId: match.info.queueId,
        championName: match.info.participants.find(
          (p) => p.puuid === summoner.puuid,
        ).championName,
        deaths: match.info.participants.find((p) => p.puuid === summoner.puuid)
          .deaths,
        assists: match.info.participants.find((p) => p.puuid === summoner.puuid)
          .assists,
        kills: match.info.participants.find((p) => p.puuid === summoner.puuid)
          .kills,
        teamEarlySurrendered: match.info.participants.find(
          (p) => p.puuid === summoner.puuid,
        ).teamEarlySurrendered,
        win: match.info.participants.find((p) => p.puuid === summoner.puuid)
          .win,
      }));
      summoner.matchHistory = simplifiedMatches;
    }
    await summoner.save();
    return summoner;
  } catch (error) {
    // Soft fail: If RIOT API's are down, use old data as fallback
    if (latestData) {
      console.warn(
        "Riot API Error – returning cached match history:",
        error.message,
      );
      return summoner;
    }
    throw error;
  }
}
/**
 * Fetch Summoner's champion mastery data
 * If cached ranked data is less than 15 minutes -> return cache data from DB
 * Else fetch from RIOT API
 * @param {Summoner} summoner
 * @returns {Promise<Summoner>}
 */
async function fetchSummonerTopChampions(summoner) {
  // Use cached match history if data is fresh
  const latestData = summoner.topChampions?.[0];
  if (latestData && !isOlderThan15Minutes(latestData.updatedAt)) {
    console.log("Using cached Champion mastery data");
    return summoner;
  }
  try {
    console.log("Champion mastery Cache is outdated, calling RIOT API's");

    const res = await fetch(
      `https://${summoner.region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${summoner.puuid}/top`,
      { headers: { "X-Riot-Token": API_KEY } },
    );
    if (!res.ok) {
      // Soft fail - return old data
      console.warn(`RIOT Ranked API failed (${res.status})`);
      return summoner;
    }
    const data = await res.json();

    if (!Array.isArray(data) || data.length == 0) {
      summoner.topChampions = [];
    } else {
      const champions = data.map((champ) => ({
        championId: champ.championId,
        championPoints: champ.championPoints,
      }));
      summoner.topChampions = champions;
    }
    await summoner.save();
    return summoner;
  } catch (error) {
    // Soft fail: If RIOT API's are down, use old data as fallback
    if (latestData) {
      console.warn(
        "Riot API Error – returning cached champion mastery:",
        error.message,
      );
      return summoner;
    }
    throw error;
  }
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
    // Soft fail: If RIOT API's are down, use old data as fallback
    if (latestData) {
      console.warn(
        "Riot API Error – returning cached ranked data:",
        error.message,
      );
      return summoner;
    }
    throw error;
  }
}
/**
 * Fetch Summoner + ranked stats + match history in one function
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

    // 3. Fetch match history + cache result
    summoner = await fetchMatchHistory(summoner);

    // 4. Fetch Summoner's Champion mastery
    summoner = await fetchSummonerTopChampions(summoner);
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
