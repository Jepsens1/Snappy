const { MessageFlags } = require("discord.js");

module.exports = {
  /**
   * @param {import("discord.js").Interaction} interaction
   * @param {import("discord.js").GuildMember} member
   * @param {string} action
   * @returns {boolean}
   */
  async handlePermissionRights(interaction, member, action) {
    // Simply returns true if the interaction member is the guild owner
    if (interaction.member.user.id == interaction.guild.ownerId) {
      return true;
    }
    const targetUserRolePosition = member.guild.roles.highest.position;
    const requestUserRolePosition = interaction.member.roles.highest.position;
    const botRolePosition = interaction.guild.members.me.roles.highest.position;
    if (targetUserRolePosition >= requestUserRolePosition) {
      await interaction.reply({
        content: `You can't ${action} that user because they have same/higher role than you`,
        flags: MessageFlags.Ephemeral,
      });
      return false;
    }
    if (targetUserRolePosition >= botRolePosition) {
      await interaction.reply({
        content: `I can't ${action} that user because they have same/higher role as me.`,
        flags: MessageFlags.Ephemeral,
      });
      return false;
    }
    return true;
  },
};
