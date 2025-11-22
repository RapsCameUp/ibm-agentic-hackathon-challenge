// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Token Manager
class TokenManager {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.token = null;
    this.expiresAt = null;
  }

  async getToken() {
    // Return cached token if still valid (with 5 min buffer)
    if (this.token && Date.now() < this.expiresAt - 300000) {
      console.log(' Using cached token');
      return this.token;
    }

    console.log(' Fetching new token...');
    
    try {
      const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${this.apiKey}`
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(' Token fetch failed:', response.status, errorText);
        throw new Error(`Token fetch failed: ${response.status}`);
      }

      const data = await response.json();
      this.token = data.access_token;
      this.expiresAt = Date.now() + (data.expires_in * 1000);
      
      console.log(' New token obtained');
      console.log('Token expires at:', new Date(this.expiresAt).toISOString());
      
      return this.token;
    } catch (error) {
      console.error(' Token manager error:', error);
      throw error;
    }
  }
}

const tokenManager = new TokenManager(process.env.WATSONX_API_KEY);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test token endpoint
app.get('/api/test-token', async (req, res) => {
  try {
    const token = await tokenManager.getToken();
    res.json({ 
      success: true, 
      tokenLength: token.length,
      tokenPreview: token.substring(0, 20) + '...'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, agentId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('\n Received message:', message);
    console.log('Agent ID:', agentId || '71fb5aac-c8c8-4c29-a7af-cd09f2d95468');


    const token = await tokenManager.getToken();
    console.log(' Token obtained, length:', token.length);

    const finalAgentId = agentId || '71fb5aac-c8c8-4c29-a7af-cd09f2d95468';
    
    const url = `https://eu-gb.watson-orchestrate.cloud.ibm.com/instances/1ea7aedd6cb94cd5a2f688cfeefa25d4_617906a5-027c-43e4-a7a2-d6beca0bb8ce/api/v1/orchestrate/${finalAgentId}/chat/completions`;
    
    console.log(' Calling URL:', url);

    const payload = {
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    };

    console.log(' Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log(' Response status:', response.status);
    console.log(' Response headers:', Object.fromEntries(response.headers));

    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error(' API Error Response:', errorText);
      
      // Try to parse as JSON
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // If not JSON, return the text
        return res.status(response.status).json({
          error: `API returned ${response.status}`,
          details: errorText.substring(0, 500) // Limit length
        });
      }

      return res.status(response.status).json({
        error: 'API request failed',
        details: errorJson
      });
    }

    // Get response text first
    const responseText = await response.text();
    console.log(' Raw response:', responseText.substring(0, 200) + '...');

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(' Failed to parse response as JSON');
      console.error('Response was:', responseText);
      return res.status(500).json({
        error: 'Invalid JSON response from API',
        rawResponse: responseText.substring(0, 500)
      });
    }

    console.log(' Parsed response successfully');
    console.log('Response structure:', Object.keys(data));

    // Extract the agent's message
    const agentMessage = data.choices?.[0]?.message?.content 
      || data.output?.text 
      || data.message 
      || 'No response from agent';

    console.log(' Agent response:', agentMessage);

    res.json({
      success: true,
      content: agentMessage,
      threadId: data.thread_id,
      fullResponse: data // Include full response for debugging
    });

  } catch (error) {
    console.error(' Server error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Start server
const PORT = process.env.PORT || 3006;
app.listen(PORT, async () => {
  console.log('\n========================================');
  console.log(` Server running on port ${PORT}`);
  console.log('========================================');
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Test token:   http://localhost:${PORT}/api/test-token`);
  console.log(`Chat API:     http://localhost:${PORT}/api/chat`);
  console.log('========================================\n');

  // Verify configuration
  if (!process.env.WATSONX_API_KEY) {
    console.error(' WATSONX_API_KEY not set in .env file!');
  } else {
    console.log(' WATSONX_API_KEY found');
    
    // Test token fetch on startup
    try {
      const token = await tokenManager.getToken();
      console.log(' Successfully obtained token on startup');
    } catch (error) {
      console.error(' Failed to obtain token on startup:', error.message);
    }
  }
});

// Error handling
process.on('unhandledRejection', (error) => {
  console.error(' Unhandled promise rejection:', error);
});

process.on('SIGINT', () => {
  console.log('\n Shutting down server...');
  process.exit(0);
});