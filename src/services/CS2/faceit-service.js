const FaceitClient = require("../../utils/CS2/faceit-api-client");
const FaceitProfile = require("../../models/CS2/faceit_schema");
class FaceitService {
  constructor() {
    this.faceitClient = new FaceitClient();
    this.cacheTimer = 5;
  }

  //#region Map Functions
  /**
   *
   * @param {String} [nickname=null]
   * @param {String} [player_id=null]
   * Maps Faceit profile information
   * To object with following fields:
   *   - player_id: String
   *   - nickname: String
   *   - avatar: String
   *   - steamId: String (64-bit SteamId)
   *   - steam_nickname: String,
   *   - faceit_url: String
   *   - activated_at: Date
   *   - cs2: {
   *   	 - region: String | Null,
   *   	 - game_player_id: String | Null,
   *   	 - skill_level: Number (default 0)
   *   	 - faceit_elo: Number (default 0)
   *   	 - game_player_name: String | Null
   *   }
   *
   */
  async mapFaceitProfile(nickname = null, player_id = null) {
    let data;
    if (player_id) {
      data = await this.faceitClient.getPlayerDetailsByPlayerId(player_id);
    } else {
      data = await this.faceitClient.getPlayerDetailsByNickName(nickname);
    }
    return {
      player_id: data.player_id,
      nickname: data.nickname,
      avatar: data.avatar,
      steamId: data.steam_id_64,
      steam_nickname: data.steam_nickname,
      faceit_url: data.faceit_url,
      activated_at: data.activated_at,
      cs2: {
        region: data.games.cs2.region || null,
        game_player_id: data.games.cs2.game_player_id || null,
        skill_level: data.games.cs2.skill_level || 0,
        faceit_elo: data.games.cs2.faceit_elo || 0,
        game_player_name: data.games.cs2.game_player_name || null,
      },
    };
  }
  //#endregion

  /**
   * Get latest Faceit data available
   * @param {String} nickname
   * @returns {Promise<FaceitProfile>}
   */
  async getFaceitProfile(nickname) {
    try {
      let faceitProfile = await this._findFaceitProfileInDb(nickname);
      if (faceitProfile) {
        faceitProfile = await this._refreshFaceitData(faceitProfile);
        return faceitProfile;
      }
      console.log(`[FaceitService][Faceit] New Faceit Profile: ${nickname}`);
      faceitProfile = await this._createFaceitProfile(nickname);
      return faceitProfile;
    } catch (error) {
      this._handleFaceitError(error, nickname);
    }
  }

  //#region Private functions

  /**
   * @param {String} nickname
   * @returns {Promise<FaceitProfile>}
   */
  async _findFaceitProfileInDb(nickname) {
    return await FaceitProfile.findOne({ nickname: nickname });
  }
  /**
   * @param {FaceitProfile} faceitProfile
   * @returns {Promise<FaceitProfile>}
   */
  async _refreshFaceitData(faceitProfile) {
    if (Date.now() - faceitProfile.updatedAt < this.cacheTimer * 60 * 1000) {
      // No updates
      console.log(
        `[FaceitService][Cache] Latest data already exist ${faceitProfile.nickname}`,
      );
      return faceitProfile;
    }
    const profile = await this.mapFaceitProfile(null, faceitProfile.player_id);

    faceitProfile.nickname = profile.nickname;
    faceitProfile.avatar = profile.avatar;
    faceitProfile.steamId = profile.steamId;
    faceitProfile.steam_nickname = profile.steam_nickname;
    faceitProfile.faceit_url = profile.faceit_url;
    faceitProfile.activated_at = profile.activated_at;
    faceitProfile.cs2 = profile.cs2;

    await faceitProfile.save();
    return faceitProfile;
  }

  /**
   * @param {String} nickname
   * @return {Promise<FaceitProfile>}
   */
  async _createFaceitProfile(nickname) {
    const profile = await this.mapFaceitProfile(nickname, null);
    const faceitProfile = new FaceitProfile({
      player_id: profile.player_id,
      nickname: profile.nickname,
      avatar: profile.avatar,
      steamId: profile.steamId,
      steam_nickname: profile.steam_nickname,
      faceit_url: profile.faceit_url,
      activated_at: profile.activated_at,
      cs2: profile.cs2,
    });
    await faceitProfile.save();
    return faceitProfile;
  }
  _handleFaceitError(error, nickname) {
    // Handle API-specific errors
    if (error.message.includes("404")) {
      throw new Error(`Faceit profile ${nickname} not found`);
    }
    if (error.message.includes("429")) {
      throw new Error(`Rate limit`);
    }
    if (error.message.includes("403")) {
      throw new Error(`API-key expired or wrong`);
    }
    console.error("[FaceitService] Unexpected Faceit Error:", error);
    throw error;
  }
  //#endregion
}

module.exports = FaceitService;
