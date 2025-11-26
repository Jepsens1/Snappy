const { Events } = require("discord.js");
const { startScheduler } = require("../utils/scheduler");
module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    startScheduler(client);
  },
};
