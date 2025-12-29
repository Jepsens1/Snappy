const {
  SlashCommandBuilder,
  InteractionContextType,
  EmbedBuilder,
} = require("discord.js");

const fetchRandomMeme = require("../../utils/fetch-random-meme");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("meme")
    .setDescription("Send a random meme to the channel")
    .setContexts(InteractionContextType.Guild),

  /**
   * @param {import("discord.js").Interaction} interaction
   */
  async execute(interaction) {
    try {
      await interaction.deferReply();
      const meme = await fetchRandomMeme();

      const embed = new EmbedBuilder()
        .setColor("Random")
        .setTitle(meme.title)
        .addFields(
          { name: "Author", value: `${meme.author}` },
          { name: "SubReddit", value: `${meme.subreddit}`, inline: true },
          { name: "Upvotes", value: `${meme.upVotes}`, inline: true },
        )
        .setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setImage(meme.image);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Unexpected error during /meme", error);
      await interaction.editReply({
        content: "Unexpected error happened during /meme",
      });
    }
  },
};
