const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  try {
    // Attempt to list models or check standard models
    console.log("Listing models...");
    // The listModels method isn't always exposed the same way in all SDK versions, 
    // let's try standard models: gemini-pro, gemini-1.5-flash-latest, etc.
    const models = ["gemini-pro", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.5-flash"];
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, respond in one word.");
        console.log(`✅ Success with model: ${modelName} -> Response:`, result.response.text().trim());
      } catch (err) {
        console.log(`❌ Failed with model: ${modelName} -> Error:`, err.message);
      }
    }
  } catch (error) {
    console.error("General error:", error);
  }
}

run();
