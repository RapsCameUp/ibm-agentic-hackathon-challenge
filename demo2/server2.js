import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fetch from 'node-fetch'; 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const CONFIG = {
  INSTANCE_URL: process.env.WATSONX_INSTANCE_URL,       
  API_KEY: process.env.WATSONX_API_KEY,              
  AGENT_ID: process.env.WATSONX_AGENT_ID            
};

// Validate config
if (!CONFIG.INSTANCE_URL || !CONFIG.API_KEY || !CONFIG.AGENT_ID) {
  console.error(" Missing configuration! Please set WATSONX_INSTANCE_URL, WATSONX_API_KEY, and WATSONX_AGENT_ID in your .env");
  process.exit(1);
}

// Token manager
class TokenManager {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.token = null;
    this.expiresAt = 0;
  }

  async getToken() {
    // Return cached token if valid (5 min buffer)
    if (this.token && Date.now() < this.expiresAt - 300_000) {
      return this.token;
    }

    console.log(" Fetching new Orchestrate token...");

    const response = await fetch(
      "https://iam.platform.saas.ibm.com/siusermgr/api/1.0/apikeys/token",
      {
        method: "POST",
        headers: { "accept": "application/json", "content-type": "application/json" },
        body: JSON.stringify({ apikey: this.apiKey })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(" Token fetch failed:", response.status, errText);
      throw new Error(`Token fetch failed: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    this.token = data.accessToken;        // correct field
    this.expiresAt = Date.now() + data.expiresIn * 1000;

    console.log(" Token obtained, expires at", new Date(this.expiresAt).toISOString());
    return this.token;
  }
}

const tokenManager = new TokenManager(CONFIG.API_KEY);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test token endpoint
app.get("/api/test-token", async (req, res) => {
  try {
    const token = await tokenManager.getToken();
    res.json({ success: true, tokenLength: token.length, tokenPreview: token.slice(0, 20) + "..." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, agentId, threadId } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const finalAgentId = agentId || CONFIG.AGENT_ID;
    const token = await tokenManager.getToken();

    const url = `${CONFIG.INSTANCE_URL}/api/v1/orchestrate/${finalAgentId}/chat/completions`;

    const payload = { messages: [{ role: "user", content: message }], stream: false };
    if (threadId) payload.thread_id = threadId;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(" Chat API error:", response.status, errText);
      return res.status(response.status).json({ error: `API returned ${response.status}`, details: errText });
    }

    const data = await response.json();
    const agentMessage = data.choices?.[0]?.message?.content || "No response from agent";
    const newThreadId = data.thread_id;

    res.json({ success: true, content: agentMessage, threadId: newThreadId, fullResponse: data });

  } catch (error) {
    console.error(" Server error:", error);
    res.status(500).json({ error: error.message, stack: process.env.NODE_ENV === "development" ? error.stack : undefined });
  }
});

// Start server
const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
