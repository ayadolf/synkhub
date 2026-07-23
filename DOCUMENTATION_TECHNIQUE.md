# SynkHub — Documentation Technique et Fonctionnelle

**Version** : 1.0.0  
**Date** : Juillet 2026  
**Auteur** : AYA DOLF  
**Projet** : PFA — Management et Gouvernance des SI  
**Entreprise** : OCP Jorf Lasfar 

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture technique](#2-architecture-technique)
3. [Base de données](#3-base-de-données)
4. [API Backend (FastAPI)](#4-api-backend-fastapi)
5. [Frontend (React)](#5-frontend-react)
6. [Authentification et sécurité](#6-authentification-et-sécurité)
7. [WebSockets](#7-websockets)
8. [Intelligence Artificielle](#8-intelligence-artificielle)
9. [Génération PDF](#9-génération-pdf)
10. [Conformité RGPD](#10-conformité-rgpd)
12. [Annexes](#12-annexes)

---

## 1. Vue d'ensemble

### 1.1 Description

SynkHub est une plateforme de brainstorming collaboratif en temps réel permettant aux équipes de:
- Créer des espaces de travail et des boards de brainstorming
- Ajouter, déplacer et voter sur des post-its
- Générer des synthèses analytiques par IA
- Identifier et gérer des risques SI
- Exporter des rapports PDF
- Collaborer en temps réel via WebSocket

### 1.2 Stack technique

| Composant | Technologie |
|-----------|-------------|
| **Backend** | Python 3.12, FastAPI, SQLAlchemy, Uvicorn |
| **Frontend** | React 18, Vite, Tailwind CSS v4 |
| **Base de données** | PostgreSQL 18 |
| **Authentification** | JWT (access + refresh tokens) |
| **Temps réel** | WebSocket (FastAPI) |
| **IA** | Groq (llama-3.1-8b-instant), Gemini, Ollama |
| **PDF** | ReportLab |
| **Déploiement** | Docker, Render, Vercel, Neon |

### 1.3 Fonctionnalités principales

- **Authentification** : Inscription, connexion, refresh token
- **Workspaces** : Création, gestion des membres (admin/member/viewer)
- **Boards** : Création de boards de brainstorming
- **Post-its** : CRUD, drag & drop, couleurs, priorités, statuts
- **Votes** : Système de vote toggle sur les post-its
- **Commentaires** : Commentaires sur les post-its
- **Notes personnelles** : Notes par board et par utilisateur
- **Synthèse IA** : Analyse des post-its et plan d'action
- **Registre des risques** : Identification IA + CRUD manuel
- **Matrice des risques** : Visualisation probabilite x impact
- **PDF** : Export des rapports de brainstorming
- **WebSocket** : Cursors partagés, mises à jour en temps réel
- **RGPD** : Audit trail, registre des traitements

---

## 2. Architecture technique

### 2.1 Diagramme des composants

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Dashboard │ │  Board   │ │Decision  │ │  Teams   │  │
│  │          │ │          │ │  Hub     │ │          │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                      │                                  │
│              ┌───────┴───────┐                          │
│              │  Axios HTTP   │  WebSocket               │
│              └───────┬───────┘                          │
└──────────────────────┼──────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────┐
│                Backend (FastAPI)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   Auth   │ │Workspaces│ │  Boards  │ │ Postits  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   Teams  │ │Synthesis │ │  Risks   │ │   PDF    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │   WS     │ │  Audit   │ │Avatar    │               │
│  └──────────┘ └──────────┘ └──────────┘               │
│                      │                                  │
│              ┌───────┴───────┐                          │
│              │  LLM Provider │                          │
│              │ (Groq/Gemini) │                          │
│              └───────────────┘                          │
└──────────────────────┼──────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────┐
│              PostgreSQL                          │
│  users, workspaces, members, boards, postits,           │
│  votes, comments, notes, risks, audit_logs,             │
│  data_processings, invitations                          │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Structure du projet

```
synkhub
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # Point d'entrée FastAPI
│   │   ├── config.py             # Configuration (env vars)
│   │   ├── database.py           # Connexion PostgreSQL
│   │   ├── models/               # Modèles SQLAlchemy
│   │   │   ├── user.py
│   │   │   ├── workspace.py
│   │   │   ├── board.py
│   │   │   ├── postit.py
│   │   │   ├── risk.py
│   │   │   ├── invitation.py
│   │   │   └── audit.py
│   │   ├── schemas/              # Schémas Pydantic
│   │   │   ├── user.py
│   │   │   ├── workspace.py
│   │   │   ├── board.py
│   │   │   ├── postit.py
│   │   │   ├── risk.py
│   │   │   └── synthesis.py
│   │   ├── routes/               # Endpoints API
│   │   │   ├── auth.py
│   │   │   ├── workspaces.py
│   │   │   ├── boards.py
│   │   │   ├── postits.py
│   │   │   ├── teams.py
│   │   │   ├── invitations.py
│   │   │   ├── notes.py
│   │   │   ├── synthesis.py
│   │   │   ├── risks.py
│   │   │   ├── pdf.py
│   │   │   ├── audit.py
│   │   │   ├── avatar.py
│   │   │   ├── ws.py
│   │   │   └── ws_global.py
│   │   └── services/
│   │       ├── email_service.py
│   │       ├── websocket_manager.py
│   │       └── llm/
│   │           ├── __init__.py
│   │           ├── base.py
│   │           ├── grok_provider.py
│   │           ├── gemini_provider.py
│   │           └── ollama_provider.py
│   ├── tests/

│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js          # Client HTTP
│   │   │   └── boards.js         # API functions
│   │   ├── components/
│   │   │   ├── Avatar.jsx
│   │   │   ├── InviteMember.jsx
│   │   │   ├── NotesSidebar.jsx
│   │   │   ├── Postit.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   ├── RiskMatrix.jsx
│   │   │   ├── RiskRegister.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── SynthesisPanel.jsx
│   │   │   └── Toolbar.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── BoardContext.jsx
│   │   │   ├── OnlineContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Boards.jsx
│   │   │   ├── Board.jsx
│   │   │   ├── DecisionHub.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Teams.jsx
│   │   │   ├── RGPDAdmin.jsx
│   │   │   └── InviteAccept.jsx
│   │   └── App.jsx
│ 
│   └── vite.config.js
└──
```

---

## 3. Base de données

### 3.1 Schéma (ERD)

#### Table `users`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK, default uuid4 | Identifiant unique |

| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | Email de l'utilisateur |
| `password_hash` | VARCHAR(255) | NOT NULL | Hash bcrypt du mot de passe |
| `username` | VARCHAR(100) | NOT NULL | Nom d'affichage |
| `role` | VARCHAR(20) | DEFAULT 'user' | Role systeme (user/admin) |
| `avatar_url` | VARCHAR(500) | NULL | URL de l'avatar |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de creation |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Derniere mise a jour |

#### Table `workspaces`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `name` | VARCHAR(255) | NOT NULL | Nom du workspace |
| `description` | TEXT | NULL | Description |
| `owner_id` | UUID | FK -> users.id, CASCADE | Proprietaire |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de creation |

#### Table `members`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `workspace_id` | UUID | FK -> workspaces.id, CASCADE | Workspace |
| `user_id` | UUID | FK -> users.id, CASCADE | Utilisateur |
| `role` | VARCHAR(20) | DEFAULT 'member' | Role (admin/member/viewer) |
| `joined_at` | TIMESTAMPTZ | DEFAULT NOW() | Date d'adhésion |

#### Table `boards`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `workspace_id` | UUID | FK -> workspaces.id, CASCADE | Workspace parent |
| `author_id` | UUID | FK -> users.id, SET NULL | Auteur |
| `title` | VARCHAR(255) | NOT NULL | Titre du board |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de creation |

#### Table `postits`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `board_id` | UUID | FK -> boards.id, CASCADE | Board parent |
| `author_id` | UUID | FK -> users.id, CASCADE | Auteur |
| `content` | TEXT | NOT NULL | Contenu (max 2000 car.) |
| `color` | VARCHAR(7) | DEFAULT '#FBBF24' | Couleur hex |
| `x_pos` | FLOAT | DEFAULT 0 | Position X |
| `y_pos` | FLOAT | DEFAULT 0 | Position Y |
| `width` | FLOAT | DEFAULT 200 | Largeur |
| `height` | FLOAT | DEFAULT 150 | Hauteur |
| `z_index` | INTEGER | DEFAULT 0 | Ordre d'empilement |
| `priority` | VARCHAR(20) | DEFAULT 'Medium' | Priorite |
| `status` | VARCHAR(20) | DEFAULT 'Draft' | Statut |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de creation |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Derniere MAJ |

#### Table `votes`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `postit_id` | UUID | FK -> postits.id, CASCADE | Postit vote |
| `user_id` | UUID | FK -> users.id, CASCADE | Votant |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date du vote |
| | | UNIQUE(postit_id, user_id) | Un vote par user/postit |

#### Table `comments`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `postit_id` | UUID | FK -> postits.id, CASCADE | Postit commente |
| `author_id` | UUID | FK -> users.id, CASCADE | Auteur |
| `content` | TEXT | NOT NULL | Contenu (max 1000 car.) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date du commentaire |

#### Table `notes`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `board_id` | UUID | FK -> boards.id, CASCADE | Board |
| `user_id` | UUID | FK -> users.id, CASCADE | Utilisateur |
| `content` | TEXT | NULL | Contenu de la note |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de creation | 
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Derniere MAJ |

#### Table `risks`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `board_id` | UUID | FK -> boards.id, CASCADE | Board |
| `title` | VARCHAR(255) | NOT NULL | Titre du risque |
| `description` | TEXT | NULL | Description |
| `category` | VARCHAR(50) | NULL | Categorie |
| `probability` | INTEGER | DEFAULT 3 | Probabilite (1-5) |
| `impact` | INTEGER | DEFAULT 3 | Impact (1-5) |
| `treatment` | VARCHAR(20) | DEFAULT 'atténuer' | Traitement |
| `treatment_action` | TEXT | NULL | Action de traitement |
| `owner` | VARCHAR(255) | NULL | Proprietaire |
| `source_postits` | JSON | NULL | Post-its sources |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de creation |

#### Table `audit_logs`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `user_id` | UUID | FK -> users.id, SET NULL | Utilisateur |
| `action` | VARCHAR(100) | NOT NULL | Action effectuee |
| `target_type` | VARCHAR(50) | NULL | Type d'objet cible |
| `target_id` | UUID | NULL | ID de l'objet cible |
| `details` | JSON | NULL | Details supplementaires |
| `ip_address` | VARCHAR(45) | NULL | Adresse IP |
| `user_agent` | TEXT | NULL | Navigateur |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de l'action |

#### Table `data_processings`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `name` | VARCHAR(200) | NOT NULL | Nom du traitement |
| `purpose` | TEXT | NOT NULL | Finalite |
| `legal_basis` | VARCHAR(100) | NOT NULL | Base legale |
| `data_categories` | TEXT | NOT NULL | Categories de donnees |
| `retention_period` | VARCHAR(100) | NOT NULL | Duree de conservation |
| `recipients` | TEXT | NULL | Destinataires |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de creation |

#### Table `invitations`
| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `workspace_id` | UUID | FK -> workspaces.id, CASCADE | Workspace |
| `email` | VARCHAR(255) | NOT NULL | Email invite |
| `token` | VARCHAR(255) | UNIQUE, NOT NULL | Token unique |
| `role` | VARCHAR(20) | DEFAULT 'member' | Role propose |
| `created_by` | UUID | FK -> users.id, CASCADE | Inviteur |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Date d'expiration |
| `accepted_at` | TIMESTAMPTZ | NULL | Date d'acceptation |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Date de creation |

### 3.2 Relations

```
users 1──N workspaces (owner_id)
users N──N workspaces (via members)
workspaces 1──N boards
workspaces 1──N members
users 1──N members
boards 1──N postits
boards 1──N notes
boards 1──N risks
users 1──N postits (author_id)
postits 1──N votes
postits 1──N comments
users 1──N votes
users 1──N comments
users 1──N notes
users 1──N audit_logs (SET NULL)
users 1──N invitations (created_by)
```

---

## 4. API Backend (FastAPI)

### 4.1 Endpoints d'authentification

| Methode | Endpoint | Description | Auth | Rate Limit |
|---------|----------|-------------|------|------------|
| `POST` | `/api/auth/register` | Inscription | Non | 5/min |
| `POST` | `/api/auth/login` | Connexion | Non | 10/min |
| `GET` | `/api/auth/me` | Infos utilisateur courant | Oui | - |
| `POST` | `/api/auth/refresh` | Rafraichir les tokens | Non | - |

**Register — Request:**
```json
{
  "email": "user@example.com",
  "password": "motdepasse8",
  "username": "Jean"
}
```

**Login — Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "Jean",
    "role": "user",
    "avatar_url": null
  }
}
```

### 4.2 Endpoints Workspaces

| Methode | Endpoint | Description | Auth | RBAC |
|---------|----------|-------------|------|------|
| `POST` | `/api/workspaces/` | Creer un workspace | Oui | - |
| `GET` | `/api/workspaces/` | Lister mes workspaces | Oui | - |
| `GET` | `/api/workspaces/{id}` | Details workspace | Oui | Membre |
| `DELETE` | `/api/workspaces/{id}` | Supprimer workspace | Oui | Owner |

### 4.3 Endpoints Boards

| Methode | Endpoint | Description | Auth | RBAC |
|---------|----------|-------------|------|------|
| `GET` | `/api/workspaces/{wid}/boards` | Lister les boards | Oui | Membre |
| `POST` | `/api/workspaces/{wid}/boards` | Creer un board | Oui | Membre |
| `GET` | `/api/boards/{id}` | Details board | Oui | Membre |
| `DELETE` | `/api/boards/{id}` | Supprimer board | Oui | Membre |

### 4.4 Endpoints Post-its

| Methode | Endpoint | Description | Auth | RBAC |
|---------|----------|-------------|------|------|
| `GET` | `/api/boards/{bid}/postits` | Lister post-its | Oui | Membre |
| `POST` | `/api/boards/{bid}/postits` | Creer post-it | Oui | Membre |
| `PATCH` | `/api/postits/{id}` | Modifier post-it | Oui | Membre |
| `PATCH` | `/api/postits/{id}/move` | Deplacer post-it | Oui | Membre |
| `PATCH` | `/api/postits/{id}/resize` | Redimensionner | Oui | Membre |
| `DELETE` | `/api/postits/{id}` | Supprimer post-it | Oui | Membre |
| `POST` | `/api/postits/{id}/vote` | Voter/de-voter | Oui | Membre |
| `GET` | `/api/postits/{id}/comments` | Lister commentaires | Oui | Membre |
| `POST` | `/api/postits/{id}/comments` | Ajouter commentaire | Oui | Membre |
| `GET` | `/api/workspaces/{wid}/postits/all` | Tous les post-its | Oui | Membre |

**Postit — Request:**
```json
{
  "content": "Améliorer le systeme de monitoring",
  "color": "#FBBF24",
  "x_pos": 100.0,
  "y_pos": 200.0,
  "width": 200.0,
  "height": 150.0,
  "priority": "High",
  "status": "Draft"
}
```

### 4.5 Endpoints Teams

| Methode | Endpoint | Description | Auth | RBAC |
|---------|----------|-------------|------|------|
| `GET` | `/api/workspaces/{wid}/members` | Lister membres | Oui | Membre |
| `POST` | `/api/workspaces/{wid}/members` | Ajouter membre | Oui | Admin |
| `PATCH` | `/api/members/{id}/role` | Changer role | Oui | Admin |
| `DELETE` | `/api/members/{id}` | Retirer membre | Oui | Admin/Self |

### 4.6 Endpoints Synthèse IA

| Methode | Endpoint | Description | Auth | Rate Limit |
|---------|----------|-------------|------|------------|
| `POST` | `/api/boards/{bid}/synthesis` | Generer synthese | Oui | 1/30s |

**Synthesis — Response:**
```json
{
  "resume": "Le brainstorming identifie 3 themes majeurs...",
  "plan_d_action": [
    {
      "action": "Mettre en place un monitoring temps reel",
      "priorite": "Haute",
      "responsable": "DSI",
      "delai": "1 mois",
      "justification": "Impact critique sur la disponibilite"
    }
  ],
  "provider_used": "grok",
  "postit_count": 15,
  "duration_ms": 2340,
  "tokens_generated": 256,
  "tokens_per_second": 109
}
```

### 4.7 Endpoints Risques

| Methode | Endpoint | Description | Auth | Rate Limit |
|---------|----------|-------------|------|------------|
| `GET` | `/api/boards/{bid}/risks` | Lister risques | Oui | - |
| `POST` | `/api/boards/{bid}/risks` | Creer risque | Oui | - |
| `PUT` | `/api/risks/{id}` | Modifier risque | Oui | - |
| `DELETE` | `/api/risks/{id}` | Supprimer risque | Oui | - |
| `POST` | `/api/boards/{bid}/risks/analyze` | Analyse IA | Oui | 1/60s |

**Niveaux de risque:**
| Score (Prob x Impact) | Niveau |
|------------------------|--------|
| >= 15 | Critique |
| 8-14 | Eleve |
| 4-7 | Moyen |
| 1-3 | Faible |

### 4.8 Endpoints PDF

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/boards/{bid}/pdf` | Generer PDF | Oui |

Le PDF contient:
- En-tete avec logo OCP
- Informations du board
- Liste des membres
- Tableau des post-its
- Registre des risques detaille

### 4.9 Endpoints Audit (Admin)

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/audit/logs` | Consulter les logs | Admin |
| `GET` | `/api/audit/stats` | Statistiques | Admin |
| `GET` | `/api/audit/processings` | Traitements RGPD | Admin |
| `POST` | `/api/audit/processings` | Creer traitement | Admin |
| `PUT` | `/api/audit/processings/{id}` | Modifier traitement | Admin |
| `DELETE` | `/api/audit/processings/{id}` | Supprimer traitement | Admin |

### 4.10 Endpoints Invitations

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/api/workspaces/{wid}/invitations` | Inviter par email | Admin |
| `GET` | `/api/invitations/{token}` | Verifier token | Non |
| `POST` | `/api/invitations/{token}/accept` | Accepter invitation | Non |

### 4.11 Endpoints Notes

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/boards/{bid}/notes` | Lister notes | Oui |
| `PUT` | `/api/boards/{bid}/notes` | Sauvegarder note | Oui |

### 4.12 Endpoints Avatar

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/api/avatar` | Upload avatar | Oui |
| `GET` | `/api/avatar/{user_id}` | Recuperer avatar | Oui |

### 4.13 Endpoint Santé

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/health` | Health check | Non |

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-07-10T22:00:00Z"
}
```

---

## 5. Frontend (React)

### 5.1 Routes

| Route | Composant | Protection | Description |
|-------|-----------|------------|-------------|
| `/login` | Login | Public | Page de connexion |
| `/register` | Register | Public | Page d'inscription |
| `/dashboard` | Dashboard | Prive | Tableau de bord |
| `/boards` | Boards | Prive | Liste des workspaces |
| `/boards/:id` | Board | Prive | Board de brainstorming |
| `/decision-hub` | DecisionHub | Prive | Hub de decision |
| `/teams` | Teams | Prive | Gestion des equipes |
| `/settings` | Settings | Prive | Parametres |
| `/rgpd` | RGPDAdmin | Admin | Registre RGPD |
| `/invite/:token` | InviteAccept | Public | Accepter invitation |

### 5.2 Composants principaux

| Composant | Description |
|-----------|-------------|
| `Sidebar` | Menu lateral avec navigation |
| `Postit` | Composant post-it avec drag & drop |
| `Toolbar` | Barre d'outils du board |
| `SynthesisPanel` | Panel de synthese IA |
| `RiskMatrix` | Matrice de visualisation des risques |
| `RiskRegister` | Registre detaille des risques |
| `NotesSidebar` | Notes personnelles par board |
| `Avatar` | Avatar utilisateur |
| `InviteMember` | Modal d'invitation |

### 5.3 Contextes React

| Contexte | Description |
|----------|-------------|
| `AuthContext` | Authentification, refresh token |
| `ThemeContext` | Theme clair/sombre |
| `OnlineContext` | Utilisateurs en ligne (WebSocket global) |
| `BoardContext` | Etat du board courant |

---

## 6. Authentification et sécurité

### 6.1 Flux d'authentification

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────>│  Login   │────>│  Backend │
│          │<────│  Token   │<────│  JWT     │
└──────────┘     └──────────┘     └──────────┘
     │
     │  Access Token (24h)
     │  Refresh Token (7j)
     │
     ▼
┌──────────┐     ┌──────────┐
│  API     │────>│  Verify  │
│  Request │<────│  JWT     │
└──────────┘     └──────────┘
     │
     │  Si 401
     ▼
┌──────────┐     ┌──────────┐
│  Refresh │────>│  New     │
│  Token   │<────│  Tokens  │
└──────────┘     └──────────┘
```

### 6.2 JWT Tokens

**Access Token:**
- Duree: 24 heures
- Claims: `sub` (user_id), `exp`, `type: "access"`
- Utilise pour les requetes API

**Refresh Token:**
- Duree: 7 jours (10080 minutes)
- Claims: `sub` (user_id), `exp`, `type: "refresh"`
- Utilise pour rafraichir l'access token

### 6.3 Roles et permissions (RBAC)

**Roles systeme:**
| Role | Description |
|------|-------------|
| `user` | Utilisateur standard |
| `admin` | Administrateur systeme |

**Roles workspace:**
| Role | Permissions |
|------|-------------|
| `admin` | CRUD complet, gestion membres |
| `member` | Lecture, creation post-its, votes |
| `viewer` | Lecture seule |

### 6.4 Rate Limiting

| Endpoint | Limite |
|----------|--------|
| `/api/auth/register` | 5 req/min |
| `/api/auth/login` | 10 req/min |
| `/api/boards/{id}/synthesis` | 1 req/30s |
| `/api/boards/{id}/risks/analyze` | 1 req/60s |

### 6.5 Securite WebSocket

- Authentification JWT obligatoire via parametre `token`
- Code 4001 si token invalide
- Validation a chaque connexion

---

## 7. WebSockets

### 7.1 Endpoints WebSocket

| Endpoint | Description |
|----------|-------------|
| `ws://{host}/ws/{board_id}?token=...` | Board specifique |
| `ws://{host}/ws/global?user_id=...&username=...` | Utilisateurs en ligne |

### 7.2 Evenements WebSocket

#### Client → Serveur

| Evenement | Donnees | Description |
|-----------|---------|-------------|
| `cursor:move` | `{x, y}` | Deplacement curseur |
| `postit:moved` | `{postit_id, x, y}` | Post-it deplace |
| `postit:created` | `{postit}` | Post-it cree |
| `postit:updated` | `{postit}` | Post-it modifie |
| `postit:deleted` | `{postit_id}` | Post-it supprime |
| `vote:toggled` | `{postit_id}` | Vote active/desactive |
| `comment:added` | `{comment}` | Commentaire ajoute |
| `ping` | `{}` | Heartbeat |

#### Serveur → Client

| Evenement | Donnees | Description |
|-----------|---------|-------------|
| `users:current` | `{users}` | Liste utilisateurs connects |
| `users:list` | `{users}` | MAJ liste globale |
| `user:joined` | `{user_id, username}` | Utilisateur rejoint |
| `user:left` | `{user_id, username}` | Utilisateur quitte |
| `user:online` | `{user_id, username}` | Utilisateur en ligne |
| `user:offline` | `{user_id}` | Utilisateur hors ligne |
| `cursor:moved` | `{user_id, x, y}` | Curseur deplace |
| `postit:moved` | `{postit_id, x, y}` | Post-it deplace |
| `postit:created` | `{postit}` | Post-it cree |
| `postit:updated` | `{postit}` | Post-it modifie |
| `postit:deleted` | `{postit_id}` | Post-it supprime |
| `vote:toggled` | `{postit_id, vote_count}` | Vote MAJ |
| `comment:added` | `{comment}` | Commentaire ajoute |
| `pong` | `{timestamp}` | Reponse heartbeat |

---

## 8. Intelligence Artificielle

### 8.1 Architecture LLM Provider

```python
class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, system_prompt: str, user_prompt: str) -> dict:
        pass

class GrokProvider(LLMProvider):  # Groq API
class GeminiProvider(LLMProvider): # Google Gemini
class OllamaProvider(LLMProvider): # Local Ollama
```

### 8.2 Provider par defaut

| Provider | Modele | Cle API | Usage |
|----------|--------|---------|-------|
| **Groq** | llama-3.1-8b-instant | `GROQ_API_KEY` | Principal |
| **Gemini** | gemini-pro | `GEMINI_API_KEY` | Fallback |
| **Ollama** | llama3.2:3b | Local | Offline |

### 8.3 Synthese

**System Prompt:**
```
Tu es un consultant en gouvernance SI. Analyse des post-its de brainstorming.
IMPORTANT: NE PAS repeter ou lister les post-its. Analyse-les et donne des actions concrètes.
CRITERES DE PRIORISATION:
- Impact SI (1-5) + Urgence (1-5)
- Score >=7: Haute, 4-6: Moyenne, <=3: Basse
Reponds UNIQUEMENT en JSON:
{"resume":"...","plan_d_action":[...]}
```

### 8.4 Analyse des risques

**System Prompt:**
```
Tu es un expert en gestion des risques. Identifie les risques CACHES.
Reponds UNIQUEMENT en JSON:
{"risques":[{"title":"...","description":"...","category":"...","probability":3,"impact":4,"treatment":"atténuer","treatment_action":"...","owner":"..."}]}
Règles:
- Probability: 1-5
- Impact: 1-5
- Traitements: atténuer, accepter, transférer, éviter
- 3 à 8 risques maximum
```

---

## 9. Génération PDF

### 9.1 Structure du PDF

1. **Page de couverture**
   - Titre: "Rapport de Brainstorming"
   - Sous-titre: "Synthese Analytique et Registre des Risques SI"
   - Infos: Board, Workspace, Date, Auteur

2. **Membres du Workspace**
   - Tableau: Nom, Role

3. **Post-its du Brainstorming**
   - Tableau: #, Contenu, Auteur
   - Maximum 20 post-its

4. **Registre des Risques**
   - Pour chaque risque:
     - Titre et niveau
     - Description, Categorie
     - Probabilite, Impact, Score
     - Traitement, Action, Proprietaire



## 10. Conformité RGPD

### 10.1 Traitements de donnees

| Traitement | Base legale | Categories | Conservation |
|------------|-------------|------------|--------------|
| Inscription | Consentement (Art.6.1.a) | Email, username, password | Duree de vie du compte |
| Authentification | Contract (Art.6.1.b) | Email, JWT tokens | 24h (access), 7j (refresh) |
| Workspaces | Contract (Art.6.1.b) | Noms, roles | Avec le workspace |
| Brainstorming | Interet legitime (Art.6.1.f) | Contenu post-its | 1 an |
| WebSocket | Interet legitime (Art.6.1.f) | ID, username | Session uniquement |
| Invitations | Interet legitime (Art.6.1.f) | Email invite | 7 jours |

### 10.2 Audit Trail

Evenements traces:
- `register` — Inscription
- `login` — Connexion reussie
- `login_failed` — Tentative echouee
- `postit:create` — Creation post-it
- `postit:vote` — Vote
- `postit:unvote` — Desvote
- `postit:comment` — Commentaire
- `processing:create` — Creation traitement
- `processing:update` — Modification traitement
- `processing:delete` — Suppression traitement

### 10.3 Droits RGPD

- **Droit d'acces** : `GET /api/auth/me`
- **Droit de rectification** : Via Settings
- **Droit a l'effacement** : Contact admin
- **Droit a la portabilite** : Export PDF

---

## 11. Déploiement

### 11.1 Architecture de production

```
Vercel (React)  ──→  Render (FastAPI)  ──→  Neon (PostgreSQL)
```

### 11.2 Variables d'environnement

**Backend (Render):**
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL Neon |
| `SECRET_KEY` | Cle secrete JWT |
| `LLM_PROVIDER` | `grok` |
| `GROQ_API_KEY` | Cle API Groq |
| `FRONTEND_URL` | URL Vercel |

**Frontend (Vercel):**
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | URL API backend |
| `VITE_WS_URL` | URL WebSocket backend |

### 11.3 Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 12. Annexes

### 12.1 Tests

| Type | Nombre | Fichiers |
|------|--------|----------|
| Backend unitaires | 100+ | `tests/test_*.py` |
| Frontend composants | 30 | `src/__tests__/*.test.jsx` |
| Load tests | 2 | `tests/load/` |
| Security scan | 1 | `tests/load/security_scan.py` |

### 12.2 Commandes utiles

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev

# Tests
cd backend && python -m pytest
cd frontend && npm test

# Build
cd frontend && npm run build
```

### 12.3 API Docs

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

**Document genere le 13 juillet 2026**
