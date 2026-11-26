# Cartes IGN

[Guide utilisateur](https://www.ign.fr/publications-de-l-ign/institut/Publications/Autres_publications/livret-appli-cartes-ign.pdf)

## Présentation

Cartes IGN est l'application mobile développée par l'IGN pour découvrir la France autrement. Les fonctionnalités de l'application se basent sur les services web de la Géoplateforme. La cartographie est faite à l'aide de [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/), et la compilation sur mobile est réalisée à l'aide de [Webpack](https://webpack.js.org/) et [Capacitor](https://capacitorjs.com/).

## Sauvegarde des traces GPS

Une trace contenant au moins deux points est sauvegardée automatiquement toutes les minutes et lors du passage en arrière-plan. En cas d'interruption, la dernière sauvegarde est disponible dans « Enregistrés » au redémarrage. L'enregistrement définitif la remplace ; la suppression de la trace la supprime également. La sauvegarde en arrière-plan dépend de l'exécution de l'application par le système.

## Installation et tests en local

Installation des dépendances :

```npm i```

Lint et tests unitaires :

```npm run lint```

```npm run test:unit```

Tests end-to-end sur l'application web compilée :

```npx playwright install chromium```

```npm run test:e2e```

Serveur de test pour développement sur navigateur :

```npm run serve:dev```

Les commandes de développement (`serve:dev`, `build:dev` et les commandes mobiles
qui utilisent `build:dev`) chargent uniquement les configurations locales du
dossier `config/`, sans requête vers les serveurs de configuration. Les couches
temporaires et le fil d'actualités, sans équivalent local, restent vides.

Pour activer ce même mode avec un build de production (par exemple dans une image
Docker de test) :

```sh
LOCAL_CONFIG=true npm run build
```

Cette option est intégrée au JavaScript lors de la compilation, pas au démarrage
de Nginx. Dans l'étape de build du Dockerfile, avant la boucle de compilation des
branches, ajouter :

```dockerfile
ARG LOCAL_CONFIG=true
ENV LOCAL_CONFIG=$LOCAL_CONFIG
```

Tous les `npm run build` suivants utilisent ainsi les configurations embarquées
de la branche compilée. Utiliser `--build-arg LOCAL_CONFIG=false` pour retrouver
le chargement distant. Sans cette variable, `npm run build` conserve le chargement
distant avec repli local en cas d'échec.

Installation sur un émulateur Android ou sur un téléphone Android branché en mode débuggage :

```npm run run:android```

## Contributions

Pour suggérer des modifications, merci d'utiliser les [issues](https://github.com/IGNF/cartes-ign-app/issues) de ce dépôt

## License

[GNU GPLv3](LICENSE)

[Licenses des dépendances](third-party-licenses.txt)
