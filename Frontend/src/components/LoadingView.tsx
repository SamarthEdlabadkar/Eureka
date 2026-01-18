import { useEffect, useState } from "react";
import HomeButton from "@/components/HomeButton";

interface LoadingViewProps {
  onComplete: () => void;
  onHome: () => void;
}

const processingSteps = [
  "PARSING_INPUT",
  "ANALYZING_SCOPE",
  "GENERATING_CONSTRAINTS",
  "COMPILING_SPECS",
];

const LoadingView = ({ onComplete, onHome }: LoadingViewProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepDuration = 500;
    const totalSteps = processingSteps.length;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        setProgress((next / totalSteps) * 100);
        
        if (next >= totalSteps) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
        }
        return next;
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with Home */}
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="container max-w-lg mx-auto px-6 py-4">
          <HomeButton onClick={onHome} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-lg space-y-8">
          {/* Terminal-style header */}
          <div className="text-center space-y-2">
            <div className="font-mono text-xs text-primary tracking-widest uppercase">
              [ Processing ]
            </div>
            <h2 className="text-2xl font-bold">Analyzing Concept</h2>
          </div>

          {/* Progress container */}
          <div className="space-y-6">
            {/* Progress bar */}
            <div className="relative">
              <div className="h-1 bg-muted overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Scan line effect */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="h-full w-8 bg-primary/20 animate-scan-line" />
              </div>
            </div>

            {/* Progress percentage */}
            <div className="flex justify-between font-mono text-xs">
              <span className="text-muted-foreground">PROGRESS</span>
              <span className="text-primary">{Math.round(progress)}%</span>
            </div>

            {/* Processing steps */}
            <div className="space-y-2 border border-border bg-card p-4">
              {processingSteps.map((step, index) => (
                <div
                  key={step}
                  className={`flex items-center gap-3 font-mono text-xs transition-colors duration-200 ${
                    index < currentStep
                      ? "text-primary"
                      : index === currentStep
                      ? "text-foreground"
                      : "text-muted-foreground/50"
                  }`}
                >
                  <span className="w-4">
                    {index < currentStep ? (
                      <span className="text-primary">✓</span>
                    ) : index === currentStep ? (
                      <span className="animate-blink">▶</span>
                    ) : (
                      <span className="text-muted-foreground/30">○</span>
                    )}
                  </span>
                  <span>{step}</span>
                  {index === currentStep && (
                    <span className="text-primary animate-pulse-slow">...</span>
                  )}
                </div>
              ))}
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2 font-mono text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-primary animate-pulse-slow" />
              <span>SYSTEM ACTIVE</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoadingView;
