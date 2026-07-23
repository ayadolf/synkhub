import json
from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.models.user import User
from app.models.workspace import Member
from app.models.board import Board
from app.models.postit import Postit
from app.routes.auth import get_current_user
from app.schemas.synthesis import SynthesisResponse
from app.services.llm import get_llm_provider

router = APIRouter(tags=["synthesis"])
limiter = Limiter(key_func=get_remote_address)

SYSTEM_PROMPT = """Tu es un consultant en gouvernance SI. Analyse des post-its de brainstorming.

IMPORTANT: NE PAS repeter ou lister les post-its. Analyse-les et donne des actions concrètes.

CRITERES DE PRIORISATION:
- Impact SI (1-5) + Urgence (1-5)
- Score >=7: Haute, 4-6: Moyenne, <=3: Basse

Le resume doit identifier 2-3 grands themes, PAS la liste des post-its.

Reponds UNIQUEMENT en JSON:
{"resume":"analyse en 3-5 phrases","plan_d_action":[{"action":"action concrete","priorite":"Haute|Moyenne|Basse","responsable":"role","delai":"delai","justification":"pourquoi cette priorite"}]}

3 a 8 actions."""

USER_PROMPT_TEMPLATE = """Post-its du brainstorming "{title}":
{postits}

Genere le JSON."""


def _verify_board_access(board_id: UUID, user_id: UUID, db: Session):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board non trouvé")
    membership = db.query(Member).filter(
        Member.workspace_id == board.workspace_id,
        Member.user_id == user_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Accès refusé")
    return board


def _format_postits(postits: list[Postit]) -> str:
    lines = []
    for i, p in enumerate(postits, 1):
        lines.append(f"{i}. {p.content}")
    return "\n".join(lines)


def _parse_llm_response(raw: str) -> dict:
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass
    return {
        "resume": raw[:500] if raw else "Pas de reponse",
        "plan_d_action": [
            {"action": "Consultez les post-its du board", "priorite": "Moyenne",
             "responsable": "", "delai": ""}
        ],
    }


@router.post("/api/boards/{board_id}/synthesis", response_model=SynthesisResponse)
@limiter.limit("1/30secondes")
def generate_synthesis(
    request: Request,
    board_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    board = _verify_board_access(board_id, current_user.id, db)

    postits = db.query(Postit).filter(Postit.board_id == board_id).all()
    if not postits:
        raise HTTPException(status_code=400, detail="Aucun post-it sur ce board")

    valid_postits = [p for p in postits if p.content and p.content.strip()]
    if not valid_postits:
        raise HTTPException(status_code=400, detail="Les post-its sont vides")

    provider = None
    try:
        provider = get_llm_provider()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM non disponible: {str(e)}")

    postits_text = _format_postits(valid_postits)
    user_prompt = USER_PROMPT_TEMPLATE.format(
        count=len(postits), title=board.title, postits=postits_text
    )

    try:
        import asyncio
        import time
        t0 = time.time()
        result = asyncio.run(provider.generate(SYSTEM_PROMPT, user_prompt))
        duration_ms = int((time.time() - t0) * 1000)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erreur LLM ({provider.name}): {str(e)}")

    raw = result["text"]

    try:
        data = _parse_llm_response(raw)
    except Exception:
        raise HTTPException(status_code=502, detail="Réponse LLM invalide")

    def _norm_priority(p):
        p = (p or "").lower().strip().lstrip("@")
        if p in ("high", "haute", "haut", "urgent", "1", "haute"):
            return "Haute"
        if p in ("low", "basse", "bas", "3", "basse"):
            return "Basse"
        return "Moyenne"

    raw_actions = data.get("plan_d_action", [])
    if not raw_actions and isinstance(data.get("actions"), list):
        raw_actions = data["actions"]

    actions = [
        {"action": a.get("action", ""), "priorite": _norm_priority(a.get("priorite", "")),
         "responsable": a.get("responsable", a.get("responsable_suggere", "")),
         "delai": a.get("delai", ""),
         "justification": a.get("justification", "")}
        for a in raw_actions if a.get("action")
    ]

    return SynthesisResponse(
        resume=data.get("resume", ""),
        plan_d_action=actions,
        provider_used=provider.name,
        postit_count=len(postits),
        duration_ms=duration_ms,
        tokens_generated=result.get("tokens", 0),
        tokens_per_second=result.get("tokens_per_sec", 0),
    )
