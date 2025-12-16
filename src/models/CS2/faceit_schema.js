const { model, Schema } = require("mongoose");

const cs2Stats = new Schema({
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
});

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
    cs2: {
      type: cs2Stats,
    },
  },
  { timestamps: true },
);

module.exports = model("FaceitProfile", faceitSchema);
