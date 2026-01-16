const { createClient } = require("redis");

let redisClient;
let isReady = false;

async function getRedisClient() {
  if (redisClient) {
    if (isReady) {
      return redisClient;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return redisClient;
  }
  redisClient = createClient();

  // Set up events
  redisClient.on("error", (err) => console.error("Redis Client Error", err));
  redisClient.on("connect", () => console.log("Redis Client Connected"));
  redisClient.on("ready", () => {
    isReady = true;
    console.log("Redis Client Ready");
  });
  redisClient.on("reconnecting", () =>
    console.log("Redis Client Reconnecting"),
  );
  redisClient.on("end", () => {
    isReady = false;
    console.log("Redis Client Disconnected");
  });
  await redisClient.connect();

  return redisClient;
}

module.exports = getRedisClient;
