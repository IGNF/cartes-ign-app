import Globals from "../globals";
import MyAccountDOM from "./my-account-dom";
import MyAccountLayers from "./my-account-styles";
import utils from "../utils/unit-utils";

import { Share } from "@capacitor/share";
import { Toast } from "@capacitor/toast";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import maplibregl from "maplibre-gl";
import Sortable from "sortablejs";

import LandmarkIconSaved from "../../css/assets/landmark-saved-map.png";
import LandmarkIconFavourite from "../../css/assets/landmark-favourite-map.png";
import LandmarkIconTovisit from "../../css/assets/landmark-tovisit-map.png";

/**
 * Interface sur la fenêtre du compte
 * @module MyAccount
 * @todo ajouter les fonctionnalités : cf. DOM
 */
class MyAccount {
  /**
   * constructeur
   * @constructs
   * @param {*} map
   * @param {*} options
   */
  constructor(map, options) {
    this.options = options || {
      target: null,
      configuration: {},
    };

    // configuration
    // TODO client keycloak GPF
    this.configuration = this.options.configuration || {
      linesource: "my-account-line",
      pointsource: "my-account-point",
      landmarksource: "my-account-landmark",
    };

    // target
    this.target = this.options.target;

    // carte
    this.map = map;

    // nom d'utilisateur
    this.accountName = null;

    // itinéraires
    this.routes = [];

    // points de repère
    this.landmarks = [];

    this.#addSourcesAndLayers();

    // Identifiant unique pour les itinéraires
    this.lastRouteId = 0;
    this.lastLandmarkId = 0;

    // récupération des itinéraires enregistrés en local
    if (!localStorage.getItem("savedRoutes")) {
      localStorage.setItem("savedRoutes", "[]");
    } else {
      var localRoutes = JSON.parse(localStorage.getItem("savedRoutes"));
      this.routes = this.routes.concat(localRoutes);
    }

    // récupération des points de repère enregistrés en local
    if (!localStorage.getItem("savedLandmarks")) {
      localStorage.setItem("savedLandmarks", "[]");
    } else {
      var localLandmarks = JSON.parse(localStorage.getItem("savedLandmarks"));
      this.landmarks = this.landmarks.concat(localLandmarks);
    }

    this.map.loadImage(LandmarkIconSaved, (_, image) => {
      this.map.addImage("landmark-icon-saved", image);
    });
    this.map.loadImage(LandmarkIconFavourite, (_, image) => {
      this.map.addImage("landmark-icon-favourite", image);
    });
    this.map.loadImage(LandmarkIconTovisit, (_, image) => {
      this.map.addImage("landmark-icon-tovisit", image);
    });

    // récupération des infos et rendu graphique
    this.compute().then(() => {
      // Ajout d'identifiant unique aux routes
      this.routes.forEach((route) => {
        route.id = this.lastRouteId;
        this.lastRouteId++;
      });
      // Ajout d'identifiant unique aux landmarks
      this.landmarks.forEach((landmark) => {
        landmark.id = this.lastLandmarkId;
        this.lastLandmarkId++;
      });
      this.render();
      this.#listeners();
      this.#updateSources();
    });

    return this;
  }

