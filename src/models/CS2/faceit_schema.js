const { model, Schema } = require("mongoose");

const cs2Stats = new Schema(
  {
    region: {
      type: String,
      default: null,
    },
    game_player_id: {
      type: String,
      default: null,
    },
    skill_level: {
      type: Number,
      default: 0,
    },
    faceit_elo: {
      type: Number,
      default: 0,
    },
    game_player_name: {
      type: String,
      default: null,
    },
  },
  { _id: false },
);

const cs2LifetimeStats = new Schema(
  {
    current_win_streak: {
      type: Number,
      default: 0,
    },
    longest_win_streak: {
      type: Number,
      default: 0,
    },
    totalMatches: {
      type: Number,
      default: 0,
    },
    wins: {
      type: Number,
      default: 0,
    },
    winrate_percentage: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);
const cs2MatchHistory = new Schema(
  {
    kills: {
      type: Number,
      default: 0,
    },
    hs_percentage: {
      type: Number,
      default: 0,
    },
    match_result: {
      type: Number,
      default: 0,
    },
    kd_ratio: {
      type: Number,
      default: 0,
    },
    kr_ratio: {
      type: Number,
      default: 0,
    },
    adr_ratio: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const faceitSchema = new Schema(
  {
    player_id: {
      type: String,
      required: true,
      unique: true,
    },
    nickname: {
      type: String,
      required: true,
      index: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    steamId: {
      type: String,
      required: true,
    },
    steam_nickname: {
      type: String,
      required: true,
    },
    faceit_url: {
      type: String,
      required: true,
    },
    activated_at: {
      type: Date,
      required: true,
    },
    faceit_stats_cs2: {
      type: cs2Stats,
    },
    lifetime_stats_cs2: {
      type: cs2LifetimeStats,
    },
    match_history_cs2: {
      type: [cs2MatchHistory],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = model("FaceitProfile", faceitSchema);
