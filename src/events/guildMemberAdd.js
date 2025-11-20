const { Events, GuildMember } = require("discord.js");
const AutoRole = require("../models/autorole_schema");
const Welcome = require("../models/welcome_schema");
module.exports = {
  name: Events.GuildMemberAdd,

  /**
   * @param {GuildMember} member
   */
  async execute(member) {
    try {
      const guild = member.guild;
      if (!guild) return;

      const autoRole = await AutoRole.findOne({ guildId: guild.id });

      if (autoRole) {
        await member.roles.add(autoRole.roleId);
      }

      if (!member.user.bot) {
        const welcome = await Welcome.findOne({ guildId: guild.id });

        if (welcome) {
          await member.send(welcome.message);
        }
      }
    } catch (error) {
      console.error("Unexpected error during guildMemberAdd event", error);
    }
  },
};
