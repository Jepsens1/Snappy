function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const daysPart = days > 0 ? `${days}:` : "";
  const hoursPart = hours.toString().padStart(2, "0");
  const minutesPart = minutes.toString().padStart(2, "0");
  const secondsPart = seconds.toString().padStart(2, "0");

  return `${daysPart}${hoursPart}:${minutesPart}:${secondsPart}`;
}

module.exports = formatTime;
