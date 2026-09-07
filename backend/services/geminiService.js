import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenerativeAI(apiKey);
};

export const chatWithGemini = async ({
  messages,
  systemPrompt,
  userContext,
  temperature = 0.6,
  topP = 0.95,
  maxTokens = 1024,
}) => {
  const model = getClient().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature,
      topP,
      maxOutputTokens: maxTokens,
    },
  });
  const context = userContext ? `User profile context: ${JSON.stringify(userContext)}\n\n` : "";
  const prompt = context + messages.map(({ role, content }) => `${role}: ${content}`).join("\n\n");
  const result = await model.generateContent(prompt);
  const response = result.response.text()?.trim();

  if (!response) throw new Error("Empty response from Gemini API");
  return { response };
};

export const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY?.trim());
export const GEMINI_MODEL_NAME = GEMINI_MODEL;
