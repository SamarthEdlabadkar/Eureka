import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { getNodeColor } from "./graphData";

interface CriticalityNodeData {
  id: string;
  title: string;
  criticality: number;
  onClick: () => void;
}

interface CriticalityNodeProps {
  data: CriticalityNodeData;
}

const CriticalityNode = memo(({ data }: CriticalityNodeProps) => {
  const color = getNodeColor(data.criticality);

  return (
    <div
      onClick={data.onClick}
      className="cursor-pointer border font-mono transition-all duration-200 hover:scale-105"
      style={{
        borderColor: color,
        borderWidth: "1px",
        minWidth: "180px",
        backgroundColor: `${color}15`,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-muted-foreground !border-0 !w-2 !h-2"
      />
      
      <div className="flex">
        {/* Criticality Indicator Stripe */}
        <div
          className="w-1 shrink-0"
          style={{ backgroundColor: color }}
        />
        
        {/* Content */}
        <div className="p-3 flex-1">
          <span className="text-xs text-muted-foreground block mb-1">
            {data.id}
          </span>
          <span className="text-sm font-bold text-foreground block">
            {data.title}
          </span>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground !border-0 !w-2 !h-2"
      />
    </div>
  );
});

CriticalityNode.displayName = "CriticalityNode";

export default CriticalityNode;
