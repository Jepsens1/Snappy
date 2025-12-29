const RiotApiClient = require("../../utils/LoL/riot-api-client");
const Summoner = require("../../models/LoL/summoner-schema");
const LeagueOfLegends = require("../../models/LoL/league-of-legends-schema");

class LeagueService {
  constructor() {
    this.riotClient = new RiotApiClient();
    this.cacheTimer = 10;
  }

  //#region Map functions

  /**
   * @param {String} puuid Summoner puuid
   * Maps Summoner Champions-masteries Riot API response
   * To array with following keys:
   * - championId: number
   *   championPoints: number
   */
  async mapMastery(puuid) {
    const data = await this.riotClient.getSummonerTopChampions(puuid);
    return data.map((champ) => ({
      championId: champ.championId,
      championPoints: champ.championPoints,
    }));
  }
  /**
   *
   * @param {String} puuid Summoner puuid
   * Maps Summoner Rank-entries Riot API response
   * To array with following keys:
   *  - QueueType: RANKED_SOLO_5x5 or RANKED_FLEX_SR
   *  - Tier: Iron, Bronze, Silver, Gold, Platinum, Emerald, Diamond, Master, Grandmaster, Challenger
   *  - Rank: I, II, III, IV
   *  - League Points (LP): number
   *  - Wins: number
   *  - Losses: number
   *  - HotStreak: boolean
   *  - WinRate: number
   */
  async mapRankedStats(puuid) {
    const data = await this.riotClient.getSummonerRank(puuid);

    return data
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
  }
  /**
   *
   * @param {String} puuid Summoner puuid
   * Maps Summoner last 10 games Riot API response
   * To array with following keys:
   *  - matchId: String
   *  - queueId: number
   *  - championName: String
   *  - death: number
   *  - kills: number
   *  - assist: number
   *  - teamEarlySurrendered: boolean
   *  - win: boolean
   */
  async mapMatchHistory(puuid) {
    const matchIds = await this.riotClient.getMatchIdsByPuuid(puuid);
    const matches = await Promise.all(
      matchIds.map((id) => this.riotClient.getMatchDataByMatchId(id)),
    );
    // Simplify match data
    return matches.map((match) => ({
      matchId: match.metadata.matchId,
      queueId: match.info.queueId,
      championName: match.info.participants.find((p) => p.puuid === puuid)
        .championName,
      deaths: match.info.participants.find((p) => p.puuid === puuid).deaths,
      assists: match.info.participants.find((p) => p.puuid === puuid).assists,
      kills: match.info.participants.find((p) => p.puuid === puuid).kills,
      teamEarlySurrendered: match.info.participants.find(
        (p) => p.puuid === puuid,
      ).teamEarlySurrendered,
      win: match.info.participants.find((p) => p.puuid === puuid).win,
    }));
  }
  /**
   *
   * @param {String} puuid Summoner puuid
   * Maps Summoner Data Riot API response
   * To array with following keys:
   *  - summonerLevel: number
   *  - profileIconId: number
   */
  async mapSummonerData(puuid) {
    const summoner = await this.riotClient.getSummonerDataByPuuid(puuid);
    return {
      summonerLevel: summoner.summonerLevel,
      profileIconId: summoner.profileIconId,
    };
  }
  /**
   * Maps latest version from Data Dragon API
   * @returns {Promise<String>} version
   */
  async mapVersion() {
    const version = await this.riotClient.getDataDragonVersion();
    return version[0];
  }
  /**
   * Maps latest champions from Data Dragon API
   * To array with following keys:
   *   - id: String
   *   - key: number,
   *   - name: String
   *   - image: String (url)
   * @param {String} version version
   */
  async mapChampions(version) {
    const response = await this.riotClient.getDataDragonChampions(version);
    const champions = Object.values(response.data);
    return champions.map((champ) => ({
      id: champ.id,
      key: parseInt(champ.key),
      name: champ.name,
      image: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.image.full}`,
    }));
  }
  /**
   * Maps latest queue types from Data Dragon API
   * To array with following keys:
   *   - queueId: number,
   *   - map: String
   *   - description: String
   */
  async mapQueueTypes() {
    const queues = await this.riotClient.getLeagueQueueTypes();
    return queues
      .filter((entry) => entry.queueId !== 0 && entry.notes == null)
      .map((entry) => ({
        queueId: entry.queueId,
        map: entry.map,
        description: entry.description,
      }));
  }
  //#endregion
  //#region Summoner Related

  /**
   * Get latest Summoner data available
   * @param {String} summonerName
   * @param {String} tag
   * @returns {Promise<Summoner>}
   */
  async getSummonerFullStats(summonerName, tag) {
    try {
      let summoner = await this._findSummonerInDb(summonerName, tag);
      if (summoner) {
        summoner = await this._refreshSummonerData(summoner);
        return summoner;
      }
      console.log(`[LeagueService][Riot] New Summoner: ${summonerName}#${tag}`);
      summoner = await this._createSummonerFromRiot(summonerName, tag);
      return summoner;
    } catch (error) {
      this._handleRiotError(error, summonerName, tag);
    }
  }
  //#endregion

  //#region Data Dragon

  /**
   * Get latest data from Data Dragon API
   * @returns {Promise<{needsUpdate: boolean; version: String}>}
   */
  async getDataDragonData() {
    try {
      const latestVersion = await this.mapVersion();
      const existing = await LeagueOfLegends.findOne();
      // 1. If database is empty -> create latest version
      if (!existing) {
        console.log(
          "[LeagueService][Dragon] No Data Dragon version found in database. Creating from latest version",
        );
        const data = await this._createChampionsFromDataDragon(latestVersion);
        return { needsUpdate: true, version: data.version };
      }
      // 2. Check if there is new version
      if (existing.version === latestVersion) {
        console.log(
          `[LeagueService][Dragon] Already up to date: ${latestVersion}`,
        );
        return { needsUpdate: false, version: latestVersion };
      }
      // 3. New version detected
      console.log(
        `[LeagueService][Dragon] New Data Dragon Version detected (${latestVersion}) > (${existing.version})`,
      );
      const data = await this._createChampionsFromDataDragon(
        latestVersion,
        existing.version,
      );
      return { needsUpdate: true, version: data.version };
    } catch (error) {
      console.error(
        "[LeagueService][Dragon] Failed to update Data Dragon data",
        error,
      );
      throw error;
    }
  }
  //#endregion
  //#region Private functions

  /**
   * Create or update database with latest data from Data Dragon API
   * @returns {Promise<LeagueOfLegends>}
   */
  async _createChampionsFromDataDragon(latestVersion, currentVersion = null) {
    const [champions, queueTypes] = await Promise.all([
      this.mapChampions(latestVersion),
      this.mapQueueTypes(),
    ]);
    const leagueData = await LeagueOfLegends.findOneAndUpdate(
      {
        version: currentVersion ? currentVersion : latestVersion,
      },
      {
        $set: {
          version: latestVersion,
          champions: champions,
          queues: queueTypes,
        },
      },
      { upsert: true, new: true },
    );
    return leagueData;
  }
  /**
   * Search for Summoner in database
   * @param {String} summonerName
   * @param {String} tag
   * @returns {Promise<Summoner>}
   */
  async _findSummonerInDb(summonerName, tag) {
    return await Summoner.findOne({
      gameName: summonerName,
      tagLine: tag,
    }).collation({ locale: "en", strength: 2 });
  }
  /**
   * Create new Summoner entry in database
   * @param {String} summonerName
   * @param {String} tag
   * @returns {Promise<Summoner>}
   */
  async _createSummonerFromRiot(summonerName, tag) {
    // 1. Get Summoner puuid from Riot Account API
    const account = await this.riotClient.getSummonerPuuidByName(
      summonerName,
      tag,
    );
    // 2. Get Summoner Region
    await this.riotClient.getSummonerRegionByPuuid(account.puuid);

    // 3. Get additional Summoner data, Rank, and Mastery
    const [basic, rank, mastery, matchHistory] = await Promise.all([
      this.mapSummonerData(account.puuid),
      this.mapRankedStats(account.puuid),
      this.mapMastery(account.puuid),
      this.mapMatchHistory(account.puuid),
    ]);

    const summoner = new Summoner({
      puuid: account.puuid,
      gameName: account.gameName,
      tagLine: account.tagLine,
      region: this.riotClient.region,
      summonerLevel: basic.summonerLevel,
      profileIconId: basic.profileIconId,
      matchHistory: matchHistory,
      rankedStats: rank,
      topChampions: mastery,
      lastBasicUpdate: new Date(),
      lastMatchHistoryUpdate: new Date(),
      lastRankedStatsUpdate: new Date(),
      lastMasteryUpdate: new Date(),
    });
    await summoner.save();
    return summoner;
  }

  _handleRiotError(error, summonerName, tag) {
    // Handle API-specific errors
    if (error.message.includes("404")) {
      throw new Error(`Summoner ${summonerName}#${tag} not found`);
    }
    if (error.message.includes("429")) {
      throw new Error(`Rate limit`);
    }
    if (error.message.includes("403")) {
      throw new Error(`API-key expired eller wrong`);
    }
    console.error("[LeagueService] Unexpected RIOT Error:", error);
    throw error;
  }
  /**
   * Check if Summoner data stored in database is still considered fresh
   * @param {Summoner} summoner
   */
  _checkDataFreshness(summoner) {
    const olderThan10Min = (date) =>
      !date || Date.now() - date.getTime() > this.cacheTimer * 60 * 1000;
    return {
      needsSummoner: olderThan10Min(summoner.lastBasicUpdate),
      needsMatchHistory: olderThan10Min(summoner.lastMatchHistoryUpdate),
      needsRankedStats: olderThan10Min(summoner.lastRankedStatsUpdate),
      needsMastery: olderThan10Min(summoner.lastMasteryUpdate),
    };
  }

  /**
   * Refresh Summoner data that is considered out of date
   * @param {Summoner} summoner
   * @returns {Promise<Summoner>}
   */
  async _refreshSummonerData(summoner) {
    // Check what data is out of date
    const { needsSummoner, needsMatchHistory, needsRankedStats, needsMastery } =
      this._checkDataFreshness(summoner);

    if (
      !needsSummoner &&
      !needsMatchHistory &&
      !needsRankedStats &&
      !needsMastery
    ) {
      // No updates
      console.log(
        `[LeagueService][Cache] Latest data already exist ${summoner.gameName}#${summoner.tagLine}`,
      );
      return summoner;
    }
    this.riotClient.setRegionAndContinental(summoner.region);
    const [basic, matchHistory, rankedStats, topChampions] = await Promise.all([
      needsSummoner ? this.mapSummonerData(summoner.puuid) : null,
      needsMatchHistory ? this.mapMatchHistory(summoner.puuid) : null,
      needsRankedStats ? this.mapRankedStats(summoner.puuid) : null,
      needsMastery ? this.mapMastery(summoner.puuid) : null,
    ]);

    let changed = false;

    // Extra checks in case the API throws errors
    if (basic !== null) {
      summoner.summonerLevel = basic.summonerLevel;
      summoner.profileIconId = basic.profileIconId;
      summoner.lastBasicUpdate = new Date();
      console.log(
        `[LeagueService][Cache] Updated data for basic Summoner Data ${summoner.gameName}#${summoner.tagLine}`,
      );
      changed = true;
    }
    if (matchHistory !== null) {
      summoner.matchHistory = matchHistory;
      summoner.lastMatchHistoryUpdate = new Date();
      console.log(
        `[LeagueService][Cache] Updated data for matchHistory ${summoner.gameName}#${summoner.tagLine}`,
      );
      changed = true;
    }
    if (rankedStats !== null) {
      summoner.rankedStats = rankedStats;
      summoner.lastRankedStatsUpdate = new Date();
      console.log(
        `[LeagueService][Cache] Updated data for rankedStats ${summoner.gameName}#${summoner.tagLine}`,
      );
      changed = true;
    }
    if (topChampions !== null) {
      summoner.topChampions = topChampions;
      summoner.lastMasteryUpdate = new Date();
      console.log(
        `[LeagueService][Cache] Updated data for topChampions ${summoner.gameName}#${summoner.tagLine}`,
      );
      changed = true;
    }

    if (changed) {
      await summoner.save();
    }
    return summoner;
  }
  //#endregion
}
module.exports = LeagueService;
