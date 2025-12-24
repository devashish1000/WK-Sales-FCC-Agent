import { GoogleGenAI } from '@google/genai';

interface LiveClientEvents {
  onOpen?: () => void;
  onClose?: () => void;
  onAudioData?: (volume: number) => void;
  onTranscription?: (speaker: 'user' | 'model', text: string) => void;
  onTurnComplete?: () => void;
  onError?: (error: Error) => void;
}

export class LiveClient {
  private events: LiveClientEvents;
  private recognition: any = null;
  private synth: SpeechSynthesis;
  private chatHistory: { role: string; parts: { text: string }[] }[] = [];
  private systemInstruction: string = '';
  private ai: any = null;
  private isIntentionalDisconnect = false;
  
  // Turn-taking and audio isolation state
  private isAISpeaking = false;
  private aiCooldown = false;
  private silenceTimer: any = null;
  private currentInterimText = '';

  // Public analysers for visualization
  public inputAnalyser: AnalyserNode | null = null;
  public outputAnalyser: AnalyserNode | null = null;

  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;

  constructor(events: LiveClientEvents) {
    this.events = events;
    this.synth = window.speechSynthesis;
  }

  async connect(systemInstruction: string) {
    this.systemInstruction = systemInstruction;
    this.isIntentionalDisconnect = false;
    this.chatHistory = [];
    this.isAISpeaking = false;
    this.aiCooldown = false;

    // Get API key - try Vite standard first, then fallback to process.env (defined in vite.config)
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
      console.error('[LiveClient] API Key missing. Available env:', {
        hasViteKey: !!import.meta.env.VITE_GEMINI_API_KEY,
        hasProcessKey: !!(process.env as any).API_KEY,
      });
      this.events.onError?.(new Error("API Key not found. Please select a valid API key."));
      return;
    }

    this.ai = new GoogleGenAI({ apiKey });

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.inputAnalyser = this.audioContext.createAnalyser();
      this.outputAnalyser = this.audioContext.createAnalyser();
      this.inputAnalyser.fftSize = 256;
      this.outputAnalyser.fftSize = 256;

