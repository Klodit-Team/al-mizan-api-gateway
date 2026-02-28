#### 1.3.2 Objectifs techniques

La plateforme repose sur une architecture moderne, souveraine et sécurisée:

- **Architecture microservices:** 10 microservices métiers indépendants (Auth, Users, Appels d'Offres, Soumission, Document, Évaluation, Commission, Recours, Audit, Notifications) + 5 services IA, chacun avec sa propre base de données (pattern Database-per-Service)

- **API Gateway:** Point d'entrée unique gérant l'authentification par sessions côté serveur, le routage et le rate limiting

- **Stack technologique:** 
  - Backend: Django/DRF, NestJS, Laravel
  - Frontend: Next.js (web), Kotlin/Jetpack Compose (mobile Android)

- **Infrastructure souveraine:** Déploiement Kubernetes On-Premise ou Cloud Algérien souverain (Algérie Télécom, CERIST) – aucune donnée ne transite hors du territoire national

- **Communication inter-services:** 
  - Synchrone via REST/HTTP pour les opérations temps-réel
  - Asynchrone via RabbitMQ pour les traitements lourds

- **Stockage souverain:** 
  - MySQL 8.x (données transactionnelles)
  - MinIO (stockage objet S3-compatible pour les fichiers chiffrés)
  - Redis (sessions, cache)
  - RabbitMQ (messagerie)

- **CI/CD:** Pipeline Jenkins + GitHub avec déploiement Blue/Green pour les services critiques

- **Haute disponibilité:** SLO de 99,5% d'uptime mensuel

#### 1.3.3 Objectifs de sécurité

La sécurité est au cœur de la conception (Security by Design):

- **Authentification forte:** MFA/TOTP obligatoire pour les rôles sensibles (SC, Commission, Admin), sessions côté serveur (cookie HttpOnly/Secure/SameSite=Strict), verrouillage après 5 tentatives échouées

- **Contrôle d'accès RBAC:** Rôles hiérarchiques (Admin, Service Contractant, Opérateur Économique, Commission Ouverture, Évaluateur, Commission Marchés, Public)

- **Chiffrement des offres financières E2EE:** AES-256-GCM côté client (WebCrypto API) + RSA-4096 (clé publique Commission) + Shamir Secret Sharing (K-of-N) pour l'ouverture multi-parties

- **Transport sécurisé:** TLS 1.3 obligatoire sur tous les endpoints, mTLS entre microservices, Certificate Pinning Android

- **Chiffrement des données PII au repos:** AES-256 conformément à la Loi 18-07

- **Journalisation inaltérable:** Logs chaînés par hash SHA-256 (chaque entrée contient le hash du précédent), table append-only

#### 1.3.4 Objectifs intelligents (IA)

Cinq services IA dédiés, hébergés On-Premise avec intégration contrôlée d'APIs externes spécialisées (NLP, LLM) pour enrichir les capacités d'analyse, et orchestrés via N8N pour l'automatisation des workflows IA:

- **IA OCR/NLP:** Analyse automatique de conformité des dossiers administratifs par reconnaissance optique et traitement du langage naturel – taux de précision cible ≥ 90%

- **IA Détection d'anomalies:** Détection de collusion entre soumissionnaires, saucissonnage des marchés, ententes sur les prix – taux de détection cible ≥ 85%

- **IA Assistance rédaction CDC:** Assistant génératif pour la rédaction du Cahier des Charges, détection de clauses biaisées ou discriminatoires

- **IA Assistant Évaluation:** Assistant intelligent pour l'évaluation des offres, fournissant des notes suggérées, un score de confiance par critère et une recommandation globale (retenir, éliminer, analyser davantage)

- **IA Assistant Gré à Gré:** Assistant dédié à l'analyse des demandes de gré à gré, évaluant la conformité des justifications fournies et produisant un score de conformité et une recommandation pour le contrôleur

### 1.4 Périmètre Fonctionnel

La plateforme couvre l'ensemble des processus liés à la gestion des marchés publics, autour de six modules principaux:

- **Module Avis & CDC:** Création, publication et gestion des appels d'offres
- **Module Soumission:** Dépôt électronique sécurisé des offres
- **Module Évaluation:** Ouverture des plis, notation et classement
- **Module Attribution:** Attribution provisoire/définitive et gestion des recours
- **Module Administration:** Gestion des utilisateurs, paramétrage, audit
- **Portail Transparence:** Accès public aux résultats des marchés attribués

**Les acteurs principaux du système sont:**

- **Service Contractant (SC):** Entité publique émettrice des marchés
- **Opérateur Économique (OE):** Soumissionnaire, entreprise privée ou publique
- **Commission d'Évaluation (COPE):** Commission d'ouverture des plis et d'évaluation
- **Commission des Marchés (CM):** Commission de contrôle et de validation
- **Administrateur:** Gestionnaire de la plateforme
- **Citoyen / Public:** Accès en lecture seule au portail de transparence

### 1.5 Glossaire et Acronymes

| Terme | Définition |
|-------|------------|
| **CSL** | Cahier des Spécifications Logicielles |
| **CDC** | Cahier des Charges |
| **SC** | Service Contractant : entité publique émettrice du marché |
| **OE** | Opérateur Économique (soumissionnaire) |
| **EPA** | Établissement Public à caractère Administratif |
| **EPIC** | Établissement Public à caractère Industriel et Commercial |
| **AO** | Appel d'Offres |
| **BOMOP** | Bulletin Officiel des Marchés de l'Opérateur Public |
| **COPE** | Commission d'Ouverture des Plis et d'Évaluation |
| **E2E / E2EE** | End-to-End Encryption – chiffrement de bout en bout |
| **OCR** | Optical Character Recognition (Reconnaissance Optique de Caractères) |
| **NLP** | Natural Language Processing (Traitement Automatique du Langage Naturel) |
| **TJM** | Taux Journalier Moyen |
| **CAPEX** | Capital Expenditure – dépenses d'investissement |
| **OPEX** | Operational Expenditure – dépenses d'exploitation |
| **J/H** | Jours / Homme |
| **SOA** | Architecture Orientée Services |
| **2FA** | Authentification à Deux Facteurs |
| **MFA** | Authentification Multi-Facteurs |
| **RBAC** | Gestion des permissions basée sur les rôles |
| **API** | Interface de communication entre services logiciels |
| **IA** | Intelligence Artificielle |
| **Audit Log** | Journal sécurisé et inaltérable des actions système |
| **RGPD** | Réglementation relative à la protection des données, appliquée via la Loi 18-07 en contexte algérien |
| **HPA** | Horizontal Pod Autoscaler (Kubernetes) |
| **SSS** | Shamir Secret Sharing – protocole de partage de secret à seuil |
| **SLO** | Service Level Objective – objectif de niveau de service |
| **mTLS** | Mutual TLS – authentification mutuelle par certificats entre microservices |
| **N8N** | Plateforme open-source d'automatisation de workflows, utilisée pour orchestrer les pipelines IA (chaînage OCR → NLP → scoring) et les tâches récurrentes |

### 1.6 Vue Générale du Système

La plateforme Al-Mizan est un système numérique permettant la gestion sécurisée du cycle de vie des marchés publics via une architecture distribuée basée sur des microservices. Le système comprend:

- Une application web (Next.js 14, bilingue arabe/français avec support RTL)
- Une application mobile Android (Kotlin / Jetpack Compose)
- Une API Gateway (point d'entrée unique, authentification par sessions Redis)
- 10 microservices métiers avec bases de données isolées (Database-per-Service)
- 5 services IA découplés, consommant des événements RabbitMQ
- Une infrastructure souveraine On-Premise ou Cloud Algérien

**Flux global du cycle de vie d'un marché public:**

1. Création et publication d'un appel d'offres (avec assistance IA pour le CDC)
2. Soumission électronique chiffrée des offres par les OE
3. Clôture automatique des dépôts à la seconde près
4. Ouverture contrôlée des plis en séance par la Commission (déchiffrement multi-clés Shamir)
5. Évaluation technique et financière avec détection d'anomalies par IA
6. Attribution provisoire, délai de recours, puis attribution définitive
7. Archivage légal complet du dossier

### 1.7 Documents de Référence

- **Loi n°23-12** du 5 août 2023 fixant les règles générales relatives aux marchés publics
- **Loi n°18-07** du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel
- **OWASP Top 10** (2021) – Référentiel de sécurité des applications web
- **Cahier des charges du projet 2CSSIL 2025-2026** (document encadrant)

---

## 2. Matrice de Conformité Réglementaire

### 2.1 Présentation

Cette matrice établit la traçabilité directe entre les articles de la Loi n°23-12 et les fonctionnalités techniques implémentées dans la plateforme. Chaque exigence réglementaire est mappée à un ou plusieurs modules du système, garantissant une couverture complète du cadre juridique.

**Clause de conformité:** Toute modification fonctionnelle ultérieure devra être vérifiée contre cette matrice pour maintenir la conformité réglementaire.

### 2.2 Matrice de conformité – Loi n°23-12 (Marchés Publics)

#### Titre I – Principes Généraux

| Réf. | Exigence Légale | Fonctionnalité | Module | Priorité |
|------|-----------------|----------------|---------|----------|
| **Art. 5** | Principe de libre accès à la commande publique | Portail public d'accès aux AO sans inscription préalable ; moteur de recherche multicritère | Portail Web | Haute |
| **Art. 6** | Principe d'égalité de traitement des candidats | Anonymisation des soumissions jusqu'à l'ouverture ; horodatage certifié identique pour tous | Soumission | Haute |
| **Art. 7** | Principe de transparence des procédures | Journalisation inaltérable de toutes les opérations ; portail citoyen de consultation des résultats | Traçabilité | Haute |
| **Art. 8** | Principe d'intégrité et de probité | Module IA de détection de collusion et d'anomalies dans les offres | IA / Éval. | Haute |

#### Titre II – Procédures de Passation

| Réf. | Exigence Légale | Fonctionnalité | Module | Priorité |
|------|-----------------|----------------|---------|----------|
| **Art. 13** | Appel d'offres ouvert national et/ou international | Workflow paramétrable AO ouvert : publication, réception, ouverture, évaluation, attribution | Workflow | Haute |
| **Art. 14** | Appel d'offres ouvert avec exigence de capacités minimales | Formulaire de critères d'éligibilité configurables (CA min, expérience, certifications) | AO / Config | Haute |
| **Art. 15** | Appel d'offres restreint | Workflow AO restreint avec phase de préqualification et liste restreinte | Workflow | Moyenne |
| **Art. 16** | Concours (jury) | Workflow concours : jury, anonymat renforcé, critères artistiques & techniques | Workflow | Basse |
| **Art. 17-19** | Gré à gré et après consultation | Workflow gré à gré avec justificatifs obligatoires (pièces jointes, visa hiérarchique) | Workflow | Moyenne |

#### Titre III – Publication et Délais

| Réf. | Exigence Légale | Fonctionnalité | Module | Priorité |
|------|-----------------|----------------|---------|----------|
| **Art. 42** | Publication obligatoire au BOMOP et dans au moins 2 quotidiens nationaux | Génération automatique de l'avis ; export PDF format BOMOP ; intégration API presse | Publication | Haute |
| **Art. 43** | Délai minimum de préparation des offres (30 jours AO ouvert, 15 en urgence) | Contrôle automatique des délais avec alerte si non-respect ; timer visible sur le portail | Gestion délais | Haute |
| **Art. 44** | Contenu obligatoire de l'avis d'appel d'offres | Formulaire structuré avec champs obligatoires (objet, lieu, délai, critères) ; validation avant publication | Formulaire AO | Haute |

#### Titre IV – Soumission des Offres

| Réf. | Exigence Légale | Fonctionnalité | Module | Priorité |
|------|-----------------|----------------|---------|----------|
| **Art. 56** | Contenu du dossier de candidature (pièces administratives) | Upload structuré : Registre Commerce, NIF, CNAS, CASNOS, Casier judiciaire ; vérification OCR automatique | Soumission | Haute |
| **Art. 57** | Offre technique séparée de l'offre financière | Soumission en 2 enveloppes numériques distinctes ; chiffrement AES-256-GCM de l'offre financière | Soumission | Haute |
| **Art. 58** | Caution de soumission | Module de vérification de la caution bancaire (upload attestation + validation manuelle) | Soumission | Moyenne |
| **Art. 59** | Date et heure limites de dépôt | Fermeture automatique des dépôts à la seconde près ; file d'attente haute disponibilité | Soumission | Haute |

#### Titre V – Ouverture des Plis et Évaluation

| Réf. | Exigence Légale | Fonctionnalité | Module | Priorité |
|------|-----------------|----------------|---------|----------|
| **Art. 71** | Ouverture publique des plis en séance | Interface commission avec déchiffrement multi-clés (Shamir Secret Sharing K-of-N) ; PV automatique horodaté | Évaluation | Haute |
| **Art. 72** | Commission d'ouverture des plis et d'évaluation (COPE) | Gestion des rôles : président, membres, observateurs ; quorum vérifiable | Admin COPE | Haute |
| **Art. 73** | Vérification de conformité administrative | Checklist automatique des pièces ; rapport de conformité généré par IA (OCR + NLP) | IA / Conf. | Haute |
| **Art. 75** | Évaluation technique selon critères pondérés | Grille de notation paramétrable ; calcul automatique des scores pondérés ; classement final | Évaluation | Haute |
| **Art. 76** | Ouverture des offres financières uniquement pour les offres techniquement conformes | Déchiffrement conditionnel des enveloppes financières après validation technique | Évaluation | Haute |
| **Art. 78** | Attribution provisoire avec délai de recours | Notification automatique à tous les soumissionnaires ; timer de recours (10 jours) | Attribution | Haute |

#### Titre VI – Recours et Contentieux

| Réf. | Exigence Légale | Fonctionnalité | Module | Priorité |
|------|-----------------|----------------|---------|----------|
| **Art. 82** | Droit de recours des soumissionnaires écartés | Formulaire de recours en ligne ; accusé de réception automatique ; workflow de traitement | Recours | Moyenne |
| **Art. 83** | Délai de recours (10 jours après notification) | Calcul automatique des délais ; blocage de l'attribution définitive pendant le délai | Recours | Moyenne |
| **Art. 84** | Commission des marchés (contrôle externe) | Interface dédiée Commission des marchés ; visa électronique ; rapport de contrôle | Commission | Moyenne |

---

## 3. Backlog Initial et Acteurs du Système

### 3.1 Les acteurs du système

Le système identifie les rôles suivants, issus de la table « roles » du service Utilisateurs et des interactions métier:

| Acteur | Description |
|--------|-------------|
| **Administrateur (ADMIN)** | Gère la plateforme, les paramètres globaux, la supervision des services et le suivi des incidents IA |
| **Service Contractant (SERVICE_CONTRACTANT)** | Entité publique (EPA, ministère...) qui crée et publie les appels d'offres, définit les critères, gère les lots et les cahiers des charges, prononce les attributions |
| **Opérateur Économique (OPERATEUR_ECONOMIQUE)** | Entreprise privée ou publique qui consulte les AO, retire le cahier des charges, dépose une soumission électronique et peut exercer un recours |
| **Membre de Commission (MEMBRE_COMMISSION)** | Membre désigné (président, rapporteur ou membre) d'une commission d'évaluation ou d'une commission des marchés. Participe aux séances d'ouverture des plis et à l'évaluation des offres |
| **Contrôleur (CONTROLEUR)** | Organe de contrôle qui valide ou rejette les demandes de gré-à-gré, vérifie la régularité des procédures et compare ses décisions aux recommandations de l'IA |
| **Système / IA** | Composant automatisé, qui assiste l'évaluation des offres, analyse les demandes de gré-à-gré, détecte les anomalies |

### 3.2 Backlog Initial

#### 3.2.1 Service Authentification

Gestion de l'authentification, des sessions et de la sécurité MFA.

| # | Fonctionnalité | Acteur(s) | User Story | Priorité |
|---|----------------|-----------|------------|----------|
| 1 | Inscription | Opérateur Économique / Service Contractant | En tant qu'utilisateur, je veux créer un compte avec mon email et un mot de passe sécurisé afin d'accéder à la plateforme | Haute |
| 2 | Connexion (login) | Tous les acteurs | En tant qu'utilisateur enregistré, je veux me connecter avec mes identifiants afin d'accéder à mon espace personnel | Haute |
| 3 | Déconnexion (logout) | Tous les acteurs | En tant qu'utilisateur connecté, je veux me déconnecter afin de sécuriser ma session | Haute |
| 4 | Activation / Désactivation MFA | Tous les acteurs | En tant qu'utilisateur, je veux activer l'authentification à deux facteurs (MFA) afin de renforcer la sécurité de mon compte | Haute |
| 5 | Vérification MFA lors de la connexion | Tous les acteurs | En tant qu'utilisateur avec MFA activé, je veux saisir le code MFA après mon mot de passe afin de valider mon identité | Haute |
| 6 | Réinitialisation du mot de passe | Tous les acteurs | En tant qu'utilisateur ayant oublié mon mot de passe, je veux recevoir un lien de réinitialisation par email afin de retrouver l'accès à mon compte | Moyenne |
| 7 | Gestion des sessions | Système | En tant que système, je veux créer et invalider les sessions utilisateurs (token, expiration, IP, user agent) afin de garantir la sécurité des accès | Haute |
| 8 | Historique des connexions | Administrateur | En tant qu'administrateur, je veux consulter l'historique des connexions (IP, user agent, date) afin de détecter les accès suspects | Basse |

#### 3.2.2 Service Utilisateurs

Gestion des profils, organisations, rôles et habilitations (RBAC).

| # | Fonctionnalité | Acteur(s) | User Story | Priorité |
|---|----------------|-----------|------------|----------|
| 1 | Créer un profil | Service Contractant / Opérateur Économique / Membre Commission | En tant qu'utilisateur, je veux renseigner mon nom, prénom, téléphone et langue préférée afin de compléter mon profil lors de mon inscription | Haute |
| 2 | Modifier un profil | Tous les acteurs | En tant qu'utilisateur, je veux modifier mes informations personnelles afin de maintenir mon profil à jour | Moyenne |
| 3 | Enregistrer une organisation | Service Contractant / Opérateur Économique | En tant que représentant d'une organisation, je veux enregistrer sa dénomination, NIF, NIS, registre de commerce et adresse afin de l'identifier sur la plateforme | Haute |
| 4 | Vérifier une organisation | Administrateur | En tant qu'administrateur, je veux valider les informations d'une organisation afin de confirmer son éligibilité | Haute |
| 5 | Gérer les services contractants | Service Contractant | En tant que service contractant, je veux renseigner mon code service, secteur d'activité et ordonnateur afin de pouvoir créer des appels d'offres | Haute |
| 6 | Gérer le profil opérateur | Opérateur Économique | En tant qu'opérateur économique, je veux saisir mes qualifications et catégories professionnelles afin d'être éligible aux marchés | Haute |
| 7 | Blacklister un opérateur | Administrateur / Contrôleur | En tant qu'administrateur, je veux blacklister un opérateur économique avec un motif afin de l'exclure des marchés publics | Moyenne |
| 8 | Attribuer / retirer un rôle | Administrateur | En tant qu'administrateur, je veux attribuer un rôle (Admin, Service Contractant, Opérateur, Membre Commission, Contrôleur) à un utilisateur afin de gérer les habilitations | Haute |
| 9 | Consulter la liste des utilisateurs | Administrateur | En tant qu'administrateur, je veux rechercher et consulter la liste des utilisateurs et leurs rôles afin de gérer la plateforme | Moyenne |

#### 3.2.3 Service Appels d'Offres

Création, publication et gestion complète du cycle de vie des appels d'offres, des lots, des cahiers des charges, des critères d'évaluation et des attributions.

| # | Fonctionnalité | Acteur(s) | User Story | Priorité |
|---|----------------|-----------|------------|----------|
| 1 | Créer un appel d'offres | Service Contractant | En tant que service contractant, je veux créer un AO (référence, objet, type, montant estimé, dates limites) afin de lancer une procédure de passation | Haute |
| 2 | Gérer les lots | Service Contractant | En tant que service contractant, je veux découper un AO en lots (numéro, désignation, montant estimé) afin de permettre des soumissions partielles | Haute |
| 3 | Publier / retirer le cahier des charges | Service Contractant | En tant que service contractant, je veux uploader et publier le cahier des charges (avec prix de retrait) afin que les opérateurs y accèdent | Haute |
| 4 | Définir les critères d'éligibilité | Service Contractant | En tant que service contractant, je veux définir des critères éliminatoires afin de filtrer les soumissions non conformes | Haute |
| 5 | Définir les critères d'évaluation | Service Contractant | En tant que service contractant, je veux définir des critères techniques et financiers avec pondération et note éliminatoire afin de guider l'évaluation | Haute |
| 6 | Publier un avis (BOMOP, presse, plateforme) | Service Contractant | En tant que service contractant, je veux publier les avis réglementaires (AO, attribution provisoire/définitive, annulation, rectificatif) afin d'informer les opérateurs | Haute |
| 7 | Changer le statut de l'AO | Service Contractant / Système | En tant que service contractant, je veux faire évoluer le statut de l'AO (brouillon → publié → en cours → ouverture plis → évaluation → attribué) afin de suivre le cycle de vie | Haute |
| 8 | Prononcer l'attribution provisoire | Service Contractant | En tant que service contractant, je veux attribuer provisoirement le marché à une soumission retenue afin de lancer la période de recours | Haute |
| 9 | Prononcer l'attribution définitive | Service Contractant | En tant que service contractant, je veux confirmer l'attribution définitive après la période de recours afin de signer le marché | Haute |
| 10 | Créer le marché | Service Contractant | En tant que service contractant, je veux créer la fiche marché (référence, montant, délai, date de signature) afin de formaliser l'engagement contractuel | Moyenne |
| 11 | Soumettre une demande de gré-à-gré | Service Contractant | En tant que service contractant, je veux soumettre une demande de gré-à-gré avec justifications afin de solliciter une dérogation à la mise en concurrence | Moyenne |
| 12 | Analyse IA d'une demande gré-à-gré | Système / IA | En tant que système IA, je veux analyser automatiquement les justifications de gré-à-gré et produire un score de conformité et une recommandation afin d'assister le contrôleur | Moyenne |
| 13 | Valider / rejeter une demande gré-à-gré | Contrôleur | En tant que contrôleur, je veux prendre une décision finale sur la demande de gré-à-gré (en comparant avec la recommandation IA) afin de garantir la régularité | Moyenne |
| 14 | Consulter les appels d'offres publiés | Opérateur Économique | En tant qu'opérateur économique, je veux consulter la liste des AO publiés, filtrer par type, wilaya ou secteur afin de trouver les marchés pertinents | Haute |
| 15 | Retirer le cahier des charges | Opérateur Économique | En tant qu'opérateur économique, je veux retirer (télécharger) le cahier des charges d'un AO afin de préparer ma soumission | Haute |

#### 3.2.4 Service Soumissions

Dépôt électronique des offres avec chiffrement de bout-en-bout et horodatage légal.

| # | Fonctionnalité | Acteur(s) | User Story | Priorité |
|---|----------------|-----------|------------|----------|
| 1 | Créer une soumission (brouillon) | Opérateur Économique | En tant qu'opérateur économique, je veux créer une soumission en brouillon pour un AO (ou un lot) afin de préparer mon offre | Haute |
| 2 | Déposer l'offre technique | Opérateur Économique | En tant qu'opérateur économique, je veux uploader mon offre technique (avec calcul de hash d'intégrité) afin de la soumettre officiellement | Haute |
| 3 | Déposer l'offre financière chiffrée | Opérateur Économique | En tant qu'opérateur économique, je veux déposer mon offre financière chiffrée de bout en bout afin de garantir la confidentialité jusqu'à l'ouverture des plis | Haute |
| 4 | Joindre la caution de soumission | Opérateur Économique | En tant qu'opérateur économique, je veux joindre ma caution bancaire (montant, banque, référence, date d'expiration) afin de valider ma candidature | Moyenne |
| 5 | Valider et soumettre la soumission | Opérateur Économique | En tant qu'opérateur économique, je veux soumettre définitivement ma soumission (avec horodatage serveur et vérification du délai) afin de participer à l'AO | Haute |
| 6 | Générer les clés de chiffrement | Système | En tant que système, je veux générer une paire de clés asymétriques par AO afin de chiffrer les offres financières | Haute |
| 7 | Déchiffrer les offres financières | Système / Commission | En tant que membre de la commission, je veux déclencher le déchiffrement des offres financières lors de la séance d'ouverture afin de consulter les montants | Haute |
| 8 | Consulter mes soumissions | Opérateur Économique | En tant qu'opérateur économique, je veux consulter l'état de mes soumissions (brouillon, déposée, reçue, évaluée...) afin de suivre leur avancement | Moyenne |

#### 3.2.5 Service Documents

Gestion des fichiers, pièces administratives et pipeline OCR/NLP.

| # | Fonctionnalité | Acteur(s) | User Story | Priorité |
|---|----------------|-----------|------------|----------|
| 1 | Uploader un document | Tous les acteurs | En tant qu'utilisateur, je veux uploader un document (avec calcul du hash SHA-256) afin de le stocker de manière sécurisée sur la plateforme | Haute |
| 2 | Consulter / télécharger un document | Tous les acteurs | En tant qu'utilisateur, je veux consulter ou télécharger un document précédemment uploadé afin d'accéder à son contenu | Haute |
| 3 | Joindre les pièces administratives | Opérateur Économique | En tant qu'opérateur économique, je veux joindre mes pièces administratives (NIF, NIS, registre de commerce, casier judiciaire, CNAS, CASNOS, attestation fiscale, bilan) à ma soumission afin de justifier mon éligibilité | Haute |
| 4 | Valider une pièce administrative | Service Contractant / Commission | En tant que membre de la commission, je veux valider ou invalider une pièce administrative (conformité, date d'expiration) afin de vérifier l'éligibilité d'un soumissionnaire | Haute |
| 5 | Analyse OCR / NLP d'un document | Système / IA | En tant que système, je veux extraire le texte d'un document par OCR, analyser sa complétude et détecter les anomalies afin d'assister la vérification des pièces | Moyenne |
| 6 | Consulter le résultat d'analyse OCR | Service Contractant / Commission | En tant que membre de la commission, je veux consulter le score de confiance, la conformité et les anomalies détectées par l'OCR afin de prendre une décision éclairée | Moyenne |

#### 3.2.6 Service Évaluations

Notation des offres, calcul des scores, grilles d'évaluation et assistance IA.

| # | Fonctionnalité | Acteur(s) | User Story | Priorité |
|---|----------------|-----------|------------|----------|
| 1 | Créer une évaluation | Service Contractant / Commission | En tant que président de commission, je veux créer une évaluation (éligibilité, technique ou financière) pour un AO afin de démarrer le processus de notation | Haute |
| 2 | Noter une soumission | Membre de Commission | En tant que membre de commission, je veux attribuer une note à chaque critère pour chaque soumission avec une justification afin de compléter la grille d'évaluation | Haute |
| 3 | Calculer les scores et le classement | Système | En tant que système, je veux calculer les scores techniques, financiers et globaux, établir le classement et identifier les soumissions éliminées afin de produire le résultat d'évaluation | Haute |
| 4 | Évaluation assistée par IA | Système / IA | En tant que système IA, je veux attribuer des notes avec justification et un score de confiance pour chaque critère afin d'assister les évaluateurs humains | Moyenne |
| 5 | Calculer le score IA et la recommandation | Système / IA | En tant que système IA, je veux calculer un score global et un classement suggéré avec une recommandation (retenir, éliminer, analyser plus) afin de faciliter la décision | Moyenne |
| 6 | Comparer décisions commission vs IA | Contrôleur / Administrateur | En tant que contrôleur, je veux comparer les scores et décisions de la commission avec ceux de l'IA (correspondance, écart, motif de divergence) afin de détecter les anomalies | Moyenne |
| 7 | Générer le rapport d'évaluation | Commission | En tant que président de commission, je veux générer le rapport final d'évaluation afin de l'annexer au PV | Haute |

#### 3.2.7 Service Commissions

Constitution des commissions, séances d'ouverture des plis et procès-verbaux.

| # | Fonctionnalité | Acteur(s) | User Story | Priorité |
|---|----------------|-----------|------------|----------|
| 1 | Constituer une commission d'évaluation | Service Contractant | En tant que service contractant, je veux créer une commission d'évaluation pour un AO et désigner ses membres (président, rapporteur, membres) afin de lancer l'évaluation | Haute |
| 2 | Constituer une commission des marchés | Administrateur | En tant qu'administrateur, je veux créer une commission des marchés (nationale, sectorielle, wilaya, communale) afin de contrôler les attributions | Haute |
| 3 | Programmer une séance d'ouverture des plis | Service Contractant / Commission | En tant que président de commission, je veux programmer une séance d'ouverture (technique ou financière) avec date, lieu et caractère public/privé afin d'organiser la procédure | Haute |
| 4 | Renseigner les résultats d'ouverture | Membre de Commission | En tant que membre de la commission, je veux renseigner pour chaque soumission si le pli est reçu, conforme et mes observations afin de consigner les résultats d'ouverture | Haute |
| 5 | Générer le PV d'ouverture | Commission | En tant que président de commission, je veux générer le procès-verbal de la séance d'ouverture afin de le signer et l'archiver | Haute |
| 6 | Dissoudre une commission | Administrateur / Service Contractant | En tant qu'administrateur, je veux dissoudre une commission après la fin de la procédure afin de clôturer la mission | Basse |

#### 3.2.8 Service Recours

Dépôt et traitement des recours dans les délais légaux.

| # | Fonctionnalité | Acteur(s) | User Story | Priorité |
|---|----------------|-----------|------------|----------|
| 1 | Déposer un recours | Opérateur Économique | En tant qu'opérateur économique non retenu, je veux déposer un recours contre l'attribution provisoire (motif, pièces jointes) dans les délais légaux afin de contester la décision | Haute |
| 2 | Examiner un recours | Commission / Contrôleur | En tant que membre de la commission des marchés ou contrôleur, je veux examiner le recours déposé afin de statuer sur sa recevabilité | Haute |
| 3 | Statuer sur un recours | Commission / Contrôleur | En tant que commission des marchés, je veux accepter ou rejeter un recours avec un motif de décision afin de clore la procédure de recours | Haute |
| 4 | Consulter mes recours | Opérateur Économique | En tant qu'opérateur économique, je veux consulter l'état de mes recours (déposé, en examen, accepté, rejeté) afin de suivre leur traitement | Moyenne |
| 5 | Vérifier le respect des délais | Système | En tant que système, je veux vérifier automatiquement que le recours est déposé dans le délai légal et que la réponse est rendue dans les délais afin de garantir la conformité réglementaire | Haute |

#### 3.2.9 Service Audit

Journalisation append-only chaînée SHA-256 et monitoring des incidents IA.

| # | Fonctionnalité | Acteur(s) | User Story | Priorité |
|---|----------------|-----------|------------|----------|
| 1 | Journaliser toute action | Système | En tant que système, je veux enregistrer chaque action utilisateur (dépôt, ouverture, notation, attribution, connexion...) avec horodatage, IP, hash SHA-256 et chaînage afin de garantir la traçabilité et l'intégrité | Haute |
| 2 | Consulter le journal d'audit | Administrateur / Contrôleur | En tant qu'administrateur, je veux consulter et rechercher dans le journal d'audit (par utilisateur, action, date) afin de vérifier la conformité des opérations | Haute |
| 3 | Vérifier l'intégrité de la chaîne de logs | Système / Administrateur | En tant qu'administrateur, je veux vérifier l'intégrité de la chaîne de hashs des logs afin de détecter toute altération | Haute |
| 4 | Détecter un incident IA | Système | En tant que système, je veux détecter et enregistrer tout incident IA (divergence gré-à-gré, divergence évaluation, erreur IA, confiance faible) avec sa gravité afin de déclencher l'alerte | Moyenne |
| 5 | Consulter les incidents IA | Administrateur / Contrôleur | En tant que contrôleur, je veux consulter la liste des incidents IA, leur gravité, statut et résolution afin de superviser le fonctionnement de l'IA | Moyenne |
| 6 | Résoudre un incident IA | Administrateur / Contrôleur | En tant qu'administrateur, je veux assigner, analyser et résoudre un incident IA avec des notes de résolution afin de maintenir la fiabilité du système | Moyenne |
| 7 | Consulter les logs de décisions IA | Contrôleur | En tant que contrôleur, je veux consulter le détail chronologique des décisions IA vs humaines par incident afin de comprendre les divergences | Basse |

#### 3.2.10 Service Notifications

Envoi d'emails, SMS, notifications push Android et alertes IA.

| # | Fonctionnalité | Acteur(s) | User Story | Priorité |
|---|----------------|-----------|------------|----------|
| 1 | Envoyer une notification | Système | En tant que système, je veux envoyer une notification (email, SMS, push ou plateforme) à un utilisateur lors d'un événement métier (publication AO, dépôt, ouverture, évaluation, attribution, recours) afin de le tenir informé | Haute |
| 2 | Consulter mes notifications | Tous les acteurs | En tant qu'utilisateur, je veux consulter la liste de mes notifications et les marquer comme lues afin de suivre les événements me concernant | Haute |
| 3 | Émettre une alerte IA | Système | En tant que système, je veux émettre une alerte spécialisée (divergence gré-à-gré, divergence évaluation, confiance faible, erreur modèle) avec un niveau d'urgence aux utilisateurs ciblés afin de signaler un incident IA | Moyenne |
| 4 | Acquitter / résoudre une alerte IA | Administrateur / Contrôleur | En tant que contrôleur, je veux acquitter et résoudre une alerte IA afin de confirmer sa prise en charge | Moyenne |
| 5 | Générer un rapport IA périodique | Système | En tant que système, je veux générer des rapports IA (quotidien, hebdomadaire, mensuel) avec les statistiques de performance, divergences et erreurs afin de suivre la fiabilité de l'IA | Basse |
| 6 | Envoyer un rapport IA aux destinataires | Système | En tant que système, je veux envoyer le rapport IA généré (PDF) aux administrateurs et contrôleurs afin de les informer régulièrement | Basse |

---