const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");

// Load environmental variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for all routes (necessary for frontend integration)
app.use(cors());
app.use(express.json());

// Serve static frontend files directly from Express
app.use(express.static(path.join(__dirname, "../frontend")));

// Initialize Google Generative AI with the API Key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("CRITICAL: GEMINI_API_KEY is not defined in the environment.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);

// Helper function to clean markdown-wrapped JSON responses from Gemini
function cleanJSONResponse(text) {
  let cleaned = text.trim();
  // Remove markdown wrappers if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```json\s*/, "");
    cleaned = cleaned.replace(/^```\s*/, "");
    cleaned = cleaned.replace(/```$/, "");
  }
  return cleaned.trim();
}

/**
 * Route: POST /api/generate-futureme
 * Description: Generates a complete reflection profile from FutureMe using Gemini
 */
app.post("/api/generate-futureme", async (req, res) => {
  try {
    const { name, age, goal, struggle, oneYearVision, tone } = req.body;

    // Payload validation
    if (!name || !age || !goal || !struggle || !oneYearVision || !tone) {
      return res.status(400).json({
        success: false,
        error: "Missing required profile fields"
      });
    }

    // Build the system prompt
    const systemPrompt = `You are FutureMe, the future successful version of the user. You are not a generic motivational coach. You speak with emotional intelligence, clarity, and deep personal understanding. Your job is to help the user see who they are becoming, what they must change, and what they should do next.

Write as if you are the user’s future self speaking directly to their current self.

Tone selected by user: ${tone}
Tones instructions:
- Motivational: warm, inspiring, supportive, high energy
- Brutally Honest: direct, sharp, no excuses, laser focused on reality
- Calm Mentor: peaceful, wise, grounded, patient but encouraging
- CEO Mode: strategic, focused, execution-heavy, highly structured

User details:
Name: ${name}
Age: ${age}
Goal: ${goal}
Current struggle: ${struggle}
One-year vision: ${oneYearVision}

Return only valid JSON in this exact format:
{
  "message": "A powerful 120-180 word message from the future self.",
  "futureIdentity": "A concise description of who the user is becoming.",
  "nextMoves": ["Action 1", "Action 2", "Action 3"],
  "habit": "One small daily habit they should start today.",
  "warning": "One mistake their future self warns them about.",
  "mantra": "A short memorable line they can repeat daily.",
  "dailyPlan": [
    {
      "time": "Specific hour slot, e.g., 07:00 AM or 09:00 PM",
      "task": "A concrete, actionable task aligned to their goal and bypasses their struggle.",
      "motivation": "A brief, highly motivating, tone-specific advice for this task."
    }
  ]
}

Make it specific. Avoid generic motivation. Avoid clichés. Make it emotional but practical.`;

    // Access the model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }]
    });

    const responseText = result.response.text();
    const cleanedText = cleanJSONResponse(responseText);
    const parsedData = JSON.parse(cleanedText);

    return res.json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    console.error("Error in /api/generate-futureme:", error);
    return res.status(500).json({
      success: false,
      error: "FutureMe could not respond right now. Try again."
    });
  }
});

/**
 * Route: POST /api/chat-futureme
 * Description: Allows interactive chat conversation with the generated FutureMe persona
 */
app.post("/api/chat-futureme", async (req, res) => {
  try {
    const { userProfile, chatHistory, question } = req.body;

    if (!userProfile || !question) {
      return res.status(400).json({
        success: false,
        error: "Missing required chat parameters"
      });
    }

    const { name, age, goal, struggle, oneYearVision, tone } = userProfile;

    // Convert history list to clean contextual string
    let formattedHistory = "";
    if (chatHistory && chatHistory.length > 0) {
      formattedHistory = chatHistory
        .map(msg => `${msg.role === "user" ? "Current Self" : "FutureMe"}: ${msg.message}`)
        .join("\n");
    } else {
      formattedHistory = "No history yet. This is the start of the chat conversation.";
    }

    const chatPrompt = `You are FutureMe, the future version of the user who already achieved their one-year vision. Reply directly to the user’s question. Be personal, sharp, honest, and useful. Do not sound like a normal AI assistant. Do not mention that you are Gemini or an AI model. Speak like the future self.

User profile:
Name: ${name}
Age: ${age}
Goal: ${goal}
Struggle: ${struggle}
One-year vision: ${oneYearVision}
Tone: ${tone}
Tones instructions:
- Motivational: warm, inspiring, supportive, high energy
- Brutally Honest: direct, sharp, no excuses, laser focused on reality
- Calm Mentor: peaceful, wise, grounded, patient but encouraging
- CEO Mode: strategic, focused, execution-heavy, highly structured

Recent chat history:
${formattedHistory}

Current question:
${question}

Reply in 2-5 short paragraphs. Give at least one clear action. Speak directly to the current version of yourself.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: chatPrompt }] }]
    });

    const reply = result.response.text().trim();

    return res.json({
      success: true,
      reply: reply
    });
  } catch (error) {
    console.error("Error in /api/chat-futureme:", error);
    return res.status(500).json({
      success: false,
      error: "FutureMe could not respond right now. Try again."
    });
  }
});

// Export app for serverless deployment
module.exports = app;

// Start listening on port
const server = app.listen(port, () => {
  console.log(`FutureMe backend listening at http://localhost:${port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`\nCRITICAL ERROR: Port ${port} is already in use.`);
    console.error("💡 MAC DEVELOPERS NOTE: macOS Monterey and newer use port 5000 for 'AirPlay Receiver' by default.");
    console.error("To resolve this, either:");
    console.error("1. Turn off 'AirPlay Receiver' in System Settings > General > Sharing");
    console.error("2. Or change the PORT variable in your backend/.env file and the backendUrl port in frontend/script.js to 5001\n");
  } else {
    console.error("Server error:", error);
  }
  process.exit(1);
});
