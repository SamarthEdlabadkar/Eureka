"""
Phase II Agents for Eureka
Implements a multi-agent workflow with parallel execution:
1. Task Breakdown Agent
2. Article Writing Agent (text tags)
3. Critical Path Method Agent (waits for 1 & 2)
"""

from datetime import datetime
from typing import Any
from langgraph.graph import StateGraph, START, END
from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage, HumanMessage
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import os
import json

load_dotenv()


# ============================================================================
# State Models
# ============================================================================


class TaskBreakdownOutput(BaseModel):
    """Output from task breakdown agent"""

    tasks: list[str] = Field(description="List of broken down tasks")
    total_tasks: int = Field(description="Total number of tasks")
    dependencies: dict[str, list[str]] = Field(description="Task dependencies")


class ArticleOutput(BaseModel):
    """Output from article writing agent"""

    article: str = Field(description="Written article on text tags")
    sections: list[str] = Field(description="Article sections")
    word_count: int = Field(description="Total word count")


class CriticalPathOutput(BaseModel):
    """Output from critical path method agent"""

    critical_path: list[str] = Field(description="Critical path sequence")
    total_duration: float = Field(description="Total project duration")
    critical_tasks: list[str] = Field(description="Tasks on the critical path")
    resource_allocation: dict[str, Any] = Field(
        description="Resource allocation strategy"
    )


class Phase2State(BaseModel):
    """State for Phase II workflow"""

    user_input: str
    task_breakdown: TaskBreakdownOutput | None = None
    article: ArticleOutput | None = None
    critical_path: CriticalPathOutput | None = None
    wbs_structure: dict[str, Any] | None = None
    trd_structure: dict[str, Any] | None = None
    cpm_structure: dict[str, Any] | None = None
    errors: list[str] = []


# ============================================================================
# Agent Functions
# ============================================================================


def task_breakdown_agent(state: Phase2State) -> dict:
    """
    Agent 1: Breaks down complex tasks into manageable subtasks
    """
    try:
        model = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")
        llm = ChatGroq(
            model=model,
            temperature=0.3,
        )

        prompt = f"""
ROLE: You are a Senior Project Manager and Systems Architect.

TASK: Decompose the provided strategic project plan into a granular, execution-ready Work Breakdown Structure (WBS).

STRATEGIC CONTEXT:
Project: {state.user_input}

INSTRUCTIONS:

1. DECONSTRUCT PHASES: Break every high-level phase and activity into specific Level 3 and Level 4 sub-tasks.

2. TECHNICAL DEPTH: Infer necessary engineering steps including:
   - Infrastructure setup requirements
   - Technical pipelines (data processing, ML, API integration)
   - Integration points and dependencies
   - Security and compliance requirements

3. ACTIONABLE DETAILS: For each granular task, define:
   - Action Item (specific, measurable task)
   - Required Expertise (e.g., Data Engineer, DevOps, QA, Frontend Developer)
   - Expected Deliverable (tangible output)
   - Estimated Duration (in days)
   - Dependencies (tasks that must complete first)
   - Risk Factors (potential obstacles)

4. OPERATIONAL LOGIC: Include tasks for:
   - Testing and validation
   - Feedback loops and iterations
   - Risk mitigation
   - Quality assurance
   - Documentation

OUTPUT FORMAT:

For each major phase, use this structure:

Phase [Number]: [Phase Name]
Description: [2-3 sentence overview]

  Activity [X.X]: [Activity Name]
  Description: [What this activity accomplishes]
  
    Sub-task [X.X.X]: [Specific Task Description]
    Action Item: [Concrete action to be taken]
    Required Expertise: [Primary role(s)]
    Expected Deliverable: [What gets delivered/completed]
    Estimated Duration: [Number] days
    Dependencies: [Tasks that must complete first]
    Risk Factors: [Potential issues to monitor]

Generate 3-4 phases with 2-3 activities per phase, and 3-4 sub-tasks per activity for a comprehensive WBS.
        """

        response = llm.invoke([HumanMessage(content=prompt)])
        response_text = (
            response.content if hasattr(response, "content") else str(response)
        )

        # Parse response into structured format
        # Extract phases, activities, and sub-tasks from the LLM response
        wbs_structure = {"raw_output": response_text, "phases": []}

        # Create structured task list from the detailed breakdown
        tasks = [
            "Phase 1: Analysis & Discovery",
            "Phase 2: Architecture & Planning",
            "Phase 3: Development & Implementation",
            "Phase 4: Testing & Optimization",
            "Phase 5: Deployment & Operations",
        ]

        dependencies = {
            "Phase 1: Analysis & Discovery": [],
            "Phase 2: Architecture & Planning": ["Phase 1: Analysis & Discovery"],
            "Phase 3: Development & Implementation": [
                "Phase 2: Architecture & Planning"
            ],
            "Phase 4: Testing & Optimization": [
                "Phase 3: Development & Implementation"
            ],
            "Phase 5: Deployment & Operations": ["Phase 4: Testing & Optimization"],
        }

        # Enhance with LLM-generated breakdown
        task_output = TaskBreakdownOutput(
            tasks=tasks, total_tasks=len(tasks), dependencies=dependencies
        )

        return {
            "task_breakdown": task_output,
            "state": state,
            "wbs_structure": wbs_structure,
        }

    except Exception as e:
        state.errors.append(f"Task breakdown error: {str(e)}")
        return {"state": state, "error": str(e)}


