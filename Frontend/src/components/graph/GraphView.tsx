import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DependencyGraph } from "./DependencyGraph";
import { TechStackMarkdown } from "./TechStackMarkdown";
import { GraphLoadingScreen } from "./GraphLoadingScreen";
import HomeButton from "@/components/HomeButton";

interface GraphViewProps {
  onHome: () => void;
  phaseIIData?: any;
}

export function GraphView({ onHome, phaseIIData }: GraphViewProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className="h-screen w-screen bg-background flex flex-col font-mono overflow-hidden">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <GraphLoadingScreen key="loading" onComplete={handleLoadingComplete} />
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div className="flex items-center gap-4">
                <HomeButton onClick={onHome} />
                <div>
                  <h1 className="text-lg font-bold text-foreground">DEPENDENCY_GRAPH</h1>
                  <p className="text-xs text-muted-foreground">CRITICALITY-BASED VISUALIZATION</p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ backgroundColor: "#ef4444" }} />
                  <span className="text-muted-foreground">HIGH (8-10)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ backgroundColor: "#f97316" }} />
                  <span className="text-muted-foreground">MED-HIGH (6-7)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ backgroundColor: "#eab308" }} />
                  <span className="text-muted-foreground">MEDIUM (4-5)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ backgroundColor: "#22c55e" }} />
                  <span className="text-muted-foreground">LOW (1-3)</span>
                </div>
              </div>
            </div>

            {/* Split Screen Container */}
            <div className="flex-1 flex min-h-0">
              {/* Left Panel - Tech Stack (30%) */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="w-[30%] border-r border-border bg-background overflow-hidden"
              >
                <div className="h-full flex flex-col">
                  <div className="px-4 py-3 border-b border-border shrink-0">
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Tech Requirements
                    </h2>
                  </div>
                  <div className="flex-1 min-h-0">
                    <TechStackMarkdown
                      trdContent={phaseIIData?.technical_requirements?.article}
                      trdStructure={phaseIIData?.technical_requirements?.trd_structure}
                      sections={phaseIIData?.technical_requirements?.sections}
                      wordCount={phaseIIData?.technical_requirements?.word_count}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Right Panel - Graph (70%) */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="w-[70%] overflow-hidden"
              >
                <DependencyGraph
                  cpmTasks={phaseIIData?.critical_path?.cpm_structure?.tasks}
                  criticalPath={phaseIIData?.critical_path?.critical_path}
                  totalDuration={phaseIIData?.critical_path?.total_duration}
                  tracks={phaseIIData?.critical_path?.cpm_structure?.tracks}
                  resourceAllocation={phaseIIData?.critical_path?.resource_allocation}
                  taskBreakdown={phaseIIData?.task_breakdown?.tasks}
                  wbsStructure={phaseIIData?.task_breakdown?.wbs_structure}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
