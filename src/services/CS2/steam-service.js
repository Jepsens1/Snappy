const SteamClient = require("../../utils/CS2/steam-api-client");
const SteamProfile = require("../../models/CS2/steam_schema");
class SteamService {
  constructor() {
    this.steamClient = new SteamClient();
    this.cacheTimer = 5;
  }

  //#region Map Functions
  /**
   * @param {String} name
   * Maps Custom SteamId to actual SteamId
   */
  async mapVanityUrl(name) {
    const data = await this.steamClient.resolveVanityUrl(name);
    if (data.response.success !== 1) {
      throw new Error("Steam profile does not exist");
    }
    return data.response.steamid;
  }
  /**
   *
   * @param {String} steamId
   * Maps Steam profile information
   * To object with following fields:
   *  - steamId : String (64-bit SteamId)
   *  - personaName: String (Steam name)
   *  - profileUrl: String
   *  - avatarUrl: String
   *  - personaState: Number (0 Offline/Private, 1 Online, 2 Busy, 3 Away, 4 Snooze, 5 Looking to trade, 6 Looking to play)
   *  - lastLogOff: Number (Unix time)
   *  - timeCreated: Number (Unix time)
   *  - CurrentlyPlaying: String
   */
  async mapSteamProfile(steamId) {
    const playerSummary = await this.steamClient.getPlayerSummaries(steamId);
    const player = playerSummary.response.players?.[0];
    if (!player) {
      throw new Error("Steam profile does not exist");
    }
    return {
      steamId: player.steamid,
      personaName: player.personaname,
      profileUrl: player.profileurl,
      avatarUrl: player.avatarfull,
      personaState: player.personastate,
      lastLogOff: player.lastlogoff,
      timeCreated: player.timecreated || null,
      currentlyPlaying: player.gameextrainfo || null,
    };
  }
  /**
   * @param {String} steamId
   * Maps Steam Level
   */
  async mapSteamLevel(steamId) {
    const data = await this.steamClient.getSteamLevel(steamId);
    return data.response.player_level;
  }
  /**
   * @param {String} steamId
   * Maps Steam Bans to object with following fields:
   *  - isVacBanned : boolean
   *  - numberOfVacBans: Number
   */
  async mapSteamPlayerBans(steamId) {
    const data = await this.steamClient.getPlayerBans(steamId);
    const playerBans = data.players?.[0];
    if (!playerBans) {
      throw new Error("Steam profile does not exist");
    }
    const isVacBanned = playerBans.VACBanned;
    const numberOfVacBans = playerBans.numberOfVACBans ?? 0;
    return {
      isVacBanned,
      numberOfVacBans,
    };
  }
  /**
   * @param {String} steamId
   * Maps Playtime to object with following fields:
   *  - playtime_2weeks : Number (Minutes)
   *  - numberOfVacBans: Number (Minutes)
   *  - last_played: Number (Unix time)
   */
  async mapSteamPlaytime(steamId) {
    const data = await this.steamClient.getPlayTime(steamId);
    if (data?.response?.games) {
      const games = data?.response?.games;

      return games
        .filter((entry) => entry.appid === 730)
        .map((entry) => ({
          playtime_2weeks: entry.playtime_2weeks,
          playtime_forever: entry.playtime_forever,
          last_played: entry.rtime_last_played,
        }));
    } else {
      return [{ playtime_2weeks: 0, playtime_forever: 0, last_played: 0 }];
    }
  }
  //#endregion

  /**
   * Get latest Steam profile data available
   * @param {String} steamId
   * @returns {Promise<SteamProfile>}
   */
  async getSteamProfile(steamId) {
    try {
      let steamProfile = await this._findSteamProfileInDb(steamId);
      if (steamProfile) {
        steamProfile = await this._refreshSteamData(steamProfile);
        return steamProfile;
      }
      console.log(`[SteamService][Steam] New Steam Profile: ${steamId}`);
      steamProfile = await this._createSteamProfile(steamId);
      return steamProfile;
    } catch (error) {
      this._handleSteamError(error, steamId);
    }
  }

