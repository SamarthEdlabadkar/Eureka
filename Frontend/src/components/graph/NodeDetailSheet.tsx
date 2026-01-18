import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { GraphNode, getNodeColor, getCriticalityLabel } from "./graphData";
import { Button } from "@/components/ui/button";

interface NodeDetailSheetProps {
  node: GraphNode | null;
  graphData?: GraphNode[];
  onClose: () => void;
  onNavigateToNode: (node: GraphNode) => void;
}

export function NodeDetailSheet({ node, graphData = [], onClose, onNavigateToNode }: NodeDetailSheetProps) {
  if (!node) return null;

  const color = getNodeColor(node.criticality);
  const label = getCriticalityLabel(node.criticality);

  const handleDependencyClick = (depId: string) => {
    const targetNode = graphData.find((n) => n.id === depId);
    if (targetNode) {
      onNavigateToNode(targetNode);
    }
  };

  return (
    <AnimatePresence>
      {node && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key={node.id}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border z-50 font-mono"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-xs text-muted-foreground">{node.id}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <h2 className="text-xl font-bold text-foreground">
                {node.title}
              </h2>

              {/* Criticality Badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold"
                style={{
                  backgroundColor: color,
                  color: node.criticality >= 6 && node.criticality <= 8 ? "#000" : "#fff",
                }}
              >
                <span>CRITICALITY:</span>
                <span>{node.criticality}/10</span>
                <span className="text-xs opacity-80">({label})</span>
              </div>

              {/* Track and Duration */}
              {(node.track || node.duration_days) && (
                <div className="space-y-2">
                  {node.track && (
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Track
                      </span>
                      <p className="text-sm text-foreground mt-1">{node.track}</p>
                    </div>
                  )}
                  {node.duration_days && (
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Duration
                      </span>
                      <p className="text-sm text-foreground mt-1">{node.duration_days} days</p>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Description
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {node.description}
                </p>
              </div>

              {/* Dependencies */}
              {/* Upstream Dependencies */}
              {(() => {
                const upstreamDeps = graphData.filter((n) => n.next.includes(node.id));
                if (upstreamDeps.length > 0) {
                  return (
                    <div className="space-y-3">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Upstream Dependencies
                      </span>
                      <div className="flex flex-col gap-2">
                        {upstreamDeps.map((depNode) => {
                          const depColor = getNodeColor(depNode.criticality);

                          return (
                            <button
                              key={depNode.id}
                              onClick={() => handleDependencyClick(depNode.id)}
                              className="flex items-center justify-between px-3 py-2 border text-left transition-all duration-200 hover:scale-[1.02] group"
                              style={{
                                borderColor: depColor,
                                backgroundColor: `${depColor}15`,
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-1 h-8 shrink-0"
                                  style={{ backgroundColor: depColor }}
                                />
                                <div>
                                  <span className="text-xs text-muted-foreground block">
                                    {depNode.id}
                                  </span>
                                  <span className="text-sm font-bold text-foreground">
                                    {depNode.title}
                                  </span>
                                </div>
                              </div>
                              <ArrowRight
                                className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors transform rotate-180"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Downstream Dependencies */}
              {node.next.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Downstream Dependencies
                  </span>
                  <div className="flex flex-col gap-2">
                    {node.next.map((depId) => {
                      const depNode = graphData.find((n) => n.id === depId);
                      const depColor = depNode ? getNodeColor(depNode.criticality) : "#666";

                      return (
                        <button
                          key={depId}
                          onClick={() => handleDependencyClick(depId)}
                          className="flex items-center justify-between px-3 py-2 border text-left transition-all duration-200 hover:scale-[1.02] group"
                          style={{
                            borderColor: depColor,
                            backgroundColor: `${depColor}15`,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-1 h-8 shrink-0"
                              style={{ backgroundColor: depColor }}
                            />
                            <div>
                              <span className="text-xs text-muted-foreground block">
                                {depId}
                              </span>
                              <span className="text-sm font-bold text-foreground">
                                {depNode?.title || depId}
                              </span>
                            </div>
                          </div>
                          <ArrowRight
                            className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
