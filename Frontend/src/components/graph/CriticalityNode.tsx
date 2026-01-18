import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { getNodeColor } from "./graphData";

interface CriticalityNodeData {
  id: string;
  title: string;
  criticality: number;
  track?: string;
  duration_days?: number;
  isOnCriticalPath?: boolean;
  onClick: () => void;
}

interface CriticalityNodeProps {
  data: CriticalityNodeData;
}

const CriticalityNode = memo(({ data }: CriticalityNodeProps) => {
  const color = getNodeColor(data.criticality);
  const borderStyle = data.isOnCriticalPath ? "2px dashed" : "1px";

  return (
    <div
      onClick={data.onClick}
      className="cursor-pointer border font-mono transition-all duration-200 hover:scale-105"
      style={{
        borderColor: data.isOnCriticalPath ? "#ef4444" : color,
        borderWidth: data.isOnCriticalPath ? "2px" : "1px",
        borderStyle: data.isOnCriticalPath ? "solid" : "solid",
        minWidth: "180px",
        backgroundColor: `${color}15`,
        boxShadow: data.isOnCriticalPath ? "0 0 8px rgba(239, 68, 68, 0.3)" : "none",
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
          style={{ backgroundColor: data.isOnCriticalPath ? "#ef4444" : color }}
        />

        {/* Content */}
        <div className="p-2 flex-1">
          <span className="text-xs text-muted-foreground block mb-1">
            {data.id}
          </span>
          <span className="text-sm font-bold text-foreground block leading-tight">
            {data.title}
          </span>

          {/* Additional metadata */}
          <div className="mt-1 space-y-0.5">
            {data.duration_days && (
              <span className="text-xs text-muted-foreground block">
                {data.duration_days}d
              </span>
            )}
            {data.track && (
              <span className="text-xs text-primary block truncate opacity-75">
                {data.track}
              </span>
            )}
          </div>
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
