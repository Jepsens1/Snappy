const LeagueOfLegends = require("../models/league_of_legends_schema");

/**
 * Get latest version tag from Data Dragon, used for getting latest champions, assets etc.
 * @returns {Promise<String>}
 */
async function getDataDragonVersion() {
  try {
    const res = await fetch(
      "https://ddragon.leagueoflegends.com/api/versions.json",
    );
    if (!res.ok) {
      throw new Error(`Data Dragon version API error ${res.status}`);
    }
    const data = await res.json();

    // Empty response
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Data Dragon version API returned empty response");
    }
    return data[0];
  } catch (error) {
    console.warn("Error during fetch Data Dragon Version", error.message);
    throw error;
  }
}

/**
 * Get all champions data for a given version
 * @param {String} version
 */
async function getDataDragonChampions(version) {
  try {
    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
    );
    if (!res.ok) {
      throw new Error(`Data Dragon champion.json API error ${res.status}`);
    }
    const json = await res.json();
    const championsData = Object.values(json.data);
    if (!championsData || championsData.length === 0) {
      throw new Error("Data Dragon champion.json API returned empty response");
    }

    const championsArray = championsData.map((champ) => ({
      id: champ.id,
      key: parseInt(champ.key),
      name: champ.name,
      image: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.image.full}`,
    }));
    console.log(
      `Champion data updated for version ${version} – ${championsArray.length} champions`,
    );
    return championsArray;
  } catch (error) {
    console.warn("Error during fetching champion", error.message);
    throw error;
  }
}

async function getQueueTypes() {
  try {
    const res = await fetch(
      "https://static.developer.riotgames.com/docs/lol/queues.json",
    );

    if (!res.ok) {
      throw new Error(`Data Dragon queues.json API error ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`Data Dragon queues.json API returned empty response`);
    }
    // Maps API response to valid game modes
    const validGameModes = data
      .filter((entry) => entry.queueId !== 0 && entry.notes == null)
      .map((q) => ({
        queueId: q.queueId,
        map: q.map,
        description: q.description,
      }));

    return validGameModes;
  } catch (error) {
    console.warn("Error during fetch queue types", error.message);
    throw error;
  }
}

async function saveToDatabase(version, champions, gameModes, currentVersion) {
  if (currentVersion == null) {
    await LeagueOfLegends.updateOne(
      {
        version: version,
      },
      {
        $set: {
          champions: champions,
          queues: gameModes,
        },
      },
      { upsert: true },
    );
  } else {
    await LeagueOfLegends.updateOne(
      {
        version: currentVersion,
      },
      {
        $set: {
          version: version,
          champions: champions,
          queues: gameModes,
        },
      },
      { upsert: true },
    );
  }
}
/**
 * Updates database with latest champions
 * @returns {Promise<{needsUpdate: boolean; version: String}>} boolean flag if emoji needs to be updated in guild
 */
async function updateChampions() {
  try {
    // 1. Check if database is empty
    const versions = await LeagueOfLegends.find();
    if (versions.length === 0) {
      console.log(
        "No versions found in database. Fetching version & champions",
      );
      const version = await getDataDragonVersion();
      const champions = await getDataDragonChampions(version);
      const gamemodes = await getQueueTypes();
      await saveToDatabase(version, champions, gamemodes, null);
      return { needsUpdate: true, version: version };
    }
    // 2. Compare current version in database & latest version from Data Dragon
    const currentVerion = versions[0].version;
    const latestVersion = await getDataDragonVersion();

    if (currentVerion === latestVersion) {
      console.log("Latest version from Data Dragon already in database");
      return { needsUpdate: false, version: currentVerion };
    }
    // 3. Newer version found, update database
    console.log(
      `Newer version from Data Dragon found (${latestVersion} > ${currentVerion})...Updating champions and queue types`,
    );
    const champions = await getDataDragonChampions(
      latestVersion,
      currentVerion,
    );
    const gamemodes = await getQueueTypes();
    await saveToDatabase(latestVersion, champions, gamemodes, currentVerion);
    return { needsUpdate: true, version: latestVersion };
  } catch (error) {
    console.log(error);
    return false;
  }
}
module.exports = {
  updateChampions,
};
