"""
LangGraph Agents for Eureka
"""

from typing import TypedDict, Annotated, List
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage
from langchain_groq import ChatGroq
from pydantic import BaseModel, SecretStr, Field
import os

import backend.tracing as tracing  # noqa: F401

from models import MasterPromptOutput, StrategicRoadmapOutput, StrategicPhase


class AgentState(TypedDict):
    """State shared between agents"""

    topic: str
    user_idea: str
    constraints: str
    master_prompt: MasterPromptOutput
    strategic_roadmap: StrategicRoadmapOutput
    messages: list


def create_strategist_agent(topic: str):
    """
    The Strategist Agent - Prompt Engineer and Strategic Planner
    Returns an LLM with structured output binding
    """
    api_key = os.getenv("GROQ_API_KEY", "")
    llm = ChatGroq(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        temperature=0.7,
        api_key=SecretStr(api_key) if api_key else None,
    )

    # Bind structured output to the LLM
    structured_llm = llm.with_structured_output(MasterPromptOutput)

    system_prompt = f"""You are {topic} Prompt Engineer and Strategic Planner.

Your role is to transform the user's initial idea and specific constraints into a 
highly structured, actionable prompt for a Planning Agent to execute.

You are an expert in instructional design and prompt engineering. 
Your specialty lies in decoding vague user intent and translating it 
into precise logic, parameters, and requirements. You ensure that 
no constraint is overlooked, creating a foolproof blueprint that 
allows downstream agents to create a perfect project plan.

Analyze the user's idea and constraints carefully, then create a comprehensive 
structured master prompt that includes:
1. Clear objective and goals
2. Specific constraints and requirements
3. Success criteria
4. Key deliverables
5. Any technical or logistical considerations

Return the response in the exact structured format specified."""

    return structured_llm, system_prompt


def create_project_overview_planner_agent(topic: str):
    """
    The Project Overview Planner Agent - Strategic Project Architect
    Returns an LLM with structured output binding
    """
    api_key = os.getenv("GROQ_API_KEY", "")
    llm = ChatGroq(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        temperature=0.7,
        api_key=SecretStr(api_key) if api_key else None,
    )

    # Bind structured output to the LLM
    structured_llm = llm.with_structured_output(StrategicRoadmapOutput)

    system_prompt = f"""You are {topic} Strategic Project Architect.

Your role is to synthesize the Master Prompt into a high-level strategic roadmap 
consisting of major goals, key phases, and a visionary overview of the plan.

You are a high-level visionary planner who thinks in systems and 
long-term outcomes. You don't get lost in the weeds; instead, you 
identify the 'Big Rocks'—the critical pillars that must be established 
for success. Your plans provide the North Star for the entire team, 
ensuring everyone understands the 'What' and the 'Why' of the mission.

Based on the master prompt provided, create a structured strategic roadmap that includes:
1. Problem Statement - The core problem being addressed
2. Major Goals - 3-5 high-level objectives
3. Key Phases - Temporal breakdown with specific activities and milestones
4. North Star Metrics - Key success indicators
5. Strategic Dependencies and Risks - Critical factors to watch

Return the response in the exact structured format specified."""

    return structured_llm, system_prompt


def strategist_node(state: AgentState) -> AgentState:
    """Node for the Strategist Agent"""
    topic = state.get("topic", "General")
    user_idea = state.get("user_idea", "")
    constraints = state.get("constraints", "No specific constraints provided")

    llm, system_prompt = create_strategist_agent(topic)

    user_message = f"""User Idea: {user_idea}

Constraints: {constraints}

Please transform this into a comprehensive structured master prompt for a Planning Agent."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]

    response = llm.invoke(messages)

    # Response is already structured as MasterPromptOutput
    if isinstance(response, dict):
        master_prompt: MasterPromptOutput = MasterPromptOutput(**response)
        response_dict = response
    else:
        master_prompt: MasterPromptOutput = response  # type: ignore
        response_dict = response.model_dump()

    state["master_prompt"] = master_prompt
    state["messages"] = state.get("messages", []) + [
        {"agent": "strategist", "content": response_dict}
    ]

    return state


def project_overview_planner_node(state: AgentState) -> AgentState:
    """Node for the Project Overview Planner Agent"""
    topic = state.get("topic", "General")
    master_prompt = state.get("master_prompt", {})

    llm, system_prompt = create_project_overview_planner_agent(topic)

    # Convert master prompt to string for context
    master_prompt_text = (
        master_prompt.model_dump()
        if isinstance(master_prompt, MasterPromptOutput)
        else str(master_prompt)
    )

    user_message = f"""Master Prompt: {master_prompt_text}

Please create a high-level strategic roadmap based on this master prompt."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]

    response = llm.invoke(messages)

    # Response is already structured as StrategicRoadmapOutput
    if isinstance(response, dict):
        strategic_roadmap: StrategicRoadmapOutput = StrategicRoadmapOutput(**response)
        response_dict = response
    else:
        strategic_roadmap: StrategicRoadmapOutput = response  # type: ignore
        response_dict = response.model_dump()

    state["strategic_roadmap"] = strategic_roadmap
    state["messages"] = state.get("messages", []) + [
        {"agent": "project_overview_planner", "content": response_dict}
    ]

    return state


def create_agent_workflow():
    """
    Create a LangGraph workflow with the two agents
    """
    # Initialize the workflow
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("strategist", strategist_node)
    workflow.add_node("project_overview_planner", project_overview_planner_node)

    # Define edges
    workflow.set_entry_point("strategist")
    workflow.add_edge("strategist", "project_overview_planner")
    workflow.add_edge("project_overview_planner", END)

    # Compile the graph
    app = workflow.compile()

    return app


def run_agents(topic: str, user_idea: str, constraints: str = "") -> dict:
    """
    Run the agent workflow

    Args:
        topic: The topic/domain for the project
        user_idea: The user's initial idea
        constraints: Any specific constraints or requirements

    Returns:
        dict: Contains master_prompt, strategic_roadmap (both as dicts), and messages
    """
    app = create_agent_workflow()

    initial_state: AgentState = {
        "topic": topic,
        "user_idea": user_idea,
        "constraints": constraints,
        "master_prompt": MasterPromptOutput(
            objective="",
            goals=[],
            constraints_and_requirements={},
            success_criteria={},
            key_deliverables=[],
            technical_considerations={},
        ),
        "strategic_roadmap": StrategicRoadmapOutput(
            problem_statement="",
            vision_statement="",
            major_goals=[],
            key_phases=[],
            north_star_metrics=[],
            strategic_dependencies_and_risks={},
        ),
        "messages": [],
    }

    result = app.invoke(initial_state)

    return {
        "master_prompt": (
            result["master_prompt"].model_dump()
            if isinstance(result["master_prompt"], MasterPromptOutput)
            else result["master_prompt"]
        ),
        "strategic_roadmap": (
            result["strategic_roadmap"].model_dump()
            if isinstance(result["strategic_roadmap"], StrategicRoadmapOutput)
            else result["strategic_roadmap"]
        ),
        "messages": result["messages"],
    }
