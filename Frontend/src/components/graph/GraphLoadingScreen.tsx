import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface GraphLoadingScreenProps {
  onComplete: () => void;
}

const loadingSteps = [
  "PARSING_DEPENDENCIES",
  "CALCULATING_CRITICALITY",
  "BUILDING_GRAPH_LAYOUT",
  "RENDERING_NODES",
];

export function GraphLoadingScreen({ onComplete }: GraphLoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepDuration = 400;
    const progressInterval = 20;
    const progressIncrement = 100 / ((loadingSteps.length * stepDuration) / progressInterval);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + progressIncrement;
        return next >= 100 ? 100 : next;
      });
    }, progressInterval);

    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= loadingSteps.length - 1) {
          clearInterval(stepTimer);
          clearInterval(progressTimer);
          setTimeout(onComplete, 300);
          return prev;
        }
        return prev + 1;
      });
    }, stepDuration);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-50 flex items-center justify-center font-mono"
    >
      <div className="w-full max-w-md px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-lg font-bold text-foreground mb-1">
            INITIALIZING_GRAPH
          </h2>
          <p className="text-xs text-muted-foreground">
            PREPARING DEPENDENCY VISUALIZATION
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>PROGRESS</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-muted border border-border">
            <motion.div
              className="h-full bg-foreground"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {loadingSteps.map((step, index) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: index <= currentStep ? 1 : 0.3,
                x: 0 
              }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div 
                className={`w-2 h-2 border ${
                  index < currentStep 
                    ? "bg-green-500 border-green-500" 
                    : index === currentStep 
                      ? "bg-foreground border-foreground animate-pulse" 
                      : "border-muted-foreground"
                }`}
              />
              <span 
                className={`text-xs ${
                  index <= currentStep ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step}
              </span>
              {index < currentStep && (
                <span className="text-xs text-green-500 ml-auto">COMPLETE</span>
              )}
              {index === currentStep && (
                <span className="text-xs text-muted-foreground ml-auto animate-pulse">
                  PROCESSING...
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Animated dots */}
        <motion.div 
          className="flex justify-center gap-1 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-muted-foreground"
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
