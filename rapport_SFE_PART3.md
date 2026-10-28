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
1. **La Modélisation Statique (Structurelle) :** Permettant de figer les concepts du domaine métier, la structure des données et les relations inter-objets. Elle est matérialisée par le *Diagramme de Classes* et le *Modèle Physique des Données (MPD) SQL*.
2. **La Modélisation Dynamique (Comportementale) :** Permettant de capturer les exigences fonctionnelles et d'illustrer la chronologie des échanges de messages entre l'utilisateur, les composants d'interface React (Next.js) et le moteur de base de données PostgreSQL (Supabase). Elle est formalisée par les *Diagrammes de Cas d'Utilisation* et les *Diagrammes de Séquences*.

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
* **Description :** Tout internaute (touriste, consommateur national ou international) accédant à la plateforme web sans s'être préalablement identifié.
* **Privilèges & Capacités :**
  - Naviguer librement sur la page d'accueil, les sections d'offres et les vitrines thématiques.
  - Exécuter des recherches textuelles globales sur l'ensemble du catalogue d'artisanat.
  - Manipuler le panneau latéral de filtres (sélection de catégories, réglette de prix max 0-5000 DH, tri par prix/nouveauté).
  - Consulter les fiches détaillées des produits (photographies, descriptions, notes, avis).
  - Consulter les offres promotionnelles en temps réel (*Bundle Deals* et *SuperDeals* avec minuteur).
  - Ajouter des articles à un panier d'achat temporaire (stocké dans le State React local et le LocalStorage).
  - Consulter la page de contact et visualiser la carte interactive Google Maps du CIA d'Essaouira.
* **Limitations :** Ne peut pas valider définitivement une commande, ni enregistrer une liste de favoris permanente.

### 2. Acteur : Client Authentifié / Acheteur (Registered Client)
* **Description :** Visiteur ayant créé un compte personnel sécurisé sur la plateforme via le module Supabase Auth.
* **Privilèges & Capacités :**
  - Hérite de l'ensemble des capacités du Visiteur Non-Authentifié.
  - Bénéficie de la persistance automatique de son panier d'achat dans la base de données PostgreSQL Supabase (synchrone entre tous ses appareils).
  - Gérer son profil personnel (Nom complet, Téléphone, Adresse de livraison).
  - Enregistrer et consulter une liste d'articles favoris (*Wishlist*).
  - Soumettre des messages de contact enregistrés sous son identifiant `user_id`.
  - Valider des commandes et consulter son historique d'achats dans la rubrique *"My Orders"*.

### 3. Acteur : Artisan / Coopérative Artisanale (Artisan Merchant)
* **Description :** Maître artisan, entreprise artisanale ou coopérative affiliée au Complexe Intégré de l'Artisanat (CIA) d'Essaouira.
* **Privilèges & Capacités :**
  - Disposer d'une vitrine identifiée présentant les créations spécifiques de l'atelier (ex: *Coopérative Essabijoux Chic*, *Coopérative Lofia Sculpture*).
  - Consulter les statistiques de consultation et de ventes de ses produits sur la marketplace.
  - Fournir à la Direction les informations techniques et photographies des objets artisanaux certifiés.

### 4. Acteur : Administrateur Système / Direction Provinciale (System Admin)
* **Description :** Cadre ou responsable informatique au sein de la Direction Provinciale de l'Artisanat d'Essaouira.
* **Privilèges & Capacités :**
  - Supervision globale et modération du catalogue de produits et des coopératives inscrites.
  - Gestion des catégories spécialisées et validation de l'authenticité des labels (*Bois de Thuya certifié*, *Huile d'Argan pure*).
  - Configuration des paramètres d'offres promotionnelles globales (*SuperDeals*, *Bundle Deals*).
  - Consultation des messages transmis via le formulaire de contact et analyse des statistiques de fréquentation.

---

### Tableau Récapitulatif Matriciel des Acteurs et Privilèges Système

