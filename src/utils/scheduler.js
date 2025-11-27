const { EmbedBuilder } = require("discord.js");
const Remind = require("../models/remind_schema");
const { uploadChampionEmojis } = require("../utils/uploadChampionEmoji");
const { CronJob } = require("cron");

function startScheduler(client) {
  const jobReminder = CronJob.from({
    cronTime: "* * * * *",
    onTick: async function () {
      await checkForReminders(client);
    },
    start: true,
  });
  const jobUpdateChampions = CronJob.from({
    cronTime: "0 6 * * *",
    onTick: async function () {
      console.log("[CRON] Update Champions");
      await uploadChampionEmojis(client);
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
      console.log("[CRON] Reminder JOB");
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
      console.log("[CRON] Reminder was sent out and removed from DB");
    }
  } catch (error) {
    console.error("Unexpected error during cron reminder", error);
  }
}

module.exports = { startScheduler };
