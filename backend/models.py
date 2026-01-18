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
