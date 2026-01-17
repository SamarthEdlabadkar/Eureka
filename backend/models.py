"""
Pydantic models for structured output from Groq
"""

from typing import List
from pydantic import BaseModel


class Flaw(BaseModel):
    title: str
    description: str


class Category(BaseModel):
    name: str
    flaws: List[Flaw]


class RefinementResult(BaseModel):
    categories: List[Category]
