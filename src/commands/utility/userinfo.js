const {
  SlashCommandBuilder,
  InteractionContextType,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Display essential user information")
    .addUserOption((option) =>
      option.setName("user").setDescription("user to lookup").setRequired(true),
    )
    .setContexts(InteractionContextType.Guild),
  /**
   *
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getMember("user");
    const response = {
      username: targetUser.user.username,
      mentionable: targetUser.toString(),
      id: targetUser.id,
      nickname: targetUser.nickname,
      // TODO Xp/Level
      joined: targetUser.joinedAt,
      registered: targetUser.user.createdAt,
      avatar: targetUser.displayAvatarURL(),
      isBot: targetUser.user.bot,
      rolesCount: targetUser.roles.cache.filter((r) => r.name !== "@everyone")
        .size,
      roles: targetUser.roles.cache
        .filter((r) => r.name !== "@everyone")
        .sort((a, b) => b.position - a.position)
        .map((r) => r.toString()),
      highestRole: targetUser.roles.highest.toString(),
      status: targetUser.presence?.status,
      activity: targetUser.presence?.activities,
      timeout: targetUser.communicationDisabledUntil,
      banner: targetUser.displayBannerURL(),
      locale: targetUser.guild.preferredLocale,
      keyPermissions: targetUser.permissions.toArray(),
    };

    const userEmbed = new EmbedBuilder()
      .setColor("Red")
      .setAuthor({
        name: response.username,
        iconURL: response.avatar,
      })
      .setDescription(response.mentionable)
      .setThumbnail(response.avatar)
      .setImage(response.banner)
      .addFields(
        {
          name: "Nickname",
          value: response.nickname
            ? `${response.nickname}`
            : "No nickname in this guild",
        },
        {
          name: "Joined",
          value: `${response.joined.toLocaleString(response.locale)}`,
          inline: true,
        },
        {
          name: "Registered",
          value: `${response.registered.toLocaleString(response.locale)}`,
          inline: true,
        },
        { name: "Bot?", value: response.isBot ? "Yes" : "No" },
        {
          name: `Roles[${response.rolesCount}]`,
          value: `${response.roles}`,
          inline: true,
        },
        {
          name: "Highest role",
          value: `${response.highestRole}`,
          inline: true,
        },
        {
          name: "Timeout",
          value: response.timeout
            ? `${response.timeout.toLocaleString(response.locale)}`
            : `${response.mentionable} is not timed out`,
        },
        { name: "Key Permissions", value: `${response.filtered}` },
        {
          name: "Status",
          value: response.status ? `${response.status}` : "N/A",
          inline: true,
        },
        {
          name: "Activity",
          value: response.activity ? `${response.activity}` : "N/A",
          inline: true,
        },
      )
      .setTimestamp()
      .setFooter({ text: `ID: ${response.id}` });
    await interaction.editReply({ embeds: [userEmbed] });
  },
};

