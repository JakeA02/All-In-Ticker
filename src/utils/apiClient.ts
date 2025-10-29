/**
 * API client utility to handle API calls
 * In development, you can either:
 * 1. Run `vercel dev` instead of `npm start` to test API routes locally
 * 2. Use mock data (set REACT_APP_USE_MOCK_DATA=true)
 * 3. The app will automatically fall back to mock data if API calls fail
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const apiClient = {
  async getMarketStatus() {
    const response = await fetch(`${API_BASE_URL}/api/market-status`);
    if (!response.ok) {
      const responseText = await response.text();
      console.error('Market status API error - Status:', response.status);
      console.error('Market status API error - Response:', responseText);
      
      let errorMessage = 'Unknown error';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.message || responseText;
      } catch {
        errorMessage = responseText || 'Unknown error';
      }
      
      throw new Error(`API error: ${response.status} - ${errorMessage}`);
    }
    return response.json();
  },

  async getStockQuote(symbol: string) {
    const response = await fetch(`${API_BASE_URL}/api/stock-quote?symbol=${symbol}`);
    if (!response.ok) {
      const responseText = await response.text();
      console.error('Stock quote API error - Status:', response.status);
      console.error('Stock quote API error - Response:', responseText);
      
      let errorMessage = 'Unknown error';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.message || responseText;
      } catch {
        errorMessage = responseText || 'Unknown error';
      }
      
      throw new Error(`API error: ${response.status} - ${errorMessage}`);
    }
    return response.json();
  }
};

