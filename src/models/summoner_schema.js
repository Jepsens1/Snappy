const { model, Schema } = require("mongoose");

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
  { _id: false, timestamps: true },
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
  },
  {
    timestamps: true,
  },
);

summonerSchema.index(
  { gameName: 1, tagLine: 1 },
  { collation: { locale: "en", strength: 2 } },
);
module.exports = model("Summoner", summonerSchema);
