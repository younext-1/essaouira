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

- **Réalisé par :** Étudiant en Génie Informatique (ESTE)
- **Encadrant Professionnel :** M. BOURAGBA Mustapha (Directeur Provincial de l'Artisanat d'Essaouira)
- **Encadrant Pédagogique :** Professeur du Département Génie Informatique (ESTE)
- **Organisme d'Accueil :** Direction Provinciale de l'Artisanat d'Essaouira – Complexe Intégré de l'Artisanat (CIA)
- **Stack Technologique :** Next.js (React Framework / App Router), Supabase (PostgreSQL / RLS / Auth / Storage), Tailwind CSS / Vanilla CSS, TypeScript / ES6+
- **Année Universitaire :** 2023 / 2024

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
> _À tous mes camarades de promotion de Génie Informatique,_  
> _En souvenir des défis relevés ensemble, des nuits d'apprentissage intense, des débats passionnés sur l'architecture logicielle et de l'esprit d'équipe exemplaire qui a marqué ces deux années de formation universitaire._
>
> _À toute personne ayant contribué, de près ou de loin, à l'aboutissement de ce travail académique et professionnel._

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
- Advanced multi-criteria search engine capabilities (category-based filtering, interactive dynamic price limit slider, and real-time sorting parameters).
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

- **Figure 1.1** : Organigramme Hiérarchique et Fonctionnel de la Direction Provinciale de l'Artisanat d'Essaouira.
- **Figure 1.2** : Vue Architecturale et Ateliers du Complexe Intégré de l'Artisanat (CIA) d'Essaouira.
- **Figure 3.1** : Diagramme de Cas d'Utilisation Global sous la norme UML 2.5.
- **Figure 3.2** : Diagramme de Classes Conceptuel de la plateforme MOGADOR Choice.
- **Figure 3.3** : Diagramme de Séquence du processus d'Authentification Supabase.
- **Figure 3.4** : Diagramme de Séquence de la recherche et du filtrage dynamique en temps réel.
- **Figure 3.5** : Diagramme de Séquence de la gestion réactive du Panier (Cart Drawer).
- **Figure 3.6** : Schéma Relationnel des Données (MPD) de la base de données PostgreSQL Supabase.
- **Figure 3.7** : Diagramme de l'Architecture Système N-Tiers (Next.js App Router + Supabase Cloud).
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
- **Figure 4.6** : Interface du volet latéral du Panier d'Achat (Cart Drawer).  
  [IMAGE REQUISITION : Capture d'écran du volet latéral du Panier d'Achat réactif avec gestion des quantités]
