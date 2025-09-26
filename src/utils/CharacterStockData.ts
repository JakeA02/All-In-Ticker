export interface CharacterStockData {
    stock: string;
    character: string;
}

const CharacterStockData: CharacterStockData[] = [
    { stock: "TSLA", character: "jcal" },
    { stock: "URA", character: "friedberg" },
    { stock: "META", character: "chamath" },
    { stock: "AIQ", character: "sacks" },
    { stock: "IBB", character: "charlie" }
]

export const currentCharacterStockData = () => {
    // Get the current date and time configured for the US Eastern time zone.
    // 'America/New_York' handles both EST and EDT automatically.
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));

    const day = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
    const hour = now.getHours(); // 0-23
    const minute = now.getMinutes(); // 0-59

    // Check if the current day is a weekday (Monday to Friday).
    const isWeekday = day >= 1 && day <= 5;
    

    // Check if the current time is within market hours (9:30 AM to 4:00 PM).
    // Market opens at 9:30 AM.
    const isAfterOpen = hour > 9 || (hour === 9 && minute >= 30);
    // Market closes at 4:00 PM (16:00).
    const isBeforeClose = hour < 16;

    const isMarketHours = isAfterOpen && isBeforeClose;

    // If it's not a weekday or not within market hours, the market is closed.
    if (!isWeekday || !isMarketHours) {
        return null;
    }

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