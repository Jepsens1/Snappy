const { model, Schema } = require("mongoose");

const autoRoleSchema = new Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  roleId: {
    type: String,
    required: true,
  },
});

module.exports = model("AutoRole", autoRoleSchema);
