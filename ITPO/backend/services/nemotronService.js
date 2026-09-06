import OpenAI from "openai";

const NEMOTRON_BASE_URL = "https://integrate.api.nvidia.com/v1";
const NEMOTRON_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";

const getClient = () => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not configured");
  }
  return new OpenAI({
    baseURL: NEMOTRON_BASE_URL,
    apiKey,
    timeout: 45000,
  });
};

const DEFAULT_OPTIONS = {
  temperature: 0.6,
  topP: 0.95,
  maxTokens: 1024,
};

export const chatWithNemotron = async ({
  messages,
  systemPrompt,
  userContext,
  temperature,
  topP,
  maxTokens,
}) => {
  const client = getClient();

  const fullMessages = [
    ...(systemPrompt
      ? [{ role: "system", content: systemPrompt }]
      : []),
    ...(userContext
      ? [
          {
            role: "system",
            content: `User profile context: ${JSON.stringify(userContext)}`,
          },
        ]
      : []),
    ...messages,
  ];

  const response = await client.chat.completions.create({
    model: NEMOTRON_MODEL,
    messages: fullMessages,
    temperature: temperature ?? DEFAULT_OPTIONS.temperature,
    top_p: topP ?? DEFAULT_OPTIONS.topP,
    max_tokens: maxTokens ?? DEFAULT_OPTIONS.maxTokens,
  });

  if (!response.choices || response.choices.length === 0) {
    throw new Error("No response choices returned from NVIDIA API");
  }

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Empty response from NVIDIA API");
  }

  return {
    response: content,
    usage: response.usage || null,
  };
};

export const isNemotronConfigured = () => {
  const key = process.env.NVIDIA_API_KEY;
  return !!(key && key.length > 10);
};

export const NEMOTRON_MODEL_NAME = NEMOTRON_MODEL;
