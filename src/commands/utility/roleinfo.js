const {
  SlashCommandBuilder,
  InteractionContextType,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roleinfo")
    .setDescription("display information about a role")
    .addRoleOption((option) =>
      option.setName("role").setDescription("role to lookup").setRequired(true),
    )
    .setContexts(InteractionContextType.Guild),
  /**
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();

    const role = interaction.options.getRole("role");
    if (role.toString() == "@everyone") {
      await interaction.editReply("You cannot lookup this role");
      return;
    }

    const roleData = {
      id: role.id,
      mention: role.toString(),
      name: role.name,
      color: role.hexColor,
      hoisted: role.hoist,
      position: role.position,
      mentionable: role.mentionable,
      managed: role.managed,
      permissions: role.permissions.toArray(),
      locale: interaction.guild.preferredLocale,
      created_at: role.createdAt,
    };
    try {
      const timestampOptions = {
        dateStyle: "medium",
        timeStyle: "short",
      };
      const roleEmbed = new EmbedBuilder()
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setColor(roleData.color)
        .addFields(
          { name: "ID", value: `${roleData.id}`, inline: true },
          { name: "Name", value: roleData.name, inline: true },
          { name: "Color", value: `${roleData.color}`, inline: true },
        )
        .addFields(
          {
            name: "Mention",
            value: `${roleData.mention}`,
            inline: true,
          },
          {
            name: "Hoisted",
            value: roleData.hoisted ? "Yes" : "No",
            inline: true,
          },
          {
            name: "Position",
            value: `${roleData.position - 1}`,
            inline: true,
          },
        )
        .addFields(
          {
            name: "Mentionable",
            value: roleData.mentionable ? "Yes" : "No",
            inline: true,
          },
          {
            name: "Managed",
            value: roleData.managed ? "Yes" : "No",
            inline: true,
          },
        )
        .addFields({
          name: "Key Permissions",
          value: `${roleData.permissions}`,
        })
        .setFooter({
          text: `Created | ${roleData.created_at.toLocaleString(roleData.locale, timestampOptions)}`,
        });
      await interaction.editReply({ embeds: [roleEmbed] });
    } catch (error) {
      await interaction.editReply("Unknown error during roleinfo");
      console.error("Unknown error during roleinfo", error);
    }
  },
};
