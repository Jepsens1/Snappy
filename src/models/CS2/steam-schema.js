const { model, Schema } = require("mongoose");

const steamProfileSchema = new Schema(
  {
    steamId: {
      type: String,
      required: true,
      unique: true,
    },
    steamLevel: {
      type: Number,
      required: true,
    },
    personaName: {
      type: String,
      required: true,
    },
    profileUrl: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
      required: true,
    },
    personaState: {
      type: Number,
      required: true,
      default: 0,
    },
    lastLogOff: {
      type: Number,
      required: false,
      default: null,
    },
    timeCreated: {
      type: Number,
      required: false,
      default: null,
    },
    currentlyPlaying: {
      type: String,
      required: false,
      default: null,
    },
    hoursPlayed: [
      {
        playtime_2weeks: {
          type: Number,
          required: false,
          default: 0,
        },
        playtime_forever: {
          type: Number,
          required: false,
          default: 0,
        },
        last_played: {
          type: Number,
          required: false,
          default: 0,
        },
      },
    ],
    vacBanned: {
      type: Boolean,
      required: false,
      default: false,
    },
    numberOfVacBans: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  { timestamps: true },
);

// Remove documents with no activity after 7 days
steamProfileSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 604800 });
module.exports = model("SteamProfile", steamProfileSchema);
