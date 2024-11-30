# BrainWashed_XR

**BrainWashed_XR** est un jeu interactif en 3D construit avec Three.js, dans lequel les joueurs doivent "cliquer" sur des points verts apparaissant de façon aléatoire sur un modèle 3D de cerveau.

## Table des Matières
- [À propos du projet](#à-propos-du-projet)
- [Fonctionnalités](#fonctionnalités)
- [Comment jouer](#comment-jouer)
- [Déroulé du jeu](#déroulé-du-jeu)
- [Technologies utilisées](#technologies-utilisées)
- [Créateurs](#créateurs)
- [Crédits](#crédits)

## À propos du projet
**BrainWashed_XR** est une application ludique et interactive qui améliore la réactivité des utilisateurs en les invitant à cliquer rapidement sur des points apparaissant sur un modèle 3D de cerveau.

## Fonctionnalités
- **Positionnement du Modèle 3D** : Les utilisateurs peuvent placer le modèle là où ils le souhaitent.
- **Génération de point aléatoire** : Le point vert se faisant "cliquer" dessus disparait et un nouveau point vert apparait

## Comment jouer

  - Installez [Homebrew](https://brew.sh)

Pour se faire, tapez dans un terminal :

```bash
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Suivez ensuite les instructructions données lors du téléchargement (copier coller 3 lignes de la forme suivante).


```bash
echo >> /Users/XXX/.zprofile

echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> /Users/XXX/.zprofile

eval "$(/opt/homebrew/bin/brew shellenv)"
```

  - **[Installez `cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)**

```bash
brew install cloudflared
```
- Lancez l'app localement avec cette commande (en étant à la racine du projet).

```bash
npm run dev
```

- Puis tapez

```bash
cloudflared --url http://localhost:5173/
```

Cela créera un lien temporaire se terminant par `*.trycloudflare.com`

Vous pouvez partager cette adresse en envoyant un lien ou en générant un QR code (très utile pour les appareils mobiles et certains casques XR).

Vous pouvez désormais "jouer".

## Déroulé du jeu

- Démarrez la partie en cliquant sur le bouton "Start XR".
- Appuyer sur l'écran à l'endroit où vous désirez placez le cerveau.
- Un point sur le modèle de cerveau deviendra vert de façon aléatoire.
- Le point changera de position après chaque "clic" réussi, cherchez le suivant puis cliquer dessus et ainsi de suite.

## Technologies utilisées

- Three.js : Pour le rendu du modèle 3D de cerveau et la création de points interactifs.
- JavaScript : Pour la logique de jeu, la mise à jour de l’interface utilisateur et la gestion des événements.
- HTML/CSS : Pour la structure et le style de base du jeu (même si le css est implémenté en JS pour le coup).

## Créateurs

- Charles Zhang
- Denis Adde

## Crédits

- Modèle de cerveau 3D : https://poly.pizza/m/5mPRPZkI3qt
- Site utilisé pour le générer le modèle avec des "points" : https://tympanus.net/codrops/2021/08/31/surface-sampling-in-three-js/
- Créé avec Three.js