      // ECHO CANCELLATION: Crucial to prevent capturing AI output from speakers
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.inputAnalyser);

      const dataArray = new Uint8Array(this.inputAnalyser.frequencyBinCount);
      const pollVolume = () => {
        if (this.inputAnalyser && !this.isIntentionalDisconnect) {
          this.inputAnalyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) { sum += dataArray[i]; }
          const rms = sum / dataArray.length / 255;
          this.events.onAudioData?.(rms);
          this.animationFrameId = requestAnimationFrame(pollVolume);
        }
      };
      pollVolume();

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error("Speech Recognition is not supported in this browser.");
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        // TURN-TAKING: Explicitly block processing if AI is active or in cooldown
        if (this.isAISpeaking || this.aiCooldown) {
          this.currentInterimText = '';
          return;
        }

        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          interimTranscript += event.results[i][0].transcript;
        }
        
        if (interimTranscript.trim()) {
          this.currentInterimText = interimTranscript;
          // Emit interim transcription for real-time UI feel
          this.events.onTranscription?.('user', interimTranscript);
          
          // SILENCE DETECTION: 2 seconds of silence signals turn end
          if (this.silenceTimer) clearTimeout(this.silenceTimer);
          this.silenceTimer = setTimeout(() => {
            if (this.currentInterimText.trim() && !this.isAISpeaking && !this.aiCooldown) {
              this.handleUserMessage(this.currentInterimText);
              this.currentInterimText = '';
            }
          }, 2000); 
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && !this.isIntentionalDisconnect) {
          console.error("[LiveClient] Recognition error:", event.error);
        }
      };

      this.recognition.onend = () => {
        // Only restart if we're not intentional disconnected and not currently speaking
        if (!this.isIntentionalDisconnect && !this.isAISpeaking && !this.aiCooldown) {
          try { this.recognition.start(); } catch(e) {}
        }
      };

      this.recognition.start();
      this.events.onOpen?.();

    } catch (err) {
      console.error('[LiveClient] Connection Error:', err);
      this.events.onError?.(err as Error);
      this.disconnect();
    }
  }

  private async handleUserMessage(text: string) {
    if (!text.trim() || this.isIntentionalDisconnect) return;
    
    // Finalize user turn in the UI and history
    this.events.onTranscription?.('user', text);
    this.events.onTurnComplete?.();
    
    this.chatHistory.push({ role: 'user', parts: [{ text }] });
    await this.generateAIResponse();
  }

  private async generateAIResponse() {
    if (this.isIntentionalDisconnect) return;

    // Use Gemini 3.0 models first (current as of December 2025)
    // Gemini 1.5 models are retired/unavailable, so use 3.0 as primary
    const models = ['gemini-3-flash-preview', 'gemini-1.5-flash'];
    
    for (const model of models) {
      try {
        const result = await this.ai.models.generateContent({
          model: model,
          contents: this.chatHistory,
          config: {
            systemInstruction: this.systemInstruction,
            temperature: 0.7,
          }
        });

        const responseText = result.text;
        if (responseText && !this.isIntentionalDisconnect) {
          this.chatHistory.push({ role: 'model', parts: [{ text: responseText }] });
          this.events.onTranscription?.('model', responseText);
          this.speak(responseText);
          return; // Success, exit
        }
      } catch (err: any) {
        const errorMsg = err.message?.toLowerCase() || '';
        const errorCode = err.code;
        
        // Check for billing/permission errors
        const isBillingError = errorMsg.includes('billing') || 
                              errorMsg.includes('permission denied') ||
                              errorMsg.includes('requires a project with active billing') ||
                              errorCode === 403;
        
        // Check for model not found errors
        const isModelNotFound = errorMsg.includes('not found') || 
                               errorMsg.includes('model') ||
                               errorCode === 404;
        
        // If billing error on first model, try fallback
        if ((isBillingError || isModelNotFound) && model === models[0] && models.length > 1) {
          console.warn(`[LiveClient] Model ${model} failed (${isBillingError ? 'billing' : 'not found'}), trying fallback: ${models[1]}`);
          continue; // Try fallback model
        }
        
        // If it's the last model or not a recoverable error, throw
        console.error(`[LiveClient] AI Generation Error with ${model}:`, err);
        this.events.onError?.(err as Error);
        return;
      }
    }
  }

  private speak(text: string) {
    if (this.isIntentionalDisconnect) return;

    // AUDIO ISOLATION: Stop recognition before speaking to prevent echo
    this.isAISpeaking = true;
    if (this.recognition) {
      try { this.recognition.stop(); } catch(e) {}
    }

    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = async () => {
      this.isAISpeaking = false;
      this.events.onTurnComplete?.();
      
      // TURN-TAKING: 3-second mandatory silence cooldown after AI finishes
      this.aiCooldown = true;
      await new Promise(resolve => setTimeout(resolve, 3000));
      this.aiCooldown = false;

      // Resume recognition after cooldown
      if (!this.isIntentionalDisconnect && this.recognition) {
        try { this.recognition.start(); } catch(e) {}
      }
    };

    this.synth.speak(utterance);
  }

  sendText(text: string) {
    if (text.startsWith('[SYSTEM:')) {
      this.chatHistory.push({ role: 'user', parts: [{ text }] });
      this.generateAIResponse();
    }
  }

  disconnect() {
    this.isIntentionalDisconnect = true;
    
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    
    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onend = null;
      try { this.recognition.stop(); } catch(e) {}
      this.recognition = null;
    }
    
    if (this.synth) {
      this.synth.cancel();
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      try { this.audioContext.close(); } catch(e) {}
      this.audioContext = null;
    }

    this.events.onClose?.();
  }
}
