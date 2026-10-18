# Abuelitas — consignes de travail

- Dépôt utilisateur : https://github.com/marketSensor/abuelitas, branche principale `main`.
- À chaque modification demandée, lire l’état actuel de GitHub et conserver son historique. Enregistrer le code validé dans ce dépôt ; signaler explicitement un blocage de synchronisation. Ne jamais forcer un push.
- Le site reste hébergé sur Sites : `https://abuelitas.indigolynx34.chatgpt.site`. Son identité est dans `.openai/hosting.json`. Respecter le workflow Sites pour sa publication et conserver son dépôt technique.
- Avant de modifier une copie Sites, comparer avec GitHub pour ne pas perdre des changements externes. Reporter les modifications validées dans les deux sources lors de la session. Aucun service de synchronisation automatique n’est installé.
- Préserver les différences de packaging GitHub : README/AGENTS, nom et scripts du package, exclusions OCR et fichiers de compilation. Les ressources `public/ocr/` sont générées par `scripts/copy-ocr-assets.mjs` à partir du lockfile.
- Exécuter les tests pertinents et le contrôle TypeScript ; construire avant publication.
- Ne pas publier de secrets ni de données utilisateurs. Ne pas modifier l’audience du site ou la visibilité du dépôt sans demande.
- Ne pas présenter une recherche chez une enseigne comme un ajout de panier. La reformulation IA nécessite la configuration serveur et une validation de l’utilisateur avant remplacement.