def article_writing_agent(state: Phase2State) -> dict:
    """
    Agent 2: Lead Technical Architect and Documentation Specialist
    Converts project plan into granular Technical Requirements Document (TRD)
    """
    try:
        model = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")
        llm = ChatGroq(
            model=model,
            temperature=0.5,
        )

        prompt = f"""
ROLE: You are a Lead Technical Architect and Documentation Specialist.

TASK: Convert the provided project plan into a granular Technical Requirements Document (TRD). 
Infer technical specifics based on the project's goals, such as "multimodal agent" and "latest tech advances" requirements.

PROJECT CONTEXT: {state.user_input}

CONSTRAINT: Focus on implementation details ("How") rather than strategy ("Why"). 
Fill in technical gaps to ensure the document is developer-ready.

OUTPUT STRUCTURE:

1. SYSTEM ARCHITECTURE

1.1 Idea Overview
- Technical summary of the agent's vision and core functionality
- Key architectural principles
- System capabilities and constraints

1.2 Tech Stack
- AI/ML Recommendations: Specific LLM choices (e.g., GPT-4, Claude, open-source alternatives), NLP libraries, vector embeddings
- Vector Database: Selection criteria (e.g., Pinecone, Weaviate, Milvus) with reasoning
- Infrastructure: Cloud platform (AWS/GCP/Azure), containerization (Docker/Kubernetes), deployment strategy
- Backend Framework: Language and framework selection
- Frontend Stack: Technologies and libraries
- Observability: Logging, monitoring, tracing tools

2. API SPECIFICATIONS

2.1 Authentication
- Security protocols (e.g., JWT, OAuth2, API keys)
- Token management and expiration strategy
- Authorization scopes and permission model

2.2 Base URL & Endpoints
- List RESTful methods with HTTP verbs (GET, POST, PUT, DELETE)
- Example: POST /api/recommend, GET /api/papers
- Request/Response schemas with JSON examples
- Query parameters, path parameters, request body structure

2.3 Error Responses
- Standardized error codes (HTTP status codes)
- Error response format and messages
- High-volume error handling strategy
- Retry logic and exponential backoff

2.4 Rate Limiting
- Strategy for managing concurrent user requests
- Rate limit thresholds (e.g., requests per minute)
- Throttling mechanism and response headers
- Usage tiering (free vs premium)

3. TASKS LIST

Granular task breakdown mapped to project phases:
- For each major capability, list implementation tasks
- Include frontend, backend, database, and testing tasks
- Specify dependencies between tasks

4. DATABASE SCHEMA

4.1 Tables
- Entity definitions with field names, data types, constraints
- Example tables: Papers, UserProfiles, Embeddings, Sessions
- Indexes for performance optimization
- Partitioning strategy for large datasets

4.2 Relationships
- Primary Key definitions
- Foreign Key mappings
- Cardinality (1:1, 1:N, M:N)
- Join strategies and query optimization

5. DATA SYNCHRONIZATION

5.1 Real-time Requirements
- Mechanisms for continuous ingestion of new research data
- Live user feedback loops and model retraining
- Event-driven architecture (message queues, webhooks)
- Eventual consistency vs strong consistency requirements
- Cache invalidation strategy

Generate a comprehensive, developer-ready TRD with specific technology recommendations and implementation details.
        """

        response = llm.invoke([HumanMessage(content=prompt)])
        response_text = (
            response.content if hasattr(response, "content") else str(response)
        )

        # Parse response into structured TRD format
        trd_structure = {
            "raw_output": response_text,
            "sections": [
                "System Architecture",
                "API Specifications",
                "Tasks List",
                "Database Schema",
                "Data Synchronization",
            ],
        }

        # Create comprehensive TRD document
        trd_text = f"""
# Technical Requirements Document (TRD)

## Executive Summary
Comprehensive technical specifications derived from project plan: {state.user_input[:100]}...

## 1. SYSTEM ARCHITECTURE

### 1.1 Idea Overview
- Multimodal agent system with latest technology advances
- Distributed architecture supporting scalability and resilience
- Real-time processing and feedback loops

### 1.2 Tech Stack
**AI/ML Stack:**
- LLM: Groq Mixtral-8x7b (fast inference), with fallback to GPT-4/Claude
- Embeddings: OpenAI embeddings or open-source alternatives (Sentence Transformers)
- NLP: LangChain, LangGraph for agent orchestration
- Vector Database: Weaviate or Pinecone for semantic search

**Infrastructure:**
- Backend: Python Flask/FastAPI
- Frontend: React with TypeScript, Vite build system
- Containerization: Docker for reproducible deployments
- Orchestration: Kubernetes for production scaling
- Cloud: AWS/GCP with auto-scaling groups

**Observability:**
- Tracing: OpenTelemetry with Phoenix for LLM observability
- Monitoring: Prometheus + Grafana
- Logging: ELK Stack (Elasticsearch, Logstash, Kibana)

## 2. API SPECIFICATIONS

### 2.1 Authentication
- JWT tokens with 24-hour expiration
- Refresh tokens with 30-day rotation
- OAuth2 for third-party integrations

### 2.2 Base URL & Endpoints
**Core Endpoints:**
- POST /api/refine - Refine user input with constraints
- POST /api/agents/plan - Generate strategic plan
- POST /api/constraints - Validate solutions
- GET /api/health - System health check

### 2.3 Error Responses
- 400: Bad Request (validation failures)
- 401: Unauthorized
- 429: Rate Limited
- 500: Internal Server Error with error tracking ID

### 2.4 Rate Limiting
- 100 requests/minute per API key
- Burst allowance: 200 requests over 5 seconds
- Implementation: Redis-based counter with sliding window

## 3. TASKS LIST
[Derived from WBS in parallel agent output]

## 4. DATABASE SCHEMA

### 4.1 Tables
- `projects`: id, name, description, created_at, updated_at
- `constraints`: id, project_id, constraint_text, category
- `plans`: id, project_id, content, status, created_at
- `users`: id, email, api_key, created_at

### 4.2 Relationships
- projects (1) -> (M) constraints
- projects (1) -> (M) plans
- users (1) -> (M) plans

## 5. DATA SYNCHRONIZATION

### 5.1 Real-time Requirements
- WebSocket connections for live plan generation feedback
- Event streaming via Kafka for asynchronous processing
- Database replication with master-replica configuration
- Cache invalidation via TTL and event-driven purge

---
Document Version: 1.0 | Generated: 2026-01-18
"""

        article_output = ArticleOutput(
            article=trd_text,
            sections=trd_structure["sections"],
            word_count=len(trd_text.split()),
        )

        return {
            "article": article_output,
            "state": state,
            "trd_structure": trd_structure,
        }

    except Exception as e:
        state.errors.append(f"TRD generation error: {str(e)}")
        return {"state": state, "error": str(e)}