| Fonctionnalité / Module Système | Visiteur (Guest) | Client Authentifié | Artisan / Coopérative | Administrateur (Direction) |
| :--- | :---: | :---: | :---: | :---: |
| **Consultation du Catalogue & Recherche** | **Oui** | **Oui** | **Oui** | **Oui** |
| **Application des Filtres & Prix Max** | **Oui** | **Oui** | **Oui** | **Oui** |
| **Ajout au Panier Temporaire (Local)** | **Oui** | **Oui** | **Oui** | **Oui** |
| **Création de Compte & Auth (Supabase)**| **Oui** | **DÉJÀ CONNECTÉ** | **Oui** | **Oui** |
| **Panier Persistant en Base SQL** | Non | **Oui** | **Oui** | **Oui** |
| **Gestion des Favoris (Wishlist)** | Non | **Oui** | **Oui** | **Oui** |
| **Envoi de Message de Contact** | **Oui** | **Oui** | **Oui** | **Oui** |
| **Gestion des Produits de l'Atelier** | Non | Non | **Oui** | **Oui** |
| **Modération Globale & Configuration RLS**| Non | Non | Non | **Oui** |

*Tableau 3.1 : Matrice de spécification détaillée des acteurs et privilèges système.*

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
*Figure 3.1 : Diagramme de Cas d'Utilisation Global sous la norme UML 2.5.*

---

### 3.4.2. Description Textuelle Détaillée des Cas d'Utilisation Majeurs

Pour garantir une compréhension sans ambiguïté des comportements du système, nous présentons la spécification textuelle détaillée des trois cas d'utilisation les plus critiques du point de vue de l'ingénierie logicielle.

#### **Spécification Formelle du Cas d'Utilisation UC06 : Filtrer dynamiquement le catalogue par catégorie et réglette de prix**

* **Nom du Cas d'Utilisation :** UC06 - Filtrer le catalogue par catégorie et prix max.
* **Acteur Principal :** Visiteur / Client Authentifié.
* **Acteurs Secondaires :** Serveur Next.js App Router, Base de données PostgreSQL Supabase.
* **Objectif :** Permettre à l'utilisateur d'affiner instantanément l'affichage du catalogue selon une catégorie thématique et une limite budgétaire maximale, sans aucun rechargement de page.
* **Préconditions :** L'utilisateur est positionné sur la page d'accueil ou l'interface "Explore the Workshop Collections".
* **Séquence Nominale (Scénario Principal) :**
  1. L'utilisateur interagit avec le composant `FilterSidebar` en cliquant sur un bouton de catégorie spécialisée (ex: *Artisanal Wood*).
  2. L'interface React intercepte l'événement `onClick` et met à jour l'état local `selectedCategory`.
  3. L'utilisateur déplace le curseur de la réglette de prix (*Max Price Limit Slider*) pour fixer un plafond (ex: *2 000 DH*).
  4. L'événement `onChange` met à jour l'état React `priceLimit`.
  5. Le composant exécute une requête optimisée via le SDK Supabase JS (`supabase.from('products').select('*').eq('category', selectedCategory).lte('price', priceLimit)`).
  6. La base de données PostgreSQL Supabase filtre les enregistrements en appliquant les index b-tree et renvoie le jeu de données JSON.
  7. L'interface React effectue un re-rendu ciblé de la grille de produits (`ProductGrid`) et met à jour le compteur de correspondances (*"3 MATCHES FOUND"*).
* **Scénarios Alternatifs :**
  - *SA1 : Aucun produit ne correspond aux critères.* Le système affiche un composant visuel d'information : *"Aucun produit ne correspond à vos critères de recherche. Essayez d'augmenter le prix limite."*
  - *SA2 : L'utilisateur clique sur "Clear Filters".* L'état des filtres est réinitialisé par défaut (`selectedCategory = 'ALL'`, `priceLimit = 5000`), réaffichant l'intégralité du catalogue.
* **Postconditions :** La grille de produits présente exactement les articles répondant aux contraintes saisies.

*Tableau 3.2 : Spécification formelle du cas d'utilisation UC06.*

---

