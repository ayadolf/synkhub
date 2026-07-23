from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.routes.auth import router as auth_router
from app.routes.workspaces import router as workspaces_router
from app.routes.boards import router as boards_router
from app.routes.postits import router as postits_router
from app.routes.teams import router as teams_router
from app.routes.avatar import router as avatar_router
from app.routes.invitations import router as invitations_router
from app.routes.notes import router as notes_router
from app.routes.audit import router as audit_router
from app.routes.ws import router as ws_router
from app.routes.ws_global import router as ws_global_router
from app.routes.synthesis import router as synthesis_router
from app.routes.risks import router as risks_router
from app.routes.pdf import router as pdf_router
from app.database import engine, Base
from app.models import User, Workspace, Member, Board, Postit, Vote, Comment, Note, Invitation, AuditLog, DataProcessing
from datetime import datetime, timezone

app = FastAPI(title="Brainstorming Pro API", version="1.0.0")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://synkhub.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(workspaces_router)
app.include_router(boards_router)
app.include_router(postits_router)
app.include_router(teams_router)
app.include_router(avatar_router)
app.include_router(invitations_router)
app.include_router(notes_router)
app.include_router(audit_router)
app.include_router(ws_router)
app.include_router(ws_global_router)
app.include_router(synthesis_router)
app.include_router(risks_router)
app.include_router(pdf_router)

@app.on_event("startup")
def startup():
    from app.database import SessionLocal
    from sqlalchemy import text

    db = SessionLocal()
    try:
        db.execute(text(
            "SELECT pg_terminate_backend(pid) "
            "FROM pg_stat_activity "
            "WHERE datname = current_database() "
            "AND pid != pg_backend_pid() "
            "AND state = 'idle in transaction'"
        ))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        db.execute(text("SET LOCAL lock_timeout = '5s'"))
        db.execute(text(
            "CREATE TABLE IF NOT EXISTS risks ("
            "id UUID PRIMARY KEY DEFAULT gen_random_uuid(), "
            "board_id UUID REFERENCES boards(id) ON DELETE CASCADE, "
            "title VARCHAR(255) NOT NULL, "
            "description TEXT DEFAULT '', "
            "category VARCHAR(50) DEFAULT 'autre', "
            "probability INTEGER DEFAULT 3, "
            "impact INTEGER DEFAULT 3, "
            "treatment VARCHAR(50) DEFAULT 'atténuer', "
            "treatment_action TEXT DEFAULT '', "
            "owner VARCHAR(100) DEFAULT '', "
            "source_postits JSON DEFAULT '[]', "
            "created_at TIMESTAMPTZ DEFAULT NOW(), "
            "updated_at TIMESTAMPTZ DEFAULT NOW())"
        ))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()

    db = SessionLocal()
    try:
        db.execute(text("SET LOCAL lock_timeout = '5s'"))
        db.execute(text("ALTER TABLE boards ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES users(id) ON DELETE SET NULL"))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()

    db = SessionLocal()
    try:
        db.execute(text("SET LOCAL lock_timeout = '5s'"))
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'"))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()

    db = SessionLocal()
    try:
        if db.query(DataProcessing).count() == 0:
            processings = [
                DataProcessing(
                    name="Authentification utilisateur",
                    purpose="Permettre l'accès sécurisé à la plateforme",
                    legal_basis="Exécution du contrat (Art. 6.1.b RGPD)",
                    data_categories="Email, nom d'utilisateur, mot de passe hashé",
                    retention_period="Durée du compte + 12 mois après suppression",
                    recipients="Direction Systèmes Informatique - OCP Jorf Lasfar",
                ),
                DataProcessing(
                    name="Gestion des post-its et contributions",
                    purpose="Permettre le brainstorming collaboratif en temps réel",
                    legal_basis="Exécution du contrat (Art. 6.1.b RGPD)",
                    data_categories="Contenu des post-its, votes, commentaires, positions X/Y",
                    retention_period="Durée du workspace + 30 jours après suppression",
                    recipients="Membres du workspace",
                ),
                DataProcessing(
                    name="Journal d'audit (logs)",
                    purpose="Traçabilité des actions pour la sécurité et la conformité",
                    legal_basis="Intérêt légitime (Art. 6.1.f RGPD) - Sécurité du SI",
                    data_categories="Actions utilisateur, adresses IP, horodatages",
                    retention_period="12 mois glissants",
                    recipients="Administrateurs système",
                ),
                DataProcessing(
                    name="Suivi de présence en temps réel",
                    purpose="Afficher les utilisateurs connectés sur un board",
                    legal_basis="Intérêt légitime (Art. 6.1.f RGPD) - Expérience collaborative",
                    data_categories="ID utilisateur, nom d'utilisateur, statut online/offline",
                    retention_period="Session uniquement (pas de persistance)",
                    recipients="Membres du board connectés",
                ),
                DataProcessing(
                    name="Invitations par email",
                    purpose="Permettre aux membres d'inviter des collaborateurs",
                    legal_basis="Intérêt légitime (Art. 6.1.f RGPD) - Collaboration",
                    data_categories="Adresse email de l'invité, token d'invitation",
                    retention_period="7 jours (expiration du lien)",
                    recipients="Personne (email envoyé directement)",
                ),
            ]
            db.add_all(processings)
            db.commit()
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "Brainstorming Pro API"}

@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}
