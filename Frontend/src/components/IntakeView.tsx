import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import HomeButton from "@/components/HomeButton";
import VoiceMicButton from "@/components/VoiceMicButton";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useToast } from "@/hooks/use-toast";

type CriticalQuestion = { question: string };
type Category = { name: string; questions: CriticalQuestion[] };
type RefinementResult = { categories: Category[] };

interface IntakeViewProps {
  onAnalyze: (prompt: string, refineResult: RefinementResult | null) => void;
}

const IntakeView = ({ onAnalyze }: IntakeViewProps) => {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const { 
    isListening, 
    status, 
    transcription, 
    audioLevels, 
    toggleListening,
  } = useVoiceInput({
    onTranscriptionComplete: (text) => setPrompt(text),
  });

  // Sync transcription to prompt as it types
  useEffect(() => {
    if (transcription && isListening) {
      setPrompt(transcription);
    }
  }, [transcription, isListening]);

  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: trimmed }),
      });

      const data = await response.json();

      if (data.success) {
        const refineResult: RefinementResult | null = data.result ?? null;
        onAnalyze(trimmed, refineResult);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to analyze the prompt",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Could not connect to the backend server",
      });
      console.error("API Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <HomeButton onClick={() => { }} />
            <div className="border-l border-border pl-4 flex items-center gap-2 font-mono text-xs text-primary">
              <span className="w-2 h-2 bg-primary" />
              <span>CONCEPT_GEN</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-3xl space-y-8">
          <div className="space-y-4 text-center">
            <div className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
              [ Concept Generator ]
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Describe Your <span className="text-primary">Idea</span>
            </h1>
            <p className="text-muted-foreground font-mono text-sm max-w-xl mx-auto">
              Input your application concept below. The system will analyze and generate
              targeted constraints for technical specification.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2 items-start">
              <div className="industrial-border-accent bg-card p-1 flex-1">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A real-time inventory management system for small warehouses with barcode scanning and low-stock alerts..."
                  className="min-h-[200px] bg-background border-0 resize-none font-mono text-sm placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={isListening}
                />
              </div>
              
              <VoiceMicButton
                isListening={isListening}
                status={status}
                audioLevels={audioLevels}
                onToggle={toggleListening}
                className="shrink-0 mt-1"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="font-mono text-xs text-muted-foreground">
                {prompt.length} characters
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                STATUS: {isListening 
                  ? status.toUpperCase() 
                  : prompt.length > 20 
                    ? "READY" 
                    : "AWAITING INPUT"}
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={prompt.trim().length < 10 || isListening || isSubmitting}
              size="lg"
              className="px-12 py-6 text-lg font-bold uppercase tracking-wider disabled:opacity-30"
            >
              {isSubmitting ? "Analyzing..." : "Analyze →"}
            </Button>
          </div>

          <div className="text-center">
            <p className="font-mono text-xs text-muted-foreground/60">
              {isListening 
                ? "Click microphone to stop recording" 
                : "Press analyze to generate constraint specifications • Click mic for voice input"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IntakeView;