  //#region Private functions

  /**
   * @param {String} steamId
   * @returns {Promise<SteamProfile>}
   */
  async _findSteamProfileInDb(steamId) {
    // 1. Get actual SteamID in case of customId
    let actualSteamId = steamId;
    if (actualSteamId.length !== 17 || isNaN(actualSteamId)) {
      // Resolve custom id to steamId
      actualSteamId = await this.mapVanityUrl(steamId);
    }
    return await SteamProfile.findOne({ steamId: actualSteamId });
  }
  /**
   * @param {SteamProfile} steamProfile
   * @returns {Promise<SteamProfile>}
   */
  async _refreshSteamData(steamProfile) {
    if (Date.now() - steamProfile.updatedAt < this.cacheTimer * 60 * 1000) {
      // No updates
      console.log(
        `[SteamService][Cache] Latest data already exist ${steamProfile.personaName}`,
      );
      return steamProfile;
    }

    const [profile, playtime, steamLevel, playerBans] = await Promise.all([
      this.mapSteamProfile(steamProfile.steamId),
      this.mapSteamPlaytime(steamProfile.steamId),
      this.mapSteamLevel(steamProfile.steamId),
      this.mapSteamPlayerBans(steamProfile.steamId),
    ]);

    steamProfile.steamLevel = steamLevel;
    steamProfile.personaName = profile.personaName;
    steamProfile.profileUrl = profile.profileUrl;
    steamProfile.avatarUrl = profile.avatarUrl;
    steamProfile.personaState = profile.personaState;
    steamProfile.lastLogOff = profile.lastLogOff;
    steamProfile.timeCreated = profile.timeCreated;
    steamProfile.currentlyPlaying = profile.currentlyPlaying;
    steamProfile.hoursPlayed = playtime;
    steamProfile.vacBanned = playerBans.isVacBanned;
    steamProfile.numberOfVacBans = playerBans.numberOfVacBans;

    await steamProfile.save();
    return steamProfile;
  }

  /**
   * @param {String} steamId
   * @return {Promise<SteamProfile>}
   */
  async _createSteamProfile(steamId) {
    // 1. Get actual SteamID in case of customId
    let actualSteamId = steamId;
    if (actualSteamId.length !== 17 || isNaN(actualSteamId)) {
      // Resolve custom id to steamId
      actualSteamId = await this.mapVanityUrl(steamId);
    }
    // 2. Get Steam Profile data, playtime, level and bans
    const [profile, playtime, steamLevel, playerBans] = await Promise.all([
      this.mapSteamProfile(actualSteamId),
      this.mapSteamPlaytime(actualSteamId),
      this.mapSteamLevel(actualSteamId),
      this.mapSteamPlayerBans(actualSteamId),
    ]);

    const steamProfile = new SteamProfile({
      steamId: profile.steamId,
      steamLevel: steamLevel,
      personaName: profile.personaName,
      profileUrl: profile.profileUrl,
      avatarUrl: profile.avatarUrl,
      personaState: profile.personaState,
      lastLogOff: profile.lastLogOff,
      timeCreated: profile.timeCreated,
      currentlyPlaying: profile.currentlyPlaying,
      hoursPlayed: playtime,
      vacBanned: playerBans.isVacBanned,
      numberOfVacBans: playerBans.numberOfVacBans,
    });
    await steamProfile.save();
    return steamProfile;
  }
  _handleSteamError(error, steamId) {
    // Handle API-specific errors
    if (error.message.includes("404")) {
      throw new Error(`Steam profile ${steamId} not found`);
    }
    if (error.message.includes("429")) {
      throw new Error(`Rate limit`);
    }
    if (error.message.includes("403")) {
      throw new Error(`API-key expired or wrong`);
    }
    console.error("[SteamService] Unexpected Steam Error:", error);
    throw error;
  }
  //#endregion
}
module.exports = SteamService;
