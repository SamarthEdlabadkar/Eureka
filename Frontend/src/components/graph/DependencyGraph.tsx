import { useCallback, useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
} from "@xyflow/react";
import dagre from "dagre";
import "@xyflow/react/dist/style.css";

import { getGraphDataFromEndpoint, GraphNode, getNodeColor } from "./graphData";
import CriticalityNode from "./CriticalityNode";
import { NodeDetailSheet } from "./NodeDetailSheet";

interface DependencyGraphProps {
  cpmTasks?: any[];
  criticalPath?: string[];
  totalDuration?: number;
  tracks?: string[];
  resourceAllocation?: any;
  taskBreakdown?: string[];
  wbsStructure?: any;
}

const nodeTypes = {
  criticality: CriticalityNode,
};

const nodeWidth = 180;
const nodeHeight = 70;

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction = "TB"
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      // Fix nodes in position - disable dragging
      draggable: false,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

export function DependencyGraph({
  cpmTasks,
  criticalPath,
  totalDuration,
  tracks,
  resourceAllocation,
  taskBreakdown,
  wbsStructure
}: DependencyGraphProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const handleNodeClick = useCallback((nodeData: GraphNode) => {
    setSelectedNode(nodeData);
  }, []);
  console.log({ cpmTasks, criticalPath, totalDuration, tracks, resourceAllocation, taskBreakdown, wbsStructure });
  // Get graph data from endpoint, falling back to mock data if not available
  const graphData = useMemo(() => getGraphDataFromEndpoint(cpmTasks), [cpmTasks]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const nodes: Node[] = graphData.map((item) => {
      // Check if this node is in the critical path
      const isOnCriticalPath = criticalPath && criticalPath.includes(item.id);

      return {
        id: item.id,
        type: "criticality",
        position: { x: 0, y: 0 },
        data: {
          id: item.id,
          title: item.title,
          criticality: item.criticality,
          track: item.track,
          duration_days: item.duration_days,
          isOnCriticalPath,
          onClick: () => handleNodeClick(item),
        },
      };
    });

    const edges: Edge[] = graphData.flatMap((item) =>
      item.next.map((targetId) => {
        // Check if this edge is on the critical path
        const sourceOnPath = criticalPath && criticalPath.includes(item.id);
        const targetOnPath = criticalPath && criticalPath.includes(targetId);
        const edgeOnCriticalPath = sourceOnPath && targetOnPath;

        return {
          id: `${item.id}-${targetId}`,
          source: item.id,
          target: targetId,
          type: "smoothstep",
          style: {
            stroke: edgeOnCriticalPath ? "#ef4444" : "#ffffff",
            strokeWidth: edgeOnCriticalPath ? 3 : 2,
            strokeDasharray: "none",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edgeOnCriticalPath ? "#ef4444" : "#ffffff",
            width: 20,
            height: 20,
          },
        };
      })
    );

    return getLayoutedElements(nodes, edges, "TB");
  }, [graphData, handleNodeClick, criticalPath]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update nodes and edges when layout changes
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-background font-mono relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="hsl(var(--border))" gap={20} size={1} />
        <Controls
          className="!bg-background !border !border-border !rounded-none [&>button]:!bg-background [&>button]:!border-border [&>button]:!rounded-none [&>button]:hover:!bg-muted [&>button>svg]:!fill-foreground"
        />
      </ReactFlow>

      {/* CPM Metadata Panel */}
      {(totalDuration || tracks || criticalPath || graphData.length > 0) && (
        <div className="absolute bottom-4 right-4 bg-background/95 border border-border rounded p-3 text-xs font-mono max-w-xs space-y-2 max-h-96 overflow-y-auto">
          {totalDuration && (
            <div>
              <span className="text-primary">TOTAL DURATION:</span> {totalDuration} days
            </div>
          )}

          {graphData.length > 0 && (
            <div>
              <span className="text-primary">TASKS:</span> {graphData.length}
            </div>
          )}

          {criticalPath && criticalPath.length > 0 && (
            <div>
              <span className="text-primary">CRITICAL PATH:</span>
              <div className="text-muted-foreground mt-1 max-h-20 overflow-y-auto text-xs">
                {criticalPath.map((task, i) => (
                  <div key={i} className="truncate">→ {task}</div>
                ))}
              </div>
            </div>
          )}

          {/* Track breakdown */}
          {tracks && tracks.length > 0 && (
            <div>
              <span className="text-primary">TRACKS:</span>
              <div className="text-muted-foreground mt-1 space-y-1">
                {tracks.map((track) => {
                  const trackTasks = graphData.filter(t => t.track === track);
                  const trackDuration = trackTasks.reduce((sum, t) => sum + (t.duration_days || 0), 0);
                  return (
                    <div key={track} className="text-xs truncate">
                      {track}: {trackTasks.length} tasks, {trackDuration}d
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {resourceAllocation && (
            <div>
              <span className="text-primary">RESOURCES:</span>
              <div className="text-muted-foreground mt-1 max-h-20 overflow-y-auto text-xs space-y-0.5">
                {Object.entries(resourceAllocation).map(([track, data]: any) => (
                  <div key={track} className="truncate">
                    {track}: {typeof data === 'object' ? Object.entries(data).map(([role, count]) => `${role}×${count}`).join(', ') : data}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <NodeDetailSheet
        node={selectedNode}
        graphData={graphData}
        onClose={() => setSelectedNode(null)}
        onNavigateToNode={(node) => setSelectedNode(node)}
      />
    </div>
  );
}
