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
from app.models.risk import Risk
from app.routes.auth import get_current_user
from app.schemas.risk import RiskCreate, RiskUpdate, RiskResponse
from app.services.llm import get_llm_provider

router = APIRouter(tags=["risks"])
limiter = Limiter(key_func=get_remote_address)


def _safe_int(value, default=3):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


_VALID_CATEGORIES = {"sécurité", "disponibilité", "conformité", "données", "infrastructure", "RH", "opérationnel", "financier", "produit", "client", "stratégique", "autre"}
_VALID_TREATMENTS = {"atténuer", "accepter", "transférer", "éviter"}


def _clean_category(raw):
    if not raw:
        return "autre"
    if "|" in raw:
        raw = raw.split("|")[0].strip()
    raw = raw.strip().lower()
    # Accept known categories, otherwise return a normalized free-text category
    if raw in _VALID_CATEGORIES:
        return raw
    # keep the provided category (truncated) so analysis remains domain-appropriate
    return raw[:50]


def _clean_treatment(raw):
    if not raw:
        return "atténuer"
    raw = raw.strip().lower()
    if raw in _VALID_TREATMENTS:
        return raw
    return "atténuer"


def _clean_owner(raw):
    if not raw:
        return ""
    bad = {"Rôle suggéré", "role suggéré", "rôle", "role", "N/A", "n/a", "à définir", "a definir"}
    if raw.strip() in bad:
        return ""
    return raw.strip()[:255]


def _risk_level(probability: int, impact: int) -> str:
    score = probability * impact
    if score >= 15:
        return "critique"
    if score >= 8:
        return "élevé"
    if score >= 4:
        return "moyen"
    return "faible"


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


def _risk_to_response(r: Risk) -> RiskResponse:
    return RiskResponse(
        id=r.id,
        board_id=r.board_id,
        title=r.title,
        description=r.description or "",
        category=r.category or "autre",
        probability=r.probability,
        impact=r.impact,
        risk_level=_risk_level(r.probability, r.impact),
        treatment=r.treatment or "atténuer",
        treatment_action=r.treatment_action or "",
        owner=r.owner or "",
        source_postits=r.source_postits or [],
        created_at=r.created_at.isoformat() if r.created_at else None,
    )


@router.get("/api/boards/{board_id}/risks", response_model=list[RiskResponse])
def list_risks(
    board_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verify_board_access(board_id, current_user.id, db)
    risks = db.query(Risk).filter(Risk.board_id == board_id).order_by(Risk.created_at.desc()).all()
    return [_risk_to_response(r) for r in risks]


@router.post("/api/boards/{board_id}/risks", response_model=RiskResponse, status_code=201)
def create_risk(
    board_id: UUID,
    data: RiskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verify_board_access(board_id, current_user.id, db)
    risk = Risk(
        board_id=board_id,
        title=data.title,
        description=data.description,
        category=data.category,
        probability=data.probability,
        impact=data.impact,
        treatment=data.treatment,
        treatment_action=data.treatment_action,
        owner=data.owner,
        source_postits=data.source_postits,
    )
    db.add(risk)
    db.commit()
    db.refresh(risk)
    return _risk_to_response(risk)


@router.put("/api/risks/{risk_id}", response_model=RiskResponse)
def update_risk(
    risk_id: UUID,
    data: RiskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    risk = db.query(Risk).filter(Risk.id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risque non trouvé")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(risk, field, value)
    db.commit()
    db.refresh(risk)
    return _risk_to_response(risk)


@router.delete("/api/risks/{risk_id}", status_code=204)
def delete_risk(
    risk_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    risk = db.query(Risk).filter(Risk.id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risque non trouvé")
    db.delete(risk)
    db.commit()


RISK_SYSTEM_PROMPT = """Tu es un expert en gestion des risques. Tu reçois des post-its d'un brainstorming pouvant porter sur n'importe quel domaine (SI, produit, financier, opérationnel, client, stratégique, RH...).
Identifie les risques CACHÉS ou implicites dans les idées. Ne répète pas les post-its, fournis une analyse des menaces et impacts.

Réponds UNIQUEMENT en JSON:
{"risques":[{"title":"Titre court","description":"Description détaillée","category":"catégorie libre (ex: sécurité, produit, financier, opérationnel, client, RH, stratégique, autre)","probability":3,"impact":4,"treatment":"atténuer|accepter|transférer|éviter","treatment_action":"Action de traitement concrète","owner":"Rôle suggéré","source_content":"post-it source"}]}

Règles:
- Probability: 1-5 (1=très peu probable, 5=quasi certain)
- Impact: 1-5 (1=négligeable, 5=catastrophique)
- Category: fournie comme texte libre; privilégie une catégorie courte et parlante
- Traitements: atténuer, accepter, transférer, éviter
- 3 à 8 risques maximum
- Identifie les risques MÊME SI le post-it semble positif
- Réponds STRICTEMENT en JSON, sans texte supplémentaire"""


@router.post("/api/boards/{board_id}/risks/analyze")
@limiter.limit("1/60secondes")
def analyze_risks(
    request: Request,
    board_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    board = _verify_board_access(board_id, current_user.id, db)
    postits = db.query(Postit).filter(Postit.board_id == board_id).all()
    if not postits:
        raise HTTPException(status_code=400, detail="Ajoutez des post-its avant d'analyser les risques")

    valid_postits = [p for p in postits if p.content and p.content.strip()]
    if not valid_postits:
        raise HTTPException(status_code=400, detail="Les post-its sont vides")

    postits_text = "\n".join([f"{i+1}. {p.content.strip()}" for i, p in enumerate(valid_postits)])
    user_prompt = f'Post-its du brainstorming "{board.title}":\n{postits_text}\n\nIdentifie les risques.'

    provider = None
    try:
        provider = get_llm_provider()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM non disponible: {str(e)}")

    try:
        import asyncio
        import time
        t0 = time.time()
        result = asyncio.run(provider.generate(RISK_SYSTEM_PROMPT, user_prompt))
        duration_ms = int((time.time() - t0) * 1000)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erreur LLM ({provider.name}): {str(e)}")

    raw = result["text"]

    try:
        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            text = "\n".join(lines)
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start != -1 and end > start:
                try:
                    data = json.loads(text[start:end])
                except json.JSONDecodeError:
                    data = {"risques": []}
            else:
                data = {"risques": []}
    except Exception:
        data = {"risques": []}

    created = []
    for r in data.get("risques", []):
        if not r.get("title"):
            continue
        prob = max(1, min(5, _safe_int(r.get("probability"), 3)))
        imp = max(1, min(5, _safe_int(r.get("impact"), 3)))
        risk = Risk(
            board_id=board_id,
            title=r.get("title", "")[:255],
            description=r.get("description", ""),
            category=_clean_category(r.get("category", "")),
            probability=prob,
            impact=imp,
            treatment=_clean_treatment(r.get("treatment", "")),
            treatment_action=r.get("treatment_action", ""),
            owner=_clean_owner(r.get("owner", "")),
            source_postits=[r.get("source_content", "")],
        )
        db.add(risk)
        db.flush()
        created.append(_risk_to_response(risk))

    db.commit()

    return {
        "risques": created,
        "count": len(created),
        "provider_used": provider.name,
        "duration_ms": duration_ms,
    }
