# SynkHub - Plateforme Collaborative de Brainstorming et Gouvernance des Risques SI

## Stack Technique

- **Frontend** : React 19, Tailwind CSS v4, Vite
- **Backend** : FastAPI (Python 3.12), SQLAlchemy, Pydantic
- **Base de donnees** : PostgreSQL 16
- **Temps reel** : WebSockets natifs
- **IA** : Groq API (Llama 3.1)

## Installation Locale (sans Docker)

### Pre-requis

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
psql -U postgres -c "CREATE DATABASE brainstorming_db;"
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Installation avec Docker (recommande)

### Pre-requis

- Docker Desktop installe : https://www.docker.com/products/docker-desktop/

### Lancer

```bash
git clone https://github.com/ayadolf/synkhub.git
cd synkhub
docker-compose up -d --build
```

### Acces

| Service | URL |
|---|---|
| Frontend | http://localhost:5174 |
| Backend API | http://localhost:8001/api |
| API Docs (Swagger) | http://localhost:8001/docs |
| PostgreSQL | localhost:5433 |

### Arreter

```bash
docker-compose down          # conserve les donnees
docker-compose down -v       # supprime les donnees
```

## Structure du Projet

```
synkhub/
├── backend/
│   ├── app/
│   │   ├── main.py              # Point d'entree FastAPI
│   │   ├── config.py            # Configuration
│   │   ├── database.py          # Connexion PostgreSQL
│   │   ├── models/              # Modeles SQLAlchemy
│   │   ├── schemas/             # schemas Pydantic
│   │   ├── routes/              # Routes API
│   │   ├── services/            # Services (LLM, WebSocket)
│   │   └── services/llm/        # Providers IA (Groq, Gemini, Ollama)
│   ├── tests/                   # Tests unitaires (100 tests)
│   ├── uploads/avatars/         # Avatars uploads
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/               # Pages React
│   │   ├── components/          # Composants React
│   │   ├── context/             # Contextes (Auth, Board, Toast...)
│   │   └── api/                 # Appels API (axios)
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Fonctionnalites

- **Dashboard** : Vue d'ensemble des workspaces et boards
- **Board Collaboratif** : Post-its temps reel avec drag & drop
- **Decision Hub** : Vote, commentaires, suivi des arbitrages
- **Risk Register** : Matrice 5x5, plans d'action, conformite EBIOS RM
- **Synthese IA** : Resume automatique des reunions (Groq/Gemini)
- **Generation PDF** : Rapports avec charte graphique
- **Gestion des equipes** : Invitations email, RBAC 2 niveaux
- **Registre RGPD** : Conforme a l'article 30
- **Parametres** : Profil, avatar, mot de passe, suppression compte

## Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run test:run
```

## Conformite et Gouvernance

| Referentiel | Application |
|---|---|
| COBIT 2019 | Alignement strategie SI (APO02, APO04) |
| ISO 27001 | Gestion des acces, RBAC, chiffrement bcrypt |
| EBIOS RM | Matrice de risques 5x5, evaluations |
| RGPD | Registre des traitements (Art. 30), AuditLog |
| OWASP Top 10 | Rate limiting, validation entrees, JWT |
| Scrum | 4 sprints, cycles iteratifs |

## Auteur

**AYA DOLF**
