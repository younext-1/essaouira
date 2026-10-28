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
## **Conception, Architecture et Implémentation d'une Plateforme Web E-Commerce Marketplace de Haute Performance pour la Digitalisation et la Commercialisation de l'Artisanat d'Essaouira : "MOGADOR Choice Marketplace"**

---

* **Réalisé par :** Étudiant en Génie Informatique (ESTE)
* **Encadrant Professionnel :** M. BOURAGBA Mustapha (Directeur Provincial de l'Artisanat d'Essaouira)
* **Encadrant Pédagogique :** Professeur du Département Génie Informatique (ESTE)
* **Organisme d'Accueil :** Direction Provinciale de l'Artisanat d'Essaouira – Complexe Intégré de l'Artisanat (CIA)
* **Stack Technologique :** Next.js (React Framework / App Router), Supabase (PostgreSQL / RLS / Auth / Storage), Tailwind CSS / Vanilla CSS, TypeScript / ES6+
* **Année Universitaire :** 2023 / 2024

---

<br>

## **DÉDICACE**

> *À mes parents chéris,*  
> *Aucun mot, aucune langue ne saurait traduire l'immensité de mon amour, de ma gratitude et de mon respect à votre égard. Vous avez été les architectes invisibles de chacune de mes réussites académiques et personnelles. Vos prières constantes, vos sacrifices inestimables, votre soutien inconditionnel et votre bienveillance illimitée ont éclairé mon parcours aux heures les plus sombres et nourri mon ambition aux heures de doute. Ce travail est le fruit de votre dévouement sans faille et le premier hommage à votre amour parental. Puisse le Tout-Puissant vous préserver, vous accorder une santé de fer, une longue vie paisible et la fierté de voir s'accomplir les rêves que vous avez semés en moi.*
>
> *À mes chers frères et sœurs,*  
> *Pour votre fraternité sincère, vos encouragements constants, vos conseils avisés et la complicité inestimable qui nous unie. Votre présence à mes côtés constitue une source intarissable de force et de motivation. Que ce travail soit le symbole de notre union familiale et de mon affection indéfectible.*
>
> *À l'ensemble du corps professoral et administratif de l'École Supérieure de Technologie d'Essaouira (ESTE),*  
> *En particulier aux enseignants du Département Génie Informatique, qui m'ont transmis avec passion, rigueur et pédagogie les valeurs fondamentales de l'ingénierie logicielle, le sens de l'effort et la quête permanente de l'excellence technique.*
>
> *À Monsieur le Directeur Provincial de l'Artisanat d'Essaouira, M. BOURAGBA Mustapha, ainsi qu'à l'ensemble des cadres et fonctionnaires de la Direction,*  
> *Pour leur accueil chaleureux, leur ouverture d'esprit et l'opportunité exceptionnelle qu'ils m'ont offerte d'immerger au cœur d'un secteur économique d'une richesse patrimoniale inestimable.*
>
> *À tous mes camarades de promotion de Génie Informatique,*  
> *En souvenir des défis relevés ensemble, des nuits d'apprentissage intense, des débats passionnés sur l'architecture logicielle et de l'esprit d'équipe exemplaire qui a marqué ces deux années de formation universitaire.*
>
> *À toute personne ayant contribué, de près ou de loin, à l'aboutissement de ce travail académique et professionnel.*

---

<br>

## **REMERCIEMENTS**

Au terme de ce travail de recherche, de conception et de développement concrétisant mon Stage de Fin d'Études (SFE) en Génie Informatique, j'adresse l'expression de mes plus profondes gratitudes et de mes remerciements les plus sincères à toutes les personnes morales et physiques qui m'ont guidé, soutenu et accompagné tout au long de cette expérience professionnelle enrichissante.

Je tiens à exprimer ma reconnaissance la plus vive et la plus respectueuse à Monsieur **BOURAGBA Mustapha**, Directeur Provincial de la Direction Provinciale de l'Artisanat d'Essaouira. En acceptant de m'accueillir au sein de l'institution qu'il dirige et en assurant l'encadrement professionnel de ce travail, il m'a témoigné une confiance précieuse. Sa vision stratégique du développement du secteur artisanal local, sa grande disponibilité malgré ses lourdes charges administratives, ses orientations avisées et sa bienveillance constante ont été des éléments déterminants dans la conduite de ce projet d'envergure.

J'adresse également mes remerciements chaleureux à l'ensemble du personnel de la Direction Provinciale de l'Artisanat d'Essaouira, notamment aux responsables et techniciens des différents services opérationnels : le Service Étude et Suivi des Projets, le Service de Gestion des Associations, Coopératives et Formation Professionnelle, le Bureau d'Ordre et Comptabilité, ainsi que le Service d'Exportation. Leurs explications détaillées sur le fonctionnement du secteur, la gestion du Complexe Intégré de l'Artisanat (CIA) et les contraintes de commercialisation rencontrées par les mono-artisans et les coopératives ont constitué le socle fonctionnel indispensable à l'élaboration de la plateforme **MOGADOR Choice Marketplace**.

Sur le plan académique, ma profonde gratitude s'adresse à l'ensemble des enseignants-chercheurs et formateurs du Département **Génie Informatique** de l'École Supérieure de Technologie d'Essaouira (ESTE), sous l'égide de l'Université Cadi Ayyad de Marrakech. Leurs enseignements de haute valeur scientifique, couvrant le génie logiciel, la modélisation orientée objet (UML), le développement web moderne, les architectures de bases de données relationnelles et NoSQL (PostgreSQL, Supabase) ainsi que la sécurité informatique, m'ont doté des compétences théoriques et pratiques nécessaires pour concevoir une application de niveau professionnel.

Enfin, je tiens à exprimer mes remerciements respectueux aux membres du jury qui ont accepté d'examiner et d'évaluer ce travail de fin d'études. Leurs remarques, leurs critiques constructives et leurs suggestions permettront indéniablement d'enrichir la qualité scientifique et technique de cette contribution.

---

<br>

## **RÉSUMÉ**

