import { useCallback, useMemo, useState } from "react";
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

import { MOCK_GRAPH_DATA, GraphNode, getNodeColor } from "./graphData";
import CriticalityNode from "./CriticalityNode";
import { NodeDetailSheet } from "./NodeDetailSheet";

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

export function DependencyGraph() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const handleNodeClick = useCallback((nodeData: GraphNode) => {
    setSelectedNode(nodeData);
  }, []);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const nodes: Node[] = MOCK_GRAPH_DATA.map((item) => ({
      id: item.id,
      type: "criticality",
      position: { x: 0, y: 0 },
      data: {
        id: item.id,
        title: item.title,
        criticality: item.criticality,
        onClick: () => handleNodeClick(item),
      },
    }));

    const edges: Edge[] = MOCK_GRAPH_DATA.flatMap((item) =>
      item.next.map((targetId) => ({
        id: `${item.id}-${targetId}`,
        source: item.id,
        target: targetId,
        type: "smoothstep",
        style: {
          stroke: "#ffffff",
          strokeWidth: 2,
          strokeDasharray: "none",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#ffffff",
          width: 20,
          height: 20,
        },
      }))
    );

    return getLayoutedElements(nodes, edges, "TB");
  }, [handleNodeClick]);

  const [nodes, , onNodesChange] = useNodesState(layoutedNodes);
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges);

  return (
    <div className="w-full h-full bg-background font-mono">
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

      <NodeDetailSheet 
        node={selectedNode} 
        onClose={() => setSelectedNode(null)} 
        onNavigateToNode={(node) => setSelectedNode(node)}
      />
    </div>
  );
}
