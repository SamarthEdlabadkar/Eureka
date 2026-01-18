export interface GraphNode {
    id: string;
    title: string;
    description: string;
    criticality: number; // 1-10
    next: string[];
    track?: string;
    duration_days?: number;
}

// Fallback mock data for development/testing
const MOCK_GRAPH_DATA: GraphNode[] = [
    {
        id: "TASK-01",
        title: "DB_MIGRATION",
        description:
            "Migrate legacy SQL data to new schema. This involves restructuring all existing tables, updating foreign key relationships, and ensuring data integrity during the transition period.",
        criticality: 9,
        next: ["TASK-02", "TASK-03"],
    },
    {
        id: "TASK-02",
        title: "API_REFACTOR",
        description:
            "Refactor REST endpoints to align with new database schema. Update all query handlers and ensure backward compatibility with existing clients.",
        criticality: 8,
        next: ["TASK-04"],
    },
    {
        id: "TASK-03",
        title: "CACHE_LAYER",
        description:
            "Implement Redis caching layer for frequently accessed data. Configure TTL policies and cache invalidation strategies.",
        criticality: 6,
        next: ["TASK-04"],
    },
    {
        id: "TASK-04",
        title: "AUTH_UPDATE",
        description:
            "Update authentication middleware to support new token format. Implement refresh token rotation and session management improvements.",
        criticality: 10,
        next: ["TASK-06"],
    },
    {
        id: "TASK-05",
        title: "LOGGING_SYSTEM",
        description:
            "Deploy centralized logging infrastructure. Configure log aggregation, indexing, and alerting rules for production monitoring.",
        criticality: 4,
        next: ["TASK-07"],
    },
    {
        id: "TASK-06",
        title: "LOAD_BALANCER",
        description:
            "Configure load balancer health checks and routing rules. Implement sticky sessions and failover mechanisms.",
        criticality: 7,
        next: ["TASK-08"],
    },
    {
        id: "TASK-07",
        title: "METRICS_DASHBOARD",
        description:
            "Create operational metrics dashboard. Visualize system health, performance KPIs, and resource utilization trends.",
        criticality: 3,
        next: ["TASK-08"],
    },
    {
        id: "TASK-08",
        title: "PROD_DEPLOY",
        description:
            "Execute production deployment. Coordinate with stakeholders, perform final validation, and initiate rollout sequence.",
        criticality: 9,
        next: [],
    },
    {
        id: "TASK-09",
        title: "DOC_UPDATE",
        description:
            "Update technical documentation and API references. Ensure all changes are properly documented for the development team.",
        criticality: 2,
        next: ["TASK-07"],
    },
];

// Export a function to get graph data, preferring real data over mock
export function getGraphDataFromEndpoint(cpmTasks?: any[]): GraphNode[] {
    if (!cpmTasks || cpmTasks.length === 0) {
        return MOCK_GRAPH_DATA;
    }

    return cpmTasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        criticality: task.criticality,
        next: task.next || [],
        track: task.track,
        duration_days: task.duration_days,
    }));
}

export function getNodeColor(criticality: number): string {
    if (criticality >= 10) return "#ef4444"; // Red
    if (criticality >= 9) return "#f97316"; // Orange
    if (criticality >= 6) return "#eab308"; // Yellow
    return "#22c55e"; // Green
}

export function getCriticalityLabel(criticality: number): string {
    if (criticality >= 10) return "CRITICAL";
    if (criticality >= 9) return "HIGH";
    if (criticality >= 6) return "MEDIUM";
    return "LOW";
}
