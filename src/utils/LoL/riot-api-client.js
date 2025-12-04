const ApiClient = require("../api/api-client");

function routeServerValues(region) {
  switch (region) {
    case "na1":
    case "br1":
    case "la1":
    case "la2":
      return `https://americas.api.riotgames.com"`;

    case "kr":
    case "jp1":
      return `https://asia.api.riotgames.com`;

    case "eun1":
    case "euw1":
    case "tr1":
    case "ru":
      return "https://europe.api.riotgames.com";

    case "oc1":
    case "sg2":
    case "ph2":
    case "tw2":
    case "vn2":
    case "th2":
      return "https://sea.api.riotgames.com";
  }
}
const RIOT_API_KEY = process.env.LEAGUE_OF_LEGENDS_API_KEY;
class RiotApiClient extends ApiClient {
  constructor() {
    const region = "euw1";
    const continental = routeServerValues(region);
    const baseUrl = `https://${region}.api.riotgames.com`;
    super(baseUrl, { "X-Riot-Token": RIOT_API_KEY });
    this.region = region;
    this.continental = continental;
  }

  /** @param {String} tag
   * @param {String} summonerName
   */
  async getSummonerPuuidByName(summonerName, tag) {
    const endpoint = `${this.continental}/riot/account/v1/accounts/by-riot-id/${summonerName}/${tag}`;
    return await this.get(endpoint);
  }

  /**
   * @param {String} puuid Summoner puuid
   */
  async getSummonerRegionByPuuid(puuid) {
    const endpoint = `${this.continental}/riot/account/v1/region/by-game/lol/by-puuid/${puuid}`;
    const response = await this.get(endpoint);

    // Update region and continental now that Summoner is known
    this.setRegionAndContinental(response.region);
    return response;
  }
  setRegionAndContinental(region) {
    this.region = region;
    this.continental = routeServerValues(this.region);
    this.client.defaults.baseURL = `https://${this.region}.api.riotgames.com`;
    console.log(
      `[RiotApiClient] updating baseUrl, now that region and continental is known: Region ${this.region}, Continental ${this.continental}`,
    );
  }
  /**
   * @param {String} puuid Summoner puuid
   */
  async getSummonerDataByPuuid(puuid) {
    const endpoint = `/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    return await this.get(endpoint);
  }

  /**
   * @param {String} puuid Summoner puuid
   */
  async getMatchIdsByPuuid(puuid) {
    const endpoint = `${this.continental}/lol/match/v5/matches/by-puuid/${puuid}/ids`;
    return await this.get(endpoint, { start: 0, count: 10 });
  }

  /**
   * @param {String} puuid Summoner puuid
   */
  async getMatchDataByMatchId(matchId) {
    const endpoint = `${this.continental}/lol/match/v5/matches/${matchId}`;
    return await this.get(endpoint);
  }

  /**
   * @param {String} puuid Summoner puuid
   */
  async getSummonerTopChampions(puuid) {
    const endpoint = `/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top`;
    return await this.get(endpoint);
  }

  /**
   * @param {String} puuid Summoner puuid
   */
  async getSummonerRank(puuid) {
    const endpoint = `/lol/league/v4/entries/by-puuid/${puuid}`;
    return await this.get(endpoint);
  }

  async getDataDragonVersion() {
    const endpoint = "https://ddragon.leagueoflegends.com/api/versions.json";
    return await this.get(endpoint);
  }

  /**
   * @param {String} version
   */
  async getDataDragonChampions(version) {
    const endpoint = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`;
    return await this.get(endpoint);
  }
  async getLeagueQueueTypes() {
    const endpoint =
      "https://static.developer.riotgames.com/docs/lol/queues.json";
    return await this.get(endpoint);
  }
}
module.exports = RiotApiClient;
