import { DependencyGraph } from "@/components/graph/DependencyGraph";
import HomeButton from "@/components/HomeButton";
import { useNavigate } from "react-router-dom";

const GraphPage = () => {
  const navigate = useNavigate();
  return (
    <div className="h-screen w-screen bg-background flex flex-col font-mono">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <HomeButton onClick={() => navigate("/")} />
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
      
      {/* Graph Container */}
      <div className="flex-1">
        <DependencyGraph />
      </div>
    </div>
  );
};

export default GraphPage;
