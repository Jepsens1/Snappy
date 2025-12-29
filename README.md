# Snappy: The All-in-One Discord Bot
A Discord bot that provides CS2 steam stats • CS2 faceit stats • LoL player stats & Match history • Moderation • Fun Commands • Dice rolls • and more

## Motivation
There are a lot of Discord bots out there, but they do not meet some of the requirements that i need. Snappy is the Discord Bot you need for getting relevant information in games like. CS2 and LoL.
I myself play a lot Counter-Strike, and i was frustrated by my inability to easily lookup opponents stats such as: Hours played, Faceit Rank, K/D, ADR and HS%.
Or when i played League of Legends having different programs or tabs open
to see opponents stats & match history. So i built Snappy and now i can lookup relevant information with ease!

## 🚀 Quick Start

### Create Discord Bot
First you need to create a Discord Application/Bot in the Discord Developer Portal
Follow the guide or search the web, how to create a discord bot

Link: [Discord Developer Portal](https://discord.com/developers/docs/intro)

### Create MongoDB account
You will also need to create a MongoDB database, either by using the Cloud or running on your machine
Follow the guide or search the web, how to create mongodb database

Link: [MongoDB Database Guide](https://www.mongodb.com/resources/products/fundamentals/create-database)

### Clone repository and install dependencies using npm

```bash
git clone https://github.com/Jepsens1/Snappy.git
cd Snappy
npm install
```

### Create .env file
Create a .env file in root directory of the project and fill out the values
```env
MONGODB_URI=<mongodb connection string>
BOT_TOKEN=
GUILD_ID=
CLIENT_ID=<Discord bot client id>
LEAGUE_OF_LEGENDS_API_KEY=
STEAM_API_KEY=
FACEIT_API_KEY=
```

# Deploy commands to your guild
> [!NOTE]
> For first time use, it's important you run this command.
> If you add a new Slash command or add/update/remove properties to a Slash command. Be sure to also run this script  
```bash
npm run deploy-commands
```
# Start the bot
To start the bot run the following command
```bash
npm run start
```

To start the bot in Development mode use the following command
```bash
npm run dev
```

## 📖 Usage

Available commands:
- `/help` - ***Needs revision***
- `/about` - Shows Bot-version, Server count and Uptime
- `/uptime` - Display in date format how long the bot has been online
- `/invite` - Creates a invite link to Discord Guild. Option to select expire time, User limit and if the invite link is temporary
- `/serverinfo` - Display essential information about the Discord Guild
- `/userinfo` - Display essential information about a Discord Member
- `/avatar` - Display a Discord Member avatar picture, Option to select different sizes (Default 1024px)
- `/roles` - Display all the roles in the Discord Guild
- `/clear` - Removes x amount of messages in a TextChannel (X range between 1-100)
- `/kick` - Kick a member from the Discord Guild. Option to provide a reason
- `/ban` - Ban a member from the Discord Guild. Option to provide a reason
- `/timeout` - Timeout a Member for a given duration and reason
- `/warn` - Gives Member a warning, support for given multiple warnings
- `/removewarn` - Remove one or all warnings for a member
- `/unban` - Unbans a member
- `/untimeout` - Removes timeout for a member
- `/roll` - Rolles a dice, option to provide how many sides and number of times to roll a dice (Default count is 1)
- `/fact` - Display today's fact
- `/meme ` - Display a random meme
- `/coinflip` - Flip a coin
- `/lol stats` - Get Profile, Summoner Level, Region, Ranked stats for Solo/Duo & Ranked Flex, Last 10 games
- `/lol history` - Get Profile, Extended last 10 games stats
- `/cs2 steamprofile` - Get essential stats for player
- `/cs2 faceit` - Get essential stats for a faceit player
- `/remind create` - Create a reminder that will be received in DM
- `/remind list` - Displays all reminder created
- `/remind remove` - Remove all reminders
- `/poll create` - Create a poll using Discord native poll system
- `/poll end` - End a poll
- `/autorole configure` - Select a role to assign new Guild Members a role automatically when joining the Guild
- `/autorole disable` - Disables automatically assigning new Guild Members a role when joining a Guild
- `/welcome configure` - Write a text that the bot should send to new Members when joining the Guild
- `/welcome disable` - Disables auto welcome message when guild members join the guild

## Examples

Get LoL Player Stats
```bash
/lol stats <summoner> <tagline>
```

Get LoL Match hisyory
```bash
/lol history <summoner> <tagline>
```

Get steam player stats for CS2
```bash
/cs2 steamprofile <steamid>
```
Get faceit player stats for CS2
```bash
/cs2 faceit <faceit nickname>
```