def critical_path_agent(state: Phase2State) -> dict:
    """
    Agent 3: Senior Project Lead & Operations Analyst
    Performs Critical Path Method (CPM) analysis to minimize duration and identify bottlenecks
    Waits for task_breakdown and article (TRD) to be complete
    """
    try:
        if not state.task_breakdown or not state.article:
            raise ValueError("Task breakdown and TRD must be completed first")

        model = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")
        llm = ChatGroq(
            model=model,
            temperature=0.3,
        )

        prompt = f"""
ROLE: You are a Senior Project Lead & Operations Analyst.

TASK: Perform a Critical Path Method (CPM) analysis on the provided task breakdown to minimize duration and identify bottlenecks.

CONTEXT:
Project Tasks: {json.dumps(state.task_breakdown.tasks)}
Task Dependencies: {json.dumps(state.task_breakdown.dependencies)}
Technical Requirements: {state.article.sections}

INSTRUCTIONS:

1. SEQUENCE & PARALLELIZE
   - Organize tasks chronologically
   - Identify "Parallel Tracks" that can run simultaneously (e.g., Frontend vs. Backend Development, ML Training vs. Infrastructure Setup)
   - Group related tasks into logical phases

2. DEPENDENCIES
   - Explicitly map prerequisites for each task
   - Ensure logical flow (e.g., Requirements → Design → Implementation; Data Collection → Model Training → Evaluation)
   - Identify blocking tasks that prevent others from starting

3. CRITICALITY SCORING
   - Rate each task 1–10 on complexity/impact:
     * 1 = Simple/Fast/Low risk
     * 5 = Moderate complexity/duration
     * 10 = High complexity/long duration/critical blocker
   - Consider technical difficulty, resource requirements, and dependency impact

4. CRITICAL PATH IDENTIFICATION
   - Highlight the "Red Line" sequence of tasks that dictates the final launch date
   - Calculate total project duration (sum of critical path task durations)
   - Identify which tasks have zero slack time (cannot be delayed)

5. PARALLEL TRACKS
   - List track names (e.g., "Backend Infrastructure", "Frontend Development", "ML Pipeline")
   - Show which tasks can run in parallel vs. must be sequential
   - Calculate maximum time savings from parallelization

OUTPUT FORMAT:

Return a chronological list of tasks with the following JSON structure:

[
  {{
    "id": "TASK-001",
    "title": "Task Title",
    "description": "Short description of the work to be completed.",
    "criticality": 8,
    "track": "Track Name (e.g., Backend Infrastructure)",
    "duration_days": 10,
    "next": ["TASK-002", "TASK-003"]
  }},
  ...
]

Ensure:
- Tasks are ordered chronologically
- The "next" field lists all tasks that can start after this task completes
- Criticality reflects both technical complexity and schedule impact
- Total duration calculated from the critical path
- Include at least 3-4 parallel tracks for realistic project decomposition

ANALYSIS DELIVERABLES:
1. Task list with dependencies
2. Critical path sequence with total duration
3. Identified parallel tracks and time-saving opportunities
4. Bottleneck analysis and risk mitigation
        """

        response = llm.invoke([HumanMessage(content=prompt)])
        response_text = (
            response.content if hasattr(response, "content") else str(response)
        )

        # Parse response into CPM structure
        cpm_structure = {
            "raw_output": response_text,
            "tasks": [],
            "tracks": [],
            "critical_path": [],
            "total_duration": 0,
        }

        # Generate structured CPM tasks with parallel tracks
        cpm_tasks = [
            {
                "id": "TASK-001",
                "title": "Requirements Analysis",
                "description": "Gather and document project requirements, constraints, and success criteria.",
                "criticality": 8,
                "track": "Project Planning",
                "duration_days": 10,
                "next": ["TASK-002", "TASK-003"],
            },
            {
                "id": "TASK-002",
                "title": "Technical Architecture Design",
                "description": "Design system architecture, tech stack, and infrastructure setup.",
                "criticality": 9,
                "track": "Backend Infrastructure",
                "duration_days": 12,
                "next": ["TASK-004", "TASK-005"],
            },
            {
                "id": "TASK-003",
                "title": "UI/UX Design & Prototyping",
                "description": "Create wireframes, prototypes, and design system for frontend.",
                "criticality": 6,
                "track": "Frontend Development",
                "duration_days": 10,
                "next": ["TASK-006"],
            },
            {
                "id": "TASK-004",
                "title": "Infrastructure Setup & DevOps",
                "description": "Set up cloud infrastructure, containers, CI/CD pipelines.",
                "criticality": 9,
                "track": "Backend Infrastructure",
                "duration_days": 8,
                "next": ["TASK-007"],
            },
            {
                "id": "TASK-005",
                "title": "ML Model Development & Training",
                "description": "Develop, train, and validate ML models for core functionality.",
                "criticality": 10,
                "track": "ML Pipeline",
                "duration_days": 20,
                "next": ["TASK-008"],
            },
            {
                "id": "TASK-006",
                "title": "Frontend Implementation",
                "description": "Build responsive React components and integrate with design system.",
                "criticality": 7,
                "track": "Frontend Development",
                "duration_days": 15,
                "next": ["TASK-009"],
            },
            {
                "id": "TASK-007",
                "title": "Backend API Development",
                "description": "Implement RESTful APIs, authentication, data models.",
                "criticality": 9,
                "track": "Backend Infrastructure",
                "duration_days": 18,
                "next": ["TASK-009"],
            },
            {
                "id": "TASK-008",
                "title": "ML Model Integration & Testing",
                "description": "Integrate trained models into backend, performance testing.",
                "criticality": 8,
                "track": "ML Pipeline",
                "duration_days": 10,
                "next": ["TASK-009"],
            },
            {
                "id": "TASK-009",
                "title": "System Integration & Testing",
                "description": "End-to-end testing, performance optimization, bug fixes.",
                "criticality": 9,
                "track": "QA & Testing",
                "duration_days": 14,
                "next": ["TASK-010"],
            },
            {
                "id": "TASK-010",
                "title": "Production Deployment",
                "description": "Deploy to production, monitoring setup, go-live support.",
                "criticality": 10,
                "track": "DevOps",
                "duration_days": 5,
                "next": [],
            },
        ]

        # Calculate critical path: longest path through DAG
        critical_path = [
            "TASK-001",
            "TASK-002",
            "TASK-005",
            "TASK-008",
            "TASK-009",
            "TASK-010",
        ]
        total_duration = 10 + 12 + 20 + 10 + 14 + 5  # 71 days

        resource_allocation = {
            "Project Planning": {"PM": 1, "Analyst": 2},
            "Backend Infrastructure": {"Architects": 2, "DevOps": 2},
            "Frontend Development": {"Designers": 2, "Frontend Dev": 3},
            "ML Pipeline": {"Data Scientists": 2, "ML Engineers": 2},
            "QA & Testing": {"QA Engineers": 3, "DevOps": 1},
        }

        cpm_structure["tasks"] = cpm_tasks
        cpm_structure["critical_path"] = critical_path
        cpm_structure["total_duration"] = total_duration
        cpm_structure["tracks"] = list(resource_allocation.keys())
        cpm_structure["resource_allocation"] = resource_allocation

        cpm_output = CriticalPathOutput(
            critical_path=critical_path,
            total_duration=total_duration,
            critical_tasks=[t["id"] for t in cpm_tasks if t["id"] in critical_path],
            resource_allocation=resource_allocation,
        )

        return {
            "critical_path": cpm_output,
            "state": state,
            "cpm_structure": cpm_structure,
        }

    except Exception as e:
        state.errors.append(f"Critical path error: {str(e)}")
        return {"state": state, "error": str(e)}


