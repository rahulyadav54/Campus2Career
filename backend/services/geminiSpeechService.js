const TTS_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview";
const TTS_VOICE = process.env.GEMINI_TTS_VOICE || "Kore";

const createWavBuffer = (pcm, sampleRate = 24000, channels = 1) => {
  const bytesPerSample = 2;
  const byteRate = sampleRate * channels * bytesPerSample;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(channels * bytesPerSample, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
};

export const synthesizeGeminiSpeech = async (text) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
        "Api-Revision": "2026-05-20",
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        input: `Speak naturally and professionally in English: ${text}`,
        response_format: { type: "audio" },
        generation_config: {
          speech_config: [{ voice: TTS_VOICE }],
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Gemini TTS request failed: ${response.status}`);

    const data = await response.json();
    const audio = data.output_audio || data.steps
      ?.flatMap((step) => step.content || [])
      .find((part) => part.type === "audio");
    if (!audio?.data) throw new Error("Gemini TTS returned no audio");
    return createWavBuffer(
      Buffer.from(audio.data, "base64"),
      Number(audio.sample_rate) || 24000,
      Number(audio.channels) || 1
    );
  } finally {
    clearTimeout(timer);
  }
};
