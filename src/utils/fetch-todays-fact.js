const Fact = require("../models/fact-schema");

/**
 * @returns {Promise<string | undefined>}
 */
async function fetchRandomFact() {
  const res = await fetch("https://uselessfacts.jsph.pl/random.json");
  if (!res.ok) throw new Error("Fact not found");
  const fact = await res.json();
  if (!fact.text || fact.text.trim() === "") {
    throw new Error("Empty fact json");
  }
  return fact.text;
}
/**
 * @returns {Promise<string>}
 */
async function fetchTodaysFact() {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // Check if todays fact exist in database
    const existing = await Fact.findOne({ date: { $gte: start, $lte: end } });
    if (existing) {
      console.log("Found fact in database");
      return existing.fact;
    }
    console.log("Could not find fact in database...Searching for new");
    const randomFact = await fetchRandomFact().then(
      console.log("Found new fact from the web"),
    );
    const fact = new Fact({ fact: randomFact, date: new Date() });
    await fact.save();

    return fact.fact;
  } catch (error) {
    console.error(
      "Unexpected error happened during fetching today's fact",
      error,
    );
    return "Error: No fact available. Please Try again.";
  }
}

module.exports = fetchTodaysFact;