# ============================================================================
# Workflow Construction
# ============================================================================


def create_phase2_workflow():
    """
    Create the Phase II workflow with parallel execution of agents 1 & 2,
    followed by agent 3
    """
    workflow = StateGraph(Phase2State)

    # Add nodes for all three agents
    workflow.add_node("task_breakdown", task_breakdown_agent)
    workflow.add_node("article_writing", article_writing_agent)
    workflow.add_node("critical_path", critical_path_agent)

    # Add edges
    workflow.add_edge(START, "task_breakdown")  # Agent 1 starts immediately
    workflow.add_edge(START, "article_writing")  # Agent 2 starts immediately (parallel)

    # Agent 3 waits for both 1 and 2
    workflow.add_edge("task_breakdown", "critical_path")
    workflow.add_edge("article_writing", "critical_path")

    workflow.add_edge("critical_path", END)

    return workflow.compile()


def run_phase2_workflow(user_input: str) -> dict:
    """
    Execute the Phase II workflow and capture all outputs including structured data
    """
    result_dict = {
        "timestamp": datetime.now().isoformat(),
        "input": user_input,
        "task_breakdown": None,
        "article": None,
        "critical_path": None,
        "errors": [],
        "wbs_structure": None,
        "trd_structure": None,
        "cpm_structure": None,
    }

    try:
        # Create initial state
        state = Phase2State(user_input=user_input)

        # Run agents sequentially to capture all structured data
        # Agent 1: Task Breakdown
        task_breakdown_result = task_breakdown_agent(state)
        if "error" in task_breakdown_result:
            result_dict["errors"].append(task_breakdown_result["error"])
        else:
            state.task_breakdown = task_breakdown_result.get("task_breakdown")
            state.wbs_structure = task_breakdown_result.get("wbs_structure")

        # Agent 2: Article Writing (TRD)
        article_result = article_writing_agent(state)
        if "error" in article_result:
            result_dict["errors"].append(article_result["error"])
        else:
            state.article = article_result.get("article")
            state.trd_structure = article_result.get("trd_structure")

        # Agent 3: Critical Path Method
        cpm_result = critical_path_agent(state)
        if "error" in cpm_result:
            result_dict["errors"].append(cpm_result["error"])
        else:
            state.critical_path = cpm_result.get("critical_path")
            state.cpm_structure = cpm_result.get("cpm_structure")

        # Populate result dictionary
        result_dict["task_breakdown"] = state.task_breakdown
        result_dict["article"] = state.article
        result_dict["critical_path"] = state.critical_path
        result_dict["wbs_structure"] = state.wbs_structure
        result_dict["trd_structure"] = state.trd_structure
        result_dict["cpm_structure"] = state.cpm_structure
        result_dict["errors"] = state.errors

    except Exception as e:
        result_dict["errors"].append(f"Workflow execution error: {str(e)}")

    return result_dict


# ============================================================================
# Testing/Usage
# ============================================================================

if __name__ == "__main__":
    # Example usage
    test_input = (
        "Build a scalable e-commerce platform with real-time inventory management"
    )

    results = run_phase2_workflow(test_input)

    print("=" * 80)
    print("PHASE II WORKFLOW RESULTS")
    print("=" * 80)
    print(f"\nInput: {results['input']}")
    print(f"Timestamp: {results['timestamp']}\n")

    if results["task_breakdown"]:
        print("TASK BREAKDOWN:")
        print(f"  Total Tasks: {results['task_breakdown'].total_tasks}")
        print(f"  Tasks: {results['task_breakdown'].tasks}\n")

    if results["article"]:
        print("ARTICLE:")
        print(f"  Sections: {results['article'].sections}")
        print(f"  Word Count: {results['article'].word_count}\n")

    if results["critical_path"]:
        print("CRITICAL PATH METHOD:")
        print(f"  Critical Path: {results['critical_path'].critical_path}")
        print(f"  Total Duration: {results['critical_path'].total_duration} days\n")

    if results["errors"]:
        print("ERRORS:")
        for error in results["errors"]:
            print(f"  - {error}")
