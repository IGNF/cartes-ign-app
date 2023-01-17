# Application mobile Géoportail - procédure de déploiement

## Prérequis

- [node](https://nodejs.org/en/)
- [Cordova](https://cordova.apache.org/#getstarted)

## Android

### Prérequis spécifiques
- Avoir le keystore ign.keystore sur la machine
- `zipalign` (`apt install zipalign`)
- [Installer les dépendances de Cordova pour Android (JDK, Android SDK, etc)](https://cordova.apache.org/docs/en/latest/guide/platforms/android/#installing-the-requirements)

### Étapes

Voici les étapes à réaliser pour déployer la dernière version du code de l'application Android du dépôt de l'UL :

#### Construction du binaire
- `git clone https://gitlab.ul.geoportail.rie.gouv.fr/ign/appli-mobile-geoportail`
- `cd appli-mobile-geoportail`
- `git checkout android`
- `cordova platform add android`
- `npm install`
- `cordova build android --release --prod -- --packageType apk`
- `jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore /<chemin_vers>/ign.keystore ./platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk geoportail_mobile` (passphrase : G3oportail)
- `zipalign 4 ./platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk ./platforms/android/app/build/outputs/apk/release/app-release.apk`
- `apksigner sign --ks /<chemin_vers>/ign.keystore --v1-signing-enabled true --v2-signing-enabled true ./platforms/android/app/build/outputs/apk/release/app-release.apk`

Le fichier `app-release.apk` ainsi créé est signé et est prête à être déposé sur la Google Play Console.

#### Déploiement en bêta

- Accéder à la [Google Play Console](https://play.google.com/console/developers/4728683733784898454/app-list) et sélectionner l'application Géoportail (le nom varie, mais a toujours en sous-titre fr.ign.geoportail)

- Sur le panneau situé à gauche, dans la section `Publier`, dans la sous-section `Tests`, sélectionner (par exemple) `Test ouvert`.

- Cliquer sur `Créer une release` en haut à droite.

- Dans la section `Apps bundles et APK`, cliquer sur `Importer` et sélectionner le fichier créé précédemment : `app-release.apk`.

- Remplir les informations, enregistrer puis examiner la release.

- Pour promouvoir la release, dans l'écran récapitulatif des tests ouverts, sous la section `Releases`, cliquer sur `Promouvoir la release`

## iOS

### Prérequis spécifiques
- N'est possible que sur Mac
- [Installer les dépendances de Cordova pour iOS](https://cordova.apache.org/docs/en/latest/guide/platforms/ios/#installing-the-requirements)
- Avoir dans le trouseau d'accès un certificat de publication App Store

### Étapes

#### Construction et téléversement du binaire
- `git clone https://gitlab.ul.geoportail.rie.gouv.fr/ign/appli-mobile-geoportail`
- `cd appli-mobile-geoportail`
- `git checkout ios`
- `cordova platform add ios`
- `cordova build ios `

- Un fichier `Géoportail.xcodeproj` a été créé dans le dossier `./platforms/ios`. L'ouvrir avec XCode.
- Dans XCode, dans l'onglet Certificats et signatures, entrer le certificat de publication App Store.
- Dans le menu général (barre tout en haut de l'écran) : `Product > Destination > Any iOS device (arm64)`
- Dans le menu général (barre tout en haut de l'écran) : `Product > Archive`

- Une nouvelle fenêtre s'ouvre après la construction du binaire (quelques minutes). Cliquer sur `Distribute App`.
- Appuyer sur Next et OK 6 fois, jusqu'à ce que l'application soit téléversée.

#### Déploiement en bêta
- Accéder à [App Store Connect](https://appstoreconnect.apple.com/apps/748345888/testflight/ios) et sélectionner l'application mobile Géoportail.
- Dans la section `TestFlight`, le dernier binaire doit appparaître. Sinon, attendre quelques minutes.
- Cliquer sur la version du build à tester, entrer les informations et les groupes de testeurs, puis lancer la vérification manuelle.
