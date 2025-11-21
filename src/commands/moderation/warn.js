const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const Warning = require("../../models/warning_schema");
const { handlePermissionRights } = require("../../utils/checkPermissions");
/**
 * @param {string} issuerId
 * @param {string} userId
 * @param {string} reason
 * @param {string} guildId
 * @param {number} duration
 */
async function createWarning(userId, issuerId, guildId, reason, duration) {
  const warning = new Warning({
    userId: userId,
    guildId: guildId,
    reason: reason,
    issuedBy: issuerId,
    expiresAt: new Date(Date.now() + duration * 1000),
  });
  await warning.save();
}

/**
 * @param {string} reason
 * @param {string} guildId
 * @param {number} duration
 * @param {import('discord.js').Interaction} interaction
 * @param {import('discord.js').GuildMember} member
 */
async function confirmNewWarning(
  warnings,
  interaction,
  member,
  guildId,
  reason,
  duration,
) {
  const embed = new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle(`Warnings for ${member.user.tag}`)
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp();

  warnings.forEach((w, i) => {
    const created = `<t:${Math.floor(w.createdAt / 1000)}:f>`;
    const expires = `<t:${Math.floor(w.expiresAt / 1000)}:R>`;

    embed.addFields({
      name: `Warning #${i + 1}: ${w.reason}`,
      value: `**Given** ${created}\n**Expires** ${expires}`,
      inline: false,
    });
  });
  const confirm = new ButtonBuilder()
    .setCustomId("confirm")
    .setLabel("Confirm new warning")
    .setStyle(ButtonStyle.Danger);

  const cancel = new ButtonBuilder()
    .setCustomId("cancel")
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(cancel, confirm);
  const response = await interaction.reply({
    components: [row],
    embeds: [embed],
    withResponse: true,
  });
  const collectorFilter = (i) => i.user.id === interaction.user.id;

  try {
    const confirmation = await response.resource.message.awaitMessageComponent({
      filter: collectorFilter,
      time: 60_000,
    });
    if (confirmation.customId === "confirm") {
      await createWarning(
        member.user.id,
        interaction.user.id,
        guildId,
        reason,
        duration,
      );
      await confirmation.update({
        content: `${member.user.tag} has been given a new warning reason: ${reason}`,
        components: [],
        embeds: [],
      });
    } else if (confirmation.customId === "cancel") {
      await confirmation.update({
        content: "Action cancelled",
        components: [],
        embeds: [],
      });
    }
  } catch {
    await interaction.editReply({
      content: "Confirmation not received within 1 minute, cancelling",
      components: [],
      embeds: [],
    });
  }
}
module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("give member a written warning")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("member to write warning")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("reason for member to recieve warning")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription("duration for when the warning should expire")
        .setRequired(true)
        .addChoices(
          { name: "30 minutes", value: 1800 },
          { name: "1 hour", value: 3600 },
          { name: "2 hours", value: 7200 },
          { name: "4 hours", value: 14400 },
          { name: "6 hours", value: 21600 },
          { name: "1 day", value: 86400 },
          { name: "7 days", value: 604800 },
        ),
    ),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    const member = interaction.options.getMember("member");
    const reason = interaction.options.getString("reason");
    const duration = interaction.options.getInteger("duration");

    if (member.user.bot) {
      await interaction.reply({
        content: "You cannot warn a bot",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (member.user.id === interaction.guild.ownerId) {
      await interaction.reply({
        content:
          "You cannot warn the provided member, cause it's the owner of this guild",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    // Check is interaction member has sufficient role to execute this command
    const hasSufficientRights = await handlePermissionRights(
      interaction,
      member,
      "warn",
    );
    if (!hasSufficientRights) return;

    try {
      // Check if member already has a warning
      const warnings = await Warning.find({
        userId: member.user.id,
        guildId: interaction.guildId,
        expiresAt: { $gt: new Date() },
      });

      if (warnings.length > 0) {
        // Ask author if a new warning should be issued
        await confirmNewWarning(
          warnings,
          interaction,
          member,
          interaction.guildId,
          reason,
          duration,
        ).catch(console.error);
      } else {
        await createWarning(
          member.user.id,
          interaction.user.id,
          interaction.guildId,
          reason,
          duration,
        );
        await interaction.reply({
          content: `A warning was created for ${member.user.tag}`,
          flags: MessageFlags.Ephemeral,
        });
        await interaction.channel.send(
          `${member.user.toString()} you have just been given a warning for: ${reason}. The warning was issued by: ${interaction.user.toString()}`,
        );
      }
    } catch (error) {
      await interaction.reply({
        content: "Unexpected error during /warn",
        flags: MessageFlags.Ephemeral,
      });
      console.error("Unexpected error during /warn", error);
    }
  },
};
