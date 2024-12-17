# Cartes IGN

[Guide utilisateur](https://www.ign.fr/publications-de-l-ign/institut/Publications/Autres_publications/livret-appli-cartes-ign.pdf)

## Présentation

Cartes IGN est l'application mobile développée par l'IGN pour découvrir la France autrement. Les fonctionnalités de l'application se basent sur les services web de la Géoplateforme. La cartographie est faite à l'aide de [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/), et la compilation sur mobile est réalisée à l'aide de [Webpack](https://webpack.js.org/) et [Capacitor](https://capacitorjs.com/).

## Installation et tests en local

Installation des dépendances :

```npm i```

Serveur de test pour développement sur navigateur :

```npm run serve:dev```

Installation sur un émulateur Android ou sur un téléphone Android branché en mode débuggage :

```npm run run:android```

## Contributions

Pour suggérer des modifications, merci d'utiliser les [issues](https://github.com/IGNF/cartes-ign-app/issues) de ce dépôt

## License

[GNU GPLv3](LICENSE)

[Licenses des dépendances](third-party-licenses.txt)