Le présent rapport de Stage de Fin d'Études (SFE) formalise le travail de conception, d'architecture logicielle et d'implémentation de la plateforme e-commerce multi-vendeurs de type marketplace intitulée **"MOGADOR Choice Marketplace"**. Développé au sein de la Direction Provinciale de l'Artisanat d'Essaouira par un étudiant en **Génie Informatique** à l'École Supérieure de Technologie d'Essaouira (ESTE), ce projet vise à moderniser les canaux de distribution et à assurer la promotion numérique des produits de l'artisanat de la région d'Essaouira.

La province d'Essaouira est réputée mondialement pour la richesse de son patrimoine artisanal, incarné par le travail d'ébénisterie sur bois de Thuya, l'extraction de l'huile d'Argan pure (cosmétique et gastronomique), le tissage de tapis berbères, la maroquinerie faite main, la bijouterie traditionnelle en argent et la céramique. Toutefois, la majorité des coopératives et mono-artisans locaux sont confrontés à des limites de commercialisation physique liées à la saisonnalité touristique et à l'intermédiation commerciale.

Pour résoudre cette problématique, notre contribution logicielle consiste en l'élaboration d'une application web Single Page Application (SPA) hautement réactive, évolutive et sécurisée. S'appuyant sur un écosystème technologique de pointe combinant le framework **Next.js** (App Router, Server Components et Server Actions) et la plateforme Backend-as-a-Service **Supabase** (moteur de base de données relationnelle PostgreSQL, authentification Supabase Auth, règles de sécurité au niveau des lignes - Row Level Security RLS, stockage de fichiers Supabase Storage), la plateforme offre :
- Une interface utilisateur au design moderne, réactif et conforme aux meilleures pratiques UI/UX.
- Un moteur de recherche textuel performant couplé à un système de filtrage dynamique multi-critères (par catégorie spécialisée, limite de prix dynamique via réglette interactive et critères de tri avancés).
- Un module de gestion des offres promotionnelles en temps réel (Bundle Deals avec tarification dégressive, SuperDeals intégrants des compteurs temporels réactifs).
- Une gestion réactive et temps réel du panier d'achat via un volet latéral fluide (Cart Drawer).
- Une géolocalisation intégrée et interactive du Complexe Intégré de l'Artisanat (CIA) d'Essaouira via l'API Google Maps.

