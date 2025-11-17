const Fact = require("../models/fact_schema");

/**
 * @returns {Promise<string>}
 */
async function fetchRandomFact() {
  try {
    const res = await fetch("");
    if (!res.ok) throw new Error("Fact not found");
    const fact = await res.json();
    return fact.text;
  } catch (error) {
    console.error("Error during fetch fact", error);
    return "Could not fetch random fact";
  }
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
      return existing.fact;
    }

    const randomFact = fetchRandomFact();
    const fact = new Fact({ fact: randomFact, date: new Date() });
    await fact.save();

    return fact.fact;
  } catch (error) {
    console.error(
      "Unexpected error happened during fetching today's fact",
      error,
    );
    return "Error: No fact available";
  }
}

module.exports = fetchTodaysFact;
