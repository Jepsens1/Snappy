const ApiClient = require("../api/api-client");

class FaceitClient extends ApiClient {
  constructor() {
    const baseUrl = "https://open.faceit.com/data/v4";
    super(baseUrl, { Authorization: `Bearer ${process.env.FACEIT_API_KEY}` });
  }

  /**
   * @param {String} nickName
   */
  async getPlayerDetailsByNickName(nickName) {
    const endpoint = `/players?nickname=${nickName}&game=cs2`;
    return await this.get(endpoint);
  }
  /**
   * @param {String} player_id
   */
  async getPlayerDetailsByPlayerId(player_id) {
    const endpoint = `/players/${player_id}`;
    return await this.get(endpoint);
  }

  /**
   * @param {String} player_id
   */
  async getPlayerLifetimeStats(player_id) {
    const endpoint = `/players/${player_id}/stats/cs2`;
    return await this.get(endpoint);
  }
  /**
   * @param {String} player_id
   */
  async getPlayerLast20Games(player_id) {
    const endpoint = `/players/${player_id}/games/cs2/stats`;
    return await this.get(endpoint);
  }
}

module.exports = FaceitClient;
