export interface CharacterStockData {
  stock: string;
  character: string;
}

const CharacterStockData: CharacterStockData[] = [
  { stock: "TSLA", character: "jcal" },
  { stock: "URA", character: "friedberg" },
  { stock: "AEXA", character: "chamath" },
  { stock: "AIQ", character: "sacks" },
  { stock: "IBB", character: "charlie" },
];

export const currentCharacterStockData = () => {
  // Get the current date and time configured for the US Eastern time zone.
  // 'America/New_York' handles both EST and EDT automatically.
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const day = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

  // If the market is open, return the stock corresponding to the current day.
  switch (day) {
    case 1: // Monday
      return CharacterStockData[0];
    case 2: // Tuesday
      return CharacterStockData[1];
    case 3: // Wednesday
      return CharacterStockData[2];
    case 4: // Thursday
      return CharacterStockData[3];
    case 5: // Friday
      return CharacterStockData[4];
    default:
      return null;
  }
};
