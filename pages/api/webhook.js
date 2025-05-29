import { handleJobSearch } from './tools/job-search';
import { handleWebSearch } from './tools/web-search';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract tool call information from the request
    const { message } = req.body;
    
    if (!message || !message.toolCalls || !message.toolCalls[0]) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    const toolCall = message.toolCalls[0];
    const toolCallId = toolCall.id;
    const functionName = toolCall.function?.name;
    const functionArgs = toolCall.function?.arguments || {};

    // Process based on the tool type
    let result;
    
    switch(functionName) {
      case 'job-search':
        result = await handleJobSearch(functionArgs);
        break;
      case 'web-search':
        result = await handleWebSearch(functionArgs);
        break;
      default:
        return res.status(400).json({ 
          error: `Unknown function: ${functionName}` 
        });
    }

    // Format response as required
    return res.status(200).json({
      results: [
        {
          toolCallId,
          result: typeof result === 'string' ? result : JSON.stringify(result)
        }
      ]
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
} 