import axios from 'axios';

// Google API configuration
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.NEXT_PUBLIC_SERPER_API_KEY || ''; // Optional

// Perform a Google search using the Search API
export async function googleSearch(query, options = {}) {
  try {
    const params = {
      key: GOOGLE_API_KEY,
      q: query,
      ...options
    };

    // Add search engine ID if available
    if (SEARCH_ENGINE_ID) {
      params.cx = SEARCH_ENGINE_ID;
    }

    const response = await axios.get('https://google.serper.dev/search', {
      params
    });

    return {
      success: true,
      searchResults: response.data.items || [],
      totalResults: response.data.searchInformation?.totalResults || 0,
      formattedSearchTime: response.data.searchInformation?.formattedSearchTime || '0'
    };
  } catch (error) {
    console.error('Google Search API error:', error.message);
    return {
      success: false,
      error: error.message,
      searchResults: []
    };
  }
}

// Format search results to a clean structure
export function formatSearchResults(results) {
  if (!results || !Array.isArray(results)) return [];

  return results.map(item => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
    displayLink: item.displayLink,
    source: 'google'
  }));
} 