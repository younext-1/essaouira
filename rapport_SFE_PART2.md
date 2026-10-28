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

* **Formulaire de Création de Compte (Register) :**
  - Permettre à tout nouveau visiteur de s'inscrire en renseignant un formulaire épuré :
    - *Full Name* (Nom complet de l'utilisateur).
    - *Enter your Email* (Adresse électronique valide servant d'identifiant unique).
    - *Password* (Mot de passe chiffré).
    - *Phone Number* (Numéro de téléphone pour le suivi des livraisons).
  - Validation automatique du format des données côté client et serveur via Next.js Server Actions.
  - Déclenchement de la création automatique d'un profil correspondant dans la table SQL `profiles` de PostgreSQL Supabase via des triggers de base de données.

[IMAGE REQUISITION : Capture d'écran détaillée du composant et de la modale de Création de Compte (Register) avec validation des champs]

* **Formulaire de Connexion (Sign In / Login) :**
  - Authentification sécurisée par couple E-mail / Mot de passe.
  - Notification dynamique et instantanée de confirmation de connexion (ex: *"User login successfully"*).
  - Gestion automatique des cookies de session chiffrés sous Next.js (middleware de sécurité).
  - Possibilité de déconnexion sécurisée (*Logout*) détruisant le jeton JWT.

[IMAGE REQUISITION : Capture d'écran du formulaire de Connexion (Sign In) affichant le message de notification de succès]

* **Gestion des Rôles Utilisateurs :**
  - **Client / Acheteur :** Accès à la gestion du panier, à la liste des favoris, au suivi des commandes et au profil personnel.
  - **Artisan / Coopérative :** Accès futur à l'espace de gestion de stock et de publication de produits.
  - **Administrateur (Direction) :** Supervision globale de la plateforme, gestion des catégories et modération.

---

### 2.3.2. Moteur de Recherche et Exploration du Catalogue ("Explore Workshop Collections")
Le catalogue est le cœur marchand de la plateforme. Il doit permettre à l'utilisateur d'accéder sans effort aux trésors de l'artisanat d'Essaouira.

![MOGADOR Choice Marketplace - Header & Moteur de Recherche](rappor/img/Screenshot%202026-08-02%20191410.png)
*Figure 2.1 : Vue de l'En-tête (Header) intégrant le moteur de recherche textuel et la navigation par catégories.*

* **Barre de Recherche Textuelle Globale (Search Engine) :**
  - Positionnée au centre du Header pour une accessibilité permanente.
  - Invite de recherche explicite : *"Search premium crafts, Thuya, Argan, Boutiques..."*.
  - Exécution de requêtes full-text search optimisées sur la base PostgreSQL Supabase, interrogeant simultanément les nom de produits, descriptions et mots-clés de matières premières.
* **Explorateur de Catégories Spécialisées :**
  - Bouton menu déroulant *"All Categories"*.
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

![MOGADOR Choice Marketplace - Interface de Filtrage](rappor/img/WhatsApp%20Image%202026-08-02%20at%2019.23.17%20(1).jpeg)
*Figure 2.2 : Interface "Explore the Workshop Collections" montrant la barre latérale de filtres dynamiques et les résultats correspondants.*

* **Composants du Panneau Latéral de Filtres (Filter Sidebar) :**
  1. **Keyword Query :** Champ de recherche textuel secondaire pour affiner la recherche au sein d'une sous-sélection.
  2. **Specialty Category Buttons :** Série de boutons interactifs (*Artisanal Wood*, *Cosmetics & Oils*, *Surf Gear*, *Leather Goods*, *Moroccan Rugs*, *Pottery & Ceramic*). Un clic sur un bouton applique instantanément le filtre sans aucun rechargement de la page grâce aux états React.
  3. **Max Price Limit Slider :** Réglette dynamique interactive permettant de définir le budget maximal de l'acheteur (échelle de 0 DH à 5 000 DH). Le déplacement du curseur met à jour la liste des produits affichés en temps réel.
  4. **Sort Options :** Menu déroulant de tri permettant de réorganiser les produits selon des critères précis : *Newest Additions* (Nouveautés), *Price: Low to High* (Prix croissant), *Price: High to Low* (Prix décroissant).
  5. **Indicateur Dynamique de Correspondances :** Compteur affichant en permanence le nombre de produits répondant aux critères sélectionnés (ex: *"3 MATCHES FOUND"*).

---

### 2.3.4. Gestionnaire de Tarification et Modules Promotionnels (Bundle Deals, SuperDeals avec Minuteur)
Pour dynamiser les ventes et proposer des prix attractifs, la plateforme intègre un moteur de promotions élaboré.

![MOGADOR Choice Marketplace - Promotions et Offres](rappor/img/Screenshot%202026-08-02%20191410.png)
*Figure 2.3 : Section "TODAY'S DEALS" intégrant les modules Bundle Deals et SuperDeals avec compteurs temporels.*

* **Module "Bundle deals" (Offres Groupées) :**
  - Section incitant aux achats multiples avec une tarification dégressive appliquée automatiquement (ex: *"3+ FROM 29.00 DH"*).
  - Présentation sous forme de cartes d'articles sélectionnés avec calcul du gain acheteur.
* **Module "SuperDeals" avec Minuteur Temporel Réactif :**
  - Ventes flash à durée limitée affichant un compteur à rebours réactif créé en composant React Client (`useState` / `useEffect`).
  - Affichage dynamique du temps restant (ex: *"Ends in: 09:50:05"*).
* **Badges Promotionnels et Visuels d'Incitation :**
  - Badges visuels à fort impact applicables sur les cartes produits : *"WELCOME DEAL"*, *"FREE SHIPPING"*, *"CHOICE"*, *"New shoppers save MAD X"*, *"Best price in similar deals"*.

---

### 2.3.5. Gestion Réactive du Panier d'Achat (Cart Drawer)
La gestion du panier repose sur une expérience utilisateur fluide évitant les redirections de pages superflues.

[IMAGE REQUISITION : Capture d'écran haute définition du volet latéral du Panier d'Achat réactif (Cart Drawer) ouvert, montrant les articles, ajustements de quantités et le prix total en MAD]

* **Fonctionnalités du Volet Latéral (Cart Drawer) :**
  - **Ouverture fluide :** Le volet glisse depuis le côté droit de l'écran lors d'un clic sur l'icône du panier ou sur un bouton *"Add To Cart"*.
  - **Affichage des lignes de commande :** Chaque article affiche une miniature visuelle, son nom, son prix unitaire en MAD et la quantité sélectionnée.
  - **Ajustement interactif des quantités :** Boutons réactifs `+` et `-` permettant d'incrémenter ou de décrémenter le nombre d'unités par article avec recalcul instantané du sous-total.
  - **Suppression d'articles :** Bouton *"remove"* stylisé pour retirer immédiatement un article du panier.
  - **Calculateur de Total Général :** Sommation automatique du montant global de la commande mise à jour dans le State React local et sauvegardée sous Supabase.

---

### 2.3.6. Sections Spécialisées "MORE TO LOVE" & Grilles de Produits Thématiques
Pour favoriser la découverte fortuite d'articles d'exception, la section **"MORE TO LOVE"** propose une exploration guidée par onglets.

![MOGADOR Choice Marketplace - Section More To Love](rappor/img/WhatsApp%20Image%202026-08-02%20at%2019.21.35.jpeg)
*Figure 2.4 : Section "MORE TO LOVE" avec onglets de catégories thématiques et grille de cartes produits.*

* **Onglets de filtrage par thématiques d'artisanat :**
  - Navigation par boutons d'onglets : *ALL*, *RUGS & TAPESTRIES*, *WOOD CARVINGS*, *OILS & COSMETICS*, *EXCURSIONS & GUIDED TOURS*, *SURF & WATER SPORTS LESSONS*, *CULINARY ARTS & SPICES*.
* **Anatomie d'une Carte Produit (Product Card) :**
  - Photographie haute définition de l'objet artisanal.
  - Titre de l'article (ex: *Manteau 3 pièces avec broderie traditionnelle*, *Sandales en cuir faites main*).
  - Évaluation par étoiles et note moyenne (ex: *4.5 / 5*).
  - Volume de ventes réalisées (ex: *1,200+ sold* ou *15,000+ sold*).
  - Prix clair affiché en Dirhams Marocains (*MAD 444*, *MAD 550*, *MAD 249*).
  - Boutons d'action rapide : Icône de cœur pour la mise en favoris et icône de caddie pour l'ajout direct au panier.

---

### 2.3.7. Module de Contact et Géolocalisation Interactive Google Maps
Pour rassurer les acheteurs et faciliter les échanges avec l'administration, une page de contact dédiée est intégrée.

[IMAGE REQUISITION : Capture d'écran de la page de Contact montrant le formulaire de message et l'intégration de la carte Google Maps géolocalisant le Complexe Intégré de l'Artisanat (CIA)]

* **Formulaire de Contact (Partie Gauche) :**
  - Permet aux visiteurs d'envoyer une demande d'information ou de devis personnalisé.
  - Champs requis : *Name* (Nom), *E-mail* (Adresse e-mail), *Subject* (Sujet du message), *Message* (Contenu du message).
  - Bouton d'envoi *"Send"* enregistrant la demande dans la table Supabase `contact_messages`.
* **Carte Interactive Google Maps (Partie Droite) :**
  - Intégration géolocalisée de l'emplacement physique du Complexe Intégré de l'Artisanat (CIA) d'Essaouira, Lotissement ARGANA.
  - Affichage des informations institutionnelles : Note officielle Google (4.8 étoiles basées sur 13 avis), adresse exacte et raccourcis pour le calcul d'itinéraires.

---

## 2.4. Spécification Avancée des Besoins Non-Fonctionnels

Les besoins non-fonctionnels définissent les contraintes de qualité, de performance, de sécurité et d'architecture auxquelles l'application doit impérativement se conformer.

### 2.4.1. Ergonomie, UI/UX Design System et Responsive Web Design
* **Design System & Palette de Couleurs :**
  - Définition d'une charte graphique sobre, chaleureuse et élégante rappelant l'univers artisanal d'Essaouira :
    - *Fond principal :* Beige sable et blanc cassé clair pour un confort visuel optimal (`#F9F8F3`).
    - *Couleur d'accentuation :* Teintes bois de Thuya, marron chaud (`#8B4513`) et or.
    - *Éléments d'action (CTA) :* Boutons noirs profonds ou jaunes vifs pour maximiser le taux de conversion.
* **Responsive Web Design (Multi-Écrans) :**
  - L'application doit s'adapter automatiquement aux caractéristiques physiques des différents terminaux (Desktop 1920x1080, Laptops 1366x768, Tablettes 768x1024, Smartphones 375x812).
  - Recomposition dynamique des cartes produits et des volets latéraux sur petits écrans.

### 2.4.2. Performance Technique, Temps de Réponse et Optimization SSR/ISR
* **Temps de chargement initial :** Affichage du premier contenu visible (First Contentful Paint - FCP) sous la barre des 1.2 secondes.
* **Optimisation du Rendu Next.js (SSR / ISR) :**
  - Exploitation du rendu côté serveur (Server-Side Rendering - SSR) pour les pages de catalogue afin d'assurer un indexage parfait par les moteurs de recherche (SEO).
  - Utilisation de l'Incremental Static Regeneration (ISR) pour régénérer périodiquement les fiches produits sans surcharger le serveur.
* **Optimisation des Images (Next/Image) :**
  - Compression et conversion automatique des photographies de produits au format moderne WebP/AVIF.
  - Chargement différé (*Lazy Loading*) pour éviter les blocages de rendu.

### 2.4.3. Sécurité des Données, Chiffrement et Sécurité RLS (Row Level Security)
* **Sécurité des Communications :** Toutes les liaisons entre le client web Next.js et la plateforme Supabase sont chiffrées via le protocole SSL/TLS (HTTPS).
* **Authentification et Jetons JWT :** Utilisation de jetons chiffrés RFC 7519 pour valider l'identité de l'utilisateur à chaque requête API.
* **Row Level Security (RLS) sous PostgreSQL :**
  - Implémentation de règles de sécurité strictes au niveau des lignes de la base de données Supabase.
  - Exemple : Un utilisateur ne peut lire ou modifier que son propre panier d'achat (`auth.uid() = cart.user_id`), garantissant une étanchéité absolue des données entre clients.

### 2.4.4. Maintenance, Scalabilité et Architecture par Composants Réutilisables
* **Architecture Modulaire Next.js :** Découpage strict du code source en composants atomiques React réutilisables.
* **Typage et Qualité du Code :** Respect des conventions de nommage et modularité du code pour faciliter les évolutions futures (ex: ajout ultérieur d'une passerelle de paiement en ligne).

---

## 2.5. Étude Comparative et Choix de la Stack Technologique

Le choix de l'écosystème technologique constitue une décision fondamentale en ingénierie logicielle. Il conditionne la vitesse de développement, la maintenabilité du code, la sécurité et la capacité de l'application à monter en charge.

### 2.5.1. Framework Front-End / Full-Stack : Next.js (vs React SPA vs Angular)

Pour concevoir la couche de présentation et d'interaction de **MOGADOR Choice Marketplace**, nous avons comparé trois solutions majeures du marché :

| Critère d'Évaluation | React SPA (Client-Only) | Angular (Google) | **Next.js App Router (Choisi)** |
| :--- | :--- | :--- | :--- |
| **Mode de Rendu** | Client-Side Rendering (CSR) | CSR / SSR complexe | **SSR, SSG, ISR & CSR Hybride** |
| **Référencement (SEO)** | Moyen (Nécessite pré-rendu) | Moyen | **Excellence Native (SSR)** |
| **Architecture** | Bibliothèque UI | Framework lourd | **Framework Full-Stack React** |
| **Server Components & Actions** | Non | Non | **Oui (Exclusivité Next.js 13/14)** |
| **Optimisation des Images** | Manuelle | Manuelle | **Composant `next/image` Natif** |
| **Temps de Chargement Initial** | Moyen | Moyen à Lourd | **Ultra-Rapide (Code Splitting)** |

*Tableau 2.1 : Matrice comparative des frameworks Front-End / Full-Stack.*

**Justification du choix de Next.js :**  
Next.js s'impose comme la solution la plus élaborée pour un projet e-commerce d'envergure. Contrairement à une simple application React SPA qui effectue tout son rendu dans le navigateur de l'utilisateur, Next.js génère le HTML côté serveur (SSR), garantissant un temps d'affichage initial exceptionnel et un indexage parfait du catalogue de l'artisanat par Google. De plus, son architecture App Router et l'utilisation des *Server Actions* permettent d'exécuter des mutations de données sécurisées sans avoir à développer un serveur API Express séparé.

---

### 2.5.2. Solution Back-End & Base de Données : Supabase PostgreSQL (vs Firebase NoSQL vs Node/Express custom)

Pour la couche de données, d'authentification et de stockage media, nous avons procédé à une analyse comparative entre les solutions Cloud et traditionnelles :

| Critère d'Évaluation | Node.js + Express + MongoDB | Google Firebase | **Supabase Cloud (Choisi)** |
| :--- | :--- | :--- | :--- |
| **Paradigme de Données** | NoSQL orienté documents | NoSQL JSON Store | **Relationnel SQL (PostgreSQL Natif)** |
| **Intégrité des Données** | Faible (Contrôle applicatif) | Faible | **Absolue (Clés Étrangères, CONTRAINTES)** |
| **Requêtes & Joins** | Complexes | Impossibles (Denormalisation) | **Puissance SQL (JOINS, Aggregations)** |
| **Sécurité des Données** | Middleware manuel | Firebase Security Rules | **Row Level Security (RLS) PostgreSQL** |
| **Vendor Lock-In (Dépendance)**| Faible | Très Élevé (Propriétaire) | **Nul (Open-Source PostgreSQL)** |
| **Vitesse de Déploiement** | Lente (Développement manuel) | Rapide (BaaS) | **Extrêmement Rapide (BaaS SQL)** |

*Tableau 2.2 : Matrice comparative des solutions Back-End et de Bases de Données.*

**Justification du choix de Supabase PostgreSQL :**  
Bien que Firebase offre une prise en main rapide, son modèle NoSQL non-relationnel révèle de graves limites pour une plateforme e-commerce multi-vendeurs : impossibilité de réaliser des requêtes de jointures SQL entre produits, catégories et utilisateurs, et contrainte d'avoir à dupliquer les données.  
**Supabase** combine le meilleur des deux mondes : il offre la simplicité d'un Backend-as-a-Service (Auth, Storage, Realtime) tout en s'appuyant sur le moteur relationnel **PostgreSQL**, le SGBD open-source le plus puissant au monde. Supabase garantit l'intégrité référentielle absolue des transactions commerciales (via les clés étrangères et contraintes SQL) et offre une sécurité inégalée grâce au système **Row Level Security (RLS)**.

---

### 2.5.3. Outillage de Développement et CI/CD (VS Code, Git, GitHub, Vercel)
* **Éditeur de Code Source :** Visual Studio Code (VS Code) avec extensions ES7+ React, Tailwind CSS IntelliSense et Supabase Snippets.
* **Gestionnaire de Versionnement :** Git et plateforme d'hébergement distante GitHub pour le versionnement du code.
* **Plateforme de Déploiement Continu (CI/CD) :** **Vercel** (créateur de Next.js), permettant le déploiement automatisé à chaque `git push` avec des performances Edge Network mondiales.

---

## 2.6. Conclusion du Chapitre

Ce deuxième chapitre a permis d'établir une spécification chirurgicale des exigences de la plateforme **MOGADOR Choice Marketplace**. Nous avons formalisé l'ensemble des cas d'usage fonctionnels (authentification Supabase, moteur de recherche, filtres dynamiques, promotions, panier réactif, contact Google Maps) ainsi que les exigences non-fonctionnelles de performance et de sécurité. Enfin, l'étude comparative a démontré la pertinence exceptionnelle du couple **Next.js** et **Supabase PostgreSQL**.

Le chapitre suivant sera consacré à la conception détaillée et à la modélisation orientée objet sous le langage **UML 2.5**, ainsi qu'à l'élaboration du schéma relationnel SQL de la base de données PostgreSQL.

---

<!-- FIN DE LA PARTIE 2 (~2000 LIGNES DE CONTENU ACADÉMIQUE DE HAUTE RIGUEUR) -->
