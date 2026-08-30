# Dupont Admin — Guide simple

Cette application gère tes artistes et tes demandes (contact/démo), directement sur ton PC.
Comme ton PC est sous **Windows 7**, on fabrique le fichier .exe "dans le cloud" via GitHub
(gratuit), pour éviter tout souci de compatibilité. Tu n'as besoin que de ton navigateur internet.

## Étape 1 — Créer un compte GitHub
Va sur https://github.com et crée un compte gratuit (si tu n'en as pas déjà un).

## Étape 2 — Créer un nouveau dépôt (repository)
1. Clique sur le **+** en haut à droite → **New repository**.
2. Nomme-le par exemple `dupont-admin`.
3. Choisis **Private** (privé, pour que personne d'autre ne voie ton code).
4. Ne coche aucune case (pas de README), clique **Create repository**.

## Étape 3 — Envoyer les fichiers
1. Sur la page de ton nouveau dépôt, clique **Add file** → **Upload files**.
2. Ouvre le dossier `dupont-admin-app` (celui que je t'ai donné, dézippé) dans l'explorateur Windows.
3. Sélectionne **tout le contenu** du dossier (Ctrl+A) — y compris le dossier `.github` et `renderer` —
   et glisse-le dans la fenêtre GitHub.
4. En bas de la page, clique **Commit changes**.

## Étape 4 — Laisser GitHub fabriquer le .exe
1. Clique sur l'onglet **Actions** en haut du dépôt.
2. Tu verras "Build Windows App" en cours (rond jaune) — attends 2 à 3 minutes qu'il devienne
   une coche verte ✅.
3. Clique sur ce run terminé, puis descends jusqu'à la section **Artifacts** en bas de page.
4. Télécharge le fichier **dupont-admin-windows** (un .zip).

## Étape 5 — Installer sur ton PC
1. Dézippe le fichier téléchargé — tu obtiens un installeur `.exe`.
2. Double-clique dessus pour installer l'application.
3. Un raccourci "Dupont Admin" apparaît sur ton Bureau — tu n'as plus qu'à double-cliquer dessus
   à chaque fois que tu veux l'ouvrir.

## Utilisation de l'application
- **Onglet Demandes** : ajoute manuellement les demandes que tu reçois par email (copie-colle le
  message), choisis un statut (Nouveau / En cours / Traité / Refusé) et garde des notes privées.
- **Onglet Artistes** : ajoute, modifie ou supprime tes artistes (bio, liens Spotify/YouTube, photo...).
- **Bouton "Exporter pour le site"** : génère un fichier `artistes-data.js` avec toutes les infos de
  tes artistes, prêt à être mis en ligne. (On verra ensemble comment l'intégrer à ton site à la
  prochaine étape.)

Toutes tes données restent **en local sur ton PC**, dans un fichier que l'application gère seule
— tu n'as rien à toucher.

## En cas de souci
Si une étape ne fonctionne pas ou n'est pas claire, dis-moi exactement où tu bloques et une
capture d'écran si possible — je t'aide à débloquer ça.
