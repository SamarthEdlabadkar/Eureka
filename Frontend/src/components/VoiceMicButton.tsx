import { Mic } from "lucide-react";
import { VoiceInputStatus } from "@/hooks/useVoiceInput";

interface VoiceMicButtonProps {
  isListening: boolean;
  status: VoiceInputStatus;
  audioLevels: number[];
  onToggle: () => void;
  className?: string;
}

const VoiceMicButton = ({ 
  isListening, 
  status, 
  audioLevels, 
  onToggle,
  className = ""
}: VoiceMicButtonProps) => {
  const avgLevel = audioLevels.reduce((a, b) => a + b, 0) / audioLevels.length;
  
  return (
    <button
      onClick={onToggle}
      className={`relative p-2 border transition-all duration-200 ${
        isListening
          ? "bg-destructive border-destructive text-destructive-foreground"
          : "bg-transparent border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary"
      } ${className}`}
      aria-label={isListening ? "Stop recording" : "Start voice input"}
    >
      {/* Animated glow ring when listening */}
      {isListening && (
        <span 
          className="absolute inset-0 border border-destructive animate-ping opacity-50"
          style={{ 
            transform: `scale(${1 + avgLevel * 0.3})`,
          }}
        />
      )}
      
      {/* Mini bar visualizer behind icon when listening */}
      {isListening && status === "listening" && (
        <div className="absolute inset-0 flex items-end justify-center gap-px p-1 opacity-40">
          {audioLevels.slice(0, 5).map((level, i) => (
            <div
              key={i}
              className="w-0.5 bg-destructive-foreground transition-all duration-75"
              style={{ height: `${Math.max(2, level * 16)}px` }}
            />
          ))}
        </div>
      )}
      
      <Mic className="w-4 h-4 relative z-10" />
    </button>
  );
};

export default VoiceMicButton;
