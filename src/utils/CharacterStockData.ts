export interface CharacterStockData {
  stock: string;
  character: string;
}

const CharacterStockData: CharacterStockData[] = [
  { stock: "NVDA", character: "jcal" },
  { stock: "GOOG", character: "friedberg" },
  { stock: "AMD", character: "chamath" },
  { stock: "PYPL", character: "sacks" },
  { stock: "SPCX", character: "charlie" },
];

export const currentCharacterStockData = () => {
  // Get the current date and time configured for the US Eastern time zone.
  // 'America/New_York' handles both EST and EDT automatically.
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const day = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

  // If the market is open, return the stock corresponding to the current day.

  if (process.env.REACT_APP_USE_MOCK_DATA === "true") {
    // Cycle every 10 seconds
    const secondsSinceEpoch = Math.floor(Date.now() / 1000);
    const index =
      Math.floor(secondsSinceEpoch / 60) % CharacterStockData.length;
    return CharacterStockData[index];
  }
  else {
    const minutsSinceEpoch = Math.floor(Date.now() / 60000);
    const index =
      Math.floor(minutsSinceEpoch / 60) % CharacterStockData.length;
    return CharacterStockData[index];
  }
};
