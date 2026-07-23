from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class RiskCreate(BaseModel):
    title: str
    description: str = ""
    category: str = "autre"
    probability: int = 3
    impact: int = 3
    treatment: str = "atténuer"
    treatment_action: str = ""
    owner: str = ""
    source_postits: list = []


class RiskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    probability: Optional[int] = None
    impact: Optional[int] = None
    treatment: Optional[str] = None
    treatment_action: Optional[str] = None
    owner: Optional[str] = None


class RiskResponse(BaseModel):
    id: UUID
    board_id: UUID
    title: str
    description: str
    category: str
    probability: int
    impact: int
    risk_level: str
    treatment: str
    treatment_action: str
    owner: str
    source_postits: list
    created_at: Optional[str] = None
