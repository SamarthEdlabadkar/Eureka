import { useState, useCallback, useRef, useEffect } from "react";

export type VoiceInputStatus = 
  | "idle" 
  | "initializing" 
  | "listening" 
  | "processing" 
  | "complete";

interface UseVoiceInputOptions {
  onTranscriptionComplete?: (text: string) => void;
  simulatedText?: string;
}

export const useVoiceInput = (options: UseVoiceInputOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<VoiceInputStatus>("idle");
  const [transcription, setTranscription] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(12).fill(0));
  
  const animationRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const simulatedText = options.simulatedText || 
    "I need a web app for tracking satellite logistics with real-time orbital positioning and cargo manifest management...";

  // Simulate audio level changes
  const animateAudioLevels = useCallback(() => {
    if (!isListening) return;
    
    setAudioLevels(prev => 
      prev.map(() => Math.random() * 0.8 + 0.2)
    );
    setAudioLevel(Math.random() * 0.7 + 0.3);
    
    animationRef.current = requestAnimationFrame(() => {
      setTimeout(animateAudioLevels, 80);
    });
  }, [isListening]);

  // Typing effect for transcription
  const simulateTyping = useCallback((text: string, index: number = 0) => {
    if (index <= text.length) {
      setTranscription(text.slice(0, index));
      typingTimeoutRef.current = setTimeout(() => {
        simulateTyping(text, index + 1);
      }, 30 + Math.random() * 40);
    } else {
      setStatus("complete");
      options.onTranscriptionComplete?.(text);
    }
  }, [options]);

  const startListening = useCallback(() => {
    setIsListening(true);
    setStatus("initializing");
    setTranscription("");
    
    // Simulate initialization delay
    statusTimeoutRef.current = setTimeout(() => {
      setStatus("listening");
      animateAudioLevels();
      
      // Start typing simulation after 2 seconds
      statusTimeoutRef.current = setTimeout(() => {
        setStatus("processing");
        simulateTyping(simulatedText);
      }, 2000);
    }, 1000);
  }, [animateAudioLevels, simulateTyping, simulatedText]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setStatus("idle");
    setAudioLevel(0);
    setAudioLevels(new Array(12).fill(0));
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  return {
    isListening,
    status,
    transcription,
    audioLevel,
    audioLevels,
    startListening,
    stopListening,
    toggleListening,
  };
};
