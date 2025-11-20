const { Events, GuildMember } = require("discord.js");
const AutoRole = require("../models/autorole");
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

      if (!autoRole) {
        return;
      }
      await member.roles.add(autoRole.roleId);
    } catch (error) {
      console.error("Unexpected error during guildMemberAdd event", error);
    }
  },
};
