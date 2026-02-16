
import { GoogleGenAI, Modality } from "@google/genai";

export class SpeechService {
  private ai: GoogleGenAI;
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private playbackRate: number = 1.0;

 constructor() {
    this.ai = new GoogleGenAI({ 
      apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' 
    });
  }

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return this.audioContext;
  }

  private decodeBase64(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  }

  async stop(): Promise<void> {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {
        // Source might have already stopped
      }
      this.currentSource = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.resume(); // Ensure it's not suspended when we stop
    }
  }

  async pause(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'running') {
      await this.audioContext.suspend();
    }
  }

  async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  setRate(rate: number) {
    this.playbackRate = rate;
    if (this.currentSource) {
      this.currentSource.playbackRate.value = rate;
    }
  }

  async speak(text: string, onEnd?: () => void): Promise<void> {
    try {
      await this.stop(); // Stop any existing speech

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Speak this to Basheer in a friendly, encouraging mentor voice: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio data received");

      const ctx = this.initAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();

      const audioBuffer = await this.decodeAudioData(this.decodeBase64(base64Audio), ctx);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = this.playbackRate;
      source.connect(ctx.destination);
      
      this.currentSource = source;
      source.start();

      source.onended = () => {
        if (this.currentSource === source) {
          this.currentSource = null;
        }
        if (onEnd) onEnd();
      };
    } catch (error) {
      console.error("Speech Generation Error:", error);
      if (onEnd) onEnd();
    }
  }
}

export const speechService = new SpeechService();
