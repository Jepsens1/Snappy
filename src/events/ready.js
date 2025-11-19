const { Events, EmbedBuilder } = require("discord.js");
const Remind = require("../models/remind_schema");
const cron = require("node-cron");
module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    cron.schedule("* * * * *", async () => {
      try {
        const now = new Date();
        const expired = await Remind.find({
          expiresAt: { $lte: now },
        });
        for (const reminder of expired) {
          const user = await client.users.fetch(reminder.userId);
          const embed = new EmbedBuilder()
            .setTitle("Reminder")
            .setDescription(reminder.content)
            .setColor("Random")
            .setFooter({
              text: `Reminder from ${reminder.createdAt}`,
            });
          await user.send({ embeds: [embed] });
          await reminder.deleteOne();
          console.log("Reminder was sent out and removed from DB");
        }
      } catch (error) {
        console.error("Unexpected error during cron reminder", error);
      }
    });
  },
};
