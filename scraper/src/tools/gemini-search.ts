import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

export interface SearchResult {
  uri: string;
  title: string;
  snippet: string;
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: config.geminiApiKey });
  return client;
}

export async function geminiWebSearch(query: string): Promise<SearchResult[]> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: config.geminiModel,
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const chunks =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

  return chunks
    .filter((chunk) => chunk.web?.uri)
    .map((chunk) => ({
      uri: chunk.web!.uri!,
      title: chunk.web!.title ?? '',
      snippet: '',
    }));
}
