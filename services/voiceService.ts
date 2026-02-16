
export class VoiceService {
  private recognition: any = null;
  private isSupported: boolean = false;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US'; // Works well for Hinglish/mixed too
      this.isSupported = true;
    }
  }

  start(onResult: (text: string, isFinal: boolean) => void, onEnd: () => void, onError: (err: any) => void) {
    if (!this.isSupported) {
      onError("Browser does not support speech recognition.");
      return;
    }

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      onResult(text, result.isFinal);
    };

    this.recognition.onend = onEnd;
    this.recognition.onerror = (event: any) => onError(event.error);

    try {
      this.recognition.start();
    } catch (e) {
      onError(e);
    }
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  checkSupport() {
    return this.isSupported;
  }
}

export const voiceService = new VoiceService();
