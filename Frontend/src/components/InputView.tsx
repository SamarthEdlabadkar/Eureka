import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import VoiceMicButton from "./VoiceMicButton";
import { useLiveKit } from "@/hooks/useLiveKit";

interface InputViewProps {
  onAnalyze: (prompt: string) => void;
}

const InputView = ({ onAnalyze }: InputViewProps) => {
  const [prompt, setPrompt] = useState("");

  const { isConnected, isRecording, toggleRecording, audioLevels } = useLiveKit({
    url: import.meta.env.VITE_LIVEKIT_URL || "wss://your-livekit-project.livekit.cloud",
    tokenEndpoint: "http://localhost:5000/api/token", // Adjust if backend is elsewhere
    onTranscription: (text) => {
        setPrompt(prev => prev + " " + text);
    }
  });

  const handleSubmit = () => {
    if (prompt.trim()) {
      onAnalyze(prompt.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center mb-12 animate-slide-up">
        <div className="font-mono text-xs text-primary tracking-widest mb-4">
          [ CONCEPT_GENERATOR v1.0 ]
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Define Your Vision
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Describe your application concept. Be specific about functionality, 
          target users, and core features.
        </p>
      </div>

      {/* Input Area */}
      <div className="w-full max-w-2xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="relative">
          <div className="font-mono text-xs text-muted-foreground mb-2 flex items-center gap-2">
            <span className="text-primary">→</span>
            INPUT_PROMPT
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your app idea here... (e.g., 'A task management app for remote teams with real-time collaboration and Kanban boards')"
            className="input-industrial w-full h-48 p-4 resize-none rounded-sm"
            autoFocus
          />
          <div className="font-mono text-xs text-muted-foreground mt-2 text-right flex justify-between items-center">
            <div className="flex items-center gap-2">
                <VoiceMicButton 
                    isListening={isRecording} 
                    status={isRecording ? "listening" : "idle"} 
                    audioLevels={audioLevels} 
                    onToggle={toggleRecording} 
                />
                {isConnected ? <span className="text-green-500 text-xs">● LiveKit Connected</span> : <span className="text-red-500 text-xs">● Disconnected</span>}
            </div>
            <span>{prompt.length} chars • ⌘+Enter to submit</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            className="min-w-[200px]"
          >
            Analyze →
          </Button>
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-16 font-mono text-xs text-muted-foreground/50 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        SYSTEM READY — AWAITING INPUT
      </div>
    </div>
  );
};

export default InputView;
