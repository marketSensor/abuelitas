# abuelitas

Application de recettes familiales : carnets privés, photos, import de recettes par OCR, variantes, export PDF et listes de courses.

Site hébergé : https://abuelitas.indigolynx34.chatgpt.site

## Développement

Node.js >= 22.13.0 et pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Les ressources OCR françaises sont reconstruites automatiquement avant `dev` et `build` depuis les dépendances verrouillées. Elles ne sont pas versionnées dans ce dépôt.

```sh
pnpm typecheck
pnpm test
pnpm build
```

Le développement utilise Vinext/React et Cloudflare Workers. Les schémas D1 sont dans `drizzle/`. L’authentification de production dépend de Sites ; le mode local utilise les mocks du starter. Ce dépôt n’est pas un site statique compatible GitHub Pages.

## Fonctionnalités et limites

- Import OCR local de recettes écrites ou imprimées ; vérification humaine avant sauvegarde.
- Création, modification et suppression des recettes par leur auteur ; variantes familiales.
- Reformulation des étapes et fonctions IA : disponibles seulement lorsque `OPENAI_API_KEY` est configurée comme secret côté serveur. `OPENAI_MODEL` est facultatif.
- Courses : choix Carrefour/Auchan, recherche de produits et copie de liste. Aucun panier marchand n’est rempli automatiquement.
- Comptes, recettes personnelles et photos sont stockés dans les services D1/R2 du site, pas dans GitHub.

## Historique et déploiement

Import de la version Sites `a5f33980c8f3ad9d7ca5259ba2f97a79aeac7578` publiée le 18 octobre 2026. L’historique GitHub commence par le commit initial existant, suivi de cet import.

Chaque nouvelle modification demandée doit être enregistrée dans ce dépôt. Consulter `AGENTS.md` avant intervention. La connexion GitHub permet d’envoyer les changements pendant une session ; elle ne constitue pas une synchronisation en arrière-plan.

La publication du site reste assurée par Sites et son dépôt technique. Un push GitHub ne déploie pas automatiquement le site. Lors d’une mise à jour, vérifier les deux sources, publier via Sites et reporter le code validé sur GitHub sans écraser les changements externes. Ne pas remplacer le dépôt technique ni son identité de projet.

Les clés API, fichiers `.env*`, `.dev.vars*`, bases locales et photos des utilisateurs doivent rester hors du dépôt. Le dépôt GitHub est public ; cela ne change pas l’accès privé au site.
