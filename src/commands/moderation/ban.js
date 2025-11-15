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
  .setName("ban")
  .setDescription("Select a member and ban them.")
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription("The member to ban")
      .setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("Reason for ban"),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
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
        "You can't ban that user because they're the server owner.",
      );
      return;
    }
    const hasSufficientRights = await handlePermissionRights(
      interaction,
      target,
      "ban",
    );
    if (!hasSufficientRights) return;
    const confirm = new ButtonBuilder()
      .setCustomId(CONFIRM)
      .setLabel("Confirm Ban")
      .setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
      .setCustomId(CANCEL)
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(cancel, confirm);
    const response = await interaction.reply({
      content: `Are you sure you want to ban ${target} for reason: ${reason}?`,
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
        await interaction.guild.members.ban(target, { reason: reason });
        await confirmation.update({
          content: `${target.user.tag} has been banned for reason: ${reason}`,
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
