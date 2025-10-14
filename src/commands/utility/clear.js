const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType} = require('discord.js');

const data = new SlashCommandBuilder().setName('clear').setDescription('Clear all messages')
    .addIntegerOption(option => option.setName('count').setDescription('Number of messages to clear').setMaxValue(100)
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setContexts(InteractionContextType.Guild);
module.exports = {
    data: data,
    async execute(interaction) {
        const count = interaction.options.getInteger('count');

        const channel = await interaction.channel;

        const messages = await channel.messages.fetch({limit: count});

        await channel.bulkDelete(messages, true);

        await interaction.reply(`${count} messages were deleted.`);
    }
}