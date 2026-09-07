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

  const history = [];
  const safeMessages = Array.isArray(messages) ? messages : [];
  const lastMessage = safeMessages[safeMessages.length - 1];

  if (safeMessages.length > 1) {
    for (const msg of safeMessages.slice(0, -1)) {
      const role = msg.role === "assistant" ? "model" : "user";
      if (typeof msg.content === "string" && msg.content.trim()) {
        history.push({ role, parts: [{ text: msg.content }] });
      }
    }
  }

  let prompt = typeof lastMessage?.content === "string" ? lastMessage.content : "";
  if (userContext) {
    prompt = `User profile context: ${JSON.stringify(userContext)}\n\n${prompt}`;
  }

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(prompt);
  const response = result.response.text()?.trim();

  if (!response) throw new Error("Empty response from Gemini API");
  return { response };
};

export const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY?.trim());
export const GEMINI_MODEL_NAME = GEMINI_MODEL;