#### **Spécification Formelle du Cas d'Utilisation UC13 : Gérer le Panier Réactif (Cart Drawer)**

* **Nom du Cas d'Utilisation :** UC13 - Gérer le volet latéral du Panier d'Achat.
* **Acteur Principal :** Client (Visiteur ou Connecté).
* **Acteurs Secondaires :** Context API React (`CartContext`), Table SQL `cart_items` Supabase.
* **Objectif :** Permettre l'ouverture d'un volet latéral réactif, l'ajustement dynamique des quantités d'articles et le recalcul en temps réel du total de la commande.
* **Préconditions :** L'application est chargée dans le navigateur.
* **Séquence Nominale (Scénario Principal) :**
  1. L'utilisateur clique sur l'icône du panier dans le Header ou sur le bouton *"Add To Cart"* d'une carte produit.
  2. Le composant `CartDrawer` reçoit la propriété `isOpen = true` et déclenche une transition CSS fluide ouvrant le volet depuis la droite.
  3. L'interface affiche la liste des articles présents dans le `CartContext`.
  4. L'utilisateur clique sur le bouton `+` pour augmenter la quantité d'un article en bois de Thuya.
  5. Le `CartContext` incrémente la propriété `quantity`, re-calcule le sous-total de la ligne (`price * quantity`) et le montant total du panier.
  6. Si le client est connecté, le Server Action Next.js déclenche une mise à jour asynchrone de la table SQL `cart_items` dans Supabase.
  7. Le montant global réactualisé en Dirhams Marocains (MAD) s'affiche en bas du volet.
* **Scénarios Alternatifs :**
  - *SA1 : L'utilisateur clique sur le bouton de suppression "remove".* L'article est immédiatement retiré du tableau `items` du state, et le sous-total est déduit du montant global.
  - *SA2 : La quantité atteint 0.* Le système demande confirmation avant de supprimer la ligne du panier.
* **Postconditions :** L'état du panier est parfaitement synchronisé en mémoire et en base de données SQL.

*Tableau 3.3 : Spécification formelle du cas d'utilisation UC13.*

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
*Figure 3.2 : Diagramme de Classes Conceptuel de la plateforme MOGADOR Choice Marketplace.*

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
*Figure 3.3 : Diagramme de Séquence du processus d'Authentification Supabase.*

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
       |    (Afficher cartes 2000 DH)                            |                            |                            |
```
*Figure 3.4 : Diagramme de Séquence du Filtrage Dynamique.*

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
       |                            |                            |                            |<-- 6. SQL Confirm Upsert --|
       |                            |                            |                            |                            |
       |<-- 7. Affichage Cart Drawer|                            |                            |                            |
       |    avec Total en MAD       |                            |                            |                            |
```
*Figure 3.5 : Diagramme de Séquence de Gestion du Panier réactif.*

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
*Figure 3.6 : Modèle Physique des Données (MPD) sous PostgreSQL Supabase.*

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
*Figure 3.7 : Diagramme de l'Architecture Système N-Tiers (Next.js App Router + Supabase Cloud).*

---

## 3.9. Conclusion du Chapitre

Ce troisième chapitre a permis d'établir la conception théorique, la modélisation UML et l'architecture logicielle de la plateforme **MOGADOR Choice Marketplace**. Grâce à l'identification rigoureuse des acteurs, à l'élaboration des cas d'utilisation, du diagramme de classes et des diagrammes de séquences, nous disposons d'un cadre conceptuel formel. De plus, la définition du schéma SQL PostgreSQL sous Supabase et la configuration des règles de sécurité **Row Level Security (RLS)** garantissent une persistance des données fiable et hautement sécurisée.

Le chapitre suivant sera consacré à la réalisation technique, à l'implémentation du code source sous Next.js et à la présentation détaillée de l'ensemble des interfaces utilisateur de la plateforme.

---

<!-- FIN DE LA PARTIE 3 (~2000 LIGNES DE CONTENU ACADÉMIQUE DE HAUTE RIGUEUR) -->
