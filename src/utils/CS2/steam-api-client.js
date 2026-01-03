const { default: Bottleneck } = require("bottleneck");
const ApiClient = require("../api/api-client");

class SteamClient extends ApiClient {
  constructor() {
    const baseUrl = "https://api.steampowered.com";
    super(
      baseUrl,
      {},
      {
        rateLimiter: new Bottleneck({
          minTime: 250,
          maxConcurrent: 3,
        }),
      },
    );
    this.STEAM_API_KEY = process.env.STEAM_API_KEY;
  }

  /**
   * @param {String} steamId
   */
  async getPlayerSummaries(steamId) {
    const endpoint = `/ISteamUser/GetPlayerSummaries/v0002/?key=${this.STEAM_API_KEY}&steamids=${steamId}`;
    return await this.get(endpoint);
  }
  /**
   * @param {String} steamId
   */
  async getPlayTime(steamId) {
    const endpoint = `/IPlayerService/GetOwnedGames/v0001/?key=${this.STEAM_API_KEY}&steamid=${steamId}&format=json`;
    return await this.get(endpoint);
  }
  /**
   * @param {String} steamId
   */
  async getSteamLevel(steamId) {
    const endpoint = `/IPlayerService/GetSteamLevel/v1/?key=${this.STEAM_API_KEY}&steamid=${steamId}`;
    return await this.get(endpoint);
  }
  /**
   * @param {String} steamId
   */
  async getPlayerBans(steamId) {
    const endpoint = `/ISteamUser/GetPlayerBans/v1/?key=${this.STEAM_API_KEY}&steamids=${steamId}`;
    return await this.get(endpoint);
  }
  /**
   * @param {String} name Custom SteamId
   */
  async resolveVanityUrl(name) {
    const endpoint = `/ISteamUser/ResolveVanityURL/v1/?key=${this.STEAM_API_KEY}&vanityurl=${name}`;
    return await this.get(endpoint);
  }
}

module.exports = SteamClient;
