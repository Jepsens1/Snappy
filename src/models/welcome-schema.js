const { model, Schema } = require("mongoose");

const welcomeSchema = new Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  message: {
    type: String,
    required: true,
  },
});

module.exports = model("Welcome", welcomeSchema);
