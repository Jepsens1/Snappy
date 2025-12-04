const { model, Schema } = require("mongoose");

const leagueOfLegendsSchema = new Schema({
  version: {
    type: String,
    required: true,
    unique: true,
  },
  queues: [
    {
      queueId: {
        type: Number,
        required: true,
        unique: true,
      },
      map: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
    },
  ],
  champions: [
    {
      id: {
        type: String,
        required: true,
        unique: true,
      },
      key: {
        type: Number,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = model("LeagueOfLegends", leagueOfLegendsSchema);
