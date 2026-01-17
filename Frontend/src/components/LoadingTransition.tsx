import { useEffect, useState } from "react";

interface LoadingTransitionProps {
  userPrompt: string;
  onComplete: () => void;
}

const LoadingTransition = ({ userPrompt, onComplete }: LoadingTransitionProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [onComplete]);

  const clampedProgress = Math.min(progress, 100);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-24 p-8">
      {/* Animated prompt box moving up */}
      <div className="w-full max-w-2xl animate-slide-up-fast">
        <div className="font-mono text-xs text-muted-foreground mb-2 flex items-center gap-2">
          <span className="text-primary">→</span>
          ANALYZING_PROMPT
        </div>
        <div className="input-industrial w-full p-4 rounded-sm text-foreground/80 line-clamp-3">
          {userPrompt}
        </div>
      </div>

      {/* Loading animation */}
      <div className="mt-16 flex flex-col items-center gap-8 animate-fade-in-delayed">
        {/* Progress bar */}
        <div className="w-64 h-1 bg-muted overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>

        {/* Status indicators */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary animate-pulse-stagger"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          
          <div className="font-mono text-xs text-muted-foreground tracking-widest">
            {clampedProgress < 30 && "PARSING_INPUT..."}
            {clampedProgress >= 30 && clampedProgress < 60 && "EXTRACTING_CONSTRAINTS..."}
            {clampedProgress >= 60 && clampedProgress < 90 && "GENERATING_SECTIONS..."}
            {clampedProgress >= 90 && "FINALIZING..."}
          </div>

          <div className="font-mono text-xs text-primary">
            {Math.floor(clampedProgress)}%
          </div>
        </div>

        {/* Data stream effect */}
        <div className="mt-8 font-mono text-xs text-muted-foreground/30 max-w-md text-center overflow-hidden h-16">
          <div className="animate-scroll-up space-y-1">
            <div>→ init_concept_parser()</div>
            <div>→ load_constraint_matrix()</div>
            <div>→ analyze_user_intent()</div>
            <div>→ map_requirement_nodes()</div>
            <div>→ build_section_tree()</div>
            <div>→ validate_output_schema()</div>
            <div>→ prepare_render_payload()</div>
            <div>→ complete()</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingTransition;
