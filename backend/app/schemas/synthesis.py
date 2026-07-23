from pydantic import BaseModel


class ActionPlan(BaseModel):
    action: str
    priorite: str = "Moyenne"
    responsable: str = ""
    delai: str = ""
    justification: str = ""


class SynthesisResponse(BaseModel):
    resume: str
    plan_d_action: list[ActionPlan]
    provider_used: str
    postit_count: int
    duration_ms: int = 0
    tokens_generated: int = 0
    tokens_per_second: float = 0.0
