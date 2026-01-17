import { useEffect, useState } from "react";
import HomeButton from "@/components/HomeButton";

interface SuccessViewProps {
  onHome: () => void;
}

const SuccessView = ({ onHome }: SuccessViewProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with Home */}
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="container max-w-lg mx-auto px-6 py-4">
          <HomeButton onClick={onHome} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className={`text-center space-y-6 transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Success Tag */}
          <div className="font-mono text-sm text-primary tracking-widest">
            [ INITIALIZATION_COMPLETE ]
          </div>

          {/* Checkmark */}
          <div className="text-6xl text-primary animate-pulse-slow">
            ✓
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Plan Accepted</h1>
            <p className="font-mono text-sm text-muted-foreground">
              Your technical specification has been finalized.
            </p>
          </div>

          {/* Status indicators */}
          <div className="pt-8 space-y-2 font-mono text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <span className="text-green-500">●</span>
              <span>Architecture defined</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-green-500">●</span>
              <span>Constraints reviewed</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-green-500">●</span>
              <span>Specification generated</span>
            </div>
          </div>

          {/* Timestamp */}
          <div className="pt-4 font-mono text-xs text-muted-foreground/50">
            SESSION_ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SuccessView;
