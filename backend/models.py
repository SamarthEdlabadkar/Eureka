"""
Pydantic models for structured output from Groq
"""

from typing import List
from pydantic import BaseModel, Field


class CriticalQuestion(BaseModel):
    question: str = Field(max_length=200)


class Category(BaseModel):
    name: str
    questions: List[CriticalQuestion] = Field(min_length=2, max_length=3)


class RefinementResult(BaseModel):
    categories: List[Category] = Field(min_length=3, max_length=3)


# LangGraph Agent Models


class MasterPromptOutput(BaseModel):
    """Structured output from the Strategist agent"""

    objective: str = Field(description="Clear project objective")
    goals: List[str] = Field(description="List of specific goals")
    constraints_and_requirements: dict = Field(
        description="Constraints organized by type"
    )
    success_criteria: dict = Field(
        description="Functional and non-functional success criteria"
    )
    key_deliverables: List[str] = Field(description="Key deliverables")
    technical_considerations: dict = Field(
        description="Technical and logistical considerations"
    )


class StrategicPhase(BaseModel):
    """Represents a phase in the strategic roadmap"""

    name: str = Field(description="Phase name")
    duration: str = Field(description="Duration/timeline")
    activities: List[str] = Field(description="Key activities in this phase")


class StrategicRoadmapOutput(BaseModel):
    """Structured output from the Project Overview Planner agent"""

    problem_statement: str = Field(description="The core problem being addressed")
    vision_statement: str = Field(description="Inspiring vision for the project")
    major_goals: List[str] = Field(description="3-5 major high-level goals")
    key_phases: List[StrategicPhase] = Field(
        description="Phased breakdown of the project"
    )
    north_star_metrics: List[str] = Field(description="Key success metrics")
    strategic_dependencies_and_risks: dict = Field(description="Dependencies and risks")
