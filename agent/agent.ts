import { defineAgent } from "eve";
import { createOpenAI } from "@ai-sdk/openai";

const openrouter = createOpenAI({
  name: "openrouter",
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:2000",
    "X-Title": process.env.OPENROUTER_APP_NAME || "ProofArena Agent"
  }
});

export default defineAgent({
  model: openrouter.chat(process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"),
  modelContextWindowTokens: Number(process.env.OPENROUTER_CONTEXT_WINDOW_TOKENS || 128000),
  compaction: {
    modelContextWindowTokens: Number(process.env.OPENROUTER_CONTEXT_WINDOW_TOKENS || 128000),
    thresholdPercent: 0.75
  }
});
