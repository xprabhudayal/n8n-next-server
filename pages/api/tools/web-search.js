import { googleSearch, formatSearchResults } from '../../../lib/google-api';

export async function handleWebSearch(args) {
  try {
    // Extract search query from arguments
    const { search_query } = args;
    
    if (!search_query || typeof search_query !== 'string') {
      return 'Please provide a valid search query.';
    }
    
    // Call Google Search API
    const searchResult = await googleSearch(search_query, { num: 5 });
    
    if (!searchResult.success) {
      return `Search failed: ${searchResult.error || 'Unknown error'}`;
    }
    
    if (!searchResult.searchResults.length) {
      return `No results found for "${search_query}".`;
    }
    
    // Format the search results into a readable summary
    return formatWebSearchResults(searchResult, search_query);
  } catch (error) {
    console.error('Error in web search handler:', error);
    return `Sorry, I encountered an error while searching: ${error.message}`;
  }
}

// Format web search results into a readable format
function formatWebSearchResults(searchResult, query) {
  const { searchResults, totalResults, formattedSearchTime } = searchResult;
  
  // Format each search result
  const formattedResults = searchResults
    .map((result, index) => {
      return `${index + 1}. ${result.title}\n   ${result.displayLink}\n   ${result.snippet}`;
    })
    .join('\n\n');
  
  // Create a summary header
  const summary = `Found ${totalResults} results for "${query}" in ${formattedSearchTime} seconds:`;
  
  return `${summary}\n\n${formattedResults}`;
} 