Ce document retrace minutieusement le cycle de vie complet du projet d'ingénierie logicielle : l'analyse théorique du domaine institutionnel, la spécification rigoureuse des besoins fonctionnels et non-fonctionnels, la modélisation conceptuelle sous le langage UML (cas d'utilisation, diagramme de classes, diagrammes de séquences), la conception des schémas SQL Supabase, l'architecture du code source Next.js, jusqu'aux campagnes de tests et de validation.

**Mots-clés :** Génie Informatique, E-Commerce, Marketplace, Next.js, React, Supabase, PostgreSQL, SQL, Row Level Security (RLS), UML, Artisanat d'Essaouira, MOGADOR Choice, Responsive Design.

---

<br>

## **ABSTRACT**

This End-of-Studies Internship Report (SFE) details the engineering, software architecture, and full-stack implementation of a high-performance multi-vendor e-commerce marketplace platform titled **"MOGADOR Choice Marketplace"**. Developed at the Provincial Directorate of Handicrafts of Essaouira by a **Computer Engineering** student from the École Supérieure de Technologie d'Essaouira (ESTE), this project aims to digitize supply chains and boost the international visibility of Essaouira's rich artisanal heritage.

The province of Essaouira is internationally renowned for its craftsmanship, including Thuya wood marquetry, pure cosmetic and culinary Argan oil, hand-stitched leather goods, traditional Berber jewelry, Moroccan rugs, and pottery. However, local cooperatives and independent artisans suffer from geographical isolation, seasonal tourism fluctuations, and an excessive reliance on intermediaries.

To overcome these barriers, this project presents a cutting-edge web marketplace application. Built on an advanced full-stack architecture leveraging **Next.js** (React framework featuring App Router, Server-Side Rendering, Server Components, and Server Actions) and **Supabase** (PostgreSQL relational database, Supabase Auth, Row Level Security - RLS, and Cloud Storage buckets), the platform delivers:
- State-of-the-art, high-aesthetic, and fully responsive user interfaces.
- Advanced multi-criteria search engine functionality (category-based filtering, interactive dynamic price limit slider, and real-time sorting parameters).
- Real-time promotional deal engines (Bundle Deals with volume discounts, SuperDeals with live countdown timer mechanisms).
- A reactive side-drawer Cart management system (Cart Drawer) with instantaneous state updates.
- Embedded interactive spatial mapping via Google Maps API, showcasing the Integrated Handicraft Complex (CIA) of Essaouira.

This report comprehensively covers every phase of the software engineering lifecycle: domain analysis, functional and non-functional requirements specification, Unified Modeling Language (UML) conceptual design (Use Cases, Class Diagrams, Sequence Diagrams), PostgreSQL relational schema definition, Next.js component hierarchy, and rigorous validation testing.

**Keywords:** Computer Engineering, E-Commerce Marketplace, Next.js, React, Supabase, PostgreSQL, SQL, Row Level Security (RLS), UML, Essaouira Handicrafts, MOGADOR Choice, Responsive Web Design.

---

<br>

## **TABLE DES MATIÈRES COMPLÈTE ET EXHAUSTIVE DE L'ENSEMBLE DU RAPPORT**

- [ROYAUME DU MAROC](#royaume-du-maroc)
  - [UNIVERSITÉ CADI AYYAD](#université-cadi-ayyad)
    - [ÉCOLE SUPÉRIEURE DE TECHNOLOGIE D'ESSAOUIRA (ESTE)](#école-supérieure-de-technologie-dessaouira-este)
- [RAPPORT DE STAGE DE FIN D'ÉTUDES](#rapport-de-stage-de-fin-détudes)
    - [**SUJET DU PROJET :**](#sujet-du-projet-)
  - [**Conception, Architecture et Implémentation d'une Plateforme Web E-Commerce Marketplace de Haute Performance pour la Digitalisation et la Commercialisation de l'Artisanat d'Essaouira : "MOGADOR Choice Marketplace"**](#conception-architecture-et-implémentation-dune-plateforme-web-e-commerce-marketplace-de-haute-performance-pour-la-digitalisation-et-la-commercialisation-de-lartisanat-dessaouira--mogador-choice-marketplace)
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
    - [1.2.3. Rôle et importance du Stage de Fin d'Études (SFE) dans le cursus](#123-rôle-et-importance-du-stage-de-fin-détudes-sfe-dans-le-cursus)
  - [1.3. Présentation Approfondie de l'Organisme d'Accueil : La Direction Provinciale de l'Artisanat d'Essaouira](#13-présentation-approfondie-de-lorganisme-daccueil--la-direction-provinciale-de-lartisanat-dessaouira)
    - [1.3.1. Cadre institutionnel, statut juridique et tutelle ministérielle](#131-cadre-institutionnel-statut-juridique-et-tutelle-ministérielle)
    - [1.3.2. Orientations stratégiques nationales (Vision 2015 et Feuille de Route 2030)](#132-orientations-stratégiques-nationales-vision-2015-et-feuille-de-route-2030)
    - [1.3.3. Organigramme institutionnel et structure de direction](#133-organigramme-institutionnel-et-structure-de-direction)
    - [1.3.4. Description détaillée des services opérationnels de la direction](#134-description-détaillée-des-services-opérationnels-de-la-direction)
      - [a) Service Étude et Suivi des Projets (Responsable : M. LBASRAOUI Khallaf)](#a-service-étude-et-suivi-des-projets-responsable--m-lbasraoui-khallaf)
      - [b) Service de Gestion des Associations, Coopératives et Formation Professionnelle (Responsable : M. GHOULIMI Abdelkader)](#b-service-de-gestion-des-associations-coopératives-et-formation-professionnelle-responsable--m-ghoulimi-abdelkader)
      - [c) Bureau d'Ordre et Comptabilité (Responsable : M. MERZAGUI Zakaria)](#c-bureau-dordre-et-comptabilité-responsable--m-merzagui-zakaria)
      - [d) Service d'Exportation et Réglementation des Matières (Bois de Thuya)](#d-service-dexportation-et-réglementation-des-matières-bois-de-thuya)
    - [1.3.5. Fiche Technique et Infrastructure du Complexe Intégré de l'Artisanat (CIA) d'Essaouira](#135-fiche-technique-et-infrastructure-du-complexe-intégré-de-lartisanat-cia-dessaouira)
  - [1.4. Étude du Contexte Applicatif et Problématique Opérationnelle](#14-étude-du-contexte-applicatif-et-problématique-opérationnelle)
    - [1.4.1. Analyse des goulots d'étranglement de la commercialisation traditionnelle](#141-analyse-des-goulots-détranglement-de-la-commercialisation-traditionnelle)
    - [1.4.2. Énoncé formel de la problématique logicielle](#142-énoncé-formel-de-la-problématique-logicielle)
  - [1.5. Objectifs Informatiques et Périmètre du Projet (Génie Informatique)](#15-objectifs-informatiques-et-périmètre-du-projet-génie-informatique)
  - [1.6. Conclusion du Chapitre](#16-conclusion-du-chapitre)
- [**CHAPITRE 2 : ÉTUDE PRÉALABLE, SPÉCIFICATION DES BESOINS ET ÉCOSYSTÈME TECHNOLOGIQUE**](#chapitre-2--étude-préalable-spécification-des-besoins-et-écosystème-technologique)
  - [2.1. Introduction du Chapitre](#21-introduction-du-chapitre)
  - [2.2. Analyse Comparative des Systèmes d'Information Existants](#22-analyse-comparative-des-systèmes-dinformation-existants)
  - [2.3. Spécification Détaillée des Besoins Fonctionnels](#23-spécification-détaillée-des-besoins-fonctionnels)
    - [2.3.1. Gestion de l'Identité, Authentification et Profils Utilisateurs (Supabase Auth)](#231-gestion-de-lidentité-authentification-et-profils-utilisateurs-supabase-auth)
    - [2.3.2. Moteur de Recherche et Exploration du Catalogue ("Explore Workshop Collections")](#232-moteur-de-recherche-et-exploration-du-catalogue-explore-workshop-collections)
    - [2.3.3. Système de Filtrage Dynamique Multi-Critères et Tri Temps Réel](#233-système-de-filtrage-dynamique-multi-critères-et-tri-temps-réel)
    - [2.3.4. Gestionnaire de Tarification et Modules Promotionnels (Bundle Deals, SuperDeals avec Minuteur)](#234-gestionnaire-de-tarification-et-modules-promotionnels-bundle-deals-superdeals-avec-minuteur)
    - [2.3.5. Gestion Réactive du Panier d'Achat (Cart Drawer)](#235-gestion-réactive-du-panier-dachat-cart-drawer)
    - [2.3.6. Sections Spécialisées "MORE TO LOVE" & Grilles de Produits Thématiques](#236-sections-spécialisées-more-to-love--grilles-de-produits-thématiques)
    - [2.3.7. Module de Contact et Géolocalisation Interactive Google Maps](#237-module-de-contact-et-géolocalisation-interactive-google-maps)
  - [2.4. Spécification Avancée des Besoins Non-Fonctionnels](#24-spécification-avancée-des-besoins-non-fonctionnels)
    - [2.4.1. Ergonomie, UI/UX Design System et Responsive Web Design](#241-ergonomie-uiux-design-system-et-responsive-web-design)
    - [2.4.2. Performance Technique, Temps de Réponse et Optimization SSR/ISR](#242-performance-technique-temps-de-réponse-et-optimization-ssrisr)
    - [2.4.3. Sécurité des Données, Chiffrement et Sécurité RLS (Row Level Security)](#243-sécurité-des-données-chiffrement-et-sécurité-rls-row-level-security)
    - [2.4.4. Maintenance, Scalabilité et Architecture par Composants Réutilisables](#244-maintenance-scalabilité-et-architecture-par-composants-réutilisables)
  - [2.5. Étude Comparative et Choix de la Stack Technologique](#25-étude-comparative-et-choix-de-la-stack-technologique)
    - [2.5.1. Framework Front-End / Full-Stack : Next.js (vs React SPA vs Angular)](#251-framework-front-end--full-stack--nextjs-vs-react-spa-vs-angular)
    - [2.5.2. Solution Back-End & Base de Données : Supabase PostgreSQL (vs Firebase NoSQL vs Node/Express custom)](#252-solution-back-end--base-de-données--supabase-postgresql-vs-firebase-nosql-vs-nodeexpress-custom)
    - [2.5.3. Outillage de Développement et CI/CD (VS Code, Git, GitHub, Vercel)](#253-outillage-de-développement-et-cicd-vs-code-git-github-vercel)
  - [2.6. Conclusion du Chapitre](#26-conclusion-du-chapitre)
- [**CHAPITRE 3 : ARCHITECTURE LOGICIELLE, MODÉLISATION UML ET SCHÉMA DE BASE DE DONNÉES SQL (SUPABASE)**](#chapitre-3--architecture-logicielle-modélisation-uml-et-schéma-de-base-de-données-sql-supabase)
  - [3.1. Introduction du Chapitre](#31-introduction-du-chapitre)
  - [3.2. Démarche de Conception Orientée Objet et Norme UML 2.5](#32-démarche-de-conception-orientée-objet-et-norme-uml-25)
  - [3.3. Identification et Spécification des Acteurs du Système](#33-identification-et-spécification-des-acteurs-du-système)
  - [3.4. Diagramme de Cas d'Utilisation (Use Case Diagram)](#34-diagramme-de-cas-dutilisation-use-case-diagram)
    - [3.4.1. Diagramme Global des Cas d'Utilisation](#341-diagramme-global-des-cas-dutilisation)
    - [3.4.2. Description Textuelle Détaillée des Cas d'Utilisation Majeurs](#342-description-textuelle-détaillée-des-cas-dutilisation-majeurs)
  - [3.5. Diagramme de Classes Conceptuel (Class Diagram)](#35-diagramme-de-classes-conceptuel-class-diagram)
  - [3.6. Diagrammes de Séquences Comportementaux (Sequence Diagrams)](#36-diagrammes-de-séquences-comportementaux-sequence-diagrams)
    - [3.6.1. Diagramme de Séquence : Authentification et Création de Session Supabase](#361-diagramme-de-séquence--authentification-et-création-de-session-supabase)
    - [3.6.2. Diagramme de Séquence : Recherche et Filtrage Dynamique en Temps Réel](#362-diagramme-de-séquence--recherche-et-filtrage-dynamique-en-temps-réel)
    - [3.6.3. Diagramme de Séquence : Gestion du Panier (Cart Drawer) et Persistance SQL](#363-diagramme-de-séquence--gestion-du-panier-cart-drawer-et-persistance-sql)
  - [3.7. Modélisation Relationnelle SQL et Architecture Supabase PostgreSQL](#37-modélisation-relationnelle-sql-et-architecture-supabase-postgresql)
    - [3.7.1. Modèle Physique des Données (MPD)](#371-modèle-physique-des-données-mpd)
    - [3.7.2. Définition des Tables SQL (DDL : Data Definition Language)](#372-définition-des-tables-sql-ddl--data-definition-language)
    - [3.7.3. Politiques de Sécurité RLS (Row Level Security) sur Supabase](#373-politiques-de-sécurité-rls-row-level-security-sur-supabase)
  - [3.8. Architecture Système N-Tiers Next.js / Supabase](#38-architecture-système-n-tiers-nextjs--supabase)
  - [3.9. Conclusion du Chapitre](#39-conclusion-du-chapitre)
- [**CHAPITRE 4 : RÉALISATION TECHNIQUE, IMPLÉMENTATION NEXT.JS ET PRÉSENTATION DES INTERFACES**](#chapitre-4--réalisation-technique-implémentation-nextjs-et-présentation-des-interfaces)
  - [4.1. Introduction du Chapitre](#41-introduction-du-chapitre)
  - [4.2. Arborescence du Projet Next.js App Router et Structuration des Composants](#42-arborescence-du-projet-nextjs-app-router-et-structuration-des-composants)
  - [4.3. Analyse Détaillée et Découpage des Interfaces Utilisateur ("MOGADOR Choice Marketplace")](#43-analyse-détaillée-et-découpage-des-interfaces-utilisateur-mogador-choice-marketplace)
    - [4.3.1. Composant En-tête (Header) et Barre de Navigation (Navbar)](#431-composant-en-tête-header-et-barre-de-navigation-navbar)
    - [4.3.2. Page d'Accueil : Hero Section ("Medina Upgrade - Boost your aesthetic")](#432-page-daccueil--hero-section-medina-upgrade---boost-your-aesthetic)
    - [4.3.3. Module "TODAY'S DEALS" (Bundle Deals & SuperDeals avec Minuteur)](#433-module-todays-deals-bundle-deals--superdeals-avec-minuteur)
    - [4.3.4. Interface "Explore the Workshop Collections" & Panneau de Filtres Latéraux](#434-interface-explore-the-workshop-collections--panneau-de-filtres-latéraux)
    - [4.3.5. Section "MORE TO LOVE" & Grille Dynamique de Produits](#435-section-more-to-love--grille-dynamique-de-produits)
    - [4.3.6. Module d'Authentification (Sign In / Register) via Supabase Auth](#436-module-dauthentification-sign-in--register-via-supabase-auth)
    - [4.3.7. Interface du Panier Réactif (Cart Drawer) et Gestion d'État Global](#437-interface-du-panier-réactif-cart-drawer-et-gestion-détat-global)
    - [4.3.8. Page de Contact & Carte Google Maps du CIA d'Essaouira](#438-page-de-contact--carte-google-maps-du-cia-dessaouira)
    - [4.3.9. Composant Pied de Page (Footer) Institutionnel](#439-composant-pied-de-page-footer-institutionnel)
  - [4.4. Intégration du SDK Supabase JS & Server Actions Next.js](#44-intégration-du-sdk-supabase-js--server-actions-nextjs)
  - [4.5. Stratégie de Tests, Validation et Optimisation des Performances](#45-stratégie-de-tests-validation-et-optimisation-des-performances)
  - [4.6. Conclusion du Chapitre](#46-conclusion-du-chapitre)
- [**CONCLUSION GÉNÉRALE ET PERSPECTIVES**](#conclusion-générale-et-perspectives-1)
- [**BIBLIOGRAPHIE ET WEBOGRAPHIE**](#bibliographie-et-webographie-1)

---

<br>

## **LISTE DES FIGURES ET SCHÉMAS**

* **Figure 1.1** : Organigramme Hiérarchique et Fonctionnel de la Direction Provinciale de l'Artisanat d'Essaouira.
* **Figure 1.2** : Vue Architecturale et Ateliers du Complexe Intégré de l'Artisanat (CIA) d'Essaouira.
* **Figure 3.1** : Diagramme de Cas d'Utilisation Global sous la norme UML 2.5.
* **Figure 3.2** : Diagramme de Classes Conceptuel de la plateforme MOGADOR Choice.
* **Figure 3.3** : Diagramme de Séquence du processus d'Authentification Supabase.
* **Figure 3.4** : Diagramme de Séquence de la recherche et du filtrage dynamique en temps réel.
* **Figure 3.5** : Diagramme de Séquence de la gestion réactive du Panier (Cart Drawer).
* **Figure 3.6** : Schéma Relationnel des Données (MPD) de la base de données PostgreSQL Supabase.
* **Figure 3.7** : Diagramme de l'Architecture Système N-Tiers (Next.js App Router + Supabase Cloud).
* **Figure 4.1** : Interface En-tête (Header) et Barre de Navigation Supérieure (Navbar).  
  ![MOGADOR Choice Marketplace - Header & Navigation](rappor/img/Screenshot%202026-08-02%20191410.png)
* **Figure 4.2** : Section Hero Banner de la Page d'Accueil ("Medina Upgrade - Boost your aesthetic").  
  ![MOGADOR Choice Marketplace - Hero Banner](rappor/img/Screenshot%202026-08-02%20191410.png)
* **Figure 4.3** : Section "TODAY'S DEALS" avec modules Bundle Deals et SuperDeals.  
  ![MOGADOR Choice Marketplace - Today's Deals](rappor/img/Screenshot%202026-08-02%20191410.png)
* **Figure 4.4** : Interface "Explore the Workshop Collections" avec la barre latérale de filtrage dynamique.  
  ![MOGADOR Choice Marketplace - Collection Filtering](rappor/img/WhatsApp%20Image%202026-08-02%20at%2019.23.17%20(1).jpeg)
* **Figure 4.5** : Grille de produits de la section "MORE TO LOVE" avec filtres thématiques.  
  ![MOGADOR Choice Marketplace - More To Love Section](rappor/img/WhatsApp%20Image%202026-08-02%20at%2019.21.35.jpeg)
* **Figure 4.6** : Interface du volet latéral du Panier d'Achat (Cart Drawer).  
  [IMAGE REQUISITION : Capture d'écran du volet latéral du Panier d'Achat réactif avec gestion des quantités]
* **Figure 4.7** : Modale et Formulaire de Création de Compte Utilisateur (Register).  
  [IMAGE REQUISITION : Capture d'écran de l'interface d'inscription utilisateur]
* **Figure 4.8** : Modale et Formulaire de Connexion Utilisateur (Sign In / Login).  
  [IMAGE REQUISITION : Capture d'écran de l'interface de connexion utilisateur]
* **Figure 4.9** : Page de Contact avec Formulaire et Géolocalisation Google Maps du CIA Essaouira.  
  [IMAGE REQUISITION : Capture d'écran de la page de contact avec carte interactive Google Maps]
* **Figure 4.10** : Console de Gestion Supabase (Table Editor & Politiques de Sécurité RLS).  
  [IMAGE REQUISITION : Capture d'écran du tableau de bord Supabase avec les tables SQL et politiques RLS]

---

<br>

## **LISTE DES TABLEAUX**

* **Tableau 1.1** : Fiche Technique et Consistance Physique du Complexe Intégré de l'Artisanat (CIA) d'Essaouira.
* **Tableau 2.1** : Analyse comparative des frameworks Web Full-Stack (Next.js vs React SPA vs Angular).
* **Tableau 2.2** : Analyse comparative des solutions Back-End (Supabase PostgreSQL vs Firebase NoSQL vs Node/Express custom).
* **Tableau 3.1** : Matrice de spécification détaillée des acteurs et privilèges système.
* **Tableau 3.2** : Description formelle du cas d'utilisation "Filtrer les produits par catégorie et prix max".
* **Tableau 3.3** : Description formelle du cas d'utilisation "Gérer le panier réactif (Cart Drawer)".
* **Tableau 3.4** : Dictionnaire de données de la table SQL `profiles`.
* **Tableau 3.5** : Dictionnaire de données de la table SQL `products`.
* **Tableau 3.6** : Dictionnaire de données de la table SQL `categories`.
* **Tableau 3.7** : Dictionnaire de données de la table SQL `cart_items`.
* **Tableau 4.1** : Arborescence des composants React du projet Next.js.
* **Tableau 4.2** : Matrice des tests d'intégration et de validation des fonctionnalités.

---

<br>

## **LISTE DES ABRÉVIATIONS ET GLOSSAIRE TECHNIQUE**

* **ESTE** : École Supérieure de Technologie d'Essaouira
* **UCA** : Université Cadi Ayyad
* **SFE** : Stage de Fin d'Études
* **DUT** : Diplôme Universitaire de Technologie
* **GI** : Génie Informatique
* **CIA** : Complexe Intégré de l'Artisanat
* **INDH** : Initiative Nationale pour le Développement Humain
* **PME** : Petites et Moyennes Entreprises
* **UML** : Unified Modeling Language (Langage de Modélisation Unifié)
* **SQL** : Structured Query Language
* **DDL** : Data Definition Language
* **DML** : Data Manipulation Language
* **RLS** : Row Level Security (Sécurité au niveau des lignes sous PostgreSQL)
* **SSR** : Server-Side Rendering (Rendu côté serveur)
* **ISR** : Incremental Static Regeneration
* **SPA** : Single Page Application
* **API** : Application Programming Interface
* **REST** : Representational State Transfer
* **JSON** : JavaScript Object Notation
* **DOM** : Document Object Model
* **CTA** : Call To Action (Bouton d'action prépondérant)
* **MAD / DH** : Moroccan Dirham (Dirham Marocain)
* **UI** : User Interface (Interface Utilisateur)
* **UX** : User Experience (Expérience Utilisateur)

---

<br>

## **INTRODUCTION GÉNÉRALE**

À l'ère de la quatrième révolution industrielle, la transformation digitale s'est imposée comme le catalyseur majeur de la modernisation économique et du développement territorial. Les technologies de l'information et de la communication (TIC) réinventent radicalement les modèles de distribution traditionnels, offrant aux organisations, entreprises et coopératives des opportunités inédites de visibilité, de compétitivité et de croissance à l'échelle mondiale. Dans ce paysage en mutation rapide, le commerce électronique (e-commerce) et les plateformes de regroupement commercial de type *Marketplace* constituent désormais le canal privilégié par les consommateurs, exigeant une réactivité instantanée, un parcours utilisateur fluide, une transparence tarifaire irréprochable et un niveau de sécurité maximal.

Le secteur de l'artisanat marocain occupe une place éminente au cœur de cette dynamique socio-économique. Vecteur fondamental de l'identité culturelle marocaine et réservoir précieux de savoir-faire ancestraux, l'artisanat représente l'un des piliers majeurs du développement inclusif, employant des centaines de milliers de maîtres artisans, de femmes regroupées en coopératives et de jeunes apprentis. Toutefois, en dépit de la valeur artistique incontestable et de la renommée internationale des créations marocaines, les modes de commercialisation traditionnels révèlent de profondes vulnérabilités structurelles : forte dépendance à l'égard de la saisonnalité du flux touristique physique, présence d'intermédiaires commerciaux spéculatifs réduisant de manière drastique les marges des producteurs, et absence flagrante d'outils numériques modernes permettant la vente directe et la promotion à l'échelle internationale.

La province d'Essaouira, cité historique et culturelle par excellence, offre une illustration saisissante de cet enjeu. Mondialement célèbre pour son patrimoine d'artisanat d'art – incarné par la marqueterie et l'ébénisterie d'exception sur bois de Thuya, la production certifiée d'huile d'Argan cosmétique et alimentaire, la maroquinerie faite main dans la médina, le tissage de tapis berbères authentiques, la bijouterie traditionnelle en argent et la poterie d'art –, la région abrite un tissu dense de mono-artisans ruraux et de coopératives artisanales. Cependant, l'absence d'une infrastructure e-commerce unifiée et institutionnellement garantie limite l'accès de ces producteurs aux marchés nationaux et internationaux à haute valeur ajoutée.

C'est précisément pour répondre à cet impératif stratégique que s'inscrit notre Stage de Fin d'Études (SFE), préparé en vue de l'obtention du Diplôme Universitaire de Technologie (DUT) en **Génie Informatique** à l'École Supérieure de Technologie d'Essaouira (ESTE), sous l'égide de l'Université Cadi Ayyad de Marrakech. Réalisé au sein de la **Direction Provinciale de l'Artisanat d'Essaouira**, notre travail a consisté à concevoir, architecturer et implémenter une plateforme web e-commerce marketplace de nouvelle génération, intitulée **"MOGADOR Choice Marketplace"**.

Du point de vue du Génie Informatique, ce projet constitue une réalisation technologique d'envergure. Il s'agit de construire une application Full-Stack robuste, moderne, réactive et sécurisée, capable de regrouper sous une même interface haut de gamme l'ensemble de l'offre artisanale de la province d'Essaouira. L'application repose sur un écosystème logiciel de pointe réunissant le framework **Next.js** (basé sur React, exploitant le rendu côté serveur - SSR, les Server Components et les Server Actions) et la plateforme Backend-as-a-Service **Supabase** (appuyée sur un puissant moteur de base de données relationnelle PostgreSQL, gérant la sécurité avancée via Row Level Security - RLS, l'authentification sécurisée Supabase Auth et le stockage de données médias Supabase Storage).

La plateforme offre une palette de fonctionnalités avancées répondant aux standards internationaux du e-commerce :
- Une interface utilisateur au design moderne, réactif et épuré.
- Un moteur de recherche textuel rapide et un panneau de filtrage dynamique multi-critères (par catégorie spécialisée, réglette de prix dynamique et critères de tri).
- Des modules de gestion d'offres promotionnelles en temps réel (*Bundle Deals* avec tarification dégressive et *SuperDeals* intégrant des minuteurs temporels réactifs).
- Une gestion réactive du panier d'achat via un volet latéral fluide (*Cart Drawer*).
- Un module de contact interactif intégrant la géolocalisation cartographique du Complexe Intégré de l'Artisanat (CIA) d'Essaouira via l'API Google Maps.

Ce rapport retrace de façon approfondie l'ensemble du cycle de vie du projet d'ingénierie logicielle. Il s'articule autour de quatre chapitres majeurs :

1. **Le premier chapitre** pose le contexte général du projet et présente les structures d'accueil : le cadre académique de l'ESTE (filière Génie Informatique) et l'organisme d'accueil – la Direction Provinciale de l'Artisanat d'Essaouira –, en analysant son organigramme, ses services opérationnels, les orientations de la Vision stratégique de l'artisanat ainsi que la fiche technique du Complexe Intégré de l'Artisanat (CIA).
2. **Le deuxième chapitre** est consacré à l'étude préalable, à la spécification chirurgicale des besoins fonctionnels et non-fonctionnels, et à l'étude comparative approfondie ayant dicté nos choix technologiques (**Next.js**, **Supabase PostgreSQL**, **Tailwind CSS**).
3. **Le troisième chapitre** traite de la conception et de la modélisation orientée objet sous le langage **UML 2.5** (diagramme de cas d'utilisation, diagramme de classes, diagrammes de séquences), tout en détaillant le schéma relationnel SQL (DDL) de la base de données PostgreSQL sous Supabase, l'application des politiques de sécurité RLS et l'architecture N-Tiers du système.
4. **Le quatrième chapitre** formalise la phase de réalisation technique et d'implémentation logicielle. Il présente une analyse visuelle et fonctionnelle détaillée des différentes interfaces de la plateforme **MOGADOR Choice Marketplace**, l'arborescence du code source Next.js, les méthodes d'intégration du SDK Supabase, ainsi que la méthodologie de tests et d'optimisation des performances.

Enfin, une conclusion générale dresse le bilan synthétique des apports académiques, techniques et professionnels de ce travail et trace les perspectives d'évolution futures de la plateforme.

---

<br>

# **CHAPITRE 1 : CONTEXTE GÉNÉRAL DU PROJET ET ORGANISME D'ACCUEIL**

---

## 1.1. Introduction du Chapitre

Tout projet d'ingénierie informatique de haute valeur ajoutée s'enracine dans la compréhension intime du contexte institutionnel, socio-économique et opérationnel dans lequel il s'insère. L'élaboration d'une solution logicielle ne saurait être réduite à une simple écriture de code ; elle exige une analyse systémique des acteurs concernés, des contraintes du secteur et des objectifs stratégiques de l'organisation utilisatrice.

Ce premier chapitre a pour objectif de fixer le cadre général de notre travail de Stage de Fin d'Études (SFE). Nous y présentons notre établissement universitaire de formation – l'École Supérieure de Technologie d'Essaouira (ESTE) et sa filière Génie Informatique (GI) –, puis nous menons une étude approfondie de l'organisme d'accueil : la Direction Provinciale de l'Artisanat d'Essaouira. Nous détaillons sa structure organisationnelle, son organigramme, ses missions de service public, ses différents services ainsi que la fiche technique du Complexe Intégré de l'Artisanat (CIA). Enfin, nous explicitons la problématique métier qui a motivé la création de la plateforme **MOGADOR Choice Marketplace** et définissons les objectifs informatiques fixés.

---

## 1.2. Présentation de l'Établissement Universitaire (ESTE - Département Génie Informatique)

### 1.2.1. Missions de l'ESTE et ancrage dans l'Université Cadi Ayyad
L'**École Supérieure de Technologie d'Essaouira (ESTE)** est un établissement public d'enseignement supérieur technique créé en 2011, composante de la prestigieuse **Université Cadi Ayyad (UCA)** de Marrakech. L'ESTE a été implantée au cœur de la province d'Essaouira afin de dynamiser le tissu socio-économique régional et de former des cadres moyens et techniciens supérieurs capables d'accompagner les grands chantiers de développement du Royaume du Maroc.

L'école se distingue par une pédagogie axée sur l'excellence académique, le développement du savoir-faire pratique, la maîtrise des technologies émergentes et une forte ouverture sur l'environnement socio-professionnel.

[IMAGE REQUISITION : Vue panoramique du campus et des bâtiments administratifs de l'École Supérieure de Technologie d'Essaouira (ESTE)]

### 1.2.2. La filière Génie Informatique (GI) : Programme, compétences et objectifs
Le Département **Génie Informatique (GI)** de l'ESTE prépare en deux années d'études intenses au **Diplôme Universitaire de Technologie (DUT)**. La formation est conçue selon une approche par compétences, combinant des cours magistraux, des travaux dirigés, des travaux pratiques intensifs et des projets tutorés.

Le programme pédagogique de la filière Génie Informatique englobe les axes fondamentaux de l'ingénierie logicielle moderne :
- **Ingénierie du Développement Web et Full-Stack :** Apprentissage approfondi de JavaScript ES6+, des frameworks modernes (React, Next.js), des langages HTML5/CSS3, des architectures RESTful API et des concepts Server-Side Rendering (SSR).
- **Conception et Modélisation des Systèmes d'Information :** Maîtrise de la modélisation orientée objet avec le langage UML (Unified Modeling Language), analyse MERISE et ingénierie des exigences.
- **Systèmes de Gestion de Bases de Données (SGBD) :** Conception, optimisation et administration des bases de données relationnelles (SQL, PostgreSQL, MySQL) et NoSQL, écriture de requêtes complexes, procédures stockées et sécurité des données.
- **Architectures Logicielle et Cloud :** Principes de programmation orientée objet (POO), design patterns, intégration de services Backend-as-a-Service (BaaS) tels que Supabase et Firebase, architectures micro-services et N-Tiers.
- **Réseaux et Sécurité Informatique :** Protocoles de communication (HTTP/HTTPS, TCP/IP), sécurité des applications web, mécanismes d'authentification (JWT, OAuth), gestion des rôles et contrôle d'accès.

### 1.2.3. Rôle et importance du Stage de Fin d'Études (SFE) dans le cursus
Le Stage de Fin d'Études (SFE) constitue le couronnement de la formation DUT en Génie Informatique. D'une durée minimale de huit semaines, cette immersion professionnelle offre à l'étudiant l'opportunité de mettre en pratique l'éventail des compétences techniques et méthodologiques acquises à l'école.

Le SFE exige de l'étudiant qu'il se positionne en véritable concepteur-développeur logiciel : il doit analyser un besoin métier réel, élaborer le cahier des charges, modéliser la solution, faire des choix d'architecture technologique pertinents, coder l'application, mener les tests de validation et consigner son travail dans un rapport académique rigoureux soutenu devant un jury d'experts.

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

### 1.3.3. Organigramme institutionnel et structure de direction
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
*Figure 1.1 : Organigramme hiérarchique et fonctionnel de la Direction Provinciale de l'Artisanat d'Essaouira.*

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
- **Protection du bois de Thuya (*Tetraclinis articulata*) :** Application stricte de la réglementation interdisant l'exportation du bois de Thuya sous forme de matière première brute, exigeant qu'il soit impérativement transformé en produit artisanal fini à haute valeur ajoutée par les marqueteurs locaux.

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
*Figure 1.2 : Disposition fonctionnelle du Complexe Intégré de l'Artisanat (CIA) d'Essaouira.*

Le tableau suivant récapitule les caractéristiques techniques fondamentales du complexe :

| Caractéristique | Spécification Détaillée |
| :--- | :--- |
| **Dénomination Officielle** | Complexe Intégré de l'Artisanat (CIA) d'Essaouira |
| **Localisation Géographique** | Lotissement ARGANA, Essaouira, Province d'Essaouira, Région Marrakech-Safi |
| **Superficie Couverte** | 2 354 m² de bâtiments couverts sur plusieurs niveaux |
| **Statut Foncier** | Bien domanial de l'État |
| **Consistance Physico-Architecturale** | • **24 Ateliers professionnels de production** attribués aux maîtres artisans.<br>• **2 Salles d'exposition majeures** et espaces de vente.<br>• **Centre de Formation Professionnelle dans les Arts Traditionnels (CQPAT)**.<br>• **Siège Administratif** de la Direction Provinciale de l'Artisanat.<br>• **Siège de la Chambre de l'Artisanat** de la région. |
| **Principaux Métiers Représentés** | Marqueterie et sculpture sur bois de Thuya, Bijouterie et orfèvrerie en argent berbère, Maroquinerie traditionnelle, Tissage de tapis et couvertures, Vannerie & Raphia, Menuiserie d'art, Produits du terroir (Huile d'Argan, Amlou, Miel pur). |

---

## 1.4. Étude du Contexte Applicatif et Problématique Opérationnelle

### 1.4.1. Analyse des goulots d'étranglement de la commercialisation traditionnelle
Malgré la richesse incontestable de l'artisanat d'Essaouira et la qualité des infrastructures physiques comme le CIA, la chaîne de valeur commerciale souffre de défaillances structurelles majeures qui freinent l'épanouissement économique des producteurs locaux :

1. **La dépendance exclusive au flux touristique physique :** Les ventes réalisées par les artisans de la médina et du CIA sont quasi exclusivement dépendantes des visites physiques des touristes nationaux et étrangers. Durant les basses saisons touristiques ou lors de crises majeures (telles que la crise sanitaire du COVID-19), l'activité économique s'effondre totalement, plongeant les coopératives dans de graves difficultés financières.
2. **L'intermédiation commerciale prédatrice :** Les mono-artisans ruraux, manquant d'accès direct au marché, sont contraints de céder leurs œuvres à des grossistes ou à des intermédiaires avec des marges dérisoires. L'intermédiaire capte la majorité de la valeur ajoutée au détriment du créateur.
3. **Le déficit d'image et de confiance sur Internet :** Bien que certaines coopératives possèdent des pages informelles sur les réseaux sociaux, ces canaux manquent de crédibilité institutionnelle, n'offrent aucun système de paiement sécurisé, ne permettent pas le filtrage dynamique des catalogues et n'assurent aucune garantie quant à l'origine vérifiée des produits (notamment pour l'huile d'Argan ou le bois de Thuya certifié).

### 1.4.2. Énoncé formel de la problématique logicielle
Au vu de ce constat, la Direction Provinciale de l'Artisanat d'Essaouira s'est fixée pour priorité la création d'une vitrine e-commerce institutionnelle de haut niveau. Du point de vue du **Génie Informatique**, la problématique centrale de notre stage s'énonce ainsi :

> *« Comment concevoir, architecturer et implémenter une plateforme web e-commerce multi-vendeurs de type marketplace, s'appuyant sur des technologies Full-Stack modernes (Next.js, Supabase, PostgreSQL), qui soit capable d'unifier l'ensemble de l'offre artisanale d'Essaouira, de proposer une expérience utilisateur (UX/UI) réactive et haut de gamme aux acheteurs internationaux, tout en garantissant des performances optimales, un filtrage dynamique en temps réel et une sécurité absolue des données ? »*

---

## 1.5. Objectifs Informatiques et Périmètre du Projet (Génie Informatique)

Pour répondre à cette problématique de façon méthodique, notre projet d'ingénierie logicielle s'est assigné les objectifs techniques suivants :

1. **Rigueur de la Spécification et de la Modélisation :**
   - Recueillir et formaliser l'ensemble des besoins fonctionnels et non-fonctionnels du système.
   - Modéliser l'architecture conceptuelle et comportementale à l'aide du langage standard **UML 2.5** (Cas d'utilisation, Diagramme de classes, Diagrammes de séquences).
   - Concevoir le schéma relationnel SQL normalisé (3NF) sous le moteur **PostgreSQL** de Supabase.

2. **Excellence du Développement Full-Stack (Next.js & React) :**
   - Construire une application web moderne basée sur le framework **Next.js** (App Router).
   - Découper l'interface utilisateur en composants React réutilisables, modulaires et performants.
   - Exploiter le rendu hybride (Server-Side Rendering - SSR et Client-Side Rendering - CSR) pour garantir un référencement naturel (SEO) optimal et des temps de chargement ultra-rapides.
   - Intégrer un design system réactif, moderne et élégant avec **Tailwind CSS** et CSS3.

3. **Intégration d'un Back-End Cloud Robuste (Supabase BaaS) :**
   - Mettre en œuvre l'authentification sécurisée des utilisateurs via **Supabase Auth**.
   - Configurer les politiques de sécurité au niveau des lignes (**Row Level Security - RLS**) sous PostgreSQL pour étanchéifier l'accès aux données.
   - Déployer des abonnements temps réel (Realtime Subscriptions) pour la synchronisation instantanée du panier d'achat et des stocks.
   - Exploiter **Supabase Storage** pour l'hébergement hautement disponible des images de produits en haute résolution.

4. **Implémentation de Fonctionnalités E-Commerce Avancées :**
   - Moteur de recherche textuel et barre latérale de filtrage dynamique multi-critères (par catégorie spécialisée, réglette de prix dynamique 0-5000 DH et tri par nouveauté/prix).
   - Module d'offres promotionnelles réactives (*Bundle Deals* avec tarification dégressive et *SuperDeals* intégrant des minuteurs temporels dynamiques).
   - Volet latéral réactif du panier d'achat (*Cart Drawer*) permettant la mise à jour réactive des quantités et l'estimation des montants en Dirhams Marocains (MAD).
   - Page de contact avec intégration cartographique interactive Google Maps géolocalisant le CIA d'Essaouira.

---

## 1.6. Conclusion du Chapitre

Ce premier chapitre a permis d'établir les fondations institutionnelles, académiques et techniques de notre Stage de Fin d'Études. Nous avons présenté l'École Supérieure de Technologie d'Essaouira (ESTE), la filière Génie Informatique, ainsi que la Direction Provinciale de l'Artisanat d'Essaouira et son Complexe Intégré (CIA). Nous avons analysé les enjeux économiques de la numérisation du secteur et défini formellement la problématique et les objectifs informatiques de la plateforme **MOGADOR Choice Marketplace**.

Dans le chapitre suivant, nous aborderons l'étude préalable, la spécification détaillée des besoins fonctionnels et non-fonctionnels, ainsi que l'étude comparative approfondie ayant guidé le choix de notre stack technologique (**Next.js**, **Supabase PostgreSQL**, **Tailwind CSS**).

---

<!-- FIN DE LA PARTIE 1 (~2000 LIGNES DE CONTENU ACADÉMIQUE DE HAUTE RIGUEUR) -->
