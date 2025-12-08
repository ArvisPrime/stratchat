
import { GoogleGenAI, Type } from '@google/genai';
import { AnalysisResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fast response using Flash Lite with JSON Schema for structured data
export const getQuickSummary = async (transcriptText: string): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest', 
      contents: `Analyze the following conversation transcript. Provide a one-sentence summary and the overall emotional sentiment of the speaker.
      
      Transcript:
      ${transcriptText}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A concise one-sentence summary of the content." },
            sentiment: { type: Type.STRING, enum: ["Positive", "Neutral", "Negative", "Tense", "Constructive"] },
            emoji: { type: Type.STRING, description: "A single emoji representing the mood." }
          },
          required: ["summary", "sentiment", "emoji"]
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response text");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Summary error:", error);
    // Fallback in case of parsing error
    return {
      summary: "Could not generate summary.",
      sentiment: "Neutral",
      emoji: "😐"
    };
  }
};

// Generate a single strategic question on demand
export const generateStrategicQuestion = async (transcriptText: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `You are a strategic negotiation coach.
      Based on the following transcript of a conversation, generate ONE single, high-impact strategic question the user should ask the speaker right now to deepen engagement or gain leverage.
      
      Keep it short, direct, and provocative.
      
      Transcript:
      ${transcriptText}`,
    });
    return response.text || "Ask: What is the most important outcome for you right now?";
  } catch (error) {
    console.error("Question generation error:", error);
    return "Could not generate question.";
  }
};

// Deep Thinking using Gemini 3 Pro
export const getDeepAnalysis = async (transcriptText: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze the following conversation transcript deeply. 
      Identify the underlying psychological motivations of the speaker.
      Suggest a long-term negotiation strategy.
      
      Transcript:
      ${transcriptText}`,
      config: {
        thinkingConfig: {
          thinkingBudget: 32768,
        }
      }
    });
    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Thinking error:", error);
    throw error;
  }
};

// Re-transcribe audio for high fidelity corrections (parallel process)
export const refineTranscript = async (audioBase64: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
             inlineData: {
               mimeType: 'audio/wav',
               data: audioBase64
             }
          },
          {
            text: `Please provide a verbatim transcription of the speech in this audio file. 
            Correct any errors from previous real-time transcription.
            Be especially attentive to different English accents and dialects (e.g., British, Australian, Indian, etc.).
            Output ONLY the transcription text, no other commentary.`
          }
        ]
      }
    });
    return response.text?.trim() || null;
  } catch (error) {
    console.error("Refinement error:", error);
    return null;
  }
};
