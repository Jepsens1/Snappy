/**
 * @property {string} title
 * @property {string} image
 * @property {string} upVotes
 * @property {string} subreddit
 */
class Meme {
  constructor(title, image, author, upVotes, subreddit) {
    this.title = title;
    this.image = image;
    this.author = author;
    this.upVotes = upVotes;
    this.subreddit = subreddit;
  }
}

/**
 * @returns {Promise<Meme>}
 */
async function fetchRandomMeme() {
  const res = await fetch("https://meme-api.com/gimme");
  if (!res.ok) {
    throw new Error("Random Meme not found");
  }
  const meme = await res.json();
  if (!meme.url || meme.url.trim() === "") {
    throw new Error("Meme image property is empty");
  }
  let title = "No title";
  if (meme.title && meme.title.trim() !== "") {
    title = meme.title;
  }
  return new Meme(title, meme.url, meme.author, meme.ups, meme.subreddit);
}

module.exports = fetchRandomMeme;
