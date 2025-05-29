import axios from 'axios';
import { googleSearch, formatSearchResults } from '../../../lib/google-api';

const RAPID_API_KEY = process.env.NEXT_PUBLIC_RAPID_API_KEY || '';
const JSEARCH_API_HOST = 'jsearch.p.rapidapi.com';

export async function handleJobSearch(args) {
  try {
    let { role, area } = args;
    
    // Default to empty strings if not provided
    role = role || '';
    area = area || '';
    
    // Infer country code for API
    const countryCode = inferCountryCode(area);
    
    // Try to use JSearch API first if we have credentials
    if (RAPID_API_KEY) {
      try {
        const results = await searchJobsViaJSearch(role, area, countryCode);
        if (results.success && results.jobs.length > 0) {
          return formatJobSearchResults(results.jobs, role, area);
        }
      } catch (error) {
        console.error('JSearch API error:', error);
        // Fall back to Google Search if JSearch fails
      }
    }

    // Fallback to Google search
    const searchQuery = `${role} jobs in ${area}`;
    const searchResults = await googleSearch(searchQuery, { num: 10 });
    
    if (!searchResults.success || !searchResults.searchResults.length) {
      return `I couldn't find any ${role} jobs in ${area}. Please try a different search or location.`;
    }
    
    // Format Google search results as job listings
    return formatGoogleJobSearchResults(searchResults.searchResults, role, area);
  } catch (error) {
    console.error('Error in job search handler:', error);
    return `Sorry, I encountered an error while searching for jobs: ${error.message}`;
  }
}

// Helper to infer ISO country code from location
function inferCountryCode(location) {
  // Simple mapping of common locations to country codes
  const locationMap = {
    'bangalore': 'IN',
    'india': 'IN',
    'delhi': 'IN',
    'mumbai': 'IN',
    'hyderabad': 'IN',
    'chennai': 'IN',
    'kolkata': 'IN',
    'usa': 'US',
    'united states': 'US',
    'new york': 'US',
    'seattle': 'US',
    'san francisco': 'US',
    'london': 'GB',
    'uk': 'GB',
    'united kingdom': 'GB',
    'canada': 'CA',
    'australia': 'AU',
    'germany': 'DE',
    'france': 'FR',
    'japan': 'JP',
    'singapore': 'SG',
    'remote': 'US' // Default for remote
  };
  
  // Check if location directly exists in map
  const normalizedLocation = location.toLowerCase().trim();
  
  for (const [key, value] of Object.entries(locationMap)) {
    if (normalizedLocation.includes(key)) {
      return value;
    }
  }
  
  // Default to US if unknown
  return 'US';
}

// Function to search jobs via RapidAPI JSearch
async function searchJobsViaJSearch(role, area, countryCode) {
  try {
    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: {
        query: `${role} in ${area}`,
        page: '1',
        num_pages: '1',
        country: countryCode
      },
      headers: {
        'x-rapidapi-host': JSEARCH_API_HOST,
        'x-rapidapi-key': RAPID_API_KEY
      }
    });
    
    return {
      success: true,
      jobs: response.data.data || []
    };
  } catch (error) {
    console.error('JSearch API search error:', error);
    return {
      success: false,
      error: error.message,
      jobs: []
    };
  }
}

// Format JSearch API results into a readable response
function formatJobSearchResults(jobs, role, area) {
  if (!jobs || jobs.length === 0) {
    return `I couldn't find any ${role} jobs in ${area}. Please try a different search or location.`;
  }
  
  // Format results into a nice human-readable text
  const totalJobs = jobs.length;
  let jobList = jobs.slice(0, Math.min(5, totalJobs)).map((job, index) => {
    const companyName = job.employer_name || 'Unknown Company';
    const jobTitle = job.job_title || role;
    const location = job.job_city || job.job_country || area;
    const isRemote = job.job_is_remote || false;
    const locationStr = isRemote ? `${location} (Remote)` : location;
    
    return `${index + 1}. ${companyName}; ${jobTitle}; ${locationStr}`;
  }).join('\n');
  
  return `I found ${totalJobs} jobs for ${role} in ${area}:\n${jobList}\n\nWould you like more details about any of these positions?`;
}

// Format Google search results into a job-like structure
function formatGoogleJobSearchResults(results, role, area) {
  if (!results || results.length === 0) {
    return `I couldn't find any ${role} jobs in ${area} through my search.`;
  }
  
  // Extract job-like information from search results
  const jobResults = results.slice(0, 5).map((result, index) => {
    const title = result.title.replace(' - job posting |', '').replace(' | LinkedIn', '').replace(' | Indeed.com', '');
    let company = 'Unknown Company';
    let location = area;
    
    // Try to extract company name from title
    const titleParts = title.split(' - ');
    if (titleParts.length > 1) {
      company = titleParts[titleParts.length - 1].trim();
    }
    
    return `${index + 1}. ${company}; ${title}; ${location}`;
  }).join('\n');
  
  return `I found several ${role} jobs in ${area}:\n${jobResults}\n\nNote: These are general search results. Would you like me to find more specific job listings?`;
} 