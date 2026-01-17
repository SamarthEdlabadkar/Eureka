import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import HomeButton from "@/components/HomeButton";

interface IntakeViewProps {
  onAnalyze: (prompt: string) => void;
}

const IntakeView = ({ onAnalyze }: IntakeViewProps) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (prompt.trim()) {
      onAnalyze(prompt.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Home */}
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <HomeButton onClick={() => {}} />
            <div className="border-l border-border pl-4 flex items-center gap-2 font-mono text-xs text-primary">
              <span className="w-2 h-2 bg-primary" />
              <span>CONCEPT_GEN</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-3xl space-y-8">
          {/* Header */}
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

          {/* Input Area */}
          <div className="space-y-4">
            <div className="industrial-border-accent bg-card p-1">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A real-time inventory management system for small warehouses with barcode scanning and low-stock alerts..."
                className="min-h-[200px] bg-background border-0 resize-none font-mono text-sm placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            {/* Character count */}
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs text-muted-foreground">
                {prompt.length} characters
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                STATUS: {prompt.length > 20 ? "READY" : "AWAITING INPUT"}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={prompt.trim().length < 10}
              size="lg"
              className="px-12 py-6 text-lg font-bold uppercase tracking-wider disabled:opacity-30"
            >
              Analyze →
            </Button>
          </div>

          {/* Footer hint */}
          <div className="text-center">
            <p className="font-mono text-xs text-muted-foreground/60">
              Press analyze to generate constraint specifications
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IntakeView;