  /**
   * Ajoute les écouteurs d'évènements
   * @private
   */
  #listeners() {
    this.map.on("click", MyAccountLayers["landmark-casing"].id, (e) => {
      if (["routeDraw", "routeDrawSave"].includes(Globals.backButtonState)) {
        return;
      }
      const landmark = this.map.queryRenderedFeatures(e.point, {layers: [MyAccountLayers["landmark-casing"].id]})[0];
      const title = `<div id="landmarkPositionTitle" class="divLegendContainer landmarkPosition-${landmark.id}">
        <label class="landmarkSummaryIcon landmarkSummaryIcon${landmark.properties.icon}"
        style="background-color:${landmark.properties.color};
          display: inline-block;
          margin-right: 5px;
          transform: translate(0, -2px);"></label>
        ${landmark.properties.title}
      </div>`;
      Globals.position.compute(e.lngLat, title, landmark.properties.description).then(() => {
        Globals.menu.open("position");
      });
    });
  }

  /**
   * creation de l'interface
   * @public
   */
  render() {
    var target = this.target || document.getElementById("myaccountWindow");
    if (!target) {
      console.warn();
      return;
    }

    var container = this.getContainer(this.accountName, this.routes, this.landmarks);
    if (!container) {
      console.warn();
      return;
    }

    // ajout du container
    target.appendChild(container);
    // dragn'drop !
    Sortable.create(this.dom.routeList, {
      handle: ".handle-draggable-layer",
      draggable: ".draggable-layer",
      animation: 200,
      forceFallback: true,
      onEnd : (evt) => {
        this.setRoutePosition(evt.oldDraggableIndex, evt.newDraggableIndex);
      }
    });
    Sortable.create(this.dom.landmarkList, {
      handle: ".handle-draggable-layer",
      draggable: ".draggable-layer",
      animation: 200,
      forceFallback: true,
      onEnd : (evt) => {
        this.setLandmarkPosition(evt.oldDraggableIndex, evt.newDraggableIndex);
      }
    });
  }

  /**
   * récupération des informations
   * @public
   */
  async compute() {
    // TODO: patience
    // TODO: connection GPF
  }

  /**
   * Ajout d'un itinéraire tracé à l'espace utilisateur
   * @param {*} drawRouteSaveOptions
   */
  addRoute(drawRouteSaveOptions) {
    if (typeof drawRouteSaveOptions.id !== "undefined" && drawRouteSaveOptions.id >= 0) {
      for (let i = 0; i < this.routes.length; i++) {
        if (this.routes[i].id === drawRouteSaveOptions.id){
          this.routes[i] = drawRouteSaveOptions;
          break;
        }
      }
    } else {
      drawRouteSaveOptions.id = this.lastRouteId;
      this.lastRouteId++;
      this.routes.unshift(drawRouteSaveOptions);
    }
    this.__updateAccountRoutesContainerDOMElement(this.routes);
    localStorage.setItem("savedRoutes", JSON.stringify(this.routes));
    this.#updateSources();
  }

  /**
   * Ajout d'un point de repère à l'espace utilisateur
   * @param {*} landmarkGeojson
   */
  addLandmark(landmarkGeojson) {
    if (typeof landmarkGeojson.id !== "undefined" && landmarkGeojson.id >= 0) {
      for (let i = 0; i < this.landmarks.length; i++) {
        if (this.landmarks[i].id === landmarkGeojson.id){
          this.landmarks[i] = JSON.parse(JSON.stringify(landmarkGeojson));
          break;
        }
      }
    } else {
      const newlandmark = JSON.parse(JSON.stringify(landmarkGeojson));
      newlandmark.id = this.lastLandmarkId;
      this.lastLandmarkId++;
      this.landmarks.unshift(newlandmark);
    }
    this.__updateAccountLandmarksContainerDOMElement(this.landmarks);
    localStorage.setItem("savedLandmarks", JSON.stringify(this.landmarks));
    this.#updateSources();
  }

  /**
   * Supprime un itinéraire de l'epace utilisateur
   */
  deleteRoute(routeId) {
    for (let i = 0; i < this.routes.length; i++) {
      let route = this.routes[i];
      if (route.id !== routeId) {
        continue;
      }
      this.routes.splice(i, 1);
      this.__updateAccountRoutesContainerDOMElement(this.routes);
      this.#updateSources();
      break;
    }
  }

  /**
   * Supprime un point de repère de l'epace utilisateur
   */
  deleteLandmark(landmarkId) {
    for (let i = 0; i < this.landmarks.length; i++) {
      let landmark = this.landmarks[i];
      if (landmark.id !== landmarkId) {
        continue;
      }
      this.landmarks.splice(i, 1);
      this.__updateAccountLandmarksContainerDOMElement(this.landmarks);
      this.#updateSources();
      break;
    }
  }

  /**
   * Change l'ordre des routes dans l'objet
   * @param {*} oldIndex
   * @param {*} newIndex
   */
  setRoutePosition(oldIndex, newIndex) {
    const route = this.routes[oldIndex];
    this.routes.splice(oldIndex, 1);
    this.routes.splice(newIndex, 0, route);
  }

  /**
   * Change l'ordre des points de repère dans l'objet
   * @param {*} oldIndex
   * @param {*} newIndex
   */
  setLandmarkPosition(oldIndex, newIndex) {
    const landmark = this.landmarks[oldIndex];
    this.landmarks.splice(oldIndex, 1);
    this.landmarks.splice(newIndex, 0, landmark);
  }

  /**
   * Ouvre l'outil de tracé d'itinéraire pour modifier un itinéraire
   * @param {*} route
   */
  editRoute(route) {
    if (route.visible) {
      route.visible = false;
      this.#updateSources();
      document.getElementById(`route-visibility_ID_${route.id}`).checked = false;
    }
    let coordinates = [];
    route.data.steps.forEach((step) => {
      coordinates = coordinates.concat(step.geometry.coordinates);
    });
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
    this.map.fitBounds(bounds, {
      padding: 100,
    });
    this.hide();
    Globals.routeDraw.show();
    Globals.routeDraw.setData(JSON.parse(JSON.stringify(route.data)));
    Globals.routeDraw.setName(route.name);
    Globals.routeDraw.setId(route.id);
  }

  /**
   * Ouvre l'outil de création de point de repère pour le modifer
   * @param {*} landmark
   */
  editLandmark(landmark) {
    this.map.flyTo({center: landmark.geometry.coordinates});
    this.hide();
    Globals.landmark.show();
    Globals.landmark.setData({
      title: landmark.properties.title,
      description: landmark.properties.description,
      location: landmark.geometry.coordinates,
      locationName: landmark.properties.locationName,
      color: landmark.properties.color,
      icon: landmark.properties.icon,
    });
    Globals.landmark.setId(landmark.id);
  }

  /**
   * Partage l'itinéraire sous forme de fichier
   * @param {*} route
   */
  shareRoute(route) {
    Filesystem.writeFile({
      path: `${route.name}.json`,
      data: JSON.stringify(this.#routeToGeojson(route)),
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    }).then((result) => {
      Share.share({
        title: `${route.name}`,
        text: `${route.name}
Temps : ${utils.convertSecondsToTime(route.data.duration)}, Distance : ${utils.convertDistance(route.data.distance)}
Dénivelé positif : ${route.data.elevationData.dplus} m, Dénivelé négatif : ${route.data.elevationData.dminus} m`,
        dialogTitle: "Partager mon itinéraire",
        url: result.uri,
      }).catch( () => {
        Toast.show({
          text: "L'itinéraire n'a pas pu être partagé. Partage du résumé...",
          duration: "long",
          position: "bottom"
        });
        Share.share({
          title: `${route.name}`,
          text: `${route.name}
Temps : ${utils.convertSecondsToTime(route.data.duration)}, Distance : ${utils.convertDistance(route.data.distance)}
Dénivelé positif : ${route.data.elevationData.dplus} m, Dénivelé négatif : ${route.data.elevationData.dminus} m`,
          dialogTitle: "Partager mon itinéraire (résumé)",
        });
      });
    });
  }

  /**
   * Partage le point de repère
   * @param {*} landmark
   */
  shareLandmark(landmark) {
    Share.share({
      title: `${landmark.properties.title}`,
      text: `${landmark.properties.title}
${landmark.properties.locationName}
Latitude : ${landmark.geometry.coordinates[1]}
Longitude : ${landmark.geometry.coordinates[0]}
${landmark.properties.description}
`,
      dialogTitle: "Partager mon point de repère",
    });
  }

  /**
   * Exporte l'itinéraire sous forme d'un ficheir geojson
   * @param {*} route
   */
  exportRoute(route) {
    Filesystem.writeFile({
      path: `${route.name}.geojson`,
      data: JSON.stringify(this.#routeToGeojson(route)),
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    }).then(() => {
      Toast.show({
        text: "Fichier enregistré dans Documents.",
        duration: "long",
        position: "bottom"
      });
    }).catch( () => {
      Toast.show({
        text: "L'itinéraire n'a pas pu être savegardé. Partage...",
        duration: "long",
        position: "bottom"
      });
      this.shareRoute(route);
    });
  }

  /**
   * Exporte le point de repère sous forme d'un ficheir geojson
   * @param {*} route
   */
  exportLandmark(landmark) {
    Filesystem.writeFile({
      path: `${landmark.properties.title}.geojson`,
      data: JSON.stringify(landmark),
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    }).then(() => {
      Toast.show({
        text: "Fichier enregistré dans Documents.",
        duration: "long",
        position: "bottom"
      });
    }).catch( () => {
      Toast.show({
        text: "Le point de repère n'a pas pu être savegardé.",
        duration: "long",
        position: "bottom"
      });
    });
  }

  /**
   * Affiche l'itinéraire s'il est caché, ou le cache s'il est affiché
   * @param {*} route
   */
  toggleShowRoute(route) {
    if (route.visible) {
      route.visible = false;
    } else {
      route.visible = true;
      this.hide();
      let coordinates = [];
      route.data.steps.forEach((step) => {
        coordinates = coordinates.concat(step.geometry.coordinates);
      });
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
      this.map.fitBounds(bounds, {
        padding: 100,
      });
    }
    this.#updateSources();
  }

  /**
   * Affiche le point de repère s'il est caché, ou le cache s'il est affiché
   * @param {*} landmark
   */
  toggleShowLandmark(landmark) {
    if (landmark.properties.visible) {
      landmark.properties.visible = false;
    } else {
      landmark.properties.visible = true;
      this.hide();
      this.map.flyTo({center: landmark.geometry.coordinates});
    }
    this.#updateSources();
  }

  /**
   * Convertit une route telle qu'enregistrée dans le compte en geojson valide
   * @param {*} route
   * @returns
   */
  #routeToGeojson(route) {
    return {
      type: "FeatureCollection",
      features: route.data.points.concat(route.data.steps),
      data: {
        name: route.name,
        transport: route.transport,
        distance: route.data.distance,
        duration: route.data.duration,
        elevationData: route.data.elevationData,
      },
    };
  }

  /**
   * Récupère toutes les lignes des itinéraires sous forme de liste de features à géométrie multilinestring
   * @returns list of multilinestring features, each feature representing one route
   */
  #getRouteLines() {
    const allMultiLineFeatures = [];
    this.routes.forEach((route) => {
      let visible = false;
      if (route.visible) {
        visible = true;
      }
      const multilineRouteFeature = {
        type: "Feature",
        geometry: {
          type: "MultiLineString",
          coordinates: []
        },
        properties: {
          name: route.name,
          visible: visible,
        }
      };
      route.data.steps.forEach((step) => {
        multilineRouteFeature.geometry.coordinates.push(step.geometry.coordinates);
      });
      allMultiLineFeatures.push(multilineRouteFeature);
    });
    return allMultiLineFeatures;
  }

  /**
   * Récupère tous les points des itinéraires sous forme de liste de features à géométrie point
   * @returns list of point features
   */
  #getRoutePoints() {
    const allPointFeatures = [];
    this.routes.forEach((route) => {
      let visible = false;
      if (route.visible) {
        visible = true;
      }
      route.data.points.forEach((point) => {
        const newPoint = JSON.parse(JSON.stringify(point));
        newPoint.properties.visible = visible;
        allPointFeatures.push(newPoint);
      });
    });
    return allPointFeatures;
  }

  /**
   * met à jour les sources de données pour l'affichage
   */
  #updateSources() {
    var linesource = this.map.getSource(this.configuration.linesource);
    linesource.setData({
      type: "FeatureCollection",
      features: this.#getRouteLines(),
    });
    var pointsource = this.map.getSource(this.configuration.pointsource);
    pointsource.setData({
      type: "FeatureCollection",
      features: this.#getRoutePoints(),
    });

    var landmarksource = this.map.getSource(this.configuration.landmarksource);
    landmarksource.setData({
      type: "FeatureCollection",
      features: this.landmarks,
    });
  }

  /**
   * ajoute la source et le layer à la carte pour affichage des itinéraires
   */
  #addSourcesAndLayers() {
    this.map.addSource(this.configuration.linesource, {
      "type": "geojson",
      "data": {
        type: "FeatureCollection",
        features: [],
      }
    });

    MyAccountLayers["line-casing"].source = this.configuration.linesource;
    MyAccountLayers["line"].source = this.configuration.linesource;
    this.map.addLayer(MyAccountLayers["line-casing"]);
    this.map.addLayer(MyAccountLayers["line"]);

    this.map.addSource(this.configuration.pointsource, {
      "type": "geojson",
      "data": {
        type: "FeatureCollection",
        features: [],
      }
    });

    MyAccountLayers["point-casing"].source = this.configuration.pointsource;
    MyAccountLayers["point"].source = this.configuration.pointsource;
    MyAccountLayers["point-departure"].source = this.configuration.pointsource;
    MyAccountLayers["point-destination"].source = this.configuration.pointsource;
    this.map.addLayer(MyAccountLayers["point-casing"]);
    this.map.addLayer(MyAccountLayers["point"]);
    this.map.addLayer(MyAccountLayers["point-departure"]);
    this.map.addLayer(MyAccountLayers["point-destination"]);

    this.map.addSource(this.configuration.landmarksource, {
      "type": "geojson",
      "data": {
        type: "FeatureCollection",
        features: [],
      }
    });
    MyAccountLayers["landmark-casing"].source = this.configuration.landmarksource;
    MyAccountLayers["landmark"].source = this.configuration.landmarksource;
    MyAccountLayers["landmark-icon"].source = this.configuration.landmarksource;
  }

  /**
   * ajoute le layer landmarks à la carte. Séparé pour pouvoir les ajouter en dernier, au-dessus des POI OSM
   */
  addLandmarksLayers() {
    this.map.addLayer(MyAccountLayers["landmark-casing"]);
    this.map.addLayer(MyAccountLayers["landmark"]);
    this.map.addLayer(MyAccountLayers["landmark-icon"]);
  }

  /**
     * affiche le menu des résultats du calcul
     * @public
     */
  show () {
    Globals.menu.open("myaccount");
  }

  /**
   * ferme le menu des résultats du calcul
   * @public
   */
  hide () {
    Globals.menu.close("myaccount");
  }
}

// mixins
Object.assign(MyAccount.prototype, MyAccountDOM);

export default MyAccount;
