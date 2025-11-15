const {
  InteractionContextType,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { handlePermissionRights } = require("../../utils/checkPermissions");

const CONFIRM = "confirm";
const CANCEL = "cancel";

const data = new SlashCommandBuilder()
  .setName("kick")
  .setDescription("Select a member and ban them.")
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription("The member to kick")
      .setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("Reason for kick"),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
  .setContexts(InteractionContextType.Guild);

module.exports = {
  data: data,
  /**
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    const target = interaction.options.getMember("target");
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";

    if (target.user.id == interaction.guild.ownerId) {
      await interaction.reply(
        "You can't kick that user because they're the server owner.",
      );
      return;
    }
    const hasSufficientRights = handlePermissionRights(
      interaction,
      target,
      "kick",
    );
    if (!hasSufficientRights) return;
    const confirm = new ButtonBuilder()
      .setCustomId(CONFIRM)
      .setLabel("Confirm Kick")
      .setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
      .setCustomId(CANCEL)
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(cancel, confirm);
    const response = await interaction.reply({
      content: `Are you sure you want to kick ${target} for reason: ${reason}?`,
      components: [row],
      withResponse: true,
    });
    const collectorFilter = (i) => i.user.id === interaction.user.id;
    try {
      const confirmation =
        await response.resource.message.awaitMessageComponent({
          filter: collectorFilter,
          time: 60_000,
        });

      if (confirmation.customId === CONFIRM) {
        await interaction.guild.members.kick(target, reason);
        await confirmation.update({
          content: `${target.user.tag} has been kicked for reason: ${reason}`,
          components: [],
        });
      } else if (confirmation.customId === CANCEL) {
        await confirmation.update({
          content: "Action cancelled",
          components: [],
        });
      }
    } catch {
      await interaction.editReply({
        content: "Confirmation not received within 1 minute, cancelling",
        components: [],
      });
    }
  },
};
