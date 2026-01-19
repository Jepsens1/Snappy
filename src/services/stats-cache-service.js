const getRedisClient = require("../utils/redis");

class StatsCacheService {
  static async getPlayerStats(platform, playerId) {
    const redis = await getRedisClient();
    const key = `stats:${platform}:${playerId}`.toLowerCase();
    const cached = await redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  static async setPlayerStats(platform, playerId, data, ttl) {
    const redis = await getRedisClient();
    const key = `stats:${platform}:${playerId}`.toLowerCase();
    await redis.set(key, JSON.stringify(data), { EX: ttl });
  }
}

module.exports = StatsCacheService;
