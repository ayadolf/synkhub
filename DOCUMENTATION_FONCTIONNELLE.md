# SynkHub — Documentation Fonctionnelle

**Version** : 1.0.0  
**Date** : Juillet 2026  
**Auteur** : AYA DOLF  
**Projet** : PFE — Management et Gouvernance des SI  
**Entreprise** : OCP Jorf Lasfar 

---

## Table des matières

1. [Presentation](#1-presentation)
2. [Glossaire](#2-glossaire)
3. [Parcours utilisateur](#3-parcours-utilisateur)
4. [Fonctionnalites detaillees](#4-fonctionnalites-detaillees)
5. [Regles metier](#5-regles-metier)
6. [Cas d'utilisation](#6-cas-dutilisation)
7. [Workflow collaboratif](#7-workflow-collaboratif)
8. [Fonctionnalites IA](#8-fonctionnalites-ia)
9. [Securite et conformite](#9-securite-et-conformite)
10. [FAQ](#10-faq)

---

## 1. Presentation

### 1.1 Qu'est-ce que SynkHub ?

SynkHub est une **plateforme de brainstorming collaboratif en temps réel** permettant aux équipes de :
- Organiser des sessions de brainstorming structurées
- Créer et manipuler des post-its numériques
- Voter et commenter les idées
- Générer automatiquement des synthèses analytiques par Intelligence Artificielle
- Identifier et gérer les risques liés aux projets
- Exporter des rapports professionnels

### 1.2 A qui s'adresse-t-il ?

| Profil | Usage |
|--------|-------|
| **Chefs de projet** | Organiser des sessions de brainstorming d'équipe |
| **Consultants SI** | Analyser les besoins et identifier les risques |
| **Direction Informatique** | Piloter la gouvernance des SI |
| **Équipes projet** | Collaborer en temps réel sur des idées |
| **Auditeurs RGPD** | Consulter le registre des traitements |

### 1.3 Avantages

- **Temps réel** : Voir les modifications des autres en direct
- **IA intégrée** : Synthèse automatique et analyse des risques
- **Portable** : Export PDF des rapports
- **Sécurisé** : Authentification, rôles, audit trail
- **Conforme RGPD** : Registre des traitements

---

## 2. Glossaire

| Terme | Definition 
|-------|------------|
| **Workspace** | Espace de travail regroupant plusieurs boards et membres |
| **Board** | Tableau de brainstorming contenant des post-its |
| **Post-it** | Note numerique avec contenu, couleur, position |
| **Vote** | Expression de soutien a une idee (1 vote par personne/post-it) |
| **Synthese IA** | Analyse automatique des post-its par intelligence artificielle |
| **Registre des risques** | Liste structuree des identifications de risques |
| **Matrice des risques** | Visualisation probabilite x impact |
| **Decision Hub** | Vue synthetique de tous les post-its d'un workspace |
| **RBAC** | Controle d'acces base sur les roles |
| **JWT** | Token d'authentification JSON Web Token |

---

## 3. Parcours utilisateur

### 3.1 Inscription

```
1. Cliquer "Creer un compte"
2. Remplir :
   - Email (unique)
   - Nom d'utilisateur
   - Mot de passe (min. 8 caracteres)
3. Cliquer "S'inscrire"
4. Redirection vers le Dashboard
```

### 3.2 Connexion

```
1. Entrer email et mot de passe
2. Cliquer "Se connecter"
3. Redirection vers le Dashboard
```

### 3.3 Creation d'un Workspace

```
1. Cliquer "+" sur la page Dashboard
2. Entrer le nom du workspace
3. Cliquer "Creer"
4. Le createur devient automatiquement Admin
```

### 3.4 Invitation de membres

```
1. Aller dans Teams (menu lateral)
2. Cliquer "Inviter un membre"
3. Entrer l'email de l'utilisateur
4. Cliquer "Envoyer l'invitation"
5. L'utilisateur recoit un lien par email
```

### 3.5 Session de Brainstorming

```
1. Creer un board dans le workspace
2. Ouvrir le board
3. Ajouter des post-its 
4. Deplacer les post-its (drag & drop)
5. Voter sur les post-its 
6. Commenter les post-its (clic sur bulle)
7. Generer une synthese IA
8. Analyser les risques
9. Exporter en PDF
```

---

## 4. Fonctionnalites detaillees

### 4.1 Gestion des Workspaces

| Action | Qui | Description |
|--------|-----|-------------|
| Creer un workspace | Tout utilisateur | Cree un nouvel espace de travail |
| Modifier le nom | Admin | Modifier le nom du workspace |
| Supprimer | Proprietaire | Supprimer le workspace et tout son contenu |
| Ajouter un membre | Admin | Inviter un utilisateur par email |
| Retirer un membre | Admin | Retirer un utilisateur du workspace |
| Changer un role | Admin | Modifier le role d'un membre |

### 4.2 Gestion des Boards

| Action | Qui | Description |
|--------|-----|-------------|
| Creer un board | Membre | Creer un nouveau tableau |
| Supprimer un board | Membre | Supprimer le tableau et ses post-its |
| Renommer | Membre | Modifier le titre du board |

### 4.3 Gestion des Post-its

#### Creation
```
1. Cliquer le bouton "STICKY NOTE"
2. Ecrire le contenu (max. 2000 caracteres)
```

#### Modification
| Attribut | Options |
|----------|---------|
| **Contenu** | Texte libre (max. 2000 car.) |
| **Couleur** | Jaune (#FBBF24), Vert (#22C55E), Rose (#EC4899), Bleu (#3B82F6), Violet (#8B5CF6), Orange (#F97316) |
| **Priorite** | Low, Medium, High |
| **Position** | Drag & drop libre |

#### Deplacement
- **Souris** : Cliquer et deplacer
- **Temps réel** : Le deplacement est visible par tous les membres connectes

#### Suppression
- Cliquer l'icone corbeille
- Confirmation demandee

### 4.4 Systeme de Votes

| Regle | Description |
|-------|-------------|
| **Unvote** | Chaque utilisateur ne peut voter qu'une seule fois |
| **Toggle** | Re-cliquer retire le vote |
| **Compteur** | Le nombre de votes est visible en temps reel |
| **Audit** | Chaque vote est trace dans l'historique |

### 4.5 Commentaires

| Regle | Description |
|-------|-------------|
| **Contenu** | Texte libre (max. 1000 caracteres) |
| **Auteur** | Affiche avec nom et avatar |
| **Ordre** | Chronologique (ancien → nouveau) |
| **Temps réel** | Nouveaux commentaires visibles instantanement |

### 4.6 Notes Personnelles

| Caracteristique | Description |
|-----------------|-------------|
| **Par board** | Chaque board a ses propres notes |
| **Par utilisateur** | Chaque membre a ses notes privees |
| **Sauvegarde auto** | Les notes sont sauvegardees automatiquement |


### 4.7 Decision Hub

Le Decision Hub est une **vue synthetique** de tous les post-its d'un workspace.

| Fonctionnalite | Description |
|----------------|-------------|
| **Vue unifiee** | Tous les post-its de tous les boards |
| **Filtrage** | Par board, par auteur |



---

## 5. Regles metier

### 5.1 Hierarchie des roles

```
Admin Systeme (role: admin)
    │
    ├── Peut tout faire
    ├── Acces au registre RGPD
    └── Peut promouvoir d'autres admins
    
Admin Workspace (role: admin dans members)
    │
    ├── Gere les membres
    ├── Creer/supprimer des boards
    └── Modifie les parametres
    
Membre (role: member dans members)
    │
    ├── Cree/modifie des post-its
    ├── Vote et commente
    └── Genere des syntheses
    
Observateur (role: viewer dans members)
    │
    └── Consultation uniquement
```

### 5.2 Regles de validation

| Element | Regle |
|---------|-------|
| **Email** | Unique, format valide |
| **Mot de passe** | Min. 8 caracteres |
| **Post-it contenu** | Non vide, max. 2000 caracteres |
| **Commentaire** | Non vide, max. 1000 caracteres |
| **Vote** | 1 vote par user par post-it (unique) |
| **Role** | admin, member, viewer uniquement |
| **Priorite** | Low, Medium, High |
| **Statut** | Draft, In Progress, Done |

### 5.3 Regles de suppression

| Element | Regle |
|---------|-------|
| **Workspace** | Seul le proprietaire peut supprimer |
| **Board** | Tout membre peut supprimer |
| **Post-it** | L'auteur ou un admin peut supprimer |
| **Commentaire** | L'auteur peut supprimer |
| **Vote** | L'utilisateur peut retirer son vote |
| **Membre** | Un admin peut retirer / un membre peut se retirer |

### 5.4 Niveaux de risque

| Score (Prob x Impact) | Niveau | Couleur | Action recommandee |
|------------------------|--------|---------|-------------------|
| 15-25 | **Critique** | Rouge | Action immediate |
| 8-14 | **Eleve** | Orange | Plan d'action prioritaire |
| 4-7 | **Moyen** | Jaune | Surveillance renforcee |
| 1-3 | **Faible** | Vert | Acceptation ou surveillance normale |

### 5.5 Traitements des risques

| Traitement | Description | Quand l'utiliser |
|------------|-------------|------------------|
| **Attenuer** | Reduire la probabilite ou l'impact | Risques evitables partiellement |
| **Accepter** | Prendre le risque tel quel | Risques a faible impact |
| **Transférer** | Decharger a un tiers (assurance, prestataire) | Risques specialises |
| **Eviter** | Eliminer l'activite a l'origine | Risques inacceptables |

---

## 6. Cas d'utilisation

### 6.1 UC01 — S'authentifier

**Acteur** : Utilisateur  
**Precondition** : L'utilisateur a un compte  
**Scenario principal** :
1. L'utilisateur accede a la page de connexion
2. Il saisit son email et mot de passe
3. Il clique sur "Se connecter"
4. Le systeme verifie les identifiants
5. L'utilisateur est redirige vers le Dashboard

**Scenarios alternatifs** :
- 3a. Email ou mot de passe incorrect → Message d'erreur
- 3a. Compte inexistant → Proposition d'inscription

### 6.2 UC02 — Creer un workspace

**Acteur** : Utilisateur connecte  
**Precondition** : L'utilisateur est connecte  
**Scenario principal** :
1. L'utilisateur clique sur "+" dans le Dashboard
2. Il saisit le nom et la description
3. Il clique sur "Creer"
4. Le workspace est cree avec l'utilisateur comme admin
5. L'utilisateur est redirige vers le nouveau workspace

### 6.3 UC03 — Inviter un membre

**Acteur** : Admin du workspace  
**Precondition** : L'utilisateur est admin du workspace  
**Scenario principal** :
1. L'admin va dans l'onglet "Teams"
2. Il clique sur "Inviter un membre"
3. Il saisit l'email et choisit le role
4. Il clique sur "Envoyer"
5. Un email d'invitation est envoye

**Scenarios alternatifs** :
- 3a. L'utilisateur n'existe pas → Message d'erreur
- 3a. L'utilisateur est deja membre → Message d'erreur

### 6.4 UC04 — Creer un post-it

**Acteur** : Membre du workspace  
**Precondition** : L'utilisateur est membre du workspace  
**Scenario principal** :
1. L'utilisateur ouvre un board
2. Il clique sur "+" ou double-clique sur le board
3. Il saisit le contenu et choisit une couleur
4. Il clique sur "Creer"
5. Le post apparait pour tous les membres connectes

### 6.5 UC05 — Voter sur un post-it

**Acteur** : Membre du workspace  
**Precondition** : L'utilisateur est membre du workspace  
**Scenario principal** :
1. L'utilisateur clique sur l'icone coeur d'un post-it
2. Le vote est enregistre
3. Le compteur de votes s'incremente
4. Le vote est visible par tous

**Scenarios alternatifs** :
- 1a. L'utilisateur a deja vote → Le vote est retire (toggle)

### 6.6 UC06 — Generer une synthese IA

**Acteur** : Membre du workspace  
**Precondition** : Le board contient au moins 1 post-it  
**Scenario principal** :
1. L'utilisateur clique sur "Generer la synthese IA"
2. Le systeme envoie les post-its au LLM
3. Le LLM genere un resume et un plan d'action
4. Les resultats sont affiches dans le panneau

**Scenarios alternatifs** :
- 2a. Le LLM est indisponible → Message d'erreur
- 2a. Le board est vide → Message d'erreur

### 6.7 UC07 — Analyser les risques

**Acteur** : Membre du workspace  
**Precondition** : Le board contient au moins 1 post-it  
**Scenario principal** :
1. L'utilisateur clique sur "Analyser les risques"
2. Le systeme envoie les post-its au LLM
3. Le LLM identifie les risques caches
4. Les risques sont ajoutes au registre
5. La matrice des risques est mise a jour

### 6.8 UC08 — Exporter en PDF

**Acteur** : Membre du workspace  
**Precondition** : Le board contient des donnees  
**Scenario principal** :
1. L'utilisateur clique sur "Exporter PDF"
2. Le systeme genere le document
3. Le PDF est telecharge automatiquement

**Contenu du PDF** :
- En-tete avec informations du board
- Liste des membres
- Tableau des post-its
- Registre des risques detaille

### 6.9 UC09 — Consulter le registre RGPD

**Acteur** : Admin systeme  
**Precondition** : L'utilisateur a le role "admin"  
**Scenario principal** :
1. L'admin clique sur "Registre RGPD" dans le menu
2. Il consulte la liste des traitements
3. Il peut ajouter, modifier ou supprimer des traitements

---

## 7. Workflow collaboratif

### 7.1 Workflow de brainstorming type

```
┌─────────────┐
│  1. SETUP   │  Creer workspace + board
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 2. INVITER  │  Ajouter les membres
└──────┬──────┘
       │
       ▼
┌─────────────┐
│3. BRAINSTORM│  Chacun ajoute des post-its
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  4. VOTER   │  Voter pour les meilleures idees
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 5. DISCUTER │  Commenter et affiner
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 6. ANALYSER │  Synthese IA + Risques
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 7. DECIDER  │  Plan d'action
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 8. EXPORTER │  PDF du rapport
└─────────────┘
```

### 7.2 Roles pendant la session

| Phase | Role Admin | Role Membre | Role Viewer |
|-------|-----------|-------------|-------------|
| Setup | Cree board | - | - |
| Invitation | Invite membres | - | - |
| Brainstorm | Ajoute post-its | Ajoute post-its | - |
| Vote | Vote | Vote | - |
| Commentaire | Commente | Commente | - |
| Analyse | Lance IA | Lance IA | Consulte |
| Export | Exporte PDF | Exporte PDF | Consulte |



## 8. Fonctionnalites IA

### 8.1 Synthese analytique

**Entree** : Liste des post-its du board  
**Sortie** :
- **Resume** : Analyse en 3-5 phrases identifiant les themes majeurs
- **Plan d'action** : 3 a 8 actions concretes avec :
  - Description de l'action
  - Priorite (Haute/Moyenne/Basse)
  - Responsable suggere
  - Delai estime
  - Justification de la priorite

**Exemple de sortie** :
```json
{
  "resume": "Le brainstorming met en evidence 3 themes majeurs: la modernisation du systeme de monitoring, l'optimisation des processus metier, et la securisation des acces.",
  "plan_d_action": [
    {
      "action": "Mettre en place un monitoring temps reel avec alertes automatiques",
      "priorite": "Haute",
      "responsable": "DSI",
      "delai": "1 mois",
      "justification": "Impact critique sur la disponibilite des services"
    },
    {
      "action": "Automatiser les rapports de production",
      "priorite": "Moyenne",
      "responsable": "Equipe Data",
      "delai": "3 mois",
      "justification": "Gain de temps significatif pour les equipes"
    }
  ]
}
```

### 8.2 Analyse des risques

**Entree** : Liste des post-its du board  
**Sortie** : 3 a 8 risques identifies avec :
- Titre court
- Description detaillee
- Categorie (securite, disponibilite, conformite, etc.)
- Probabilite (1-5)
- Impact (1-5)
- Traitement recommande (attenuer/accepter/transfere/eviter)
- Action de traitement concrete
- Proprietaire suggere
- Post-it source

**Categories de risques** :
- Securite
- Disponibilite
- Conformite
- Donnees
- Infrastructure
- RH
- Operationnel
- Financier
- Produit
- Client
- Strategique

### 8.3 Limites de l'IA

| Limite | Description |
|--------|-------------|
| **Qualite des donnees** | Les resultats dependent de la qualite des post-its |
| **Contexte** | L'IA n'a pas le contexte complet de l'organisation |
| **Validation** | Les resultats doivent etre valides par les humains |
| **Rate limit** | 1 synthese / 30 secondes, 1 analyse risques / 60 secondes |

---

## 9. Securite et conformite

### 9.1 Authentification

| Mesure | Description |
|--------|-------------|
| **Mots de passe** | Haches avec bcrypt, min. 8 caracteres |
| **JWT** | Access token (24h) + Refresh token (7j) |
| **Rate limiting** | 5 inscriptions/min, 10 connexions/min |
| **Audit** | Toutes les actions sont tracees |

### 9.2 Controle d'acces

| Niveau | Description |
|--------|-------------|
| **Systeme** | user / admin |
| **Workspace** | admin / member / viewer |
| **Ressource** | Proprietaire / Membre / Externe |

### 9.3 Audit trail

Evenements traces :
- Inscription / Connexion / Echec de connexion
- Creation / Modification / Suppression de post-its
- Votes / Desvotes
- Commentaires
- Traitements RGPD

Chaque entree contient :
- Utilisateur
- Action
- Cible (type + ID)
- Details (JSON)
- Adresse IP
- Horodatage

### 9.4 RGPD

| Droit | Comment l'exercer |
|-------|-------------------|
| **Acces** | `GET /api/auth/me` |
| **Rectification** | Page Settings |
| **Effacement** | Contact administrateur |
| **Portabilite** | Export PDF |

### 9.5 Traitements de donnees

| Traitement | Finalite | Base legale | Conservation |
|------------|----------|-------------|--------------|
| Inscription | Creer un compte | Consentement | Duree de vie du compte |
| Authentification | Verifier l'identite | Contract | 24h (token) |
| Workspaces | Collaborer | Contract | Avec le workspace |
| Brainstorming | Produire des idees | Interet legitime | 1 an |
| WebSocket | Temps reel | Interet legitime | Session |
| Invitations | Recruter des membres | Interet legitime | 7 jours |

---

## 10. FAQ

### Q : Combien de post-its puis-je creer ?
**R** : Pas de limite. Cependant, pour de meilleurs resultats IA, limitez a 20-30 post-its par board.

### Q : Puis-je supprimer un post-it d'un autre utilisateur ?
**R** : Oui, si vous etes admin du workspace. Sinon, seul l'auteur peut supprimer son post-it.

### Q : Les votes sont-ils anonymes ?
**R** : Non, les votes sont lies a votre compte. Cependant, seuls les comptes de votes sont visibles, pas les votants individuellement.

### Q : Puis-je modifier un post-it apres l'avoir cree ?
**R** : Oui, vous pouvez modifier le contenu, la couleur, la priorite et le statut.

### Q : Que se passe-t-il si je perds ma connexion WebSocket ?
**R** : La reconnexion est automatique. Vos donnees sont sauvegardees sur le serveur.

### Q : Comment modifier mon mot de passe ?
**R** : Allez dans Settings > Changer le mot de passe.

### Q : Puis-je utiliser SynkHub sur mobile ?
**R** : L'interface est responsive et fonctionne sur tablette. L'experience mobile n'est pas optimisee.

### Q : Les donnees sont-elles securisees ?
**R** : Oui. Mots de passe haches, tokens JWT, HTTPS en production, audit trail complet.

### Q : Puis-je exporter les donnees ?
**R** : Oui, via l'export PDF qui contient les post-its et le registre des risques.

### Q : Comment devenir admin systeme ?
**R** : Seul un admin existant peut promouvoir un utilisateur au role admin via la base de donnees.

---

