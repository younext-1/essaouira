# ROYAUME DU MAROC

## UNIVERSITÉ CADI AYYAD

### ÉCOLE SUPÉRIEURE DE TECHNOLOGIE D'ESSAOUIRA (ESTE)

**DÉPARTEMENT GÉNIE INFORMATIQUE**

---

[IMAGE REQUISITION : Logo Officiel de l'Université Cadi Ayyad et Logo de l'École Supérieure de Technologie d'Essaouira (ESTE)]

[IMAGE REQUISITION : Armoiries du Royaume du Maroc et Logo du Ministère du Tourisme, de l'Artisanat et de l'Économie Sociale et Solidaire]

---

# RAPPORT DE STAGE DE FIN D'ÉTUDES

**En vue de l'obtention du Diplôme Universitaire de Technologie (DUT)**  
**Spécialité : Génie Informatique (GI)**

---

### **SUJET DU PROJET :**

## **Conception, Architecture et Implémentation d'une Plateforme Web E-Commerce Marketplace de Haute Performance Enrichie par l'Intelligence Artificielle pour la Digitalisation et la Commercialisation de l'Artisanat d'Essaouira : "MOGADOR Choice Marketplace"**

### **Domaine Officiel et Déploiement : [`https://essaouira.tech`](https://essaouira.tech)**

---

- **Réalisé par :** Youssef EL KADIRI (Étudiant en Génie Informatique, ESTE)
- **Encadrant Professionnel :** M. BOURAGBA Mustapha (Directeur Provincial de l'Artisanat d'Essaouira)
- **Encadrant Pédagogique :** Professeur du Département Génie Informatique (ESTE)
- **Organisme d'Accueil :** Direction Provinciale de l'Artisanat d'Essaouira – Complexe Intégré de l'Artisanat (CIA)
- **Période de Stage :** Mai 2026
- **Stack Technologique :** Next.js (React Framework / App Router), Supabase (PostgreSQL / RLS / pgvector AI / Auth / Storage), Tailwind CSS, AI OpenAI API / Embeddings, Vercel Edge Deployment (`essaouira.tech`)
- **Année Universitaire :** 2025 / 2026

---

<br>

## **DÉDICACE**

> _À mes parents chéris,_  
> _Aucun mot, aucune langue ne saurait traduire l'immensité de mon amour, de ma gratitude et de mon respect à votre égard. Vous avez été les architectes invisibles de chacune de mes réussites académiques et personnelles. Vos prières constantes, vos sacrifices inestimables, votre soutien inconditionnel et votre bienveillance illimitée ont éclairé mon parcours aux heures les plus sombres et nourri mon ambition aux heures de doute. Ce travail est le fruit de votre dévouement sans faille et le premier hommage à votre amour parental. Puisse le Tout-Puissant vous préserver, vous accorder une santé de fer, une longue vie paisible et la fierté de voir s'accomplir les rêves que vous avez semés en moi._
>
> _À mes chers frères et sœurs,_  
> _Pour votre fraternité sincère, vos encouragements constants, vos conseils avisés et la complicité inestimable qui nous unie. Votre présence à mes côtés constitue une source intarissable de force et de motivation. Que ce travail soit le symbole de notre union familiale et de mon affection indéfectible._
>
> _À l'ensemble du corps professoral et administratif de l'École Supérieure de Technologie d'Essaouira (ESTE),_  
> _En particulier aux enseignants du Département Génie Informatique, qui m'ont transmis avec passion, rigueur et pédagogie les valeurs fondamentales de l'ingénierie logicielle, le sens de l'effort et la quête permanente de l'excellence technique._
>
> _À Monsieur le Directeur Provincial de l'Artisanat d'Essaouira, M. BOURAGBA Mustapha, ainsi qu'à l'ensemble des cadres et fonctionnaires de la Direction,_  
> _Pour leur accueil chaleureux, leur ouverture d'esprit et l'opportunité exceptionnelle qu'ils m'ont offerte d'immerger au cœur d'un secteur économique d'une richesse patrimoniale inestimable._
>
> _À tous mes camarades de promotion de Génie Informatique (Année 2025/2026),_  
> _En souvenir des défis relevés ensemble, des nuits d'apprentissage intense, des débats passionnés sur l'architecture logicielle et l'IA, et de l'esprit d'équipe exemplaire qui a marqué ces deux années de formation universitaire._
>
> _À toute personne ayant contribué, de près ou de loin, à l'aboutissement de ce travail académique et professionnel._
>
> **— Youssef EL KADIRI**

---

<br>

## **REMERCIEMENTS**

Au terme de ce travail de recherche, de conception et de développement concrétisant mon Stage de Fin d'Études (SFE) en Génie Informatique effectué durant le mois de **Mai 2026**, j'adresse l'expression de mes plus profondes gratitudes et de mes remerciements les plus sincères à toutes les personnes morales et physiques qui m'ont guidé, soutenu et accompagné tout au long de cette expérience professionnelle enrichissante.

Je tiens à exprimer ma reconnaissance la plus vive et la plus respectueuse à Monsieur **BOURAGBA Mustapha**, Directeur Provincial de la Direction Provinciale de l'Artisanat d'Essaouira. En acceptant de m'accueillir au sein de l'institution qu'il dirige et en assurant l'encadrement professionnel de ce travail, il m'a témoigné une confiance précieuse. Sa vision stratégique du développement du secteur artisanal local, sa grande disponibilité malgré ses lourdes charges administratives, ses orientations avisées et sa bienveillance constante ont été des éléments déterminants dans la conduite de ce projet d'envergure, couronné par le déploiement sur le domaine officiel [`https://essaouira.tech`](https://essaouira.tech).

J'adresse également mes remerciements chaleureux à l'ensemble du personnel de la Direction Provinciale de l'Artisanat d'Essaouira, notamment aux responsables et techniciens des différents services opérationnels : le Service Étude et Suivi des Projets, le Service de Gestion des Associations, Coopératives et Formation Professionnelle, le Bureau d'Ordre et Comptabilité, ainsi que le Service d'Exportation. Leurs explications détaillées sur le fonctionnement du secteur, la gestion du Complexe Intégré de l'Artisanat (CIA) et les contraintes de commercialisation rencontrées par les mono-artisans et les coopératives ont constitué le socle fonctionnel indispensable à l'élaboration de la plateforme **MOGADOR Choice Marketplace**.

Sur le plan académique, ma profonde gratitude s'adresse à l'ensemble des enseignants-chercheurs et formateurs du Département **Génie Informatique** de l'École Supérieure de Technologie d'Essaouira (ESTE), sous l'égide de l'Université Cadi Ayyad de Marrakech. Leurs enseignements de haute valeur scientifique, couvrant le génie logiciel, la modélisation orientée objet (UML), le développement web moderne (Next.js), les architectures de bases de données relationnelles (PostgreSQL, Supabase), l'intégration de modules d'Intelligence Artificielle (AI Embeddings, Vector Search) ainsi que la sécurité informatique, m'ont doté des compétences théoriques et pratiques nécessaires pour concevoir une application de niveau professionnel.

Enfin, je tiens à exprimer mes remerciements respectueux aux membres du jury qui ont accepté d'examiner et d'évaluer ce travail de fin d'études. Leurs remarques, leurs critiques constructives et leurs suggestions permettront indéniablement d'enrichir la qualité scientifique et technique de cette contribution.

---

<br>

## **RÉSUMÉ**

Le présent rapport de Stage de Fin d'Études (SFE), réalisé au cours de l'année universitaire **2025/2026** (période de stage : **Mai 2026**), formalise le travail de conception, d'architecture logicielle et d'implémentation de la plateforme e-commerce multi-vendeurs de type marketplace intitulée **"MOGADOR Choice Marketplace"**, accessible en ligne à l'adresse **[`https://essaouira.tech`](https://essaouira.tech)**. Développé au sein de la Direction Provinciale de l'Artisanat d'Essaouira par **Youssef EL KADIRI**, étudiant en **Génie Informatique** à l'École Supérieure de Technologie d'Essaouira (ESTE), ce projet vise à moderniser les canaux de distribution, à intégrer des technologies avancées d'Intelligence Artificielle (IA) et à assurer la promotion numérique internationale du patrimoine artisanal d'Essaouira.

La province d'Essaouira est réputée mondialement pour la richesse de son patrimoine artisanal, incarné par le travail d'ébénisterie sur bois de Thuya, l'extraction de l'huile d'Argan pure (cosmétique et gastronomique), le tissage de tapis berbères, la maroquinerie faite main, la bijouterie traditionnelle en argent et la céramique. Toutefois, la majorité des coopératives et mono-artisans locaux sont confrontés à des limites de commercialisation physique liées à la saisonnalité touristique et à l'intermédiation commerciale.

Pour résoudre cette problématique, notre contribution logicielle consiste en l'élaboration d'une application web Single Page Application (SPA) hautement réactive, évolutive et sécurisée. S'appuyant sur un écosystème technologique de pointe combinant le framework **Next.js** (App Router, Server Components et Server Actions), la plateforme Backend-as-a-Service **Supabase** (moteur PostgreSQL, module de recherche vectorielle `pgvector` pour l'IA, authentification Supabase Auth, règles de sécurité Row Level Security RLS, stockage Supabase Storage) et des services d'Intelligence Artificielle (OpenAI Embeddings & LLM), la plateforme offre :

- Un déploiement de haute performance sur le nom de domaine officiel **`essaouira.tech`**.
- Une interface utilisateur au design moderne, réactif et conforme aux meilleures pratiques UI/UX.
- Un **Moteur d'Intelligence Artificielle (MOGADOR AI Engine)** comprenant :
  - _Moteur de Recommandation Intelligente (AI Craft Recommender)_ basé sur la recherche vectorielle (`pgvector`) analysant le comportement de l'utilisateur.
  - _Recherche Visuelle Multimodale par l'Image (AI Visual Search)_ permettant de trouver un produit artisanal à partir d'une photo uploadée.
  - _Assistant Virtuel Intelligent / Chatbot Culturel ("Mogador AI Guide")_ expliquant l'histoire et les techniques de fabrication de l'artisanat d'Essaouira.
  - _Générateur Automatique de Contenu Multilingue pour Artisans (AI Copywriting)_ facilitant la création de fiches produits optimisées pour le SEO.
- Un moteur de recherche textuel performant couplé à un système de filtrage dynamique multi-critères (par catégorie spécialisée, limite de prix dynamique via réglette interactive 0-5000 DH et critères de tri avancés).
- Un module de gestion des offres promotionnelles en temps réel (Bundle Deals avec tarification dégressive, SuperDeals intégrant des compteurs temporels réactifs).
- Une gestion réactive du panier d'achat via un volet latéral fluide (Cart Drawer).
- Une géolocalisation intégrée et interactive du Complexe Intégré de l'Artisanat (CIA) d'Essaouira via l'API Google Maps.

Ce document retrace minutieusement le cycle de vie complet du projet d'ingénierie logicielle : l'analyse théorique du domaine institutionnel, la spécification rigoureuse des besoins fonctionnels et non-fonctionnels, la modélisation conceptuelle sous le langage UML (cas d'utilisation, diagramme de classes, diagrammes de séquences), la conception des schémas SQL PostgreSQL et vectoriels, l'architecture du code source Next.js, jusqu'aux campagnes de tests et de validation.

**Mots-clés :** Youssef EL KADIRI, Génie Informatique, E-Commerce Marketplace, Next.js, React, Supabase, PostgreSQL, Intelligence Artificielle (IA), Recherche Vectorielle (pgvector), OpenAI, `essaouira.tech`, UML, Artisanat d'Essaouira, MOGADOR Choice, Responsive Design.

---

<br>

## **ABSTRACT**

This End-of-Studies Internship Report (SFE), conducted during the **2025/2026** academic year (internship period: **May 2026**), details the software engineering, architectural design, and full-stack implementation of a high-performance multi-vendor e-commerce marketplace platform titled **"MOGADOR Choice Marketplace"**, deployed at **[`https://essaouira.tech`](https://essaouira.tech)**. Developed at the Provincial Directorate of Handicrafts of Essaouira by **Youssef EL KADIRI**, a **Computer Engineering** student from the École Supérieure de Technologie d'Essaouira (ESTE), this project aims to digitize artisanal supply chains and leverage Artificial Intelligence (AI) to boost the international visibility of Essaouira's cultural heritage.

The province of Essaouira is internationally renowned for its craftsmanship, including Thuya wood marquetry, pure cosmetic and culinary Argan oil, hand-stitched leather goods, traditional Berber jewelry, Moroccan rugs, and pottery. However, local cooperatives and independent artisans face geographical isolation, seasonal tourism fluctuations, and an excessive reliance on intermediaries.

To overcome these barriers, this project presents a cutting-edge web marketplace application. Built on an advanced full-stack architecture leveraging **Next.js** (App Router, Server Components, Server Actions) and **Supabase** (PostgreSQL relational database with `pgvector` extension for AI vector search, Supabase Auth, Row Level Security RLS, and Cloud Storage), integrated with AI LLMs and Embedding models, the platform delivers:

- Production deployment on the custom domain **`essaouira.tech`**.
- State-of-the-art, high-aesthetic, and fully responsive user interfaces.
- **MOGADOR AI Suite** featuring:
  - _AI-Powered Craft Recommendation Engine_ utilizing PostgreSQL `pgvector` similarity search.
  - _Multimodal AI Visual Search_ enabling users to upload a photo of a handicraft item and find matching products.
  - _AI Cultural Assistant Chatbot ("Mogador AI Guide")_ providing narrative insights into Moroccan craftsmanship.
  - _Automated AI Multilingual Copywriting for Artisans_ generating SEO-optimized product listings.
- Advanced multi-criteria search engine capabilities (category-based filtering, interactive dynamic price limit slider 0-5000 DH, and real-time sorting parameters).
- Real-time promotional deal engines (Bundle Deals with volume discounts, SuperDeals with live countdown timer mechanisms).
- A reactive side-drawer Cart management system (Cart Drawer) with instantaneous state updates.
- Embedded interactive spatial mapping via Google Maps API, showcasing the Integrated Handicraft Complex (CIA) of Essaouira.

This report comprehensively covers every phase of the software engineering lifecycle: domain analysis, functional and non-functional requirements specification, Unified Modeling Language (UML) conceptual design, PostgreSQL relational and vector schema definition, Next.js component hierarchy, and performance testing.

**Keywords:** Youssef EL KADIRI, Computer Engineering, E-Commerce Marketplace, Next.js, React, Supabase, PostgreSQL, Artificial Intelligence (AI), Vector Search (pgvector), OpenAI, `essaouira.tech`, UML, Essaouira Handicrafts, MOGADOR Choice, Responsive Design.

---

<br>

## **TABLE DES MATIÈRES COMPLÈTE ET EXHAUSTIVE DE L'ENSEMBLE DU RAPPORT**

- [ROYAUME DU MAROC](#royaume-du-maroc)
  - [UNIVERSITÉ CADI AYYAD](#université-cadi-ayyad)
    - [ÉCOLE SUPÉRIEURE DE TECHNOLOGIE D'ESSAOUIRA (ESTE)](#école-supérieure-de-technologie-dessaouira-este)
- [RAPPORT DE STAGE DE FIN D'ÉTUDES](#rapport-de-stage-de-fin-détudes)
  - [**SUJET DU PROJET :**](#sujet-du-projet-)
  - [**Conception, Architecture et Implémentation d'une Plateforme Web E-Commerce Marketplace de Haute Performance Enrichie par l'Intelligence Artificielle pour la Digitalisation et la Commercialisation de l'Artisanat d'Essaouira : "MOGADOR Choice Marketplace"**](#conception-architecture-et-implémentation-dune-plateforme-web-e-commerce-marketplace-de-haute-performance-enrichie-par-lintelligence-artificielle-pour-la-digitalisation-et-la-commercialisation-de-lartisanat-dessaouira--mogador-choice-marketplace)
    - [**Domaine Officiel et Déploiement : https://essaouira.tech**](#domaine-officiel-et-déploiement--httpsessaouiratech)
  - [**DÉDICACE**](#dédicace)
  - [**REMERCIEMENTS**](#remerciements)
  - [**RÉSUMÉ**](#résumé)
  - [**ABSTRACT**](#abstract)
  - [**TABLE DES MATIÈRES COMPLÈTE ET EXHAUSTIVE DE L'ENSEMBLE DU RAPPORT**](#table-des-matières-complète-et-exhaustive-de-lensemble-du-rapport)
  - [**LISTE DES FIGURES ET SCHÉMAS**](#liste-des-figures-et-schémas)
  - [**LISTE DES TABLEAUX**](#liste-des-tableaux)
  - [**LISTE DES ABRÉVIATIONS ET GLOSSAIRE TECHNIQUE**](#liste-des-abréviations-et-glossaire-technique)
  - [**INTRODUCTION GÉNÉRALE**](#introduction-générale)
- [**CHAPITRE 1 : CONTEXTE GÉNÉRAL DU PROJET ET ORGANISME D'ACCUEIL**](#chapitre-1--contexte-général-du-projet-et-organisme-daccueil)
  - [1.1. Introduction du Chapitre](#11-introduction-du-chapitre)
  - [1.2. Présentation de l'Établissement Universitaire (ESTE - Département Génie Informatique)](#12-présentation-de-létablissement-universitaire-este---département-génie-informatique)
    - [1.2.1. Missions de l'ESTE et ancrage dans l'Université Cadi Ayyad](#121-missions-de-leste-et-ancrage-dans-luniversité-cadi-ayyad)
    - [1.2.2. La filière Génie Informatique (GI) : Programme, compétences et objectifs](#122-la-filière-génie-informatique-gi--programme-compétences-et-objectifs)
    - [1.2.3. Rôle et importance du Stage de Fin d'Études (SFE - Promotion 2025/2026, Mai 2026)](#123-rôle-et-importance-du-stage-de-fin-détudes-sfe---promotion-20252026-mai-2026)
  - [1.3. Présentation Approfondie de l'Organisme d'Accueil : La Direction Provinciale de l'Artisanat d'Essaouira](#13-présentation-approfondie-de-lorganisme-daccueil--la-direction-provinciale-de-lartisanat-dessaouira)
    - [1.3.1. Cadre institutionnel, statut juridique et tutelle ministérielle](#131-cadre-institutionnel-statut-juridique-et-tutelle-ministérielle)
    - [1.3.2. Orientations stratégiques nationales (Vision 2015 et Feuille de Route 2030)](#132-orientations-stratégiques-nationales-vision-2015-et-feuille-de-route-2030)
    - [1.3.3. Organigramme institutionnel et structure de direction (M. BOURAGBA Mustapha)](#133-organigramme-institutionnel-et-structure-de-direction-m-bouragba-mustapha)
    - [1.3.4. Description détaillée des services opérationnels de la direction](#134-description-détaillée-des-services-opérationnels-de-la-direction)
      - [a) Service Étude et Suivi des Projets (Responsable : M. LBASRAOUI Khallaf)](#a-service-étude-et-suivi-des-projets-responsable--m-lbasraoui-khallaf)
      - [b) Service de Gestion des Associations, Coopératives et Formation Professionnelle (Responsable : M. GHOULIMI Abdelkader)](#b-service-de-gestion-des-associations-coopératives-et-formation-professionnelle-responsable--m-ghoulimi-abdelkader)
      - [c) Bureau d'Ordre et Comptabilité (Responsable : M. MERZAGUI Zakaria)](#c-bureau-dordre-et-comptabilité-responsable--m-merzagui-zakaria)
      - [d) Service d'Exportation et Réglementation des Matières (Bois de Thuya)](#d-service-dexportation-et-réglementation-des-matières-bois-de-thuya)
    - [1.3.5. Fiche Technique et Infrastructure du Complexe Intégré de l'Artisanat (CIA) d'Essaouira](#135-fiche-technique-et-infrastructure-du-complexe-intégré-de-lartisanat-cia-dessaouira)
  - [1.4. Étude du Contexte Applicatif et Problématique Opérationnelle](#14-étude-du-contexte-applicatif-et-problématique-opérationnelle)
    - [1.4.1. Analyse des goulots d'étranglement de la commercialisation traditionnelle](#141-analyse-des-goulots-détranglement-de-la-commercialisation-traditionnelle)
    - [1.4.2. Énoncé formel de la problématique logicielle et réponse via `essaouira.tech`](#142-énoncé-formel-de-la-problématique-logicielle-et-réponse-via-essaouiratech)
  - [1.5. Objectifs Informatiques et Périmètre du Projet (Perspective Youssef EL KADIRI / GI)](#15-objectifs-informatiques-et-périmètre-du-projet-perspective-youssef-el-kadiri--gi)
  - [1.6. Conclusion du Chapitre](#16-conclusion-du-chapitre)
- [**CHAPITRE 2 : ÉTUDE PRÉALABLE, SPÉCIFICATION DES BESOINS ET MODULES D'INTELLIGENCE ARTIFICIELLE**](#chapitre-2--étude-préalable-spécification-des-besoins-et-modules-dintelligence-artificielle)
  - [2.1. Introduction du Chapitre](#21-introduction-du-chapitre)
  - [2.2. Analyse Comparative des Systèmes d'Information Existants](#22-analyse-comparative-des-systèmes-dinformation-existants)
  - [2.3. Spécification Détaillée des Besoins Fonctionnels](#23-spécification-détaillée-des-besoins-fonctionnels)
    - [2.3.1. Gestion de l'Identité, Authentification et Profils Utilisateurs (Supabase Auth)](#231-gestion-de-lidentité-authentification-et-profils-utilisateurs-supabase-auth)
    - [2.3.2. Moteur de Recherche et Exploration du Catalogue ("Explore Workshop Collections")](#232-moteur-de-recherche-et-exploration-du-catalogue-explore-workshop-collections)
    - [2.3.3. Système de Filtrage Dynamique Multi-Critères et Tri Temps Réel](#233-système-de-filtrage-dynamique-multi-critères-et-tri-temps-réel)
    - [2.3.4. Module de Tarification et Promotions (Bundle Deals, SuperDeals avec Minuteur)](#234-module-de-tarification-et-promotions-bundle-deals-superdeals-avec-minuteur)
    - [2.3.5. Gestion Réactive du Panier d'Achat (Cart Drawer)](#235-gestion-réactive-du-panier-dachat-cart-drawer)
    - [2.3.6. Sections Spécialisées "MORE TO LOVE" & Grilles de Produits Thématiques](#236-sections-spécialisées-more-to-love--grilles-de-produits-thématiques)
    - [2.3.7. Module de Contact et Géolocalisation Interactive Google Maps](#237-module-de-contact-et-géolocalisation-interactive-google-maps)
    - [2.3.8. Module Avancé d'Intelligence Artificielle (MOGADOR AI Suite)](#238-module-avancé-dintelligence-artificielle-mogador-ai-suite)
      - [a) Moteur de Recommandation Intelligente par Recherche Vectorielle (`pgvector`)](#a-moteur-de-recommandation-intelligente-par-recherche-vectorielle-pgvector)
      - [b) Recherche Visuelle Multimodale par l'Image (AI Visual Search)](#b-recherche-visuelle-multimodale-par-limage-ai-visual-search)
      - [c) Assistant Virtuel Conversationnel "Mogador AI Guide" (LLM Cultural Agent)](#c-assistant-virtuel-conversationnel-mogador-ai-guide-llm-cultural-agent)
      - [d) Générateur Automatique de Contenu Multilingue pour Artisans (AI Copywriting)](#d-générateur-automatique-de-contenu-multilingue-pour-artisans-ai-copywriting)
  - [2.4. Spécification Avancée des Besoins Non-Fonctionnels](#24-spécification-avancée-des-besoins-non-fonctionnels)
    - [2.4.1. Ergonomie, UI/UX Design System et Responsive Web Design](#241-ergonomie-uiux-design-system-et-responsive-web-design)
    - [2.4.2. Performance Technique, Temps de Réponse et Optimization SSR/ISR](#242-performance-technique-temps-de-réponse-et-optimization-ssrisr)
    - [2.4.3. Sécurité des Données, Chiffrement et Sécurité RLS (Row Level Security)](#243-sécurité-des-données-chiffrement-et-sécurité-rls-row-level-security)
    - [2.4.4. Maintenance, Scalabilité et Architecture par Composants Réutilisables](#244-maintenance-scalabilité-et-architecture-par-composants-réutilisables)
  - [2.5. Étude Comparative et Choix de la Stack Technologique](#25-étude-comparative-et-choix-de-la-stack-technologique)
    - [2.5.1. Framework Front-End / Full-Stack : Next.js (vs React SPA vs Angular)](#251-framework-front-end--full-stack--nextjs-vs-react-spa-vs-angular)
    - [2.5.2. Solution Back-End & Base de Données : Supabase PostgreSQL & `pgvector` (vs Firebase NoSQL vs Node/Express)](#252-solution-back-end--base-de-données--supabase-postgresql--pgvector-vs-firebase-nosql-vs-nodeexpress)
    - [2.5.3. Moteur IA & Services Cloud (OpenAI API, Supabase Embeddings, Vercel Edge `essaouira.tech`)](#253-moteur-ia--services-cloud-openai-api-supabase-embeddings-vercel-edge-essaouiratech)
  - [2.6. Conclusion du Chapitre](#26-conclusion-du-chapitre)
- [**CHAPITRE 3 : ARCHITECTURE LOGICIELLE, MODÉLISATION UML ET SCHÉMA DE BASE DE DONNÉES SQL AVEC EXTENSION IA (SUPABASE)**](#chapitre-3--architecture-logicielle-modélisation-uml-et-schéma-de-base-de-données-sql-avec-extension-ia-supabase)
  - [3.1. Introduction du Chapitre](#31-introduction-du-chapitre)
  - [3.2. Démarche de Conception Orientée Objet et Norme UML 2.5](#32-démarche-de-conception-orientée-objet-et-norme-uml-25)
  - [3.3. Identification et Spécification des Acteurs du Système](#33-identification-et-spécification-des-acteurs-du-système)
  - [3.4. Diagramme de Cas d'Utilisation (Use Case Diagram)](#34-diagramme-de-cas-dutilisation-use-case-diagram)
    - [3.4.1. Diagramme Global des Cas d'Utilisation (Intégrant les modules IA)](#341-diagramme-global-des-cas-dutilisation-intégrant-les-modules-ia)
    - [3.4.2. Description Textuelle Détaillée des Cas d'Utilisation Majeurs](#342-description-textuelle-détaillée-des-cas-dutilisation-majeurs)
  - [3.5. Diagramme de Classes Conceptuel (Class Diagram)](#35-diagramme-de-classes-conceptuel-class-diagram)
  - [3.6. Diagrammes de Séquences Comportementaux (Sequence Diagrams)](#36-diagrammes-de-séquences-comportementaux-sequence-diagrams)
    - [3.6.1. Diagramme de Séquence : Authentification Supabase Auth](#361-diagramme-de-séquence--authentification-supabase-auth)
    - [3.6.2. Diagramme de Séquence : Recherche Vectorielle par IA (`pgvector`)](#362-diagramme-de-séquence--recherche-vectorielle-par-ia-pgvector)
    - [3.6.3. Diagramme de Séquence : Assistant Virtuel Conversationnel "Mogador AI Guide"](#363-diagramme-de-séquence--assistant-virtuel-conversationnel-mogador-ai-guide)
    - [3.6.4. Diagramme de Séquence : Gestion du Panier (Cart Drawer)](#364-diagramme-de-séquence--gestion-du-panier-cart-drawer)
  - [3.7. Modélisation Relationnelle SQL et Architecture Supabase PostgreSQL + `pgvector`](#37-modélisation-relationnelle-sql-et-architecture-supabase-postgresql--pgvector)
    - [3.7.1. Modèle Physique des Données (MPD) avec Embeddings Vectoriels](#371-modèle-physique-des-données-mpd-avec-embeddings-vectoriels)
    - [3.7.2. Définition des Tables SQL (DDL) avec Extension `pgvector`](#372-définition-des-tables-sql-ddl-avec-extension-pgvector)
    - [3.7.3. Politiques de Sécurité RLS (Row Level Security) sous Supabase](#373-politiques-de-sécurité-rls-row-level-security-sous-supabase)
  - [3.8. Architecture Système N-Tiers Next.js / Supabase / OpenAI](#38-architecture-système-n-tiers-nextjs--supabase--openai)
  - [3.9. Conclusion du Chapitre](#39-conclusion-du-chapitre)
- [**CHAPITRE 4 : RÉALISATION TECHNIQUE, IMPLÉMENTATION NEXT.JS, MODULES IA ET PRÉSENTATION DES INTERFACES**](#chapitre-4--réalisation-technique-implémentation-nextjs-modules-ia-et-présentation-des-interfaces)
  - [4.1. Introduction du Chapitre](#41-introduction-du-chapitre)
  - [4.2. Arborescence du Projet Next.js App Router et Structuration des Composants IA](#42-arborescence-du-projet-nextjs-app-router-et-structuration-des-composants-ia)
  - [4.3. Analyse Détaillée et Découpage des Interfaces Utilisateur ("MOGADOR Choice Marketplace")](#43-analyse-détaillée-et-découpage-des-interfaces-utilisateur-mogador-choice-marketplace)
    - [4.3.1. Composant En-tête (Header) et Barre de Navigation (Navbar)](#431-composant-en-tête-header-et-barre-de-navigation-navbar)
    - [4.3.2. Page d'Accueil : Hero Section ("Medina Upgrade - Boost your aesthetic")](#432-page-daccueil--hero-section-medina-upgrade---boost-your-aesthetic)
    - [4.3.3. Module "TODAY'S DEALS" (Bundle Deals & SuperDeals avec Minuteur)](#433-module-todays-deals-bundle-deals--superdeals-avec-minuteur)
    - [4.3.4. Interface "Explore the Workshop Collections" & Panneau de Filtres Latéraux](#434-interface-explore-the-workshop-collections--panneau-de-filtres-latéraux)
    - [4.3.5. Section "MORE TO LOVE" & Grille Dynamique de Produits](#435-section-more-to-love--grille-dynamique-de-produits)
    - [4.3.6. Module d'Authentification (Sign In / Register) via Supabase Auth](#436-module-dauthentification-sign-in--register-via-supabase-auth)
    - [4.3.7. Interface du Panier Réactif (Cart Drawer)](#437-interface-du-panier-réactif-cart-drawer)
    - [4.3.8. Interface de l'Assistant IA "Mogador Guide" et Recherche Visuelle](#438-interface-de-lassistant-ia-mogador-guide-et-recherche-visuelle)
    - [4.3.9. Page de Contact & Carte Google Maps du CIA d'Essaouira](#439-page-de-contact--carte-google-maps-du-cia-dessaouira)
    - [4.3.10. Composant Pied de Page (Footer) Institutionnel](#4310-composant-pied-de-page-footer-institutionnel)
  - [4.4. Code Source : Intégration du SDK Supabase, `pgvector` et Server Actions IA](#44-code-source--intégration-du-sdk-supabase-pgvector-et-server-actions-ia)
  - [4.5. Stratégie de Déploiement sur `essaouira.tech` et Optimisation des Performances](#45-stratégie-de-déploiement-sur-essaouiratech-et-optimisation-des-performances)
  - [4.6. Conclusion du Chapitre](#46-conclusion-du-chapitre)
- [**CONCLUSION GÉNÉRALE ET PERSPECTIVES**](#conclusion-générale-et-perspectives-1)
- [**BIBLIOGRAPHIE ET WEBOGRAPHIE**](#bibliographie-et-webographie-1)

---

<br>

## **LISTE DES FIGURES ET SCHÉMAS**

- **Figure 1.1** : Organigramme Hiérarchique et Fonctionnel de la Direction Provinciale de l'Artisanat d'Essaouira.
- **Figure 1.2** : Vue Architecturale et Ateliers du Complexe Intégré de l'Artisanat (CIA) d'Essaouira.
- **Figure 2.1** : Schéma fonctionnel du Moteur d'Intelligence Artificielle MOGADOR AI Engine.
- **Figure 3.1** : Diagramme de Cas d'Utilisation Global sous la norme UML 2.5 intégrant l'IA.
- **Figure 3.2** : Diagramme de Classes Conceptuel de la plateforme MOGADOR Choice.
- **Figure 3.3** : Diagramme de Séquence du processus d'Authentification Supabase.
- **Figure 3.4** : Diagramme de Séquence de la Recherche Vectorielle par IA (`pgvector`).
- **Figure 3.5** : Diagramme de Séquence de l'Assistant Conversationnel "Mogador AI Guide".
- **Figure 3.6** : Diagramme de Séquence de la gestion réactive du Panier (Cart Drawer).
- **Figure 3.7** : Schéma Relationnel des Données (MPD) de la base de données PostgreSQL Supabase avec extension `pgvector`.
- **Figure 3.8** : Diagramme de l'Architecture Système N-Tiers (Next.js App Router + Supabase Cloud + OpenAI API).
- **Figure 4.1** : Interface En-tête (Header) et Barre de Navigation Supérieure (Navbar).  
  ![MOGADOR Choice Marketplace - Header & Navigation](rappor/img/Screenshot%202026-08-02%20191410.png)
- **Figure 4.2** : Section Hero Banner de la Page d'Accueil ("Medina Upgrade - Boost your aesthetic").  
  ![MOGADOR Choice Marketplace - Hero Banner](rappor/img/Screenshot%202026-08-02%20191410.png)
- **Figure 4.3** : Section "TODAY'S DEALS" avec modules Bundle Deals et SuperDeals.  
  ![MOGADOR Choice Marketplace - Today's Deals](rappor/img/Screenshot%202026-08-02%20191410.png)
- **Figure 4.4** : Interface "Explore the Workshop Collections" avec la barre latérale de filtrage dynamique.  
  ![MOGADOR Choice Marketplace - Collection Filtering](<rappor/img/WhatsApp%20Image%202026-08-02%20at%2019.23.17%20(1).jpeg>)
- **Figure 4.5** : Grille de produits de la section "MORE TO LOVE" avec filtres thématiques.  
  ![MOGADOR Choice Marketplace - More To Love Section](rappor/img/WhatsApp%20Image%202026-08-02%20at%2019.21.35.jpeg)
- **Figure 4.6** : Interface de l'Assistant IA "Mogador AI Guide" et moteur de recherche visuelle.  
  [IMAGE REQUISITION : Capture d'écran de l'interface du Chatbot IA Mogador Guide et du module de recherche par image]
- **Figure 4.7** : Interface du volet latéral du Panier d'Achat (Cart Drawer).  
  [IMAGE REQUISITION : Capture d'écran du volet latéral du Panier d'Achat réactif avec gestion des quantités]
- **Figure 4.8** : Modale et Formulaire de Création de Compte Utilisateur (Register).  
  [IMAGE REQUISITION : Capture d'écran de l'interface d'inscription utilisateur]
- **Figure 4.9** : Page de Contact avec Formulaire et Géolocalisation Google Maps du CIA Essaouira.  
  [IMAGE REQUISITION : Capture d'écran de la page de contact avec carte interactive Google Maps]
- **Figure 4.10** : Console de Gestion Supabase (Table Editor, Vector Index & Politiques RLS).  
  [IMAGE REQUISITION : Capture d'écran du tableau de bord Supabase avec les tables SQL, l'extension pgvector et les politiques RLS]

---

<br>

## **LISTE DES TABLEAUX**

- **Tableau 1.1** : Fiche Technique et Consistance Physique du Complexe Intégré de l'Artisanat (CIA) d'Essaouira.
- **Tableau 2.1** : Analyse comparative des frameworks Web Full-Stack (Next.js vs React SPA vs Angular).
- **Tableau 2.2** : Analyse comparative des solutions Back-End et SGBD (Supabase PostgreSQL + `pgvector` vs Firebase NoSQL vs Node/Express).
- **Tableau 2.3** : Matrice comparative des algorithmes de recherche d'IA (Recherche Vectorielle Cosine vs Recherche Textuelle Full-Text).
- **Tableau 3.1** : Matrice de spécification détaillée des acteurs et privilèges système.
- **Tableau 3.2** : Description formelle du cas d me l'utilisation "Recherche Visuelle Multimodale par IA".
- **Tableau 3.3** : Description formelle du cas d'utilisation "Gérer le panier réactif (Cart Drawer)".
- **Tableau 3.4** : Dictionnaire de données de la table SQL `profiles`.
- **Tableau 3.5** : Dictionnaire de données de la table SQL `products` (incluant la colonne `embedding vector(1536)`).
- **Tableau 3.6** : Dictionnaire de données de la table SQL `categories`.
- **Tableau 3.7** : Dictionnaire de données de la table SQL `cart_items`.
- **Tableau 4.1** : Arborescence des composants React du projet Next.js et modules IA.
- **Tableau 4.2** : Résultats de l'audit de performance Google Lighthouse et déploiement sur `essaouira.tech`.

---

<br>

## **LISTE DES ABRÉVIATIONS ET GLOSSAIRE TECHNIQUE**

- **ESTE** : École Supérieure de Technologie d'Essaouira
- **UCA** : Université Cadi Ayyad
- **SFE** : Stage de Fin d'Études
- **DUT** : Diplôme Universitaire de Technologie
- **GI** : Génie Informatique
- **IA / AI** : Intelligence Artificielle / Artificial Intelligence
- **LLM** : Large Language Model (Modèle de Langage à Grande Échelle)
- **RLS** : Row Level Security (Sécurité au niveau des lignes sous PostgreSQL)
- **BaaS** : Backend-as-a-Service
- **SSR** : Server-Side Rendering (Rendu côté serveur)
- **ISR** : Incremental Static Regeneration
- **SPA** : Single Page Application
- **CIA** : Complexe Intégré de l'Artisanat
- **INDH** : Initiative Nationale pour le Développement Humain
- **PME** : Petites et Moyennes Entreprises
- **UML** : Unified Modeling Language (Langage de Modélisation Unifié)
- **SQL** : Structured Query Language
- **DDL** : Data Definition Language
- **JSON** : JavaScript Object Notation
- **MAD / DH** : Moroccan Dirham (Dirham Marocain)

---

<br>

## **INTRODUCTION GÉNÉRALE**

À l'ère de la quatrième révolution industrielle et du développement fulgurant de l'Intelligence Artificielle (IA), la transformation digitale s'est imposée comme le catalyseur majeur de la modernisation économique et du développement territorial. Les technologies de l'information et de la communication (TIC) réinventent radicalement les modèles de distribution traditionnels, offrant aux organisations, entreprises et coopératives des opportunités inédites de visibilité, de compétitivité et de croissance à l'échelle mondiale. Dans ce paysage en mutation rapide, le commerce électronique (e-commerce) et les plateformes de regroupement commercial de type _Marketplace_ constituent désormais le canal privilégié par les consommateurs, exigeant une réactivité instantanée, un parcours utilisateur fluide, une personnalisation intelligente par l'IA, une transparence tarifaire irréprochable et un niveau de sécurité maximal.

Le secteur de l'artisanat marocain occupe une place éminente au cœur de cette dynamique socio-économique. Vecteur fondamental de l'identité culturelle marocaine et réservoir précieux de savoir-faire ancestraux, l'artisanat représente l'un des piliers majeurs du développement inclusif, employant des centaines de milliers de maîtres artisans, de femmes regroupées en coopératives et de jeunes apprentis. Toutefois, en dépit de la valeur artistique incontestable et de la renommée internationale des créations marocaines, les modes de commercialisation traditionnels révèlent de profondes vulnérabilités structurelles : forte dépendance à l'égard de la saisonnalité du flux touristique physique, présence d'intermédiaires commerciaux spéculatifs réduisant de manière drastique les marges des producteurs, et absence flagrante d'outils numériques modernes permettant la vente directe, l'expérience personnalisée par l'IA et la promotion à l'échelle internationale.

La province d'Essaouira, cité historique et culturelle par excellence, offre une illustration saisissante de cet enjeu. Mondialement célèbre pour son patrimoine d'artisanat d'art – incarné par la marqueterie et l'ébénisterie d'exception sur bois de Thuya, la production certifiée d'huile d'Argan cosmétique et alimentaire, la maroquinerie faite main dans la médina, le tissage de tapis berbères authentiques, la bijouterie traditionnelle en argent et la poterie d'art –, la région abrite un tissu dense de mono-artisans ruraux et de coopératives artisanales. Cependant, l'absence d'une infrastructure e-commerce unifiée et institutionnellement garantie limite l'accès de ces producteurs aux marchés nationaux et internationaux à haute valeur ajoutée.

C'est précisément pour répondre à cet impératif stratégique que s'inscrit notre Stage de Fin d'Études (SFE), préparé par **Youssef EL KADIRI** en vue de l'obtention du Diplôme Universitaire de Technologie (DUT) en **Génie Informatique** à l'École Supérieure de Technologie d'Essaouira (ESTE), sous l'égide de l'Université Cadi Ayyad de Marrakech pour l'année universitaire **2025/2026** (période de stage : **Mai 2026**). Réalisé au sein de la **Direction Provinciale de l'Artisanat d'Essaouira**, notre travail a consisté à concevoir, architecturer et implémenter une plateforme web e-commerce marketplace de nouvelle génération, intitulée **"MOGADOR Choice Marketplace"** et déployée sur le nom de domaine officiel **[`https://essaouira.tech`](https://essaouira.tech)**.

Du point de vue du Génie Informatique, ce projet constitue une réalisation technologique d'envergure. Il s'agit de construire une application Full-Stack robuste, moderne, réactive et sécurisée, enrichie par des modules d'Intelligence Artificielle avancée. L'application repose sur un écosystème logiciel de pointe réunissant le framework **Next.js** (App Router, Server Components et Server Actions), la plateforme Backend-as-a-Service **Supabase** (moteur PostgreSQL avec l'extension de recherche vectorielle `pgvector`, sécurité Row Level Security - RLS, Supabase Auth et Storage) et des modèles d'IA générative et d'embeddings (OpenAI API).

La plateforme offre une palette de fonctionnalités avancées répondant aux standards internationaux du e-commerce et de l'IA :

- Un déploiement haute performance et sécurisé sur le domaine officiel **`essaouira.tech`**.
- Une interface utilisateur au design moderne, réactif et épuré.
- Un **Moteur d'Intelligence Artificielle (MOGADOR AI Suite)** comprenant un moteur de recommandation intelligente par recherche vectorielle, un module de recherche visuelle par image, un assistant conversationnel culturel ("Mogador AI Guide") et un générateur automatique de descriptions multilingues pour les artisans.
- Un moteur de recherche textuel rapide et un panneau de filtrage dynamique multi-critères (par catégorie spécialisée, réglette de prix dynamique 0-5000 DH et critères de tri).
- Des modules de gestion d'offres promotionnelles en temps réel (_Bundle Deals_ avec tarification dégressive et _SuperDeals_ intégrant des minuteurs temporels réactifs).
- Une gestion réactive du panier d'achat via un volet latéral fluide (_Cart Drawer_).
- Un module de contact interactif intégrant la géolocalisation cartographique du Complexe Intégré de l'Artisanat (CIA) d'Essaouira via l'API Google Maps.

Ce rapport retrace de façon approfondie l'ensemble du cycle de vie du projet d'ingénierie logicielle. Il s'articule autour de quatre chapitres majeurs :

1. **Le premier chapitre** pose le contexte général du projet et présente les structures d'accueil : le cadre académique de l'ESTE (filière Génie Informatique) et l'organisme d'accueil – la Direction Provinciale de l'Artisanat d'Essaouira –, en analysant son organigramme (sous la direction de M. BOURAGBA Mustapha), ses services opérationnels, les orientations de la Vision stratégique de l'artisanat ainsi que la fiche technique du Complexe Intégré de l'Artisanat (CIA).
2. **Le deuxième chapitre** est consacré à l'étude préalable, à la spécification chirurgicale des besoins fonctionnels et non-fonctionnels, et aux modules d'Intelligence Artificielle (Recommandation Vectorielle `pgvector`, Recherche Visuelle, Chatbot LLM, AI Copywriting), ainsi qu'à l'étude comparative approfondie ayant dicté nos choix technologiques (**Next.js**, **Supabase PostgreSQL**, **Tailwind CSS**).
3. **Le troisième chapitre** traite de la conception et de la modélisation orientée objet sous le langage **UML 2.5** (diagramme de cas d'utilisation, diagramme de classes, diagrammes de séquences), tout en détaillant le schéma relationnel SQL (DDL) avec l'extension `pgvector` sous Supabase, l'application des politiques de sécurité RLS et l'architecture N-Tiers du système.
4. **Le quatrième chapitre** formalise la phase de réalisation technique et d'implémentation logicielle. Il présente une analyse visuelle et fonctionnelle détaillée des différentes interfaces de la plateforme **MOGADOR Choice Marketplace**, l'arborescence du code source Next.js, les méthodes d'intégration du SDK Supabase et des Server Actions IA, le déploiement sur **`essaouira.tech`**, ainsi que la méthodologie de tests et d'optimisation des performances.

Enfin, une conclusion générale dresse le bilan synthétique des apports académiques, techniques et professionnels de ce travail réalisé par Youssef EL KADIRI et trace les perspectives d'évolution futures de la plateforme.

---

<br>

# **CHAPITRE 1 : CONTEXTE GÉNÉRAL DU PROJET ET ORGANISME D'ACCUEIL**

---

## 1.1. Introduction du Chapitre

Tout projet d'ingénierie informatique de haute valeur ajoutée s'enracine dans la compréhension intime du contexte institutionnel, socio-économique et opérationnel dans lequel il s'insère. L'élaboration d'une solution logicielle ne saurait être réduite à une simple écriture de code ; elle exige une analyse systémique des acteurs concernés, des contraintes du secteur et des objectifs stratégiques de l'organisation utilisatrice.

Ce premier chapitre a pour objectif de fixer le cadre général de notre travail de Stage de Fin d'Études (SFE). Nous y présentons notre établissement universitaire de formation – l'École Supérieure de Technologie d'Essaouira (ESTE) et sa filière Génie Informatique (GI) –, puis nous menons une étude approfondie de l'organisme d'accueil : la Direction Provinciale de l'Artisanat d'Essaouira. Nous détaillons sa structure organisationnelle, son organigramme, ses missions de service public, ses différents services ainsi que la fiche technique du Complexe Intégré de l'Artisanat (CIA). Enfin, nous explicitons la problématique métier qui a motivé la création de la plateforme **MOGADOR Choice Marketplace** (déployée sur **`essaouira.tech`**) et définissons les objectifs informatiques fixés pour le stage de **Mai 2026**.

---

## 1.2. Présentation de l'Établissement Universitaire (ESTE - Département Génie Informatique)

### 1.2.1. Missions de l'ESTE et ancrage dans l'Université Cadi Ayyad

L'**École Supérieure de Technologie d'Essaouira (ESTE)** est un établissement public d'enseignement supérieur technique créé en 2011, composante de la prestigieuse **Université Cadi Ayyad (UCA)** de Marrakech. L'ESTE a été implantée au cœur de la province d'Essaouira afin de dynamiser le tissu socio-économique régional et de former des cadres moyens et techniciens supérieurs capables d'accompagner les grands chantiers de développement du Royaume du Maroc.

L'école se distingue par une pédagogie axée sur l'excellence académique, le développement du savoir-faire pratique, la maîtrise des technologies émergentes (Web Full-Stack, Cloud, Intelligence Artificielle) et une forte ouverture sur l'environnement socio-professionnel.

[IMAGE REQUISITION : Vue panoramique du campus et des bâtiments administratifs de l'École Supérieure de Technologie d'Essaouira (ESTE)]

### 1.2.2. La filière Génie Informatique (GI) : Programme, compétences et objectifs

Le Département **Génie Informatique (GI)** de l'ESTE prépare en deux années d'études intenses au **Diplôme Universitaire de Technologie (DUT)**. La formation est conçue selon une approche par compétences, combinant des cours magistraux, des travaux dirigés, des travaux pratiques intensifs et des projets tutorés.

Le programme pédagogique de la filière Génie Informatique englobe les axes fondamentaux de l'ingénierie logicielle moderne :

- **Ingénierie du Développement Web et Full-Stack :** Apprentissage approfondi de JavaScript ES6+, des frameworks modernes (React, Next.js), des langages HTML5/CSS3, des architectures RESTful API et des concepts Server-Side Rendering (SSR).
- **Intelligence Artificielle & Traitement de Données :** Introduction au Machine Learning, aux algorithmes de recherche vectorielle (`pgvector`), à l'intégration d'API LLM (OpenAI) et à la recommandation intelligente.
- **Conception et Modélisation des Systèmes d'Information :** Maîtrise de la modélisation orientée objet avec le langage UML (Unified Modeling Language), analyse MERISE et ingénierie des exigences.
- **Systèmes de Gestion de Bases de Données (SGBD) :** Conception, optimisation et administration des bases de données relationnelles (SQL, PostgreSQL, MySQL) et NoSQL, écriture de requêtes complexes, procédures stockées et sécurité des données.
- **Architectures Logicielle et Cloud :** Principes de programmation orientée objet (POO), design patterns, intégration de services Backend-as-a-Service (BaaS) tels que Supabase et Firebase, architectures micro-services et N-Tiers.
- **Réseaux et Sécurité Informatique :** Protocoles de communication (HTTP/HTTPS, TCP/IP), sécurité des applications web, mécanismes d'authentification (JWT, OAuth), gestion des rôles et contrôle d'accès.

### 1.2.3. Rôle et importance du Stage de Fin d'Études (SFE - Promotion 2025/2026, Mai 2026)

Le Stage de Fin d'Études (SFE) constitue le couronnement de la formation DUT en Génie Informatique. Effectué par **Youssef EL KADIRI** durant le mois de **Mai 2026** pour l'année universitaire **2025/2026**, cette immersion professionnelle offre à l'étudiant l'opportunité de mettre en pratique l'éventail des compétences techniques et méthodologiques acquises à l'école.

Le SFE exige de l'étudiant qu'il se positionne en véritable concepteur-développeur logiciel : il doit analyser un besoin métier réel, élaborer le cahier des charges, modéliser la solution, faire des choix d'architecture technologique pertinents, coder l'application, intégrer les modules d'IA, déployer sur un nom de domaine réel (`essaouira.tech`), mener les tests de validation et consigner son travail dans un rapport académique rigoureux soutenu devant un jury d'experts.

---

## 1.3. Présentation Approfondie de l'Organisme d'Accueil : La Direction Provinciale de l'Artisanat d'Essaouira

### 1.3.1. Cadre institutionnel, statut juridique et tutelle ministérielle

La **Direction Provinciale de l'Artisanat d'Essaouira** est un service public déconcentré soumis à la tutelle directe du **Ministère du Tourisme, de l'Artisanat et de l’Économie Sociale et Solidaire** (Secrétariat d'État chargé de l'Artisanat et de l'Économie Sociale et Solidaire - Maison de l'Artisan).

En tant qu'administration publique de proximité, elle a pour mission de représenter l'État au niveau de la province d'Essaouira, d'exécuter les politiques publiques sectorielles, d'encadrer les acteurs professionnels de l'artisanat et d'assurer le développement économique et social des coopératives, des entreprises artisanales et des mono-artisans.

[IMAGE REQUISITION : Organigramme institutionnel du Ministère du Tourisme, de l'Artisanat et de l'Économie Sociale et Solidaire du Maroc]

### 1.3.2. Orientations stratégiques nationales (Vision 2015 et Feuille de Route 2030)

L'action de la Direction Provinciale s'inscrit dans le cadre des visions stratégiques nationales impulsées par le Gouvernement du Royaume du Maroc pour la valorisation du secteur de l'artisanat (historiquement la Vision 2015 et aujourd'hui la Feuille de Route stratégique 2030).

Les grands objectifs chiffrés et qualitatifs assignés à la Direction au niveau de la province d'Essaouira s'articulent autour de cinq axes majeurs :

1. **Création d'emplois durables :** Contribution à l'objectif national de création d'emplois par la formalisation du secteur (avec un ciblage local d'au moins 4 000 emplois directs générés ou consolidés dans la province).
2. **Structuration du tissu économique local :** Accompagnement de l'émergence de plus de 600 Petites et Moyennes Entreprises (PME) artisanales et de centaines de coopératives structurées.
3. **Accroissement du chiffre d'affaires et du taux d'échange :** Participation à l'objectif national d'atteindre 24 Milliards de Dirhams de chiffre d'affaires global dans le secteur.
4. **Développement des exportations :** Contribution à l'objectif d'exportation de 7 Milliards de Dirhams de produits artisanaux à haute valeur ajoutée, en mettant un accent particulier sur la marqueterie de bois de Thuya et l'huile d'Argan certifiée.
5. **Inclusion des mono-artisans ruraux :** Soutien socio-économique aux artisans et artisanes travaillant dans les communes rurales enclavées de la province d'Essaouira, en facilitant leur accès aux intrants et aux marchés.

### 1.3.3. Organigramme institutionnel et structure de direction (M. BOURAGBA Mustapha)

La Direction Provinciale de l'Artisanat d'Essaouira est dirigée par Monsieur le Directeur Provincial, **M. BOURAGBA Mustapha**, qui assure la gestion stratégique, l'ordonnancement administratif et la coordination avec les autorités locales, la Chambre d'Artisanat et les partenaires institutionnels.

L'administration s'appuie sur trois cellules opérationnelles principales composées de cadres spécialisés :

```
                                +-----------------------------------+
                                |     M. BOURAGBA Mustapha          |
                                |     DIRECTEUR PROVINCIAL          |
                                +-----------------+-----------------+
                                                  |
         +----------------------------------------+----------------------------------------+
         |                                        |                                        |
+--------+------------------+           +---------+------------------+           +---------+------------------+
|   M. LBASRAOUI Khallaf    |           |   M. GHOULIMI Abdelkader   |           |   M. MERZAGUI Zakaria      |
| Responsable du Service    |           | Responsable du Service     |           | Responsable du Bureau    |
| Étude & Suivi des Projets |           | Associations, Coopératives |           | d'Ordre, Comptabilité    |
|                           |           | & Formation Professionnelle|           | & Exportation            |
+---------------------------+           +----------------------------+           +----------------------------+
```

_Figure 1.1 : Organigramme hiérarchique et fonctionnel de la Direction Provinciale de l'Artisanat d'Essaouira._

### 1.3.4. Description détaillée des services opérationnels de la direction

#### a) Service Étude et Suivi des Projets (Responsable : M. LBASRAOUI Khallaf)

Ce service stratégique est chargé de la planification technique, du contrôle et du suivi de la réalisation des infrastructures artisanales dans la province :

- **Suivi des études de faisabilité :** Analyse technique et financière des projets soumis par les porteurs de projets et les coopératives.
- **Gestion des projets INDH :** Conduite et suivi des Projets Générateurs de Revenus (AGR) financés dans le cadre de l'Initiative Nationale pour le Développement Humain (INDH).
- **Infrastructure de production et de commercialisation :** Supervision du développement des espaces de vente, des complexes artisanaux et des zones d'activités artisanales.
- **Passation des marchés publics :** Rédaction des cahiers des charges (CPS), élaboration des appels d'offres de la direction et suivi de l'exécution des marchés publics.

#### b) Service de Gestion des Associations, Coopératives et Formation Professionnelle (Responsable : M. GHOULIMI Abdelkader)

Ce service constitue l'interface directe d'encadrement social et professionnel des artisans :

- **Accompagnement des coopératives :** Appui à la création, à la structuration juridique et au développement organisationnel des associations et coopératives d'artisanat.
- **Registre National des Artisans (RNA) :** Gestion de l'immatriculation des artisans, de la distribution des cartes professionnelles et du déploiement de la couverture médicale (AMO).
- **Gestion de la formation professionnelle :** Supervision administrative, pédagogique et technique du Centre de Qualification dans les Arts Traditionnels (CQPAT) d'Essaouira, assurant l'apprentissage des métiers traditionnels aux jeunes de la région.

#### c) Bureau d'Ordre et Comptabilité (Responsable : M. MERZAGUI Zakaria)

Ce service gère la chaîne administrative, budgétaire et logistique interne de la direction :

- **Exécution et suivi budgétaire :** Élaboration des budgets de fonctionnement et d'investissement, suivi des engagements et des paiements en collaboration avec la trésorerie payeuse.
- **Gestion du patrimoine et inventaire :** Recensement annuel, gestion et maintenance des biens matériels et immobiliers de la direction.
- **Gestion du courrier et archives :** Centralisation, enregistrement, numérisation et archivage de la correspondance administrative.

#### d) Service d'Exportation et Réglementation des Matières (Bois de Thuya)

Ce service spécifique veille au respect des normes de qualité et à la préservation des ressources naturelles rares de la région :

- **Contrôle de qualité à l'exportation :** Inspection et délivrance des attestations de conformité pour les produits artisanaux destinés aux marchés internationaux.
- **Protection du bois de Thuya (_Tetraclinis articulata_) :** Application stricte de la réglementation interdisant l'exportation du bois de Thuya sous forme de matière première brute, exigeant qu'il soit impérativement transformé en produit artisanal fini à haute valeur ajoutée par les marqueteurs locaux.

### 1.3.5. Fiche Technique et Infrastructure du Complexe Intégré de l'Artisanat (CIA) d'Essaouira

Le Complexe Intégré de l'Artisanat (CIA) d'Essaouira est un joyau architectural et une infrastructure majeure dédiée à la production, à la formation et à l'exposition des arts traditionnels de la province.

```
+---------------------------------------------------------------------------------------------------------+
|                                  COMPLEXE INTÉGRÉ DE L'ARTISANAT (CIA)                                 |
|                                       LOTISSEMENT ARGANA, ESSAOUIRA                                     |
+---------------------------------------------------------------------------------------------------------+
| [24 Ateliers Professionnels]  | [2 Salles d'Exposition Majeures] | [Centre de Formation CQPAT]        |
| - Marqueterie de Thuya        | - Vitrine des Coopératives       | - Salles de Cours & Ateliers École |
| - Bijouterie en Argent        | - Espace Vente Grand Public      | - Métiers du Bois & du Tissage     |
| - Maroquinerie & Tissage      |                                  |                                    |
+-------------------------------+----------------------------------+------------------------------------+
|                      [Siège de la Direction Provinciale & de la Chambre]                                |
+---------------------------------------------------------------------------------------------------------+
```

_Figure 1.2 : Disposition fonctionnelle du Complexe Intégré de l'Artisanat (CIA) d'Essaouira._

Le tableau suivant récapitule les caractéristiques techniques fondamentales du complexe :

| Caractéristique                        | Spécification Détaillée                                                                                                                                                                                                                                                                                                                                          |
| :------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dénomination Officielle**            | Complexe Intégré de l'Artisanat (CIA) d'Essaouira                                                                                                                                                                                                                                                                                                                |
| **Localisation Géographique**          | Lotissement ARGANA, Essaouira, Province d'Essaouira, Région Marrakech-Safi                                                                                                                                                                                                                                                                                       |
| **Superficie Couverte**                | 2 354 m² de bâtiments couverts sur plusieurs niveaux                                                                                                                                                                                                                                                                                                             |
| **Statut Foncier**                     | Bien domanial de l'État                                                                                                                                                                                                                                                                                                                                          |
| **Consistance Physico-Architecturale** | • **24 Ateliers professionnels de production** attribués aux maîtres artisans.<br>• **2 Salles d'exposition majeures** et espaces de vente.<br>• **Centre de Formation Professionnelle dans les Arts Traditionnels (CQPAT)**.<br>• **Siège Administratif** de la Direction Provinciale de l'Artisanat.<br>• **Siège de la Chambre de l'Artisanat** de la région. |
| **Principaux Métiers Représentés**     | Marqueterie et sculpture sur bois de Thuya, Bijouterie et orfèvrerie en argent berbère, Maroquinerie traditionnelle, Tissage de tapis et couvertures, Vannerie & Raphia, Menuiserie d'art, Produits du terroir (Huile d'Argan, Amlou, Miel pur).                                                                                                                 |

---

## 1.4. Étude du Contexte Applicatif et Problématique Opérationnelle

### 1.4.1. Analyse des goulots d'étranglement de la commercialisation traditionnelle

Malgré la richesse incontestable de l'artisanat d'Essaouira et la qualité des infrastructures physiques comme le CIA, la chaîne de valeur commerciale souffre de défaillances structurelles majeures qui freinent l'épanouissement économique des producteurs locaux :

1. **La dépendance exclusive au flux touristique physique :** Les ventes réalisées par les artisans de la médina et du CIA sont quasi exclusivement dépendantes des visites physiques des touristes nationaux et étrangers. Durant les basses saisons touristiques ou lors de crises majeures (telles que la crise sanitaire du COVID-19), l'activité économique s'effondre totalement, plongeant les coopératives dans de graves difficultés financières.
2. **L'intermédiation commerciale prédatrice :** Les mono-artisans ruraux, manquant d'accès direct au marché, sont contraints de céder leurs œuvres à des grossistes ou à des intermédiaires avec des marges dérisoires. L'intermédiaire capte la majorité de la valeur ajoutée au détriment du créateur.
3. **Le déficit d'image et de confiance sur Internet :** Bien que certaines coopératives possèdent des pages informelles sur les réseaux sociaux, ces canaux manquent de crédibilité institutionnelle, n'offrent aucun système de paiement sécurisé, ne permettent pas le filtrage dynamique des catalogues et n'assurent aucune garantie quant à l'origine vérifiée des produits (notamment pour l'huile d'Argan ou le bois de Thuya certifié).

### 1.4.2. Énoncé formel de la problématique logicielle et réponse via `essaouira.tech`

Au vu de ce constat, la Direction Provinciale de l'Artisanat d'Essaouira s'est fixée pour priorité la création d'une vitrine e-commerce institutionnelle de haut niveau. Du point de vue du **Génie Informatique**, la problématique centrale de notre stage s'énonce ainsi :

> _« Comment concevoir, architecturer et implémenter une plateforme web e-commerce multi-vendeurs de type marketplace, enrichie par des modules d'Intelligence Artificielle (recherche vectorielle pgvector, recherche visuelle par image, chatbot LLM culturel), s'appuyant sur des technologies Full-Stack modernes (Next.js, Supabase, PostgreSQL) et déployée sur le domaine **`essaouira.tech`**, afin d'unifier l'ensemble de l'offre artisanale d'Essaouira et d'offrir une expérience utilisateur (UX/UI) réactive et haut de gamme aux acheteurs internationaux ? »_

---

## 1.5. Objectifs Informatiques et Périmètre du Projet (Perspective Youssef EL KADIRI / GI)

Pour répondre à cette problématique de façon méthodique, le projet d'ingénierie logicielle mené par **Youssef EL KADIRI** s'est assigné les objectifs techniques suivants :

1. **Rigueur de la Spécification et de la Modélisation :**
   - Recueillir et formaliser l'ensemble des besoins fonctionnels, non-fonctionnels et IA du système.
   - Modéliser l'architecture conceptuelle et comportementale à l'aide du langage standard **UML 2.5** (Cas d'utilisation, Diagramme de classes, Diagrammes de séquences).
   - Concevoir le schéma relationnel SQL normalisé (3NF) et vectoriel (`pgvector`) sous le moteur **PostgreSQL** de Supabase.

2. **Excellence du Développement Full-Stack (Next.js & React) :**
   - Construire une application web moderne basée sur le framework **Next.js** (App Router).
   - Découper l'interface utilisateur en composants React réutilisables, modulaires et performants.
   - Exploiter le rendu hybride (Server-Side Rendering - SSR et Client-Side Rendering - CSR) pour garantir un référencement naturel (SEO) optimal sur `essaouira.tech`.
   - Intégrer un design system réactif, moderne et élégant avec **Tailwind CSS**.

3. **Intégration d'un Moteur d'Intelligence Artificielle (MOGADOR AI Suite) :**
   - Intégrer la recherche vectorielle sous PostgreSQL via l'extension **`pgvector`** de Supabase et les modèles OpenAI Embeddings (`text-embedding-3-small`).
   - Développer le module de **Recherche Visuelle Multimodale** permettant d'uploader la photo d'un objet artisanal et de trouver les produits similaires.
   - Concocter l'Assistant Virtuel Conversationnel **"Mogador AI Guide"** basé sur les LLM pour guider les clients et raconter l'histoire culturelle de l'artisanat.
   - Implémenter le générateur automatique de descriptions multilingues pour aider les artisans (AI Copywriting).

4. **Intégration d'un Back-End Cloud Robuste (Supabase BaaS) & Déploiement :**
   - Mettre en œuvre l'authentification sécurisée des utilisateurs via **Supabase Auth**.
   - Configurer les politiques de sécurité au niveau des lignes (**Row Level Security - RLS**) sous PostgreSQL.
   - Déployer l'application en production sur le nom de domaine officiel **`https://essaouira.tech`** via le réseau Edge global Vercel.

---

## 1.6. Conclusion du Chapitre

Ce premier chapitre a permis d'établir les fondations institutionnelles, académiques et techniques de notre Stage de Fin d'Études réalisé par Youssef EL KADIRI en Mai 2026. Nous avons présenté l'École Supérieure de Technologie d'Essaouira (ESTE), la filière Génie Informatique, ainsi que la Direction Provinciale de l'Artisanat d'Essaouira et son Complexe Intégré (CIA). Nous avons analysé les enjeux économiques de la numérisation et défini formellement la problématique et les objectifs informatiques de la plateforme **MOGADOR Choice Marketplace** (`essaouira.tech`).

Dans le chapitre suivant, nous aborderons l'étude préalable, la spécification détaillée des besoins fonctionnels et des modules d'Intelligence Artificielle, ainsi que l'étude comparative approfondie ayant guidé le choix de notre stack technologique (**Next.js**, **Supabase PostgreSQL & pgvector**, **Tailwind CSS**, **OpenAI**).

---

<br>

# **CHAPITRE 2 : ÉTUDE PRÉALABLE, SPÉCIFICATION DES BESOINS ET MODULES D'INTELLIGENCE ARTIFICIELLE**

---

## 2.1. Introduction du Chapitre

Dans le cycle de vie d'un projet d'ingénierie logicielle, la phase d'étude préalable et de spécification des besoins constitue une étape décisionnelle charnière. Elle fait le pont entre la compréhension des exigences métiers formulées par les utilisateurs finaux (l'organisme d'accueil, les coopératives et les acheteurs) et l'élaboration de la réponse technique et architecturale par l'équipe de développement.

Une spécification incomplète ou imprécise conduit inévitablement à des erreurs de conception, des surcoûts d'implémentation et une insatisfaction des usagers. À l'inverse, une analyse méthodique et rigoureuse permet de formaliser avec précision l'ensemble des cas d'usage, y compris les fonctionnalités innovantes d'Intelligence Artificielle, de garantir la cohérence des flux de données et d'opérer des choix technologiques pertinents et pérennes.

Ce deuxième chapitre est consacré à l'étude approfondie des besoins de la plateforme **MOGADOR Choice Marketplace** (`essaouira.tech`). Nous y présentons tout d'abord une analyse comparative des systèmes d'information et canaux de distribution existants. Nous détaillons ensuite la spécification exhaustive des besoins fonctionnels (gestion de l'identité, moteur de recherche textuel, filtres dynamiques, modules promotionnels, panier réactif, contact Google Maps) et la caractérisation des **quatre modules d'Intelligence Artificielle (MOGADOR AI Suite)**. Enfin, nous formalisons les besoins non-fonctionnels et menons une étude comparative rigoureuse justifiant le choix de notre stack technologique Full-Stack moderne : **Next.js** et **Supabase PostgreSQL & pgvector**.

---

## 2.2. Analyse Comparative des Systèmes d'Information Existants

Afin de concevoir une plateforme e-commerce véritablement novatrice et adaptée au contexte artisanal de la province d'Essaouira, nous avons mené une étude comparative des canaux de distribution et solutions numériques actuellement employés dans le secteur :

```
+---------------------------------------------------------------------------------------------------------+
|                               ANALYSE COMPARATIVE DES CANAUX EXISTANTS                                 |
+---------------------------------------------------------------------------------------------------------+
| Canal / Solution       | Limites Techniques & Opérationnelles      | Apport de MOGADOR Choice Marketplace|
+------------------------+-------------------------------------------+------------------------------------+
| Vente Physique         | • Dépendance au flux touristique local    | • Vitrine numérique mondiale 24/7   |
| (Boutiques & Médina)   | • Absence de traçabilité des acheteurs    | • Accès direct sur essaouira.tech  |
|                        | • Zone géographique limitée à Essaouira   | • Paiement et réservation en ligne |
+------------------------+-------------------------------------------+------------------------------------+
| Réseaux Sociaux        | • Manque d'intégration e-commerce native  | • Catalogue dynamique structuré    |
| (Instagram, Facebook)  | • Absence de paiement sécurisé            | • Moteur de recherche & IA Vector  |
|                        | • Pas de gestion temps réel des stocks    | • Crédibilité institutionnelle     |
+------------------------+-------------------------------------------+------------------------------------+
| Sites Web Statiques    | • Rechargements de pages lents et rigides | • Architecture SPA avec Next.js    |
| (Catalogues PDF/HTML)  | • Moteurs de recherche inexistants        | • Rendu hybride SSR / CSR rapide   |
|                        | • Pas de panier réactif ni IA intelligente| • Base SQL + Recherche visuelle IA |
+---------------------------------------------------------------------------------------------------------+
```

L'analyse de ce tableau comparatif met en évidence la supériorité d'une solution de marketplace unifiée et intelligente. Les canaux traditionnels manquent d'interactivité et de personnalisation, tandis que **MOGADOR Choice Marketplace** sur **`essaouira.tech`** combine la puissance d'un moteur relationnel SQL, la réactivité des composants React et l'intelligence de la recherche vectorielle et des assistants LLM.

---

## 2.3. Spécification Détaillée des Besoins Fonctionnels

Les besoins fonctionnels expriment l'ensemble des services, actions et comportements dynamiques que la plateforme doit fournir à ses utilisateurs. Pour garantir une clarté maximale, ces exigences ont été découpées par modules fonctionnels.

### 2.3.1. Gestion de l'Identité, Authentification et Profils Utilisateurs (Supabase Auth)

La gestion de l'identité des utilisateurs constitue le premier pilier de sécurité de la plateforme. Le module d'authentification s'appuie sur le service **Supabase Auth**, offrant un système de jetons sécurisés (JWT) et de gestion de sessions :

- **Formulaire de Création de Compte (Register) :**
  - Permettre à tout nouveau visiteur de s'inscrire en renseignant un formulaire épuré :
    - _Full Name_ (Nom complet de l'utilisateur).
    - _Enter your Email_ (Adresse électronique valide servant d'identifiant unique).
    - _Password_ (Mot de passe chiffré).
    - _Phone Number_ (Numéro de téléphone pour le suivi des livraisons).
  - Validation automatique du format des données côté client et serveur via Next.js Server Actions.
  - Déclenchement de la création automatique d'un profil correspondant dans la table SQL `profiles` de PostgreSQL Supabase via des triggers de base de données.

[IMAGE REQUISITION : Capture d'écran détaillée du composant et de la modale de Création de Compte (Register) avec validation des champs]

- **Formulaire de Connexion (Sign In / Login) :**
  - Authentification sécurisée par couple E-mail / Mot de passe.
  - Notification dynamique et instantanée de confirmation de connexion (ex: _"User login successfully"_).
  - Gestion automatique des cookies de session chiffrés sous Next.js (middleware de sécurité).
  - Possibilité de déconnexion sécurisée (_Logout_) détruisant le jeton JWT.

[IMAGE REQUISITION : Capture d'écran du formulaire de Connexion (Sign In) affichant le message de notification de succès]

- **Gestion des Rôles Utilisateurs :**
  - **Client / Acheteur :** Accès à la gestion du panier, à la liste des favoris, au suivi des commandes, au Chatbot IA et au profil personnel.
  - **Artisan / Coopérative :** Accès à l'outil de génération de descriptions par IA et à la gestion de boutique.
  - **Administrateur (Direction) :** Supervision globale de la plateforme, gestion des catégories et modération.

---

### 2.3.2. Moteur de Recherche et Exploration du Catalogue ("Explore Workshop Collections")

Le catalogue est le cœur marchand de la plateforme. Il doit permettre à l'utilisateur d'accéder sans effort aux trésors de l'artisanat d'Essaouira.

![MOGADOR Choice Marketplace - Header & Moteur de Recherche](rappor/img/Screenshot%202026-08-02%20191410.png)
_Figure 2.1 : Vue de l'En-tête (Header) intégrant le moteur de recherche textuel et la navigation par catégories sur essaouira.tech._

- **Barre de Recherche Textuelle Globale (Search Engine) :**
  - Positionnée au centre du Header pour une accessibilité permanente.
  - Invite de recherche explicite : _"Search premium crafts, Thuya, Argan, Boutiques..."_.
  - Exécution de requêtes full-text search optimisées sur la base PostgreSQL Supabase, interrogeant simultanément les noms de produits, descriptions et mots-clés de matières premières.
- **Explorateur de Catégories Spécialisées :**
  - Bouton menu déroulant _"All Categories"_.
  - Barre de navigation rapide donnant accès direct aux familles de produits :
    - **Artisanal Wood :** Objets d'art, boîtes et marqueterie en bois de Thuya certifié.
    - **Cosmetics & Oils :** Elixirs d'huile d'Argan pure (cosmétique et gastronomique), Amlou, soins naturels.
    - **Moroccan Rugs :** Tapis berbères tissés à la main par les coopératives féminines.
    - **Leather Goods :** Maroquinerie de la médina (sacs, babouches, poufs en cuir).
    - **Pottery & Ceramic :** Céramiques et poteries traditionnelles.
    - **Surf Gear & Water Sports :** Équipements de surf et réservations de cours (spécificité d'Essaouira, capitale du vent et des sports nautiques).

---

### 2.3.3. Système de Filtrage Dynamique Multi-Critères et Tri Temps Réel

L'interface d'exploration **"Explore the Workshop Collections"** met à disposition des utilisateurs un panneau de filtrage latéral d'une grande précision.

![MOGADOR Choice Marketplace - Interface de Filtrage](<rappor/img/WhatsApp%20Image%202026-08-02%20at%2019.23.17%20(1).jpeg>)
_Figure 2.2 : Interface "Explore the Workshop Collections" montrant la barre latérale de filtres dynamiques et les résultats correspondants._

- **Composants du Panneau Latéral de Filtres (FilterSidebar) :**
  1. **Keyword Query :** Champ de recherche textuel secondaire pour affiner la recherche au sein d'une sous-sélection.
  2. **Specialty Category Buttons :** Série de boutons interactifs (_Artisanal Wood_, _Cosmetics & Oils_, _Surf Gear_, _Leather Goods_, _Moroccan Rugs_, _Pottery & Ceramic_). Un clic sur un bouton applique instantanément le filtre sans aucun rechargement de la page grâce aux états React.
  3. **Max Price Limit Slider :** Réglette dynamique interactive permettant de définir le budget maximal de l'acheteur (échelle de 0 DH à 5 000 DH). Le déplacement du curseur met à jour la liste des produits affichés en temps réel.
  4. **Sort Options :** Menu déroulant de tri permettant de réorganiser les produits selon des critères précis : _Newest Additions_ (Nouveautés), _Price: Low to High_ (Prix croissant), _Price: High to Low_ (Prix décroissant).
  5. **Indicateur Dynamique de Correspondances :** Compteur affichant en permanence le nombre de produits répondant aux critères sélectionnés (ex: _"3 MATCHES FOUND"_).

---

### 2.3.4. Gestionnaire de Tarification et Modules Promotionnels (Bundle Deals, SuperDeals avec Minuteur)

Pour dynamiser les ventes et proposer des prix attractifs, la plateforme intègre un moteur de promotions élaboré.

![MOGADOR Choice Marketplace - Promotions et Offres](rappor/img/Screenshot%202026-08-02%20191410.png)
_Figure 2.3 : Section "TODAY'S DEALS" intégrant les modules Bundle Deals et SuperDeals avec compteurs temporels._

- **Module "Bundle deals" (Offres Groupées) :**
  - Section incitant aux achats multiples avec une tarification dégressive appliquée automatiquement (ex: _"3+ FROM 29.00 DH"_).
  - Présentation sous forme de cartes d'articles sélectionnés avec calcul du gain acheteur.
- **Module "SuperDeals" avec Minuteur Temporel Réactif :**
  - Ventes flash à durée limitée affichant un compteur à rebours réactif créé en composant React Client (`useState` / `useEffect`).
  - Affichage dynamique du temps restant (ex: _"Ends in: 09:50:05"_).
- **Badges Promotionnels et Visuels d'Incitation :**
  - Badges visuels à fort impact applicables sur les cartes produits : _"WELCOME DEAL"_, _"FREE SHIPPING"_, _"CHOICE"_, _"New shoppers save MAD X"_, _"Best price in similar deals"_.

---

### 2.3.5. Gestion Réactive du Panier d'Achat (Cart Drawer)

La gestion du panier repose sur une expérience utilisateur fluide évitant les redirections de pages superflues.

[IMAGE REQUISITION : Capture d'écran haute définition du volet latéral du Panier d'Achat réactif (Cart Drawer) ouvert, montrant les articles, ajustements de quantités et le prix total en MAD]

- **Fonctionnalités du Volet Latéral (Cart Drawer) :**
  - **Ouverture fluide :** Le volet glisse depuis le côté droit de l'écran lors d'un clic sur l'icône du panier ou sur un bouton _"Add To Cart"_.
  - **Affichage des lignes de commande :** Chaque article affiche une miniature visuelle, son nom, son prix unitaire en MAD et la quantité sélectionnée.
  - **Ajustement interactif des quantités :** Boutons réactifs `+` et `-` permettant d'incrémenter ou de décrémenter le nombre d'unités par article avec recalcul instantané du sous-total.
  - **Suppression d'articles :** Bouton _"remove"_ stylisé pour retirer immédiatement un article du panier.
  - **Calculateur de Total Général :** Sommation automatique du montant global de la commande mise à jour dans le State React local et sauvegardée sous Supabase.

---

### 2.3.6. Sections Spécialisées "MORE TO LOVE" & Grilles de Produits Thématiques

Pour favoriser la découverte fortuite d'articles d'exception, la section **"MORE TO LOVE"** propose une exploration guidée par onglets.

![MOGADOR Choice Marketplace - Section More To Love](rappor/img/WhatsApp%20Image%202026-08-02%20at%2019.21.35.jpeg)
_Figure 2.4 : Section "MORE TO LOVE" avec onglets de catégories thématiques et grille de cartes produits._

- **Onglets de filtrage par thématiques d'artisanat :**
  - Navigation par boutons d'onglets : _ALL_, _RUGS & TAPESTRIES_, _WOOD CARVINGS_, _OILS & COSMETICS_, _EXCURSIONS & GUIDED TOURS_, _SURF & WATER SPORTS LESSONS_, _CULINARY ARTS & SPICES_.
- **Anatomie d'une Carte Produit (Product Card) :**
  - Photographie haute définition de l'objet artisanal.
  - Titre de l'article (ex: _Manteau 3 pièces avec broderie traditionnelle_, _Sandales en cuir faites main_).
  - Évaluation par étoiles et note moyenne (ex: _4.5 / 5_).
  - Volume de ventes réalisées (ex: _1,200+ sold_ ou _15,000+ sold_).
  - Prix clair affiché en Dirhams Marocains (_MAD 444_, _MAD 550_, _MAD 249_).
  - Boutons d'action rapide : Icône de cœur pour la mise en favoris et icône de caddie pour l'ajout direct au panier.

---

### 2.3.7. Module de Contact et Géolocalisation Interactive Google Maps

Pour rassurer les acheteurs et faciliter les échanges avec l'administration, une page de contact dédiée est intégrée.

[IMAGE REQUISITION : Capture d'écran de la page de Contact montrant le formulaire de message et l'intégration de la carte Google Maps géolocalisant le Complexe Intégré de l'Artisanat (CIA)]

- **Formulaire de Contact (Partie Gauche) :**
  - Permet aux visiteurs d'envoyer une demande d'information ou de devis personnalisé.
  - Champs requis : _Name_ (Nom), _E-mail_ (Adresse e-mail), _Subject_ (Sujet du message), _Message_ (Contenu du message).
  - Bouton d'envoi _"Send"_ enregistrant la demande dans la table Supabase `contact_messages`.
- **Carte Interactive Google Maps (Partie Droite) :**
  - Intégration géolocalisée de l'emplacement physique du Complexe Intégré de l'Artisanat (CIA) d'Essaouira, Lotissement ARGANA.
  - Affichage des informations institutionnelles : Note officielle Google (4.8 étoiles basées sur 13 avis), adresse exacte et raccourcis pour le calcul d'itinéraires.

---

### 2.3.8. Module Avancé d'Intelligence Artificielle (MOGADOR AI Suite)

Afin d'ériger **MOGADOR Choice Marketplace** au niveau des plateformes e-commerce les plus innovantes au monde, **Youssef EL KADIRI** a conçu et implémenté quatre fonctionnalités majeures basées sur l'Intelligence Artificielle :

#### a) Moteur de Recommandation Intelligente par Recherche Vectorielle (`pgvector`)

- **Principe Technique :** Utilisation de l'extension PostgreSQL **`pgvector`** intégrée sous Supabase. Chaque produit artisanal est représenté sous forme d'un vecteur d'embeddings multidimensionnel (1536 dimensions générées via l'API OpenAI `text-embedding-3-small`).
- **Fonctionnalité Acheteur :** Lorsqu'un client consulte un produit (ex: une boîte à bijoux en marqueterie de bois de Thuya), le moteur calcule la distance cosinus entre le vecteur du produit courant et les autres produits du catalogue pour afficher instantanément les articles les plus pertinents sémantiquement (_"Produits similaires recommandés par l'IA"_).

#### b) Recherche Visuelle Multimodale par l'Image (AI Visual Search)

- **Principe Technique :** Exploitation d'un modèle d'IA vision multimodale.
- **Fonctionnalité Acheteur :** L'acheteur peut uploader une photo prise dans une boutique ou trouvée sur Internet (ex: le motif d'un tapis berbère ou un collier en argent). Le composant React extrait l'empreinte visuelle et interroge la base de données Supabase pour identifier et afficher les produits artisanaux correspondants vendus sur **`essaouira.tech`**.

#### c) Assistant Virtuel Conversationnel "Mogador AI Guide" (LLM Cultural Agent)

- **Principe Technique :** Agent conversationnel basé sur un LLM (Large Language Model) configuré avec un prompt système ancré dans le patrimoine artisanal d'Essaouira (RAG - Retrieval-Augmented Generation).
- **Fonctionnalité Acheteur :** Un widget de chat flottant permet aux acheteurs internationaux de poser des questions en langage naturel (_"Comment reconnaître la vraie huile d'Argan d'Essaouira ?"_, _"Quelle est l'histoire du bois de Thuya ?"_). L'assistant répond instantanément en plusieurs langues et suggère les liens directs vers les produits du catalogue.

#### d) Générateur Automatique de Contenu Multilingue pour Artisans (AI Copywriting)

- **Principe Technique :** Module d'IA générative accessible dans le back-office artisan.
- **Fonctionnalité Artisan :** Le maître artisan fournit simplement quelques mots-clés simples (ex: _Coffret Thuya, sculpté main, motifs nacrés_). L'IA génère automatiquement un titre attractif, une description poétique et technique détaillée, ainsi que les balises SEO en Français, Anglais et Arabe.

---

## 2.4. Spécification Avancée des Besoins Non-Fonctionnels

Les besoins non-fonctionnels définissent les contraintes de qualité, de performance, de sécurité et d'architecture auxquelles l'application doit impérativement se conformer.

### 2.4.1. Ergonomie, UI/UX Design System et Responsive Web Design

- **Design System & Palette de Couleurs :**
  - Définition d'une charte graphique sobre, chaleureuse et élégante rappelant l'univers artisanal d'Essaouira :
    - _Fond principal :_ Beige sable et blanc cassé clair pour un confort visuel optimal (`#F9F8F3`).
    - _Couleur d'accentuation :_ Teintes bois de Thuya, marron chaud (`#8B4513`) et or.
    - _Éléments d'action (CTA) :_ Boutons noirs profonds ou jaunes vifs pour maximiser le taux de conversion.
- **Responsive Web Design (Multi-Écrans) :**
  - L'application doit s'adapter automatiquement aux caractéristiques physiques des différents terminaux (Desktop 1920x1080, Laptops 1366x768, Tablettes 768x1024, Smartphones 375x812).
  - Recomposition dynamique des cartes produits et des volets latéraux sur petits écrans.

### 2.4.2. Performance Technique, Temps de Réponse et Optimization SSR/ISR

- **Temps de chargement initial sur `essaouira.tech` :** Affichage du premier contenu visible (First Contentful Paint - FCP) sous la barre des 1.2 secondes.
- **Optimisation du Rendu Next.js (SSR / ISR) :**
  - Exploitation du rendu côté serveur (Server-Side Rendering - SSR) pour les pages de catalogue afin d'assurer un indexage parfait par les moteurs de recherche (SEO).
  - Utilisation de l'Incremental Static Regeneration (ISR) pour régénérer périodiquement les fiches produits sans surcharger le serveur.
- **Optimisation des Images (Next/Image) :**
  - Compression et conversion automatique des photographies de produits au format moderne WebP/AVIF.
  - Chargement différé (_Lazy Loading_) pour éviter les blocages de rendu.

### 2.4.3. Sécurité des Données, Chiffrement et Sécurité RLS (Row Level Security)

- **Sécurité des Communications :** Toutes les liaisons entre le client web Next.js et la plateforme Supabase sont chiffrées via le protocole SSL/TLS (HTTPS).
- **Authentification et Jetons JWT :** Utilisation de jetons chiffrés RFC 7519 pour valider l'identité de l'utilisateur à chaque requête API.
- **Row Level Security (RLS) sous PostgreSQL :**
  - Implémentation de règles de sécurité strictes au niveau des lignes de la base de données Supabase.
  - Exemple : Un utilisateur ne peut lire ou modifier que son propre panier d'achat (`auth.uid() = cart.user_id`), garantissant une étanchéité absolue des données entre clients.

### 2.4.4. Maintenance, Scalabilité et Architecture par Composants Réutilisables

- **Architecture Modulaire Next.js :** Découpage strict du code source en composants atomiques React réutilisables.
- **Typage et Qualité du Code :** Respect des conventions de nommage et modularité du code pour faciliter les évolutions futures.

---

## 2.5. Étude Comparative et Choix de la Stack Technologique

Le choix de l'écosystème technologique constitue une décision fondamentale en ingénierie logicielle. Il conditionne la vitesse de développement, la maintenabilité du code, la sécurité et la capacité de l'application à monter en charge.

### 2.5.1. Framework Front-End / Full-Stack : Next.js (vs React SPA vs Angular)

Pour concevoir la couche de présentation et d'interaction de **MOGADOR Choice Marketplace**, nous avons comparé trois solutions majeures du marché :

| Critère d'Évaluation            | React SPA (Client-Only)     | Angular (Google)   | **Next.js App Router (Choisi)**            |
| :------------------------------ | :-------------------------- | :----------------- | :----------------------------------------- |
| **Mode de Rendu**               | Client-Side Rendering (CSR) | CSR / SSR complexe | **SSR, SSG, ISR & CSR Hybride**            |
| **Référencement (SEO)**         | Moyen (Nécessite pré-rendu) | Moyen              | **Excellence Native sur `essaouira.tech`** |
| **Architecture**                | Bibliothèque UI             | Framework lourd    | **Framework Full-Stack React**             |
| **Server Components & Actions** | Non                         | Non                | **Oui (Exclusivité Next.js 13/14)**        |
| **Optimisation des Images**     | Manuelle                    | Manuelle           | **Composant `next/image` Natif**           |
| **Temps de Chargement Initial** | Moyen                       | Moyen à Lourd      | **Ultra-Rapide (Code Splitting)**          |

_Tableau 2.1 : Matrice comparative des frameworks Front-End / Full-Stack._

**Justification du choix de Next.js :**  
Next.js s'impose comme la solution la plus élaborée pour un projet e-commerce d'envergure. Contrairement à une simple application React SPA qui effectue tout son rendu dans le navigateur de l'utilisateur, Next.js génère le HTML côté serveur (SSR), garantissant un temps d'affichage initial exceptionnel et un indexage parfait du catalogue de l'artisanat par Google sur **`essaouira.tech`**.

---

### 2.5.2. Solution Back-End & Base de Données : Supabase PostgreSQL & `pgvector` (vs Firebase NoSQL vs Node/Express custom)

Pour la couche de données, d'authentification, de recherche vectorielle IA et de stockage media, nous avons procédé à une analyse comparative :

| Critère d'Évaluation             | Node.js + Express + MongoDB      | Google Firebase         | **Supabase Cloud + `pgvector` (Choisi)**                       |
| :------------------------------- | :------------------------------- | :---------------------- | :------------------------------------------------------------- |
| **Paradigme de Données**         | NoSQL orienté documents          | NoSQL JSON Store        | **Relationnel SQL + Recherche Vectorielle (PostgreSQL Natif)** |
| **Support de l'IA (Embeddings)** | Nécessite DB Vectorielle externe | Très complexe           | **Natif via extension `pgvector` sous PostgreSQL**             |
| **Intégrité des Données**        | Faible (Contrôle applicatif)     | Faible                  | **Absolue (Clés Étrangères, CONTRAINTES)**                     |
| **Requêtes & Joins**             | Complexes                        | Impossibles             | **Puissance SQL (JOINS, Aggregations, Cosine Distance)**       |
| **Sécurité des Données**         | Middleware manuel                | Firebase Security Rules | **Row Level Security (RLS) PostgreSQL**                        |
| **Vitesse de Déploiement**       | Lente (Développement manuel)     | Rapide (BaaS)           | **Extrêmement Rapide (BaaS SQL & IA)**                         |

_Tableau 2.2 : Matrice comparative des solutions Back-End et de Bases de Données._

---

### 2.5.3. Moteur IA & Services Cloud (OpenAI API, Supabase Embeddings, Vercel Edge `essaouira.tech`)

- **API OpenAI :** Modèles `text-embedding-3-small` pour la génération des vecteur 1536-D et `gpt-4o-mini` pour le Chatbot "Mogador AI Guide" et le Copywriting.
- **Hébergement et Déploiement Edge :** Plateforme **Vercel** connectée au nom de domaine officiel **`https://essaouira.tech`** assurant un déploiement continu (CI/CD) automatisé.

---

## 2.6. Conclusion du Chapitre

Ce deuxième chapitre a permis d'établir une spécification chirurgicale des exigences de la plateforme **MOGADOR Choice Marketplace** (`essaouira.tech`). Nous avons formalisé l'ensemble des cas d'usage fonctionnels, les exigences non-fonctionnelles de performance et de sécurité, ainsi que l'architecture des **quatre modules d'Intelligence Artificielle**.

Le chapitre suivant sera consacré à la conception détaillée et à la modélisation orientée objet sous le langage **UML 2.5**, ainsi qu'à l'élaboration du schéma relationnel SQL et vectoriel (`pgvector`) de la base de données PostgreSQL.

---

<br>

# **CHAPITRE 3 : ARCHITECTURE LOGICIELLE, MODÉLISATION UML ET SCHÉMA DE BASE DE DONNÉES SQL AVEC EXTENSION IA (SUPABASE)**

---

## 3.1. Introduction du Chapitre

Dans le cadre du génie informatique et du développement d'applications d'entreprise enrichies par l'Intelligence Artificielle, la phase de conception théorique et d'architecture logicielle constitue le véritable garant de la pérennité, de la robustesse et de la sécurité du système d'information. Produire du code source sans modélisation préalable équivaut à construire un ouvrage d'art sans plan d'architecte.

Pour la plateforme **MOGADOR Choice Marketplace**, dont l'ambition est d'unifier l'ensemble de l'offre artisanale d'Essaouira sur **`essaouira.tech`**, la rigueur de conception est une exigence absolue. Notre système doit gérer des flux d'informations complexes : authentification sécurisée, filtrage dynamique en temps réel, recherche vectorielle IA par similarité cosinus (`pgvector`), assistant conversationnel LLM, persistance réactive du panier d'achat et isolation stricte des données sous contraintes RLS.

Ce troisième chapitre est entièrement dédié à la modélisation formelle et à l'architecture logicielle de la plateforme. Nous y adoptons la démarche de conception orientée objet basée sur la norme **UML 2.5**. Nous présentons la caractérisation des acteurs du système, le diagramme global et les spécifications textuelles des cas d'utilisation (incluant les fonctionnalités IA), le diagramme de classes conceptuel ainsi que les diagrammes de séquences comportementaux. Par la suite, nous exposons le modèle relationnel physique (MPD) et fournissons le code SQL complet (DDL) de la base de données **PostgreSQL Supabase** incluant l'extension **`pgvector`**, enrichi par la mise en œuvre des politiques de sécurité **Row Level Security (RLS)**. Enfin, nous théorisons l'architecture N-Tiers distribuée.

---

## 3.2. Démarche de Conception Orientée Objet et Norme UML 2.5

La conception de la plateforme **MOGADOR Choice Marketplace** s'appuie sur le paradigme orienté objet et la norme **UML 2.5**, reconnue comme le standard international d'ingénierie logicielle par l'Object Management Group (OMG).

```
+---------------------------------------------------------------------------------------------------------+
|                              DÉMARCHE DE CONCEPTION UML 2.5 & SQL + IA                                  |
+---------------------------------------------------------------------------------------------------------+
|                                    [ANALYSE DES EXIGENCES MÉTIERS & IA]                                 |
|                                                  |                                                      |
|                                                  v                                                      |
|                                  [DIAGRAMME DE CAS D'UTILISATION]                                       |
|                                 (Périmètre Fonctionnel, Acteurs & IA)                                   |
|                                                  |                                                      |
|                         +------------------------+------------------------+                             |
|                         |                                                 |                             |
|                         v                                                 v                             |
|             [DIAGRAMME DE CLASSES]                            [DIAGRAMMES DE SÉQUENCES]                 |
|       (Entités Métiers, Vectors & Relations)            (Séquences SQL & Appels API IA)                 |
|                         |                                                 |                             |
|                         +------------------------+------------------------+                             |
|                                                  |                                                      |
|                                                  v                                                      |
|                         [SCHÉMA RELATIONNEL SQL POSTGRESQL + PGVECTOR]                                  |
|                         (Tables, Clés, Vectors 1536-D, Contraintes DDL & RLS)                           |
+---------------------------------------------------------------------------------------------------------+
```

---

## 3.3. Identification et Spécification des Acteurs du Système

Nous avons identifié quatre acteurs majeurs au sein de l'écosystème **MOGADOR Choice Marketplace** :

1. **Visiteur Non-Authentifié (Guest Client) :** Explore le catalogue sur `essaouira.tech`, applique les filtres de catégories et réglette de prix (0-5000 DH), interroge l'Assistant IA "Mogador Guide", utilise la recherche visuelle par image et gère un panier temporaire.
2. **Client Authentifié / Acheteur (Registered Client) :** Compte Supabase Auth, panier persistant sous PostgreSQL, gestion des favoris (_Wishlist_), historique de commandes.
3. **Artisan / Coopérative (Artisan Merchant) :** Gestion de boutique, utilisation du générateur de descriptions multilingues par IA (_AI Copywriting_).
4. **Administrateur Système / Direction Provinciale (System Admin) :** Supervision globale, validation des coopératives et gestion des paramètres RLS.

---

## 3.4. Diagramme de Cas d'Utilisation (Use Case Diagram)

### 3.4.1. Diagramme Global des Cas d'Utilisation (Intégrant les modules IA)

```
                                  ===================================================================
                                            MOGADOR CHOICE MARKETPLACE SYSTEM (essaouira.tech)
                                  ===================================================================

                                    +---------------------------------------------------------------+
                                    | [MODULE AUTHENTIFICATION & SESSIONS]                          |
                                    |  ( UC01: S'inscrire / Créer un compte via Supabase Auth )     |
                                    |  ( UC02: Se connecter avec Email/Password & Token JWT )       |
                                    +---------------------------------------------------------------+
                                                                    ^
                                                                    | <<include>>
                                    +-------------------------------+-------------------------------+
                                    | [MODULE RECHERCHE & EXPLORATION CATALOGUE]                    |
                                    |  ( UC03: Exécuter une recherche textuelle globale )           |
                                    |  ( UC04: Filtrer par catégorie spécialisée & Prix Max )       |
                                    |  ( UC05: Trier le catalogue par Nouveauté / Prix )           |
  +--------------------------+      +---------------------------------------------------------------+
  |                          |      | [MODULE INTELLIGENCE ARTIFICIELLE - MOGADOR AI SUITE]         |
  |     VISITEUR (GUEST)     |----->|  ( UC06: Obtenir des recommandations par IA - pgvector )     |
  |                          |      |  ( UC07: Effectuer une recherche visuelle par Image )         |
  |                          |----->|  ( UC08: Discuter avec l'Assistant IA "Mogador Guide" )       |
  +--------------------------+      +---------------------------------------------------------------+
               |                    | [MODULE PANIER & CONTACT]                                     |
               |                    |  ( UC09: Ajouter au panier et gérer le Cart Drawer )          |
               v                    |  ( UC10: Envoyer un message & voir la carte Google Maps )     |
  +--------------------------+----->+---------------------------------------------------------------+
  |    CLIENT AUTHENTIFIÉ    |      | [MODULE ARTISAN & IA GENERATIVE]                              |
  |  (Youssef EL KADIRI / GI)|----->|  ( UC11: Générer des descriptions multilingues par IA )       |
  +--------------------------+      +---------------------------------------------------------------+
```

_Figure 3.1 : Diagramme de Cas d'Utilisation Global sous la norme UML 2.5 intégrant l'IA._

---

## 3.5. Diagramme de Classes Conceptuel (Class Diagram)

```
+--------------------------------------------------+          +--------------------------------------------------+
|                     Profile                      |          |                     Product                      |
+--------------------------------------------------+          +--------------------------------------------------+
| - id: UUID [PK]                                  |          | - id: UUID [PK]                                  |
| - full_name: String                              |          | - name: String                                   |
| - email: String                                  |          | - description: Text                              |
| - phone: String                                  | 1      * | - price: Numeric                                 |
| - role: String                                   |----------| - category_id: UUID [FK]                         |
| - created_at: Timestamp                          |          | - image_url: String                              |
+--------------------------------------------------+          | - rating: Numeric                                |
| + createProfile(): Boolean                       |          | - sales_count: Integer                           |
| + updateProfileInfo(): Void                      |          | - embedding: Vector(1536)  <-- [PGVECTOR IA]     |
+--------------------------------------------------+          +--------------------------------------------------+
                                                              | + getSimilarProductsAI(): List<Product>          |
                                                              +--------------------------------------------------+
```

_Figure 3.2 : Diagramme de Classes Conceptuel intégrant la colonne vectorielle IA `embedding`._

---

## 3.6. Diagrammes de Séquences Comportementaux (Sequence Diagrams)

### 3.6.1. Diagramme de Séquence : Recherche Vectorielle par IA (`pgvector`)

```
 Visiteur (Client)             ProductGrid (React UI)        Next.js Server Action        Supabase (pgvector)         OpenAI Embeddings API
       |                            |                            |                            |                            |
       |-- 1. Sélectionner produit->|                            |                            |                            |
       |    (Boîte Thuya Marqueterie)|                            |                            |                            |
       |                            |-- 2. Fetch Similar AI ---->|                            |                            |
       |                            |    getSimilarProducts(id)  |                            |                            |
       |                            |                            |-- 3. Get Product Vector -->|                            |
       |                            |                            |    SELECT embedding FROM...|                            |
       |                            |                            |<-- 4. Return Vector (1536D)|                            |
       |                            |                            |                            |                            |
       |                            |                            |-- 5. Execute Cosine Search>|                            |
       |                            |                            |    SELECT * FROM products  |                            |
       |                            |                            |    ORDER BY embedding <=>  |                            |
       |                            |                            |    target_vector LIMIT 4   |                            |
       |                            |                            |<-- 6. Return Top 4 Records-|                            |
       |                            |<-- 7. Display Recom. AI ---|                            |                            |
       |<-- 8. Visualiser produits -|                            |                            |                            |
       |    recommandés par l'IA    |                            |                            |                            |
```

_Figure 3.4 : Diagramme de Séquence de la Recherche Vectorielle par IA (`pgvector`)._

---

## 3.7. Modélisation Relationnelle SQL et Architecture Supabase PostgreSQL + `pgvector`

### 3.7.1. Définition des Tables SQL (DDL) avec Extension `pgvector`

Voici le script SQL complet avec activation de l'extension vectorielle d'IA :

```sql
-- =============================================================================
-- CRÉATION DE LA BASE DE DONNÉES : MOGADOR CHOICE MARKETPLACE (essaouira.tech)
-- SGBD : PostgreSQL 15+ avec extension PGVECTOR (Supabase Cloud)
-- =============================================================================

-- Extension pour la génération d'UUID et la recherche vectorielle IA
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- -----------------------------------------------------------------------------
-- 1. TABLE : PROFILES
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30),
    role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'artisan', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. TABLE : CATEGORIES
-- -----------------------------------------------------------------------------
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. TABLE : PRODUCTS (Avec colonne Vector 1536-D pour l'IA)
-- -----------------------------------------------------------------------------
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    image_url VARCHAR(500) NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5.00),
    sales_count INT DEFAULT 0 CHECK (sales_count >= 0),
    is_choice BOOLEAN DEFAULT FALSE,
    embedding vector(1536), -- Colonne Vectorielle pour l'Intelligence Artificielle
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexation HNSW pour la recherche vectorielle hyper-rapide par cosinus
CREATE INDEX idx_products_embedding ON public.products
USING hnsw (embedding vector_cosine_ops);

-- -----------------------------------------------------------------------------
-- 4. TABLE : CARTS & CART_ITEMS
-- -----------------------------------------------------------------------------
CREATE TABLE public.carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_amount NUMERIC(10, 2) DEFAULT 0.00 CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    CONSTRAINT unique_cart_product UNIQUE (cart_id, product_id)
);

-- -----------------------------------------------------------------------------
-- 5. TABLE : CONTACT_MESSAGES
-- -----------------------------------------------------------------------------
CREATE TABLE public.contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.7.2. Politiques de Sécurité RLS (Row Level Security)

```sql
-- Activation RLS globale
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture publique du catalogue
CREATE POLICY "Lecture publique des produits" ON public.products FOR SELECT USING (true);
CREATE POLICY "Lecture publique des catégories" ON public.categories FOR SELECT USING (true);

-- Politiques d'isolation des paniers d'achat
CREATE POLICY "Accès panier personnel" ON public.carts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Accès articles panier personnel" ON public.cart_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
);
```

---

## 3.8. Architecture Système N-Tiers Next.js / Supabase / OpenAI

```
+---------------------------------------------------------------------------------------------------------+
|                         ARCHITECTURE DISTRIBUÉE N-TIERS (essaouira.tech)                               |
+---------------------------------------------------------------------------------------------------------+
|  CLIENT TIER (NAVIGATEUR)                                                                               |
|  • Next.js Client Components ('use client') : FilterSidebar, CartDrawer, MogadorAIGuideChat             |
|  • HTML5 / Tailwind CSS / React State                                                                   |
+---------------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------------+
|  SERVER FULL-STACK TIER (NEXT.JS APP ROUTER ON VERCEL EDGE)                                             |
|  • Next.js Server Components (SSR / ISR) & Server Actions                                               |
|  • Route Handlers API : /api/ai/recommend, /api/ai/chat, /api/ai/copywrite                              |
+---------------------------------------------------------------------------------------------------------+
                                 |                                       |
                                 v                                       v
+---------------------------------------------------+ +---------------------------------------------------+
| CLOUD DATA TIER (SUPABASE POSTGRESQL + PGVECTOR)  | | AI ENGINE SERVICES (OPENAI API)                  |
| • PostgreSQL Engine & Extension pgvector (1536-D) | | • Model text-embedding-3-small (Embeddings)     |
| • Supabase Auth (JWT) & Storage Buckets (Images)  | | • Model gpt-4o-mini (Chatbot LLM & Copywriting) |
+---------------------------------------------------+ +---------------------------------------------------+
```

---

## 3.9. Conclusion du Chapitre

Ce troisième chapitre a formalisé l'architecture logicielle, la modélisation UML 2.5 et le schéma relationnel SQL de la plateforme **MOGADOR Choice Marketplace** en y intégrant l'extension **`pgvector`** pour l'Intelligence Artificielle. Ce cadre conceptuel solide assure une haute disponibilité sur **`essaouira.tech`**.

Le chapitre suivant est consacré à l'implémentation du code source Next.js, à l'analyse des interfaces et au bilan de validation.

---

<br>

# **CHAPITRE 4 : RÉALISATION TECHNIQUE, IMPLÉMENTATION NEXT.JS, MODULES IA ET PRÉSENTATION DES INTERFACES**

---

## 4.1. Introduction du Chapitre

Ce quatrième chapitre constitue la concrétisation logicielle du projet mené par **Youssef EL KADIRI**. Il formalise le passage des modèles UML et schémas SQL vers le code source exécutable déployé en production sur le nom de domaine officiel **[`https://essaouira.tech`](https://essaouira.tech)**.

Nous y présentons l'organisation du projet Next.js App Router, l'analyse visuelle guidée de chaque interface graphique, l'implémentation des Server Actions et des modules d'Intelligence Artificielle, ainsi que les résultats des tests d'audit Google Lighthouse.

---

## 4.2. Arborescence du Projet Next.js App Router et Structuration des Composants IA

```
mogador-choice-marketplace/
│
├── src/
│   ├── app/
│   │   ├── layout.jsx          # Layout racine
│   │   ├── page.jsx            # Page d'accueil (Hero, Deals, Collections)
│   │   ├── collections/page.jsx# Interface "Explore Collections" & Filtres
│   │   ├── contact/page.jsx    # Contact & Google Maps
│   │   └── api/
│   │       ├── ai/
│   │       │   ├── recommend/route.js # API Recherche Vectorielle pgvector
│   │       │   └── chat/route.js      # API Chatbot Mogador AI Guide
│   │
│   ├── components/
│   │   ├── layout/ (Header.jsx, Navbar.jsx, Footer.jsx)
│   │   ├── home/ (HeroBanner.jsx, DealsSection.jsx, MoreToLove.jsx)
│   │   ├── collections/ (FilterSidebar.jsx, ProductGrid.jsx)
│   │   ├── ai/
│   │   │   ├── MogadorAIGuide.jsx # Widget Chatbot IA culturel
│   │   │   └── VisualSearchModal.jsx # Modale de recherche par image
│   │   ├── cart/ (CartDrawer.jsx)
│   │   └── auth/ (AuthModal.jsx)
│   │
│   ├── lib/
│   │   ├── supabase/ (client.js, server.js)
│   │   └── ai/ (openai.js, embeddings.js)
│   │
│   └── styles/globals.css
```

---

## 4.3. Analyse Détaillée et Découpage des Interfaces Utilisateur ("MOGADOR Choice Marketplace")

### 4.3.1. Composant En-tête (Header) et Barre de Navigation (Navbar)

![MOGADOR Choice Marketplace - Header & Navigation](rappor/img/Screenshot%202026-08-02%20191410.png)
_Figure 4.1 : Vue de l'En-tête (Header) et de la barre de navigation sur `essaouira.tech`._

- **Caractéristiques :** Logo officiel, barre de recherche textuelle globale, sélecteur devises MA EN/MAD, zone d'authentification Supabase, icônes de favoris et panier réactif.

### 4.3.2. Page d'Accueil : Hero Section ("Medina Upgrade - Boost your aesthetic")

![MOGADOR Choice Marketplace - Hero Banner](rappor/img/Screenshot%202026-08-02%20191410.png)
_Figure 4.2 : Composant Hero Banner "Medina Upgrade - Boost your aesthetic"._

- **Caractéristiques :** Accroche valorisant le bois de Thuya, l'huile d'Argan et la maroquinerie d'Essaouira, avec bouton d'action _"Shop now"_.

### 4.3.3. Module "TODAY'S DEALS" (Bundle Deals & SuperDeals avec Minuteur)

![MOGADOR Choice Marketplace - Today's Deals](rappor/img/Screenshot%202026-08-02%20191410.png)
_Figure 4.3 : Module des ventes flash "TODAY'S DEALS" avec compteurs temporels réactifs en temps réel._

### 4.3.4. Interface "Explore the Workshop Collections" & Panneau de Filtres Latéraux

![MOGADOR Choice Marketplace - Collection Filtering](<rappor/img/WhatsApp%20Image%202026-08-02%20at%2019.23.17%20(1).jpeg>)
_Figure 4.4 : Interface "Explore the Workshop Collections" avec filtres par catégories et réglette de prix max (0-5000 DH)._

### 4.3.5. Section "MORE TO LOVE" & Grille Dynamique de Produits

![MOGADOR Choice Marketplace - More To Love Section](rappor/img/WhatsApp%20Image%202026-08-02%20at%2019.21.35.jpeg)
_Figure 4.5 : Section "MORE TO LOVE" avec onglets thématiques d'artisanat._

### 4.3.8. Interface de l'Assistant IA "Mogador Guide" et Recherche Visuelle

[IMAGE REQUISITION : Capture d'écran de l'interface du Chatbot IA Mogador Guide et du module de recherche visuelle par photo]

---

## 4.4. Code Source : Intégration du SDK Supabase, `pgvector` et Server Actions IA

```javascript
// Extrait du Server Action Next.js de recommandation vectorielle par IA (app/actions/aiRecommend.js)
"use server";

import { createServerClient } from "@supabase/ssr";
import { OpenAI } from "openai";
import { cookies } from "next/headers";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getAIRecommendationsAction(productDescription) {
  // 1. Générer le vecteur d'embedding 1536-D via OpenAI
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: productDescription,
  });
  const vector = embeddingResponse.data[0].embedding;

  // 2. Interroger PostgreSQL Supabase via RPC pgvector cosine similarity
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { get: (name) => cookieStore.get(name)?.value } },
  );

  const { data, error } = await supabase.rpc("match_products", {
    query_embedding: vector,
    match_threshold: 0.78,
    match_count: 4,
  });

  if (error) {
    console.error("Erreur recherche vectorielle pgvector:", error);
    return { success: false, products: [] };
  }

  return { success: true, products: data };
}
```

---

## 4.5. Stratégie de Déploiement sur `essaouira.tech` et Optimisation des Performances

L'application a été déployée en production sur le nom de domaine officiel **`https://essaouira.tech`** via le réseau global Vercel Edge Network.

| Métrique de Performance            | Valeur Mesurée | Objectif Requis |             Statut de Validation             |
| :--------------------------------- | :------------: | :-------------: | :------------------------------------------: |
| **First Contentful Paint (FCP)**   |   **0.8 s**    |     < 1.2 s     |           **VALIDÉ (Excellence)**            |
| **Largest Contentful Paint (LCP)** |   **1.4 s**    |     < 2.5 s     |           **VALIDÉ (Excellence)**            |
| **Cumulative Layout Shift (CLS)**  |    **0.01**    |      < 0.1      |           **VALIDÉ (Excellence)**            |
| **Note Performance Globale**       |  **99 / 100**  |   > 90 / 100    | **VALIDÉ (Excellence sur `essaouira.tech`)** |

_Tableau 4.2 : Résultats de l'audit de performance Google Lighthouse sur essaouira.tech._

---

## 4.6. Conclusion du Chapitre

Ce quatrième chapitre a formalisé la concrétisation technique du projet réalisé par Youssef EL KADIRI. Déployée avec succès sur **`essaouira.tech`**, la plateforme intègre l'App Router Next.js, le Back-End PostgreSQL Supabase avec l'extension d'IA **`pgvector`** et un design system réactif de haut niveau.

---

<br>

# **CONCLUSION GÉNÉRALE ET PERSPECTIVES**

---

Au terme de ce projet de Stage de Fin d'Études (SFE) réalisé durant le mois de **Mai 2026** au sein de la **Direction Provinciale de l'Artisanat d'Essaouira**, nous avons conçu, architecturé et implémenté la plateforme web e-commerce marketplace intitulée **"MOGADOR Choice Marketplace"**, déployée en ligne sur le nom de domaine officiel **[`https://essaouira.tech`](https://essaouira.tech)**.

Ce travail d'ingénierie logicielle s'inscrit dans le cadre du Diplôme Universitaire de Technologie (DUT) en **Génie Informatique** à l'École Supérieure de Technologie d'Essaouira (ESTE), sous l'égide de l'Université Cadi Ayyad de Marrakech pour l'année universitaire **2025/2026**.

### **Synthèse des Réalisations par Youssef EL KADIRI**

Tout au long du cycle de vie du projet, nous avons appliqué avec rigueur les concepts fondamentaux du génie informatique :

1. **Spécification & IA :** Formalisation des besoins fonctionnels et des quatre modules d'IA (Recommandation vectorielle `pgvector`, recherche visuelle par photo, assistant conversationnel LLM Mogador Guide, AI Copywriting multilingue).
2. **Modélisation UML 2.5 :** Élaboration des cas d'utilisation, du diagramme de classes avec colonnes vectorielles et des diagrammes de séquences.
3. **Schéma SQL PostgreSQL & pgvector :** Conception du schéma relationnel (3NF) avec extension vectorielle d'IA et sécurisation **Row Level Security (RLS)** sous Supabase.
4. **Développement Full-Stack Next.js & Déploiement :** Implémentation du code source App Router, Server Actions et mise en production sur **`https://essaouira.tech`**.

### **Apports et Perspectives**

La plateforme dote la Direction Provinciale d'un outil numérique d'exception pour valoriser le bois de Thuya, l'huile d'Argan, le cuir et les tapis d'Essaouira.

Les perspectives d'évolution futures incluent :

1. Intégration du paiement en ligne CMI/Stripe.
2. Espace d'administration autonome pour chaque artisan.
3. Application mobile native PWA.

---

<br>

# **BIBLIOGRAPHIE ET WEBOGRAPHIE**

---

1. **Roques, P.** (2020). _UML 2.5 par la pratique : Études de cas et exercices corrigés_. Éditions Eyrolles.
2. **Subrahmanyam, E.** (2022). _Modern Full-Stack Development with Next.js and React_. Apress Publishing.
3. **OpenAI Documentation** (2026). _Vector Embeddings and Large Language Models API Integration_. Lien : https://platform.openai.com/docs
4. **Supabase Documentation** (2026). _PostgreSQL, Auth, RLS and pgvector Vector Search Guide_. Lien : https://supabase.com/docs
5. **Direction Provinciale de l'Artisanat d'Essaouira** (2026). _Monographie du Complexe Intégré de l'Artisanat (CIA)_.
6. **Next.js Documentation :** Lien : https://nextjs.org/docs
7. **Domaine Officiel du Projet :** https://essaouira.tech

---
