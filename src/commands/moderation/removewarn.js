const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const Warning = require("../../models/warning_schema");

/**
 * @param {import('discord.js').Interaction} interaction
 * @param {import('discord.js').GuildMember} member
 */
async function handleDeletion(interaction, member, warnings, query) {
  const deleteAllButton = new ButtonBuilder()
    .setCustomId("delete_warning_all")
    .setLabel("Delete all warnings")
    .setStyle(ButtonStyle.Danger);

  const cancelButton = new ButtonBuilder()
    .setCustomId("cancel")
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Secondary);

  const issuedByIds = [...new Set(warnings.map((w) => w.issuedBy))];
  const issuedByMembers = await interaction.guild.members.fetch({
    user: issuedByIds,
  });
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("delete_warning_select")
    .setPlaceholder("Select a warning to remove")
    .addOptions(
      warnings.map((w, i) => {
        const issuer = issuedByMembers.get(w.issuedBy);
        return {
          label: `Warning #${i + 1}: ${w.reason.substring(0, 50)}`,
          description: `Issued by: ${issuer.displayName}`,
          value: w._id.toString(),
        };
      }),
    );
  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle(`Delete warnings for ${member.user.tag}`)
    .setDescription(
      `Select either one warning to delete, or press "Delete all warnings".\n\n**Active warnings:** ${warnings.length}`,
    )
    .setThumbnail(member.user.displayAvatarURL());
  const response = await interaction.reply({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(selectMenu),
      new ActionRowBuilder().addComponents(deleteAllButton),
      new ActionRowBuilder().addComponents(cancelButton),
    ],
    flags: MessageFlags.Ephemeral,
    withResponse: true,
  });
  const collectorFilter = (i) => i.user.id === interaction.user.id;

  const collector = response.resource.message.createMessageComponentCollector({
    filter: collectorFilter,
    time: 60_000,
  });

  collector.on("collect", async (i) => {
    try {
      if (i.isStringSelectMenu()) {
        const warningId = i.values[0];
        await Warning.deleteOne({ _id: warningId });
        await i.update({
          content: "Warning deleted!",
          components: [],
          embeds: [],
        });
      }
      if (i.isButton() && i.customId === "delete_warning_all") {
        await Warning.deleteMany(query);

        await i.update({
          content: `All ${warnings.length} warnings removed for ${member.user.tag}!`,
          components: [],
          embeds: [],
        });
        await interaction.channel.send(
          `${member.toString()} i have some great news for you. ${interaction.user.toString()} has decided to remove all your warnings in this guild.\nIsn't that great :smiley:`,
        );
      }

      if (i.isButton() && i.customId === "cancel") {
        await i.update({
          content: "Cancelled removal of warnings",
          components: [],
          embeds: [],
        });
      }
      collector.stop();
    } catch (error) {
      console.error(error);
      await i.editReply({
        content: "Error occured during collection",
        flags: MessageFlags.Ephemeral,
      });
    }
  });
  collector.on("end", (collected) => {
    if (collected.size === 0) {
      response.editReply({
        content: "Confirmation not recieved within 1 minute, cancelling",
        components: [],
        embeds: [],
      });
    }
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removewarn")
    .setDescription("remove all or one warning from guild member")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("member to remove one/more warnings")
        .setRequired(true),
    )
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  /**
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    const member = interaction.options.getMember("member");
    if (member.user.bot) {
      await interaction.reply({
        content: "Selecting a bot is not allowed!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    try {
      const query = {
        userId: member.user.id,
        guildId: interaction.guildId,
        expiresAt: { $gt: new Date() },
      };
      const warnings = await Warning.find(query);
      if (warnings.length === 0) {
        await interaction.reply({
          content:
            "This member does not have any active warnings in this guild",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await handleDeletion(interaction, member, warnings, query).catch(
        console.error,
      );
    } catch (error) {
      console.error("Error during removal of warning", error);
    }
  },
};
