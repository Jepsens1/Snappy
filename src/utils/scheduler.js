const { EmbedBuilder } = require("discord.js");
const Remind = require("../models/remind_schema");
const { updateChampions } = require("../utils/champion");
const { CronJob } = require("cron");

function startScheduler(client) {
  const jobReminder = CronJob.from({
    cronTime: "* * * * *",
    onTick: async function () {
      console.log("[CRON] Minute Reminder");
      await checkForReminders(client);
    },
    start: true,
  });
  const jobUpdateChampions = CronJob.from({
    cronTime: "* * * * *",
    onTick: async function () {
      console.log("[CRON] Update Champions");
      await updateChampions();
    },
    start: true,
  });
}
async function checkForReminders(client) {
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
        .addFields({
          name: "Reminder from",
          value: `<t:${Math.floor(reminder.createdAt / 1000)}:F>`,
        });
      await user.send({ embeds: [embed] });
      await reminder.deleteOne();
      console.log("Reminder was sent out and removed from DB");
    }
  } catch (error) {
    console.error("Unexpected error during cron reminder", error);
  }
}

module.exports = { startScheduler };
