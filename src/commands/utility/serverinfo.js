const {
  SlashCommandBuilder,
  InteractionContextType,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Display essential server information")
    .setContexts(InteractionContextType.Guild),
  /**
   *
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    try {
      const response = {
        serverName: interaction.guild.name,
        serverId: interaction.guildId,
        owner: await interaction.guild.fetchOwner(),
        created_at: interaction.guild.createdAt,
        members: interaction.guild.memberCount,
        category_channels: interaction.guild.channels.cache.filter(
          (c) => c.type === ChannelType.GuildCategory,
        ),
        voice_channels: interaction.guild.channels.cache.filter(
          (c) => c.type === ChannelType.GuildVoice,
        ),
        text_channels: interaction.guild.channels.cache.filter(
          (c) => c.type === ChannelType.GuildText,
        ),
        bots: interaction.guild.members.cache.filter((m) => m.user.bot),
        boost: interaction.guild.premiumSubscriptionCount,
        roles: interaction.guild.roles.cache,
        rolesList: interaction.guild.roles.cache
          .sort((a, b) => b.position - a.position)
          .map((r) => r.name),
        tier: interaction.guild.premiumTier,
        icon: interaction.guild.iconURL(),
        verificationLevel: interaction.guild.verificationLevel,
        locale: interaction.guild.preferredLocale,
        banner: interaction.guild.bannerURL(),
      };

      const verificationLevelMap = {
        1: "Low",
        2: "Medium",
        3: "High",
      };
      const boostEmoji = {
        0: "❌",
        1: "🟢",
        2: "🔵",
        3: "🟣",
      };
      const timestampOptions = { dateStyle: "medium", timeStyle: "short" };
      const serverEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setAuthor({
          name: response.serverName,
          iconURL: response.icon,
        })
        .setThumbnail(response.icon)
        .setImage(response.banner)
        .addFields(
          {
            name: "Owner",
            value: `${response.owner.user.username}`,
            inline: true,
          },
          {
            name: "Members",
            value: `${response.members} (${response.bots.size} bots)`,
            inline: true,
          },
          { name: "Roles", value: `${response.roles.size}`, inline: true },
          {
            name: "Category Channels",
            value: `${response.category_channels.size}`,
            inline: true,
          },
          {
            name: "Text Channels",
            value: `${response.text_channels.size}`,
            inline: true,
          },
          {
            name: "Voice Channels",
            value: `${response.voice_channels.size}`,
            inline: true,
          },
          { name: "Role list", value: `${response.rolesList}` },
          {
            name: "Boosts",
            value: `${boostEmoji[response.boost]} ${response.boost} (Tier ${response.tier})`,
          },
          {
            name: "Verification level",
            value: `${verificationLevelMap[response.verificationLevel]}`,
          },
        )
        .setFooter({
          text: `ID: ${response.serverId} | Created ${response.created_at.toLocaleString(response.locale, timestampOptions)}`,
        });
      await interaction.reply({
        embeds: [serverEmbed],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Unexpected error during /serverinfo", error);
      await interaction.reply({
        content: "Unexpected error during /serverinfo",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