- **Figure 4.7** : Modale et Formulaire de Création de Compte Utilisateur (Register).  
  [IMAGE REQUISITION : Capture d'écran de l'interface d'inscription utilisateur]
- **Figure 4.8** : Modale et Formulaire de Connexion Utilisateur (Sign In / Login).  
  [IMAGE REQUISITION : Capture d'écran de l'interface de connexion utilisateur]
- **Figure 4.9** : Page de Contact avec Formulaire et Géolocalisation Google Maps du CIA Essaouira.  
  [IMAGE REQUISITION : Capture d'écran de la page de contact avec carte interactive Google Maps]
- **Figure 4.10** : Console de Gestion Supabase (Table Editor & Politiques de Sécurité RLS).  
  [IMAGE REQUISITION : Capture d'écran du tableau de bord Supabase avec les tables SQL et politiques RLS]

---

<br>

## **LISTE DES TABLEAUX**

- **Tableau 1.1** : Fiche Technique et Consistance Physique du Complexe Intégré de l'Artisanat (CIA) d'Essaouira.
- **Tableau 2.1** : Analyse comparative des frameworks Web Full-Stack (Next.js vs React SPA vs Angular).
- **Tableau 2.2** : Analyse comparative des solutions Back-End (Supabase PostgreSQL vs Firebase NoSQL vs Node/Express custom).
- **Tableau 3.1** : Matrice de spécification détaillée des acteurs et privilèges système.
- **Tableau 3.2** : Description formelle du cas d'utilisation "Filtrer les produits par catégorie et prix max".
- **Tableau 3.3** : Description formelle du cas d'utilisation "Gérer le panier réactif (Cart Drawer)".
- **Tableau 3.4** : Dictionnaire de données de la table SQL `profiles`.
- **Tableau 3.5** : Dictionnaire de données de la table SQL `products`.
- **Tableau 3.6** : Dictionnaire de données de la table SQL `categories`.
- **Tableau 3.7** : Dictionnaire de données de la table SQL `cart_items`.
- **Tableau 4.1** : Arborescence des composants React du projet Next.js.
- **Tableau 4.2** : Matrice des tests d'intégration et de validation des fonctionnalités.

---

<br>

## **LISTE DES ABRÉVIATIONS ET GLOSSAIRE TECHNIQUE**

- **ESTE** : École Supérieure de Technologie d'Essaouira
- **UCA** : Université Cadi Ayyad
- **SFE** : Stage de Fin d'Études
- **DUT** : Diplôme Universitaire de Technologie
- **GI** : Génie Informatique
- **CIA** : Complexe Intégré de l'Artisanat
- **INDH** : Initiative Nationale pour le Développement Humain
- **PME** : Petites et Moyennes Entreprises
- **UML** : Unified Modeling Language (Langage de Modélisation Unifié)
- **SQL** : Structured Query Language
- **DDL** : Data Definition Language
- **DML** : Data Manipulation Language
- **RLS** : Row Level Security (Sécurité au niveau des lignes sous PostgreSQL)
- **SSR** : Server-Side Rendering (Rendu côté serveur)
- **ISR** : Incremental Static Regeneration
- **SPA** : Single Page Application
- **API** : Application Programming Interface
- **REST** : Representational State Transfer
- **JSON** : JavaScript Object Notation
- **DOM** : Document Object Model
- **CTA** : Call To Action (Bouton d'action prépondérant)
- **MAD / DH** : Moroccan Dirham (Dirham Marocain)
- **UI** : User Interface (Interface Utilisateur)
- **UX** : User Experience (Expérience Utilisateur)

---

<br>

## **INTRODUCTION GÉNÉRALE**

À l'ère de la quatrième révolution industrielle, la transformation digitale s'est imposée comme le catalyseur majeur de la modernisation économique et du développement territorial. Les technologies de l'information et de la communication (TIC) réinventent radicalement les modèles de distribution traditionnels, offrant aux organisations, entreprises et coopératives des opportunités inédites de visibilité, de compétitivité et de croissance à l'échelle mondiale. Dans ce paysage en mutation rapide, le commerce électronique (e-commerce) et les plateformes de regroupement commercial de type _Marketplace_ constituent désormais le canal privilégié par les consommateurs, exigeant une réactivité instantanée, un parcours utilisateur fluide, une transparence tarifaire irréprochable et un niveau de sécurité maximal.

Le secteur de l'artisanat marocain occupe une place éminente au cœur de cette dynamique socio-économique. Vecteur fondamental de l'identité culturelle marocaine et réservoir précieux de savoir-faire ancestraux, l'artisanat représente l'un des piliers majeurs du développement inclusif, employant des centaines de milliers de maîtres artisans, de femmes regroupées en coopératives et de jeunes apprentis. Toutefois, en dépit de la valeur artistique incontestable et de la renommée internationale des créations marocaines, les modes de commercialisation traditionnels révèlent de profondes vulnérabilités structurelles : forte dépendance à l'égard de la saisonnalité du flux touristique physique, présence d'intermédiaires commerciaux spéculatifs réduisant de manière drastique les marges des producteurs, et absence flagrante d'outils numériques modernes permettant la vente directe et la promotion à l'échelle internationale.

La province d'Essaouira, cité historique et culturelle par excellence, offre une illustration saisissante de cet enjeu. Mondialement célèbre pour son patrimoine d'artisanat d'art – incarné par la marqueterie et l'ébénisterie d'exception sur bois de Thuya, la production certifiée d'huile d'Argan cosmétique et alimentaire, la maroquinerie faite main dans la médina, le tissage de tapis berbères authentiques, la bijouterie traditionnelle en argent et la poterie d'art –, la région abrite un tissu dense de mono-artisans ruraux et de coopératives artisanales. Cependant, l'absence d'une infrastructure e-commerce unifiée et institutionnellement garantie limite l'accès de ces producteurs aux marchés nationaux et internationaux à haute valeur ajoutée.

C'est précisément pour répondre à cet impératif stratégique que s'inscrit notre Stage de Fin d'Études (SFE), préparé en vue de l'obtention du Diplôme Universitaire de Technologie (DUT) en **Génie Informatique** à l'École Supérieure de Technologie d'Essaouira (ESTE), sous l'égide de l'Université Cadi Ayyad de Marrakech. Réalisé au sein de la **Direction Provinciale de l'Artisanat d'Essaouira**, notre travail a consisté à concevoir, architecturer et implémenter une plateforme web e-commerce marketplace de nouvelle génération, intitulée **"MOGADOR Choice Marketplace"**.

Du point de vue du Génie Informatique, ce projet constitue une réalisation technologique d'envergure. Il s'agit de construire une application Full-Stack robuste, moderne, réactive et sécurisée, capable de regrouper sous une même interface haut de gamme l'ensemble de l'offre artisanale de la province d'Essaouira. L'application repose sur un écosystème logiciel de pointe réunissant le framework **Next.js** (basé sur React, exploitant le rendu côté serveur - SSR, les Server Components et les Server Actions) et la plateforme Backend-as-a-Service **Supabase** (appuyée sur un puissant moteur de base de données relationnelle PostgreSQL, gérant la sécurité avancée via Row Level Security - RLS, l'authentification sécurisée Supabase Auth et le stockage de données médias Supabase Storage).

La plateforme offre une palette de fonctionnalités avancées répondant aux standards internationaux du e-commerce :

- Une interface utilisateur au design moderne, réactif et épuré.
- Un moteur de recherche textuel rapide et un panneau de filtrage dynamique multi-critères (par catégorie spécialisée, réglette de prix dynamique et critères de tri).
- Des modules de gestion d'offres promotionnelles en temps réel (_Bundle Deals_ avec tarification dégressive et _SuperDeals_ intégrant des minuteurs temporels réactifs).
- Une gestion réactive du panier d'achat via un volet latéral fluide (_Cart Drawer_).
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

### 1.4.2. Énoncé formel de la problématique logicielle

Au vu de ce constat, la Direction Provinciale de l'Artisanat d'Essaouira s'est fixée pour priorité la création d'une vitrine e-commerce institutionnelle de haut niveau. Du point de vue du **Génie Informatique**, la problématique centrale de notre stage s'énonce ainsi :

> _« Comment concevoir, architecturer et implémenter une plateforme web e-commerce multi-vendeurs de type marketplace, s'appuyant sur des technologies Full-Stack modernes (Next.js, Supabase, PostgreSQL), qui soit capable d'unifier l'ensemble de l'offre artisanale d'Essaouira, de proposer une expérience utilisateur (UX/UI) réactive et haut de gamme aux acheteurs internationaux, tout en garantissant des performances optimales, un filtrage dynamique en temps réel et une sécurité absolue des données ? »_

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
   - Module d'offres promotionnelles réactives (_Bundle Deals_ avec tarification dégressive et _SuperDeals_ intégrant des minuteurs temporels dynamiques).
   - Volet latéral réactif du panier d'achat (_Cart Drawer_) permettant la mise à jour réactive des quantités et l'estimation des montants en Dirhams Marocains (MAD).
   - Page de contact avec intégration cartographique interactive Google Maps géolocalisant le CIA d'Essaouira.

---

## 1.6. Conclusion du Chapitre

Ce premier chapitre a permis d'établir les fondations institutionnelles, académiques et techniques de notre Stage de Fin d'Études. Nous avons présenté l'École Supérieure de Technologie d'Essaouira (ESTE), la filière Génie Informatique, ainsi que la Direction Provinciale de l'Artisanat d'Essaouira et son Complexe Intégré (CIA). Nous avons analysé les enjeux économiques de la numérisation du secteur et défini formellement la problématique et les objectifs informatiques de la plateforme **MOGADOR Choice Marketplace**.

Dans le chapitre suivant, nous aborderons l'étude préalable, la spécification détaillée des besoins fonctionnels et non-fonctionnels, ainsi que l'étude comparative approfondie ayant guidé le choix de notre stack technologique (**Next.js**, **Supabase PostgreSQL**, **Tailwind CSS**).

---

<br>

# **CHAPITRE 2 : ÉTUDE PRÉALABLE, SPÉCIFICATION DES BESOINS ET ÉCOSYSTÈME TECHNOLOGIQUE**

---

## 2.1. Introduction du Chapitre

Dans le cycle de vie d'un projet d'ingénierie logicielle, la phase d'étude préalable et de spécification des besoins constitue une étape décisionnelle charnière. Elle fait le pont entre la compréhension des exigences métiers formulées par les utilisateurs finaux (l'organisme d'accueil, les coopératives et les acheteurs) et l'élaboration de la réponse technique et architecturale par l'équipe de développement.

Une spécification incomplète ou imprécise conduit inévitablement à des erreurs de conception, des surcoûts d'implémentation et une insatisfaction des usagers. À l'inverse, une analyse méthodique et rigoureuse permet de formaliser avec précision l'ensemble des cas d'usage, de garantir la cohérence des flux de données et d'opérer des choix technologiques pertinents et pérennes.

Ce deuxième chapitre est consacré à l'étude approfondie des besoins de la plateforme **MOGADOR Choice Marketplace**. Nous y présentons tout d'abord une analyse comparative des systèmes d'information et canaux de distribution existants. Nous détaillons ensuite la spécification exhaustive des besoins fonctionnels de la plateforme (gestion de l'identité, moteur de recherche et filtres dynamiques, modules promotionnels, panier réactif, géolocalisation) et des besoins non-fonctionnels (ergonomie UI/UX, performances SSR, sécurité RLS, scalabilité). Enfin, nous menons une étude comparative rigoureuse justifiant le choix de notre stack technologique Full-Stack moderne : **Next.js** (framework React avec App Router et Server Actions) et **Supabase** (Backend-as-a-Service basé sur le moteur relationnel PostgreSQL).

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
| (Boutiques & Médina)   | • Absence de traçabilité des acheteurs    | • Accès direct sans intermédiaires |
|                        | • Zone géographique limitée à Essaouira   | • Paiement et réservation en ligne |
+------------------------+-------------------------------------------+------------------------------------+
| Réseaux Sociaux        | • Manque d'intégration e-commerce native  | • Catalogue dynamique structuré    |
| (Instagram, Facebook)  | • Absence de paiement sécurisé            | • Moteur de recherche & filtres SQL|
|                        | • Pas de gestion temps réel des stocks    | • Crédibilité institutionnelle     |
+------------------------+-------------------------------------------+------------------------------------+
| Sites Web Statiques    | • Rechargements de pages lents et rigides | • Architecture SPA avec Next.js    |
| (Catalogues PDF/HTML)  | • Moteurs de recherche inexistants        | • Rendu hybride SSR / CSR rapide   |
|                        | • Pas de panier réactif ni promotions     | • Base de données relationnelle    |
+---------------------------------------------------------------------------------------------------------+
```

L'analyse de ce tableau comparatif met en évidence la supériorité d'une solution de marketplace unifiée. Les canaux traditionnels manquent d'interactivité et de scalabilité, tandis que **MOGADOR Choice Marketplace** combine la puissance d'un moteur de recherche relationnel, la réactivité des composants React et la crédibilité d'une plateforme institutionnellement garantie par la Direction Provinciale de l'Artisanat.

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
  - **Client / Acheteur :** Accès à la gestion du panier, à la liste des favoris, au suivi des commandes et au profil personnel.
  - **Artisan / Coopérative :** Accès futur à l'espace de gestion de stock et de publication de produits.
  - **Administrateur (Direction) :** Supervision globale de la plateforme, gestion des catégories et modération.

---

### 2.3.2. Moteur de Recherche et Exploration du Catalogue ("Explore Workshop Collections")

Le catalogue est le cœur marchand de la plateforme. Il doit permettre à l'utilisateur d'accéder sans effort aux trésors de l'artisanat d'Essaouira.

![MOGADOR Choice Marketplace - Header & Moteur de Recherche](rappor/img/Screenshot%202026-08-02%20191410.png)
_Figure 2.1 : Vue de l'En-tête (Header) intégrant le moteur de recherche textuel et la navigation par catégories._

- **Barre de Recherche Textuelle Globale (Search Engine) :**
  - Positionnée au centre du Header pour une accessibilité permanente.
  - Invite de recherche explicite : _"Search premium crafts, Thuya, Argan, Boutiques..."_.
  - Exécution de requêtes full-text search optimisées sur la base PostgreSQL Supabase, interrogeant simultanément les nom de produits, descriptions et mots-clés de matières premières.
- **Explorateur de Catégories Spécialisées :**
  - Bouton menu déroulant _"All Categories"_.
  - Barre de navigation rapide donnant accès direct aux familles de produits :
    - **Artisanal Wood :** Objets d'art, boîtes et marqueterie en bois de Thuya certifié.
    - **Cosmetics & Oils :** Elixirs d'huile d'Argan pure (cosmétique et gastronomique), Amlou, soins naturels.
    - **Moroccan Rugs :** Tapis berbères tissés à la hand par les coopératives féminines.
    - **Leather Goods :** Maroquinerie de la médina (sacs, babouches, poufs en cuir).
    - **Pottery & Ceramic :** Céramiques et poteries traditionnelles.
    - **Surf Gear & Water Sports :** Équipements de surf et réservations de cours (spécificité d'Essaouira, capitale du vent et des sports nautiques).

---

### 2.3.3. Système de Filtrage Dynamique Multi-Critères et Tri Temps Réel

L'interface d'exploration **"Explore the Workshop Collections"** met à disposition des utilisateurs un panneau de filtrage latéral d'une grande précision.

![MOGADOR Choice Marketplace - Interface de Filtrage](<rappor/img/WhatsApp%20Image%202026-08-02%20at%2019.23.17%20(1).jpeg>)
_Figure 2.2 : Interface "Explore the Workshop Collections" montrant la barre latérale de filtres dynamiques et les résultats correspondants._

- **Composants du Panneau Latéral de Filtres (Filter Sidebar) :**
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
  - Titre de l'article (ex: _Manteau 3 pièces avec broderie traditionnelle_, _Sandales en cuir faites hand_).
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

- **Temps de chargement initial :** Affichage du premier contenu visible (First Contentful Paint - FCP) sous la barre des 1.2 secondes.
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
- **Typage et Qualité du Code :** Respect des conventions de nommage et modularité du code pour faciliter les évolutions futures (ex: ajout ultérieur d'une passerelle de paiement en ligne).

---

## 2.5. Étude Comparative et Choix de la Stack Technologique

Le choix de l'écosystème technologique constitue une décision fondamentale en ingénierie logicielle. Il conditionne la vitesse de développement, la maintenabilité du code, la sécurité et la capacité de l'application à monter en charge.

### 2.5.1. Framework Front-End / Full-Stack : Next.js (vs React SPA vs Angular)

Pour concevoir la couche de présentation et d'interaction de **MOGADOR Choice Marketplace**, nous avons comparé trois solutions majeures du marché :

| Critère d'Évaluation            | React SPA (Client-Only)     | Angular (Google)   | **Next.js App Router (Choisi)**     |
| :------------------------------ | :-------------------------- | :----------------- | :---------------------------------- |
| **Mode de Rendu**               | Client-Side Rendering (CSR) | CSR / SSR complexe | **SSR, SSG, ISR & CSR Hybride**     |
| **Référencement (SEO)**         | Moyen (Nécessite pré-rendu) | Moyen              | **Excellence Native (SSR)**         |
| **Architecture**                | Bibliothèque UI             | Framework lourd    | **Framework Full-Stack React**      |
| **Server Components & Actions** | Non                         | Non                | **Oui (Exclusivité Next.js 13/14)** |
| **Optimisation des Images**     | Manuelle                    | Manuelle           | **Composant `next/image` Natif**    |
| **Temps de Chargement Initial** | Moyen                       | Moyen à Lourd      | **Ultra-Rapide (Code Splitting)**   |

_Tableau 2.1 : Matrice comparative des frameworks Front-End / Full-Stack._

**Justification du choix de Next.js :**  
Next.js s'impose comme la solution la plus élaborée pour un projet e-commerce d'envergure. Contrairement à une simple application React SPA qui effectue tout son rendu dans le navigateur de l'utilisateur, Next.js génère le HTML côté serveur (SSR), garantissant un temps d'affichage initial exceptionnel et un indexage parfait du catalogue de l'artisanat par Google. De plus, son architecture App Router et l'utilisation des _Server Actions_ permettent d'exécuter des mutations de données sécurisées sans avoir à développer un serveur API Express séparé.

---

### 2.5.2. Solution Back-End & Base de Données : Supabase PostgreSQL (vs Firebase NoSQL vs Node/Express custom)

Pour la couche de données, d'authentification et de stockage media, nous avons procédé à une analyse comparative entre les solutions Cloud et traditionnelles :

| Critère d'Évaluation            | Node.js + Express + MongoDB  | Google Firebase               | **Supabase Cloud (Choisi)**                |
| :------------------------------ | :--------------------------- | :---------------------------- | :----------------------------------------- |
| **Paradigme de Données**        | NoSQL orienté documents      | NoSQL JSON Store              | **Relationnel SQL (PostgreSQL Natif)**     |
| **Intégrité des Données**       | Faible (Contrôle applicatif) | Faible                        | **Absolue (Clés Étrangères, CONTRAINTES)** |
| **Requêtes & Joins**            | Complexes                    | Impossibles (Denormalisation) | **Puissance SQL (JOINS, Aggregations)**    |
| **Sécurité des Données**        | Middleware manuel            | Firebase Security Rules       | **Row Level Security (RLS) PostgreSQL**    |
| **Vendor Lock-In (Dépendance)** | Faible                       | Très Élevé (Propriétaire)     | **Nul (Open-Source PostgreSQL)**           |
| **Vitesse de Déploiement**      | Lente (Développement manuel) | Rapide (BaaS)                 | **Extrêmement Rapide (BaaS SQL)**          |

_Tableau 2.2 : Matrice comparative des solutions Back-End et de Bases de Données._

**Justification du choix de Supabase PostgreSQL :**  
Bien que Firebase offre une prise en main rapide, son modèle NoSQL non-relationnel révèle de graves limites pour une plateforme e-commerce multi-vendeurs : impossibilité de réaliser des requêtes de jointures SQL entre produits, catégories et utilisateurs, et contrainte d'avoir à dupliquer les données.  
**Supabase** combine le meilleur des deux mondes : il offre la simplicité d'un Backend-as-a-Service (Auth, Storage, Realtime) tout en s'appuyant sur le moteur relationnel **PostgreSQL**, le SGBD open-source le plus puissant au monde. Supabase garantit l'intégrité référentielle absolue des transactions commerciales (via les clés étrangères et contraintes SQL) et offre une sécurité inégalée grâce au système **Row Level Security (RLS)**.

---

### 2.5.3. Outillage de Développement et CI/CD (VS Code, Git, GitHub, Vercel)

- **Éditeur de Code Source :** Visual Studio Code (VS Code) avec extensions ES7+ React, Tailwind CSS IntelliSense et Supabase Snippets.
- **Gestionnaire de Versionnement :** Git et plateforme d'hébergement distante GitHub pour le versionnement du code.
- **Plateforme de Déploiement Continu (CI/CD) :** **Vercel** (créateur de Next.js), permettant le déploiement automatisé à chaque `git push` avec des performances Edge Network mondiales.

---

## 2.6. Conclusion du Chapitre

Ce deuxième chapitre a permis d'établir une spécification chirurgicale des exigences de la plateforme **MOGADOR Choice Marketplace**. Nous avons formalisé l'ensemble des cas d'usage fonctionnels (authentification Supabase, moteur de recherche, filtres dynamiques, promotions, panier réactif, contact Google Maps) ainsi que les exigences non-fonctionnelles de performance et de sécurité. Enfin, l'étude comparative a démontré la pertinence exceptionnelle du couple **Next.js** et **Supabase PostgreSQL**.

Le chapitre suivant sera consacré à la conception détaillée et à la modélisation orientée objet sous le langage **UML 2.5**, ainsi qu'à l'élaboration du schéma relationnel SQL de la base de données PostgreSQL.

---

<br>

# **CHAPITRE 3 : ARCHITECTURE LOGICIELLE, MODÉLISATION UML ET SCHÉMA DE BASE DE DONNÉES SQL (SUPABASE)**

---

## 3.1. Introduction du Chapitre

Dans le cadre du génie informatique et du développement d'applications d'entreprise, la phase de conception théorique et d'architecture logicielle constitue le véritable garant de la pérennité, de la robustesse et de la sécurité du système d'information. Produire du code source sans modélisation préalable équivaut à construire un ouvrage d'art sans plan d'architecte : les anomalies de structures, les incohérences de données et les vulnérabilités de sécurité émergent inévitablement lors des phases d'exploitation.

Pour la plateforme **MOGADOR Choice Marketplace**, dont l'ambition est d'unifier l'ensemble de l'offre artisanale de la province d'Essaouira et d'offrir un service sans rupture aux acheteurs mondiaux, la rigueur de conception est une exigence absolue. Notre système doit gérer des flux d'informations complexes : authentification sécurisée des utilisateurs, gestion d'un catalogue multi-catégories enrichi, filtrage dynamique en temps réel, calculs promotionnels dégressifs, persistance réactive du panier d'achat et isolation stricte des données sous contraintes de sécurité.

Ce troisième chapitre est entièrement dédié à la modélisation formelle et à l'architecture logicielle de la plateforme. Nous y adoptons la démarche de conception orientée objet basée sur la norme **UML 2.5 (Unified Modeling Language)**. Nous présentons une caractérisation chirurgicale des acteurs du système, le diagramme global et les spécifications textuelles des cas d'utilisation, le diagramme de classes conceptuel ainsi que les diagrammes de séquences comportementaux. Par la suite, nous exposons le modèle relationnel physique (MPD) et fournissons le code SQL complet (DDL) de la base de données **PostgreSQL Supabase**, enrichi par la mise en œuvre des politiques de sécurité **Row Level Security (RLS)**. Enfin, nous théorisons l'architecture N-Tiers sous-jacente au framework **Next.js** et aux services cloud **Supabase**.

---

## 3.2. Démarche de Conception Orientée Objet et Norme UML 2.5

La conception de la plateforme **MOGADOR Choice Marketplace** s'appuie sur le paradigme orienté objet et la norme **UML 2.5**, reconnue comme le standard international d'ingénierie logicielle par l'Object Management Group (OMG).

La modélisation UML s'articule autour de deux axes complémentaires :

1. **La Modélisation Statique (Structurelle) :** Permettant de figer les concepts du domaine métier, la structure des données et les relations inter-objets. Elle est matérialisée par le _Diagramme de Classes_ et le _Modèle Physique des Données (MPD) SQL_.
2. **La Modélisation Dynamique (Comportementale) :** Permettant de capturer les exigences fonctionnelles et d'illustrer la chronologie des échanges de messages entre l'utilisateur, les composants d'interface React (Next.js) et le moteur de base de données PostgreSQL (Supabase). Elle est formalisée par les _Diagrammes de Cas d'Utilisation_ et les _Diagrammes de Séquences_.

```
+---------------------------------------------------------------------------------------------------------+
|                                  DÉMARCHE DE CONCEPTION UML 2.5 & SQL                                  |
+---------------------------------------------------------------------------------------------------------+
|                                    [ANALYSE DES EXIGENCES MÉTIERS]                                     |
|                                                  |                                                      |
|                                                  v                                                      |
|                                  [DIAGRAMME DE CAS D'UTILISATION]                                       |
|                                 (Périmètre Fonctionnel & Acteurs)                                       |
|                                                  |                                                      |
|                         +------------------------+------------------------+                             |
|                         |                                                 |                             |
|                         v                                                 v                             |
|             [DIAGRAMME DE CLASSES]                            [DIAGRAMMES DE SÉQUENCES]                 |
|       (Entités Métiers & Relations)                     (Chronologie des Échanges)                      |
|                         |                                                 |                             |
|                         +------------------------+------------------------+                             |
|                                                  |                                                      |
|                                                  v                                                      |
|                                [SCHÉMA RELATIONNEL SQL POSTGRESQL]                                      |
|                                (Tables, Clés, Contraintes DDL & RLS)                                    |
+---------------------------------------------------------------------------------------------------------+
```

---

## 3.3. Identification et Spécification des Acteurs du Système

Un **acteur** au sens UML représente l'abstraction d'un rôle joué par une entité externe (humaine ou système autonome) qui interagit directement avec l'application logicielle. Une identification précise des acteurs permet de déterminer les niveaux de privilèges et les politiques de sécurité à appliquer au niveau des lignes sous PostgreSQL (RLS).

Nous avons identifié quatre acteurs majeurs au sein de l'écosystème **MOGADOR Choice Marketplace** :

### 1. Acteur : Client / Visiteur Non-Authentifié (Guest Client)

- **Description :** Tout internaute (touriste, consommateur national ou international) accédant à la plateforme web sans s'être préalablement identifié.
- **Privilèges & Capacités :**
  - Naviguer librement sur la page d'accueil, les sections d'offres et les vitrines thématiques.
  - Exécuter des recherches textuelles globales sur l'ensemble du catalogue d'artisanat.
  - Manipuler le panneau latéral de filtres (sélection de catégories, réglette de prix max 0-5000 DH, tri par prix/nouveauté).
  - Consulter les fiches détaillées des produits (photographies, descriptions, notes, avis).
  - Consulter les offres promotionnelles en temps réel (_Bundle Deals_ et _SuperDeals_ avec minuteur).
  - Ajouter des articles à un panier d'achat temporaire (stocké dans le State React local et le LocalStorage).
  - Consulter la page de contact et visualiser la carte interactive Google Maps du CIA d'Essaouira.
- **Limitations :** Ne peut pas valider définitivement une commande, ni enregistrer une liste de favoris permanente.

### 2. Acteur : Client Authentifié / Acheteur (Registered Client)

- **Description :** Visiteur ayant créé un compte personnel sécurisé sur la plateforme via le module Supabase Auth.
- **Privilèges & Capacités :**
  - Hérite de l'ensemble des capacités du Visiteur Non-Authentifié.
  - Bénéficie de la persistance automatique de son panier d'achat dans la base de données PostgreSQL Supabase (synchrone entre tous ses appareils).
  - Gérer son profil personnel (Nom complet, Téléphone, Adresse de livraison).
  - Enregistrer et consulter une liste d'articles favoris (_Wishlist_).
  - Soumettre des messages de contact enregistrés sous son identifiant `user_id`.
  - Valider des commandes et consulter son historique d'achats dans la rubrique _"My Orders"_.

### 3. Acteur : Artisan / Coopérative Artisanale (Artisan Merchant)

- **Description :** Maître artisan, entreprise artisanale ou coopérative affiliée au Complexe Intégré de l'Artisanat (CIA) d'Essaouira.
- **Privilèges & Capacités :**
  - Disposer d'une vitrine identifiée présentant les créations spécifiques de l'atelier (ex: _Coopérative Essabijoux Chic_, _Coopérative Lofia Sculpture_).
  - Consulter les statistiques de consultation et de ventes de ses produits sur la marketplace.
  - Fournir à la Direction les informations techniques et photographies des objets artisanaux certifiés.

### 4. Acteur : Administrateur Système / Direction Provinciale (System Admin)

- **Description :** Cadre ou responsable informatique au sein de la Direction Provinciale de l'Artisanat d'Essaouira.
- **Privilèges & Capacités :**
  - Supervision globale et modération du catalogue de produits et des coopératives inscrites.
  - Gestion des catégories spécialisées et validation de l'authenticité des labels (_Bois de Thuya certifié_, _Huile d'Argan pure_).
  - Configuration des paramètres d'offres promotionnelles globales (_SuperDeals_, _Bundle Deals_).
  - Consultation des messages transmis via le formulaire de contact et analyse des statistiques de fréquentation.

---

### Tableau Récapitulatif Matriciel des Acteurs et Privilèges Système

| Fonctionnalité / Module Système            | Visiteur (Guest) | Client Authentifié | Artisan / Coopérative | Administrateur (Direction) |
| :----------------------------------------- | :--------------: | :----------------: | :-------------------: | :------------------------: |
| **Consultation du Catalogue & Recherche**  |     **Oui**      |      **Oui**       |        **Oui**        |          **Oui**           |
| **Application des Filtres & Prix Max**     |     **Oui**      |      **Oui**       |        **Oui**        |          **Oui**           |
| **Ajout au Panier Temporaire (Local)**     |     **Oui**      |      **Oui**       |        **Oui**        |          **Oui**           |
| **Création de Compte & Auth (Supabase)**   |     **Oui**      | **DÉJÀ CONNECTÉ**  |        **Oui**        |          **Oui**           |
| **Panier Persistant en Base SQL**          |       Non        |      **Oui**       |        **Oui**        |          **Oui**           |
| **Gestion des Favoris (Wishlist)**         |       Non        |      **Oui**       |        **Oui**        |          **Oui**           |
| **Envoi de Message de Contact**            |     **Oui**      |      **Oui**       |        **Oui**        |          **Oui**           |
| **Gestion des Produits de l'Atelier**      |       Non        |        Non         |        **Oui**        |          **Oui**           |
| **Modération Globale & Configuration RLS** |       Non        |        Non         |          Non          |          **Oui**           |

_Tableau 3.1 : Matrice de spécification détaillée des acteurs et privilèges système._

---

## 3.4. Diagramme de Cas d'Utilisation (Use Case Diagram)

### 3.4.1. Diagramme Global des Cas d'Utilisation

Le diagramme de cas d'utilisation ci-dessous formalise l'ensemble des interactions entre les acteurs et les grands modules fonctionnels de la plateforme **MOGADOR Choice Marketplace**.

```
                                  ===================================================================
                                                  MOGADOR CHOICE MARKETPLACE SYSTEM
                                  ===================================================================

                                    +---------------------------------------------------------------+
                                    | [MODULE AUTHENTIFICATION & SESSIONS]                          |
                                    |  ( UC01: S'inscrire / Créer un compte )                       |
                                    |  ( UC02: Se connecter avec Email/Password )                   |
                                    |  ( UC03: Se déconnecter / Détruire Token JWT )                |
                                    +---------------------------------------------------------------+
                                                                    ^
                                                                    | <<include>>
                                    +-------------------------------+-------------------------------+
                                    | [MODULE RECHERCHE & EXPLORATION CATALOGUE]                    |
                                    |  ( UC04: Exécuter une recherche textuelle globale )           |
                                    |  ( UC05: Filtrer par catégorie spécialisée )                  |
                                    |  ( UC06: Ajuster la réglette de prix max 0-5000 DH )          |
                                    |  ( UC07: Trier le catalogue par Nouveauté / Prix )           |
                                    |  ( UC08: Consulter la fiche détaillée d'un produit )          |
  +--------------------------+      +---------------------------------------------------------------+
  |                          |      | [MODULE PROMOTIONS & OFFRES SPÉCIALES]                        |
  |     VISITEUR (GUEST)     |----->|  ( UC09: Consulter la section "TODAY'S DEALS" )               |
  |                          |      |  ( UC10: Visualiser les Bundle Deals 3+ items )               |
  |                          |----->|  ( UC11: Suivre les SuperDeals avec Minuteur Temporel )       |
  +--------------------------+      +---------------------------------------------------------------+
               |                    | [MODULE PANIER & COMMANDES]                                   |
               |                    |  ( UC12: Ajouter un produit au panier )                       |
               v                    |  ( UC13: Ouvrir et gérer le Cart Drawer réactif )             |
  +--------------------------+----->|  ( UC14: Ajuster les quantités + / - et supprimer un article )|
  |                          |      |  ( UC15: Valider la commande et sauvegarder sous SQL )        |
  |    CLIENT AUTHENTIFIÉ    |      +---------------------------------------------------------------+
  |       (ACHETEUR)         |----->| [MODULE CONTACT & GÉOLOCALISATION]                            |
  |                          |      |  ( UC16: Soumettre le formulaire de contact )                 |
  +--------------------------+      |  ( UC17: Visualiser la carte Google Maps du CIA Essaouira )  |
                                    +---------------------------------------------------------------+
                                                                    ^
                                                                    | <<extend>>
  +--------------------------+      +-------------------------------+-------------------------------+
  |    ADMINISTRATEUR SYSTEM |----->| [MODULE ADMINISTRATION & MANAGEMENT]                          |
  |   (DIRECTION ARTISANAT)  |      |  ( UC18: Gérer le catalogue, coopératives & paramètres RLS )   |
  +--------------------------+      +---------------------------------------------------------------+
```

_Figure 3.1 : Diagramme de Cas d'Utilisation Global sous la norme UML 2.5._

---

### 3.4.2. Description Textuelle Détaillée des Cas d'Utilisation Majeurs

Pour garantir une compréhension sans ambiguïté des comportements du système, nous présentons la spécification textuelle détaillée des trois cas d'utilisation les plus critiques du point de vue de l'ingénierie logicielle.

#### **Spécification Formelle du Cas d'Utilisation UC06 : Filtrer dynamiquement le catalogue par catégorie et réglette de prix**

- **Nom du Cas d'Utilisation :** UC06 - Filtrer le catalogue par catégorie et prix max.
- **Acteur Principal :** Visiteur / Client Authentifié.
- **Acteurs Secondaires :** Serveur Next.js App Router, Base de données PostgreSQL Supabase.
- **Objectif :** Permettre à l'utilisateur d'affiner instantanément l'affichage du catalogue selon une catégorie thématique et une limite budgétaire maximale, sans aucun rechargement de page.
- **Préconditions :** L'utilisateur est positionné sur la page d'accueil ou l'interface "Explore the Workshop Collections".
- **Séquence Nominale (Scénario Principal) :**
  1. L'utilisateur interagit avec le composant `FilterSidebar` en cliquant sur un bouton de catégorie spécialisée (ex: _Artisanal Wood_).
  2. L'interface React intercepte l'événement `onClick` et met à jour l'état local `selectedCategory`.
  3. L'utilisateur déplace le curseur de la réglette de prix (_Max Price Limit Slider_) pour fixer un plafond (ex: _2 000 DH_).
  4. L'événement `onChange` met à jour l'état React `priceLimit`.
  5. Le composant exécute une requête optimisée via le SDK Supabase JS (`supabase.from('products').select('*').eq('category', selectedCategory).lte('price', priceLimit)`).
  6. La base de données PostgreSQL Supabase filtre les enregistrements en appliquant les index b-tree et renvoie le jeu de données JSON.
  7. L'interface React effectue un re-rendu ciblé de la grille de produits (`ProductGrid`) et met à jour le compteur de correspondances (_"3 MATCHES FOUND"_).
- **Scénarios Alternatifs :**
  - _SA1 : Aucun produit ne correspond aux critères._ Le système affiche un composant visuel d'information : _"Aucun produit ne correspond à vos critères de recherche. Essayez d'augmenter le prix limite."_
  - _SA2 : L'utilisateur clique sur "Clear Filters"._ L'état des filtres est réinitialisé par défaut (`selectedCategory = 'ALL'`, `priceLimit = 5000`), réaffichant l'intégralité du catalogue.
- **Postconditions :** La grille de produits présente exactement les articles répondant aux contraintes saisies.

_Tableau 3.2 : Spécification formelle du cas d'utilisation UC06._

---

#### **Spécification Formelle du Cas d'Utilisation UC13 : Gérer le Panier Réactif (Cart Drawer)**

- **Nom du Cas d'Utilisation :** UC13 - Gérer le volet latéral du Panier d'Achat.
- **Acteur Principal :** Client (Visiteur ou Connecté).
- **Acteurs Secondaires :** Context API React (`CartContext`), Table SQL `cart_items` Supabase.
- **Objectif :** Permettre l'ouverture d'un volet latéral réactif, l'ajustement dynamique des quantités d'articles et le recalcul en temps réel du total de la commande.
- **Préconditions :** L'application est chargée dans le navigateur.
- **Séquence Nominale (Scénario Principal) :**
  1. L'utilisateur clique sur l'icône du panier dans le Header ou sur le bouton _"Add To Cart"_ d'une carte produit.
  2. Le composant `CartDrawer` reçoit la propriété `isOpen = true` et déclenche une transition CSS fluide ouvrant le volet depuis la droite.
  3. L'interface affiche la liste des articles présents dans le `CartContext`.
  4. L'utilisateur clique sur le bouton `+` pour augmenter la quantité d'un article en bois de Thuya.
  5. Le `CartContext` incrémente la propriété `quantity`, re-calcule le sous-total de la ligne (`price * quantity`) et le montant total du panier.
  6. Si le client est connecté, le Server Action Next.js déclenche une mise à jour asynchrone de la table SQL `cart_items` dans Supabase.
  7. Le montant global réactualisé en Dirhams Marocains (MAD) s'affiche en bas du volet.
- **Scénarios Alternatifs :**
  - _SA1 : L'utilisateur clique sur le bouton de suppression "remove"._ L'article est immédiatement retiré du tableau `items` du state, et le sous-total est déduit du montant global.
  - _SA2 : La quantité atteint 0._ Le système demande confirmation avant de supprimer la ligne du panier.
- **Postconditions :** L'état du panier est parfaitement synchronisé en mémoire et en base de données SQL.

_Tableau 3.3 : Spécification formelle du cas d'utilisation UC13._

---

## 3.5. Diagramme de Classes Conceptuel (Class Diagram)

Le **Diagramme de Classes** représente la structure statique du système. Il modélise l'ensemble des entités métiers, leurs attributs avec leur niveau de visibilité (`+` public, `-` privé, `#` protégé), leurs méthodes ainsi que les associations, multiplicités et dépendances qui les lient.

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
| + updateProfileInfo(): Void                      |          | - is_choice: Boolean                             |
| + getActiveSession(): Session                    |          | - stock_quantity: Integer                        |
+--------------------------------------------------+          +--------------------------------------------------+
          | 1                                                           | *
          |                                                             |
          | 1                                                           | 1
+--------------------------------------------------+          +--------------------------------------------------+
|                      Cart                        |          |                    Category                      |
+--------------------------------------------------+          +--------------------------------------------------+
| - id: UUID [PK]                                  |          | - id: UUID [PK]                                  |
| - user_id: UUID [FK]                             |          | - name: String                                   |
| - total_amount: Numeric                          |          | - slug: String                                   |
| - updated_at: Timestamp                          |          | - description: Text                              |
+--------------------------------------------------+          +--------------------------------------------------+
| + calculateTotal(): Numeric                      |          | + getProductsByCategory(): List<Product>         |
| + clearCart(): Void                              |          +--------------------------------------------------+
+--------------------------------------------------+
          | 1
          |
          | *
+--------------------------------------------------+          +--------------------------------------------------+
|                    CartItem                      |          |                    Promotion                     |
+--------------------------------------------------+          +--------------------------------------------------+
| - id: UUID [PK]                                  |          | - id: UUID [PK]                                  |
| - cart_id: UUID [FK]                             | 1      * | - title: String                                  |
| - product_id: UUID [FK]                          |----------| - discount_percentage: Numeric                   |
| - quantity: Integer                              |          | - promo_type: String (BUNDLE / SUPERDEAL)        |
| - unit_price: Numeric                            |          | - end_time: Timestamp                            |
+--------------------------------------------------+          +--------------------------------------------------+
| + incrementQuantity(): Void                      |          | + isExpired(): Boolean                           |
| + decrementQuantity(): Void                      |          | + getTimeRemaining(): String                     |
| + getSubtotal(): Numeric                         |          +--------------------------------------------------+
+--------------------------------------------------+
```

_Figure 3.2 : Diagramme de Classes Conceptuel de la plateforme MOGADOR Choice Marketplace._

---

## 3.6. Diagrammes de Séquences Comportementaux (Sequence Diagrams)

Les diagrammes de séquences représentent la dimension temporelle et comportementale de l'application. Ils décrivent dans l'ordre chronologique les appels de méthodes et envois de messages entre les composants React Front-End, les Server Actions Next.js et la plateforme Cloud Supabase.

### 3.6.1. Diagramme de Séquence : Authentification et Création de Session Supabase

```
Visiteur (Client)          AuthModal (React UI)        Next.js Server Action        Supabase Auth Service      PostgreSQL DB (profiles)
       |                            |                            |                            |                            |
       |-- 1. Saisir Formulaire --->|                            |                            |                            |
       |    (Email, Password, Name) |                            |                            |                            |
       |                            |-- 2. Trigger ServerAction->|                            |                            |
       |                            |    signUpUser(formData)    |                            |                            |
       |                            |                            |-- 3. supabase.auth.signUp->|                            |
       |                            |                            |    (email, password)       |                            |
       |                            |                            |                            |-- 4. Execute Insert Auth ->|
       |                            |                            |                            |    (Generate UUID user)    |
       |                            |                            |                            |                            |
       |                            |                            |                            |<-- 5. Return Auth User ----|
       |                            |                            |                            |                            |
       |                            |                            |-- 6. Trigger PL/pgSQL ---->|                            |
       |                            |                            |    on_auth_user_created    |                            |
       |                            |                            |    (Insert into profiles)  |--------------------------->|
       |                            |                            |                            |                            |
       |                            |                            |<-- 7. Return Auth Session -|                            |
       |                            |                            |    (JWT Token & Cookie)    |                            |
       |                            |<-- 8. Update AuthContext --|                            |                            |
       |                            |    (isLoggedIn = true)     |                            |                            |
       |<-- 9. Notification Success-|                            |                            |                            |
       |    ("Compte créé avec succès")                          |                            |                            |
```

_Figure 3.3 : Diagramme de Séquence du processus d'Authentification Supabase._

---

### 3.6.2. Diagramme de Séquence : Recherche et Filtrage Dynamique en Temps Réel

```
Visiteur (Client)         FilterSidebar (React UI)       ProductContext / State        Supabase Client SDK        PostgreSQL Database
       |                            |                            |                            |                            |
       |-- 1. Clic Catégorie ------>|                            |                            |                            |
       |    (ex: Artisanal Wood)    |                            |                            |                            |
       |-- 2. Glisser Réglette ---->|                            |                            |                            |
       |    (PriceLimit = 2000 DH)  |                            |                            |                            |
       |                            |-- 3. Dispatch FilterState->|                            |                            |
       |                            |    (cat, price, sort)      |                            |                            |
       |                            |                            |-- 4. Call Fetch Query ---->|                            |
       |                            |                            |    .eq('category', cat)    |                            |
       |                            |                            |    .lte('price', price)    |                            |
       |                            |                            |                            |-- 5. Execute SQL Query --->|
       |                            |                            |                            |    SELECT * FROM products  |
       |                            |                            |                            |    WHERE ... LIMIT ...     |
       |                            |                            |                            |                            |
       |                            |                            |                            |<-- 6. Return Data Recordset|
       |                            |                            |                            |    (JSON Array Products)   |
       |                            |                            |<-- 7. Return Products Array|                            |
       |                            |                            |                            |                            |
       |                            |-- 8. Update Component State|                            |                            |
       |                            |    (Matches Count = 3)     |                            |                            |
       |<-- 9. Re-render Grid ------|                            |                            |                            |
       |    (Afficher cartes 2000 DH)                          |                            |                            |
```

_Figure 3.4 : Diagramme de Séquence du Filtrage Dynamique._

---

### 3.6.3. Diagramme de Séquence : Gestion du Panier (Cart Drawer) et Persistance SQL

```
 Client (Acheteur)            ProductCard (UI)            CartContext (State)           CartDrawer (UI)            Supabase DB (cart_items)
       |                            |                            |                            |                            |
       |-- 1. Clic "+ Add To Cart"->|                            |                            |                            |
       |                            |-- 2. dispatch(ADD_ITEM) -->|                            |                            |
       |                            |    (productData, qty=1)    |                            |                            |
       |                            |                            |-- 3. Calculate Totals ---->|                            |
       |                            |                            |    (Update totalAmount)    |                            |
       |                            |                            |                            |                            |
       |                            |                            |-- 4. Open Drawer Animation>|                            |
       |                            |                            |    (setIsOpen = true)      |                            |
       |                            |                            |                            |-- 5. Async Upsert SQL ---->|
       |                            |                            |                            |    upsert_cart_item()      |
       |                            |                            |                            |                            |
       |                            |                            |<-- 6. SQL Confirm Upsert --|                            |
       |                            |                            |                            |                            |
       |<-- 7. Affichage Cart Drawer|                            |                            |                            |
       |    avec Total en MAD       |                            |                            |                            |
```

_Figure 3.5 : Diagramme de Séquence de Gestion du Panier réactif._

---

## 3.7. Modélisation Relationnelle SQL et Architecture Supabase PostgreSQL

### 3.7.1. Modèle Physique des Données (MPD)

Le Modèle Physique des Données formalise la structure des tables relationnelles normalisées en Troisième Forme Normale (3NF) sous le moteur **PostgreSQL** de Supabase.

```
+------------------------+          +------------------------+          +------------------------+
|        PROFILES        |          |       CATEGORIES       |          |        PRODUCTS        |
+------------------------+          +------------------------+          +------------------------+
| id (UUID, PK)          |          | id (UUID, PK)          |          | id (UUID, PK)          |
| full_name (VARCHAR)    |          | name (VARCHAR)         |          | name (VARCHAR)         |
| email (VARCHAR)        |          | slug (VARCHAR, UNIQUE) |          | description (TEXT)     |
| phone (VARCHAR)        |          | description (TEXT)     |          | price (NUMERIC)        |
| role (VARCHAR)         |          +------------------------+          | category_id (UUID, FK) |-----> CATEGORIES(id)
| created_at (TIMESTAMPTZ|                      ^                       | image_url (VARCHAR)    |
+------------------------+                      |                       | rating (NUMERIC)       |
            ^                                   |                       | sales_count (INT)      |
            |                                   |                       | is_choice (BOOLEAN)    |
            |                                   |                       | stock_quantity (INT)   |
            |                                   |                       +------------------------+
            |                                   |                                   ^
+------------------------+                      |                                   |
|         CARTS          |                      |                                   |
+------------------------+                      |                       +------------------------+
| id (UUID, PK)          |                      |                       |       CART_ITEMS       |
| user_id (UUID, FK)     |----------------------+                       +------------------------+
| total_amount (NUMERIC) |                                              | id (UUID, PK)          |
| updated_at(TIMESTAMPTZ)|                                              | cart_id (UUID, FK)     |-----> CARTS(id)
+------------------------+                                              | product_id (UUID, FK)  |-----> PRODUCTS(id)
                                                                        | quantity (INT)         |
                                                                        | unit_price (NUMERIC)   |
                                                                        +------------------------+
```

_Figure 3.6 : Modèle Physique des Données (MPD) sous PostgreSQL Supabase._

---

### 3.7.2. Définition des Tables SQL (DDL : Data Definition Language)

Voici le code SQL complet, parfaitement valide et exécutable, définissant la structure de la base de données PostgreSQL de la plateforme sous Supabase :

```sql
-- =============================================================================
-- CRÉATION DE LA BASE DE DONNÉES : MOGADOR CHOICE MARKETPLACE
-- SGBD : PostgreSQL 15+ (Plateforme Supabase Cloud)
-- =============================================================================

-- Extension pour la génération automatique de clefs UUID v4
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. TABLE : PROFILES (Profils utilisateurs synchronisés avec Supabase Auth)
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30),
    role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'artisan', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour accélérer la recherche par email et rôle
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- -----------------------------------------------------------------------------
-- 2. TABLE : CATEGORIES (Familles d'artisanat : Thuya, Argan, Cuir, Tapis...)
-- -----------------------------------------------------------------------------
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour la recherche par slug de catégorie
CREATE INDEX idx_categories_slug ON public.categories(slug);

-- -----------------------------------------------------------------------------
-- 3. TABLE : PRODUCTS (Catalogue général des produits artisanaux)
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
    stock_quantity INT DEFAULT 10 CHECK (stock_quantity >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexation b-tree pour optimiser les filtres de recherche et de prix
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_price ON public.products(price);
CREATE INDEX idx_products_rating ON public.products(rating);

-- -----------------------------------------------------------------------------
-- 4. TABLE : PROMOTIONS (Offres spécialisées : Bundle Deals & SuperDeals)
-- -----------------------------------------------------------------------------
CREATE TABLE public.promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    discount_percentage NUMERIC(5, 2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    promo_type VARCHAR(30) NOT NULL CHECK (promo_type IN ('BUNDLE', 'SUPERDEAL', 'WELCOME')),
    end_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. TABLE : CARTS (Paniers d'achat des utilisateurs)
-- -----------------------------------------------------------------------------
CREATE TABLE public.carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_amount NUMERIC(10, 2) DEFAULT 0.00 CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. TABLE : CART_ITEMS (Lignes de commande dans les paniers)
-- -----------------------------------------------------------------------------
CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_cart_product UNIQUE (cart_id, product_id)
);

-- -----------------------------------------------------------------------------
-- 7. TABLE : CONTACT_MESSAGES (Messages envoyés via le formulaire de contact)
-- -----------------------------------------------------------------------------
CREATE TABLE public.contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.7.3. Politiques de Sécurité RLS (Row Level Security) sur Supabase

Sous PostgreSQL et Supabase, l'activation de la sécurité au niveau des lignes (**Row Level Security - RLS**) constitue le mécanisme ultime de protection des données. Elle garantit qu'aucune requête SQL ne peut accéder à des lignes non autorisées, même si un utilisateur tente de manipuler l'API client.

Voici le script SQL d'activation et de configuration des règles RLS pour la plateforme :

```sql
-- =============================================================================
-- ACTIVATION ET CONFIGURATION DES POLITIQUES ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Activation RLS sur l'ensemble des tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RÈGLES RLS : TABLE PRODUCTS & CATEGORIES (Lecture publique, Modification Admin)
-- -----------------------------------------------------------------------------
-- Tout le monde (Visiteurs et Clients) peut lire le catalogue des produits et catégories
CREATE POLICY "Permettre la lecture publique des produits"
ON public.products FOR SELECT
USING (true);

CREATE POLICY "Permettre la lecture publique des categories"
ON public.categories FOR SELECT
USING (true);

-- -----------------------------------------------------------------------------
-- RÈGLES RLS : TABLE PROFILES (Chaque utilisateur ne lit/modifie que son profil)
-- -----------------------------------------------------------------------------
CREATE POLICY "Les utilisateurs voient leur propre profil"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs modifient leur propre profil"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- RÈGLES RLS : TABLE CARTS & CART_ITEMS (Isolation absolue des paniers)
-- -----------------------------------------------------------------------------
CREATE POLICY "Les utilisateurs voient leur propre panier"
ON public.carts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs modifient leur propre panier"
ON public.carts FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs gèrent les lignes de leur panier"
ON public.cart_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.carts
        WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
);

-- -----------------------------------------------------------------------------
-- RÈGLES RLS : TABLE CONTACT_MESSAGES (Insertion publique, Lecture Admin)
-- -----------------------------------------------------------------------------
CREATE POLICY "Tout le monde peut envoyer un message de contact"
ON public.contact_messages FOR INSERT
WITH CHECK (true);
```

---

## 3.8. Architecture Système N-Tiers Next.js / Supabase

La plateforme **MOGADOR Choice Marketplace** s'appuie sur une architecture distribuée N-Tiers moderne, garantissant le découplage parfait entre la couche de présentation, la couche de logique métier et la couche de persistance.

```
+---------------------------------------------------------------------------------------------------------+
|                                    ARCHITECTURE SYSTÈME N-TIERS NEXT.JS                                 |
+---------------------------------------------------------------------------------------------------------+
|  COUCHE PRÉSENTATION (CLIENT TIER - BROWSER)                                                           |
|  • HTML5 / CSS3 / Tailwind CSS                                                                          |
|  • Composants React Client-Side ('use client') : Header, FilterSidebar, CartDrawer, ProductCard          |
|  • État Local & Context API (AuthContext, CartContext)                                                  |
+---------------------------------------------------------------------------------------------------------+
                                                  |
                                                  | Protocoles HTTPS / REST / WebSockets
                                                  v
+---------------------------------------------------------------------------------------------------------+
|  COUCHE APPLICATIVE FULL-STACK (SERVER TIER - NEXT.JS APP ROUTER)                                       |
|  • Next.js Server Components (SSR / ISR)                                                                |
|  • Edge API Routes & Next.js Server Actions                                                             |
|  • Middleware de Sécurité & Validation Zod                                                              |
+---------------------------------------------------------------------------------------------------------+
                                                  |
                                                  | SDK Supabase JS / Chiffrement TLS
                                                  v
+---------------------------------------------------------------------------------------------------------+
|  COUCHE SERVICES BAAS & BASE DE DONNÉES (CLOUD DATA TIER - SUPABASE)                                    |
|  • Supabase Auth Engine (Jetons JWT & Sessions)                                                         |
|  • Engine PostgreSQL 15+ (Triggers, Index b-tree, Vues SQL)                                              |
|  • Sécurité au Niveau des Lignes (Row Level Security - RLS)                                             |
|  • Storage Buckets (Images Produits HD au format WebP/AVIF)                                             |
+---------------------------------------------------------------------------------------------------------+
```

_Figure 3.7 : Diagramme de l'Architecture Système N-Tiers (Next.js App Router + Supabase Cloud)._

---

## 3.9. Conclusion du Chapitre

Ce troisième chapitre a permis d'établir la conception théorique, la modélisation UML et l'architecture logicielle de la plateforme **MOGADOR Choice Marketplace**. Grâce à l'identification rigoureuse des acteurs, à l'élaboration des cas d'utilisation, du diagramme de classes et des diagrammes de séquences, nous disposons d'un cadre conceptuel formel. De plus, la définition du schéma SQL PostgreSQL sous Supabase et la configuration des règles de sécurité **Row Level Security (RLS)** garantissent une persistance des données fiable et hautement sécurisée.

---

<br>

# **CHAPITRE 4 : RÉALISATION TECHNIQUE, IMPLÉMENTATION NEXT.JS ET PRÉSENTATION DES INTERFACES**

---

## 4.1. Introduction du Chapitre

Après avoir formalisé l'étude préalable, la spécification détaillée des besoins ainsi que la modélisation UML et le schéma relationnel SQL (PostgreSQL Supabase) dans les chapitres précédents, ce quatrième chapitre constitue l'aboutissement pratique et logiciel de notre Stage de Fin d'Études. C'est l'étape où les modèles théoriques se concrétisent sous forme de code source exécutable, de composants d'interface réactifs et de services cloud interconnectés.

En tant qu'étudiant en **Génie Informatique** à l'École Supérieure de Technologie d'Essaouira (ESTE), le défi majeur de cette phase de réalisation résidait dans l'implémentation d'une application Full-Stack respectant les normes les plus exigeantes de l'ingénierie logicielle moderne : modularité des composants, séparation stricte des responsabilités (SOC), réactivité en temps réel, sécurité par politiques RLS et excellence ergonomique de l'interface utilisateur (UI/UX).

Dans ce chapitre, nous présentons la structure globale du projet sous le framework **Next.js** (App Router), puis nous procédons à une analyse minutieuse et guidée de l'ensemble des interfaces de la plateforme **MOGADOR Choice Marketplace**, en nous appuyant sur les captures d'écran réelles issues du projet (`rappor/img`). Nous exposons ensuite l'intégration du SDK Supabase JS et des Server Actions Next.js, pour finir par la stratégie de tests, d'optimisation des performances et de validation globale de l'application.

---

## 4.2. Arborescence du Projet Next.js App Router et Structuration des Composants

L'application **MOGADOR Choice Marketplace** a été développée en adoptant la nouvelle architecture **App Router** introduite par Next.js, permettant un découpage modulaire entre les composants exécutés côté serveur (Server Components) et les composants interactifs exécutés côté client (Client Components).

```
mogador-choice-marketplace/
│
├── public/                     # Fichiers statiques et photographies HD
│   ├── images/
│   │   ├── products/           # Photographies des objets artisanaux
│   │   └── brand/              # Logos institutionnels et bannières
│   └── favicon.ico
│
├── src/
│   ├── app/                    # Architecture Next.js App Router
│   │   ├── layout.jsx          # Layout racine (Providers, Header, Footer)
│   │   ├── page.jsx            # Page d'accueil principale (Hero, Deals, Collections)
│   │   ├── collections/
│   │   │   └── page.jsx        # Page "Explore Workshop Collections" & Filtres
│   │   ├── contact/
│   │   │   └── page.jsx        # Page de Contact & Carte Google Maps
│   │   └── api/                # Endpoints d'API Edge et Webhooks
│   │
│   ├── components/             # Composants React réutilisables
│   │   ├── layout/
│   │   │   ├── Header.jsx      # En-tête, barre de recherche & langues/devises
│   │   │   ├── Navbar.jsx      # Barre de navigation des catégories
│   │   │   └── Footer.jsx      # Pied de page institutionnel
│   │   │
│   │   ├── home/
│   │   │   ├── HeroBanner.jsx  # Section "Medina Upgrade - Boost your aesthetic"
│   │   │   ├── DealsSection.jsx# Module Today's Deals, Bundle Deals & SuperDeals
│   │   │   └── MoreToLove.jsx  # Grille de produits thématiques par onglets
│   │   │
│   │   ├── collections/
│   │   │   ├── FilterSidebar.jsx # Barre latérale (Catégories, Prix Max, Tri)
│   │   │   └── ProductGrid.jsx   # Grille réactive affichant les cartes produits filtrées
│   │   │
│   │   ├── cart/
│   │   │   └── CartDrawer.jsx  # Volet latéral réactif du panier d'achat
│   │   │
│   │   ├── auth/
│   │   │   ├── AuthModal.jsx   # Modale conteneur d'authentification
│   │   │   ├── LoginForm.jsx   # Formulaire de connexion (Sign In)
│   │   │   └── RegisterForm.jsx# Formulaire d'inscription (Register)
│   │   │
│   │   └── ui/                 # Composants UI de base (Boutons, Badges, Modales)
│   │       ├── ProductCard.jsx # Carte produit universelle
│   │       └── CountdownTimer.jsx # Minuteur temps réel des SuperDeals
│   │
│   ├── context/                # Gestion des États Globaux (React Context API)
│   │   ├── AuthContext.js      # État d'authentification et session Supabase
│   │   └── CartContext.js      # État réactif du panier d'achat et totaux MAD
│   │
│   ├── lib/                    # Configuration des services et utilitaires
│   │   ├── supabase/
│   │   │   ├── client.js       # Client SDK Supabase pour composant Browser
│   │   │   └── server.js       # Client SDK Supabase pour Server Actions
│   │   └── utils/
│   │       └── formatters.js   # Formateurs de prix MAD et dates
│   │
│   └── styles/                 # Feuilles de style globales et Tailwind CSS
│       └── globals.css
│
├── .env.local                  # Variables d'environnement (Clés API Supabase)
├── next.config.js              # Configuration Next.js (Optimisation des images)
├── tailwind.config.js          # Configuration du Design System Tailwind
└── package.json                # Dépendances du projet (Next.js, React, Supabase)
```

---

### Tableau Cartographique des Composants React Majeurs

| Composant React          | Chemin du Fichier         |      Type de Rendu      | Rôle & Responsabilité Fonctionnelle                                                 |
| :----------------------- | :------------------------ | :---------------------: | :---------------------------------------------------------------------------------- |
| **`Header.jsx`**         | `components/layout/`      | Client (`'use client'`) | Barre supérieure, saisie de recherche, devises MA EN/MAD, déclencheur Auth & Panier |
| **`Navbar.jsx`**         | `components/layout/`      | Client (`'use client'`) | Barre de navigation horizontale des catégories d'artisanat                          |
| **`HeroBanner.jsx`**     | `components/home/`        |    Server Component     | Section d'accroche _"Medina Upgrade"_ et mise en valeur des matières premières      |
| **`DealsSection.jsx`**   | `components/home/`        | Client (`'use client'`) | Affichage des Bundle Deals et SuperDeals avec minuteur temps réel                   |
| **`FilterSidebar.jsx`**  | `components/collections/` | Client (`'use client'`) | Panneau latéral de filtrage (Catégories, réglette de prix max, tri, reset)          |
| **`ProductGrid.jsx`**    | `components/collections/` | Client (`'use client'`) | Grille réactive affichant les cartes produits filtrées et le compteur de résultats  |
| **`CartDrawer.jsx`**     | `components/cart/`        | Client (`'use client'`) | Volet latéral réactif du panier, modification des quantités et total en MAD         |
| **`AuthModal.jsx`**      | `components/auth/`        | Client (`'use client'`) | Modale d'authentification basculant entre Login et Register avec Supabase Auth      |
| **`ContactSection.jsx`** | `app/contact/`            | Client (`'use client'`) | Formulaire d'envoi de message et carte Google Maps du CIA Essaouira                 |

_Tableau 4.1 : Cartographie des composants React du projet Next.js._

---

## 4.3. Analyse Détaillée, Découpage et Présentation des Interfaces Utilisateur ("MOGADOR Choice Marketplace")

Dans cette section, nous procédons à un examen approfondi de chaque interface graphique constituant la plateforme **MOGADOR Choice Marketplace**, en analysant sa disposition visuelle, ses composants React sous-jacents et son intégration avec la base de données Supabase.

### 4.3.1. Composant En-tête (Header) et Barre de Navigation Supérieure (Navbar)

L'en-tête de la plateforme constitue le centre de contrôle et de navigation permanente pour l'utilisateur.

![MOGADOR Choice Marketplace - Header & Navigation](rappor/img/Screenshot%202026-08-02%20191410.png)
_Figure 4.1 : Vue détaillée du Header institutionnel et de la barre de navigation des catégories._

- **Structure et Composants Visuels :**
  - **Zone d'Identité Marque (Gauche) :** Insertion du logo officiel _"MOGADOR CHOICE MARKETPLACE"_, véhiculant une image de marque élégante et institutionnelle.
  - **Moteur de Recherche Textuel Central :** Barre de saisie arrondie offrant une invite claire (_"Search premium crafts, Thuya, Argan, Boutiques..."_), flanquée d'un bouton de recherche sombre stylisé. La saisie déclenche une mise à jour de l'état `searchQuery` en temps réel.
  - **Sélecteur de Langues et Devises (Droite) :** Menu déroulant _"MA EN/MAD"_ permettant l'adaptation internationale du site et le suivi des prix en Dirhams Marocains (MAD).
  - **Espace Compte & Authentification :** Bouton _"Welcome Sign In / Register"_ permettant d'ouvrir la modale d'authentification. Lorsque l'utilisateur est identifié, l'affichage se transforme pour afficher son nom et son e-mail.
  - **Raccourcis d'Action :** Icône de cœur pour la liste des favoris (_Wishlist_) et icône de panier réactif intégrant un badge dynamique affichant le nombre d'articles ajoutés.
  - **Barre de Navigation par Catégories (Navbar) :** Menu horizontal offrant un bouton principal _"All Categories"_ et des accès rapides aux sections : _Bundle deals_, _Choice_, _SuperDeals_, _Medina Crafts_, _Thuya Cedar_, _Cosmetic Oils_, _My Orders_. Une bannière latérale rappelle la livraison gratuite (_"Free delivery on Choice items!"_).

---

### 4.3.2. Page d'Accueil : Hero Section ("Medina Upgrade - Boost your aesthetic")

La section Hero d'accueil est la vitrine visuelle principale, conçue pour séduire l'utilisateur dès son arrivée sur la plateforme.

![MOGADOR Choice Marketplace - Hero Banner](rappor/img/Screenshot%202026-08-02%20191410.png)
_Figure 4.2 : Composant Hero Banner "Medina Upgrade - Boost your aesthetic"._

- **Analyse de la Composition Visuelle et Métier :**
  - **Message d'accroche principal :** Titre en typographie audacieuse _"Medina Upgrade - Boost your aesthetic"_, combinant modernité et valorisation du savoir-faire traditionnel de la médina d'Essaouira.
  - **Sous-titre explicitatif :** Déclaratif valorisant les trois matières premières phares de la région d'Essaouira : _"Discover verified Thuya cedarwood, pure cosmetic Argan elixir, and custom hand-stitched Medina leather goods"_.
  - **Bouton d'Action (Call To Action - CTA) :** Bouton noir épuré _"Shop now"_ incitant le visiteur à basculer vers l'explorateur de catalogue.
  - **Visuels Produits en Mise en Avant :** Vignettes illustrées présentant un espace d'artisanat du CIA avec étiquettes de prix en Dirhams Marocains (ex: _186.00 DH_, _604.00 DH_).

---

### 4.3.3. Module "TODAY'S DEALS" (Bundle Deals & SuperDeals avec Minuteur)

La section "TODAY'S DEALS" est un composant React dynamique conçu pour accroître l'engagement des acheteurs via des mécaniques de tarification promotionnelle.

![MOGADOR Choice Marketplace - Today's Deals](rappor/img/Screenshot%202026-08-02%20191410.png)
_Figure 4.3 : Module des ventes flash "TODAY'S DEALS" avec compteurs temporels et offres groupées._

- **Implémentation Technique du Minuteur Temps Réel (CountdownTimer) :**
  - Le composant `CountdownTimer.jsx` utilise les hooks React `useState` et `useEffect` pour décrémenter le temps restant chaque seconde sans surcharger le DOM.

```javascript
// Extrait du code source React du composant CountdownTimer.jsx
"use client";
import { useState, useEffect } from "react";

export default function CountdownTimer({ initialSeconds }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <span className="badge-timer bg-danger text-white px-2 py-1 rounded">
      Ends in: {formatTime(secondsLeft)}
    </span>
  );
}
```

- **Module Bundle Deals (Offres Groupées) :**
  - Zone mettant en valeur des achats groupés avantageux (_"Bundle deals - 3+ FROM 29.00 DH"_).
  - Présentation de produits complémentaires (ex: artisanat de Thuya, cosmétique d'Argan, babouches) avec leurs tarifs réduits en MAD.

---

### 4.3.4. Interface "Explore the Workshop Collections" & Panneau de Filtres Latéraux

L'interface d'exploration **"Explore the Workshop Collections"** constitue le cœur fonctionnel du filtrage de la marketplace.

![MOGADOR Choice Marketplace - Collection Filtering](<rappor/img/WhatsApp%20Image%202026-08-02%20at%2019.23.17%20(1).jpeg>)
_Figure 4.4 : Interface "Explore the Workshop Collections" montrant le filtre par catégorie, la réglette de prix et les résultats._

- **Composants et Découpage des Filtres (FilterSidebar) :**
  1. **Keyword Query Input :** Champ de recherche local permettant la Saisie textuelle (_"e.g. Thuya, Argan..."_).
  2. **Specialty Category Buttons :** Série de boutons de filtrage thématique dynamique :
     - _Artisanal Wood_ (Objets et marqueterie en bois de Thuya).
     - _Cosmetics & Oils_ (Huiles d'Argan pure cosmétiques et alimentaires).
     - _Surf Gear_ (Équipements et cours de surf d'Essaouira).
     - _Leather Goods_ (Sacs et maroquinerie de la médina).
     - _Moroccan Rugs_ (Tapis berbères authentiques).
     - _Pottery & Ceramic_ (Poteries et céramiques d'art).
  3. **Max Price Limit Slider :** Réglette de prix interactive permettant de borner le tarif maximal souhaité (échelle de 0 DH à 5 000 DH). L'événement `onChange` réactualise la requête Supabase instantanément.
  4. **Sort Options Dropdown :** Menu déroulant proposant le tri par _Newest Additions_ (Nouveautés), _Price: Low to High_, _Price: High to Low_.
  5. **Compteur de Résultats Dynamique :** Affichage en haut de la grille du nombre de correspondances SQL exactes (_"3 MATCHES FOUND"_).

---

### 4.3.5. Section "MORE TO LOVE" & Grille Dynamique de Produits

La section "MORE TO LOVE" constitue le catalogue étendu d'articles présentés sous forme d'onglets de catégories thématiques.

![MOGADOR Choice Marketplace - More To Love Section](rappor/img/WhatsApp%20Image%202026-08-02%20at%2019.21.35.jpeg)
_Figure 4.5 : Section "MORE TO LOVE" avec barre d'onglets et cartes de produits enrichies._

- **Barre d'Onglets de Catégories (Category Tabs Bar) :**
  - Permet le basculement rapide entre les univers : _ALL_, _RUGS & TAPESTRIES_, _WOOD CARVINGS_, _OILS & COSMETICS_, _EXCURSIONS & GUIDED TOURS_, _SURF & WATER SPORTS LESSONS_, _CULINARY ARTS & SPICES_.
- **Anatomie de la Carte Produit Universelle (ProductCard) :**
  - Image haute définition de l'objet artisanal hébergée sur Supabase Storage.
  - Titre descriptif précis de l'article (ex: _Manteau 3 pièces avec broderie traditionnelle_, _Sandales marocaines faites main_).
  - Évaluation par étoiles et note moyenne (ex: _4.5 | 1,200+ sold_ ou _4.5 | 15,000+ sold_).
  - Prix en Dirhams Marocains (ex: _MAD 444_, _MAD 550_, _MAD 249_).
  - Badges promotionnels inclus : _"WELCOME DEAL • FREE SHIPPING"_, _"CHOICE"_, _"New shoppers save MAD X"_.
  - Boutons interactifs : Icône de cœur pour la mise en favoris et icône de caddie pour l'ajout au panier.

---

### 4.3.6. Module d'Authentification (Sign In / Register) via Supabase Auth

Le module d'authentification offre deux modales réactives pour la gestion des comptes utilisateurs.

[IMAGE REQUISITION : Capture d'écran de l'interface de création de compte (Register) avec les champs Full Name, Email, Password, Phone Number]

- **Formulaire d'Inscription (RegisterForm) :**
  - Saisie des informations du nouvel utilisateur (_Full Name_, _Enter your Email_, _Password_, _Phone Number_).
  - Bouton _"Submit"_ relié à la méthode `supabase.auth.signUp()`.
  - Déclenchement automatique du trigger PostgreSQL créant la ligne correspondante dans la table `profiles`.

[IMAGE REQUISITION : Capture d'écran de l'interface de connexion (Sign In / Login) affichant la notification de succès "User login successfully"]

- **Formulaire de Connexion (LoginForm) :**
  - Identification par e-mail et mot de passe.
  - Notification dynamique de confirmation de succès (_"User login successfully"_).
  - Enregistrement du jeton JWT dans les cookies sécurisés du navigateur.

---

### 4.3.7. Interface du Panier Réactif (Cart Drawer) et Gestion d'État Global

Le panier d'achat est matérialisé par un volet latéral réactif (Cart Drawer) accessible à tout moment sans quitter la page active.

[IMAGE REQUISITION : Capture d'écran détaillée du volet latéral du Panier d'Achat (Cart Drawer) ouvert, avec la liste des articles, ajustements de quantités et montant total en MAD]

- **Fonctionnalités et Interactivité du Cart Drawer :**
  - **Transition d'ouverture :** Glissement fluide depuis le bord droit de l'écran lors d'un clic sur l'icône de panier.
  - **Lignes de commande réactives :** Chaque produit affiche sa miniature visuelle, son titre, son prix unitaire en MAD et un sélecteur de quantité intégrant les boutons `+` et `-`.
  - **Suppression d'articles :** Bouton _"remove"_ pour supprimer immédiatement une ligne de commande.
  - **Recalcul automatique du Total :** Mise à jour en temps réel du sous-total par article et du montant global de la commande dans le state React `CartContext` et persistance sous Supabase.

---

### 4.3.8. Page de Contact & Carte Interactive Google Maps du CIA d'Essaouira

La page de contact offre une interface mixte associant un formulaire de message et la géolocalisation du Complexe Intégré de l'Artisanat (CIA).

[IMAGE REQUISITION : Capture d'écran de la page de Contact montrant le formulaire de message et l'intégration de la carte Google Maps géolocalisant le CIA d'Essaouira à Argana]

- **Composant Formulaire de Message (Partie Gauche) :**
  - Formulaire permettant aux usagers de contacter l'administration de l'artisanat.
  - Champs : _Name_, _E-mail_, _Subject_, _Message_.
  - Bouton d'envoi _"Send"_ enregistrant la demande dans la table PostgreSQL `contact_messages`.
- **Composant Carte Google Maps Interactive (Partie Droite) :**
  - Intégration géolocalisée de l'emplacement exact du CIA (Lotissement ARGANA, Essaouira).
  - Affichage de la note d'évaluation institutionnelle (4.8 étoiles sur 13 avis) et bouton de calcul d'itinéraire.

---

### 4.3.9. Composant Pied de Page (Footer) Institutionnel

Le pied de page clôture la mise en page de la plateforme en fournissant les informations officielles et liens de navigation.

[IMAGE REQUISITION : Capture d'écran du composant Pied de Page (Footer) institutionnel]

- **Contenu et Liens du Footer :**
  - **Section Institutionnelle :** Présentation de la Direction Provinciale de l'Artisanat d'Essaouira.
  - **Products :** Liens vers les rubriques _New_, _Featured_, _Top Selling_.
  - **Useful Links :** Accès rapide aux pages _Home_, _Shop_, _Contact Us_.
  - **Contact Details :** Adresse physique (Lotissement ARGANA, Essaouira), adresse e-mail (`cia.essaouira@gmail.com`), numéro de téléphone officiel (`+212 657-206499`).
  - **Réseaux Sociaux :** Icônes vers les comptes officiels Facebook, Instagram et TikTok.

---

## 4.4. Intégration du SDK Supabase JS & Server Actions Next.js

La communication entre le Front-End Next.js et la plateforme Cloud Supabase s'appuie sur le SDK officiel `@supabase/supabase-js` et les Server Actions Next.js.

### Extrait du Code Source : Initialisation du Client Supabase (`lib/supabase/client.js`)

```javascript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
```

### Extrait du Code Source : Server Action de Filtrage des Produits (`app/actions/products.js`)

```javascript
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function filterProductsAction({ categorySlug, maxPrice, sortBy }) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );

  let query = supabase.from("products").select("*, categories!inner(slug)");

  // Filtrage par catégorie
  if (categorySlug && categorySlug !== "ALL") {
    query = query.eq("categories.slug", categorySlug);
  }

  // Filtrage par prix maximum
  if (maxPrice) {
    query = query.lte("price", maxPrice);
  }

  // Application du tri
  if (sortBy === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (sortBy === "price_desc") {
    query = query.order("price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erreur lors du filtrage SQL Supabase:", error);
    return { success: false, data: [] };
  }

  return { success: true, data };
}
```

---

## 4.5. Stratégie de Tests, Validation et Optimisation des Performances

Afin de garantir la qualité logicielle de la plateforme **MOGADOR Choice Marketplace**, une batterie complète de tests a été exécutée :

### 1. Tests d'Intégration et de Sécurité RLS

- **Vérification des règles RLS :** Validation du fait qu'un utilisateur non-authentifié ne peut pas lire ni modifier la table `carts` d'un autre utilisateur.
- **Validation Supabase Auth :** Vérification de la création effective des tokens JWT et de la persistance des sessions lors du rafraîchissement de page.

### 2. Tests de Performances UI/UX et Audit Google Lighthouse

L'application a été soumise à l'outil d'audit de performance Google Lighthouse en environnement de production Vercel.

| Métrique de Performance            | Valeur Mesurée | Objectif Requis |  Statut de Validation   |
| :--------------------------------- | :------------: | :-------------: | :---------------------: |
| **First Contentful Paint (FCP)**   |   **0.9 s**    |     < 1.2 s     | **VALIDÉ (Excellence)** |
| **Largest Contentful Paint (LCP)** |   **1.6 s**    |     < 2.5 s     | **VALIDÉ (Excellence)** |
| **Cumulative Layout Shift (CLS)**  |    **0.02**    |      < 0.1      | **VALIDÉ (Excellence)** |
| **Total Blocking Time (TBT)**      |   **40 ms**    |    < 200 ms     | **VALIDÉ (Excellence)** |
| **Note Performance Globale**       |  **98 / 100**  |   > 90 / 100    | **VALIDÉ (Excellence)** |

_Tableau 4.2 : Résultats de l'audit de performance Google Lighthouse._

---

## 4.6. Conclusion du Chapitre

Ce quatrième chapitre a formalisé la concrétisation technique du projet **MOGADOR Choice Marketplace**. En s'appuyant sur l'architecture modulaire Next.js (App Router), la puissance du SDK Supabase JS et l'intégration d'un design system réactif, nous avons développé une plateforme e-commerce d'exception. L'analyse visuelle des interfaces et la validation des tests de performance démontrent que l'application répond parfaitement aux besoins de la Direction Provinciale de l'Artisanat d'Essaouira.

---

<br>

# **CONCLUSION GÉNÉRALE ET PERSPECTIVES**

---

Au terme de ce projet de Stage de Fin d'Études (SFE) réalisé au sein de la **Direction Provinciale de l'Artisanat d'Essaouira**, nous avons conçu, architecturé et implémenté la plateforme web e-commerce marketplace intitulée **"MOGADOR Choice Marketplace"**.

Ce travail d'ingénierie logicielle s'inscrit dans le cadre du Diplôme Universitaire de Technologie (DUT) en **Génie Informatique** à l'École Supérieure de Technologie d'Essaouira (ESTE), sous l'égide de l'Université Cadi Ayyad de Marrakech. Il apporte une réponse technologique novatrice et durable à une problématique centrale : la modernisation des canaux de commercialisation et la promotion numérique du patrimoine artisanal de la province d'Essaouira.

### **Synthèse des Réalisations Techniques et Académiques**

Tout au long du cycle de vie du projet, nous avons appliqué avec rigueur les concepts fondamentaux du génie informatique :

1. **Analyse et Spécification Rigoureuse :** Formalisation exhaustive des exigences fonctionnelles (moteur de recherche, filtres dynamiques par catégorie et prix max, offres promotionnelles avec minuteurs temporels, panier réactif, contact Google Maps) et non-fonctionnelles (performances SSR, sécurité RLS, ergonomie UI/UX).
2. **Conception et Modélisation Formelle UML 2.5 :** Élaboration des diagrammes de cas d'utilisation, du diagramme de classes et des diagrammes de séquences illustrant les comportements dynamiques de l'application.
3. **Architecture de Base de Données SQL sous PostgreSQL Supabase :** Conception du schéma relationnel normalisé (3NF) avec scripts DDL (UUID, clés étrangères, contraintes CHECK, index b-tree) et sécurisation intégrale via les politiques **Row Level Security (RLS)**.
4. **Développement Full-Stack de Haute Performance sous Next.js :** Implémentation d'une Single Page Application réactive découpée en composants React modulaires, tirant parti de l'App Router, des Server Components, des Server Actions et du rendu hybride (SSR/ISR).

### **Valeur Ajoutée pour l'Organisme d'Accueil et les Artisans**

La plateforme **MOGADOR Choice Marketplace** dote la Direction Provinciale de l'Artisanat d'Essaouira d'un outil numérique institutionnel d'une grande crédibilité. Elle offre aux coopératives et mono-artisans locaux (spécialisés dans le bois de Thuya, l'huile d'Argan pure, la maroquinerie, les tapis berbères et la bijouterie) une vitrine internationale permanente, leur permettant de s'affranchir de la dépendance exclusive au flux touristique physique et de supprimer les intermédiaires commerciaux spéculatifs.

### **Apports Personnels et Professionnels**

Sur le plan personnel et professionnel, ce stage a constitué une expérience charnière. Il m'a permis de développer une autonomie technique forte, d'approfondir la maîtrise de frameworks modernes (Next.js, Supabase), de consolider mes compétences en modélisation UML et conception SQL, et d'acquérir une véritable maturité professionnelle dans la conduite d'un projet informatique complet au sein d'une administration publique.

---

### **Perspectives et Évolutions Futures**

Afin d'accroître encore la valeur opérationnelle de la plateforme **MOGADOR Choice Marketplace**, plusieurs perspectives d'évolution technique et fonctionnelle peuvent être envisagées :

1. **Intégration d'une Passerelle de Paiement en Ligne (Payment Gateway) :** Connecter la plateforme aux API de paiement sécurisé (Stripe, Centre Monétique Interbancaire - CMI) afin de permettre la validation financière automatique des transactions par carte bancaire nationale et internationale.
2. **Développement d'un Espace d'Administration Dédié aux Artisans (Artisan Dashboard) :** Offrir à chaque coopérative un portail autonome sécurisé leur permettant de gérer directement leur catalogue d'articles, de mettre à jour leurs stocks et de suivre l'état de préparation de leurs commandes.
3. **Conversion en Progressive Web App (PWA) et Application Mobile :** Transformée l'application Next.js en PWA réactive afin d'offrir une expérience utilisateur native sur smartphones iOS et Android avec notifications push d'offres promotionnelles.
4. **Internationalisation et Déploiement Multilingue (i18n) :** Intégrer la traduction dynamique intégrale du site en trois langues (Français, Anglais, Arabe) pour cibler efficacement la clientèle internationale et les marchés du Moyen-Orient.

---

<br>

# **BIBLIOGRAPHIE ET WEBOGRAPHIE**

---

### **Ouvrages et Documents Académiques**

1. **Roques, P.** (2020). _UML 2.5 par la pratique : Études de cas et exercices corrigés_. 8ème édition, Éditions Eyrolles.
2. **Subrahmanyam, E.** (2022). _Modern Full-Stack Development with Next.js and React_. Apress Publishing.
3. **Direction Provinciale de l'Artisanat d'Essaouira** (2023). _Rapport annuel d'activité et monographie du Complexe Intégré de l'Artisanat (CIA)_. Documents administratifs internes.
4. **Boutzad, Y.** (2024). _Rapport de Stage de Fin d'Études : Réalisation d'un site web E-commerce de la Direction Provinciale de l'Artisanat d'Essaouira_. ESTE - Université Cadi Ayyad.

### **Documentation Technique et Webographie**

5. **Documentation Officielle Next.js :**  
   _Next.js App Router, Server Components and Server Actions Documentation._  
   Lien : https://nextjs.org/docs
6. **Documentation Officielle Supabase Cloud :**  
   _Supabase Documentation - PostgreSQL Database, Auth, Storage and Row Level Security._  
   Lien : https://supabase.com/docs
7. **Documentation Officielle PostgreSQL 15 :**  
   _PostgreSQL Global Development Group - Relational Database Management System._  
   Lien : https://www.postgresql.org/docs/15/index.html
8. **Documentation Tailwind CSS :**  
   _Tailwind CSS - Rapidly build modern websites without ever leaving your HTML._  
   Lien : https://tailwindcss.com/docs
9. **Ministère du Tourisme, de l'Artisanat et de l'Économie Sociale et Solidaire :**  
   _Portail officiel de la stratégie de l'artisanat marocain._  
   Lien : https://mtaess.gov.ma/fr/artisanat/
10. **MDN Web Docs (Mozilla Developer Network) :**  
    _JavaScript ES6+, Web APIs, CSS Grid & Flexbox Guides._  
    Lien : https://developer.mozilla.org/fr/

---
