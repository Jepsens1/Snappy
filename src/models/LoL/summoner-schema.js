const { model, Schema } = require("mongoose");

const topChampionSchema = new Schema(
  {
    championId: {
      type: Number,
      required: true,
    },
    championPoints: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);
const matchDataSchema = new Schema(
  {
    matchId: {
      type: String,
      required: true,
      unique: true,
    },
    queueId: {
      type: Number,
      required: true,
    },
    championName: {
      type: String,
      required: true,
    },
    deaths: {
      type: Number,
      required: true,
    },
    kills: {
      type: Number,
      required: true,
    },
    assists: {
      type: Number,
      required: true,
    },
    teamEarlySurrendered: {
      type: Boolean,
      default: false,
    },
    win: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false },
);
const rankedQueueSchema = new Schema(
  {
    queueType: {
      type: String,
      required: true,
      enum: ["RANKED_SOLO_5x5", "RANKED_FLEX_SR"],
    },
    tier: {
      type: String,
      enum: [
        "IRON",
        "BRONZE",
        "SILVER",
        "GOLD",
        "PLATINUM",
        "EMERALD",
        "DIAMOND",
        "MASTER",
        "GRANDMASTER",
        "CHALLENGER",
        "UNRANKED",
      ],
      default: "UNRANKED",
    },
    rank: {
      type: String,
      enum: ["I", "II", "III", "IV", ""],
      default: "",
    },
    leaguePoints: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    hotStreak: {
      type: Boolean,
      default: false,
    },
    winrate: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const summonerSchema = new Schema(
  {
    puuid: {
      type: String,
      required: true,
      unique: true,
    },
    region: {
      type: String,
      required: true,
    },
    gameName: {
      type: String,
      required: true,
    },
    tagLine: {
      type: String,
      required: true,
    },
    summonerLevel: {
      type: Number,
      required: true,
    },
    profileIconId: {
      type: Number,
      required: true,
    },
    rankedStats: { type: [rankedQueueSchema], default: [] },
    matchHistory: { type: [matchDataSchema], default: [] },
    topChampions: { type: [topChampionSchema], default: [] },
    lastBasicUpdate: { type: Date, default: null },
    lastMatchHistoryUpdate: { type: Date, default: null },
    lastRankedStatsUpdate: { type: Date, default: null },
    lastMasteryUpdate: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

// Remove documents with no activity after 7 days
summonerSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 604800 });
summonerSchema.index(
  { gameName: 1, tagLine: 1 },
  { collation: { locale: "en", strength: 2 } },
);
module.exports = model("Summoner", summonerSchema);
