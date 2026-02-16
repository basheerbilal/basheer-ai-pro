
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { MentorMode, Message, MessageImage } from "../types";

export class GeminiService {
  private ai: GoogleGenAI | null = null;

constructor() {
    this.ai = new GoogleGenAI({ 
      apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' 
    });
  }

  isConfigured(): boolean {
    return !!this.ai;
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async sendMessage(
    history: Message[],
    currentMessage: string,
    mode: MentorMode,
    codeContext?: string,
    image?: MessageImage,
    retryCount = 0
  ): Promise<string> {
    if (!this.ai) {
      return "Basheer, aapki API Key set nahi hai. Please Netlify settings mein `API_KEY` check karein.";
    }

    const contents = history.map(msg => {
      const parts: any[] = [{ text: msg.content }];
      if (msg.image) {
        parts.push({
          inlineData: {
            data: msg.image.data,
            mimeType: msg.image.mimeType
          }
        });
      }
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts
      };
    });

    let finalPromptText = currentMessage;
    if (codeContext) {
      finalPromptText = `Look at this code in ${mode} mode:\n\n\`\`\`\n${codeContext}\n\`\`\`\n\nQuestion: ${currentMessage}`;
    }

    const currentParts: any[] = [{ text: finalPromptText }];
    if (image) {
      currentParts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType
        }
      });
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    // Strategy: Try Pro first (retryCount 0), fallback to Flash (retryCount > 0)
    const primaryModel = 'gemini-3-pro-preview';
    const fallbackModel = 'gemini-3-flash-preview';
    const modelToUse = retryCount > 0 ? fallbackModel : primaryModel;

    try {
      const response = await this.ai.models.generateContent({
        model: modelToUse,
        contents: contents as any,
        config: {
          systemInstruction: `${SYSTEM_INSTRUCTION}\n\nCurrent Mode: ${mode}.`,
          temperature: 0.7,
          // Limit thinking budget for Flash to save quota tokens
          thinkingConfig: { 
            thinkingBudget: modelToUse === primaryModel ? 32768 : 16000 
          }
        }
      });

      return response.text || "Main samajh nahi paya. Dubara try karein?";
    } catch (error: any) {
      const errorMsg = error?.message || "";
      const isQuotaError = error?.status === 429 || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota');

      if (isQuotaError) {
        // If Pro fails, immediately try Flash
        if (modelToUse === primaryModel) {
          console.warn("Pro Quota Exceeded. Falling back to Flash...");
          return this.sendMessage(history, currentMessage, mode, codeContext, image, retryCount + 1);
        }
        
        // If Flash also fails, retry with exponential backoff up to 2 times
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 2000;
          console.warn(`Flash Quota Exceeded. Retrying in ${delay}ms...`);
          await this.sleep(delay);
          return this.sendMessage(history, currentMessage, mode, codeContext, image, retryCount + 1);
        }
        
        return "Basheer, Google API ki limit (429 Quota) poori ho chuki hai. Ye aksar zyada requests bhejney se hota hai. Fikar na karein, 1-2 minute baad system khud theek ho jayega. Thodi dair sabr karein.";
      }

      if (errorMsg.includes('API_KEY_INVALID')) {
        return "Aapki API Key invalid lag rahi hai. Please check karein.";
      }

      console.error(`Gemini Service Error (${modelToUse}):`, error);
      return `Connection mein masla hai. Error detail: ${errorMsg.slice(0, 100)}`;
    }
  }
}

export const gemini = new GeminiService();
