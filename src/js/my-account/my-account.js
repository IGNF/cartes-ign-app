import Globals from "../globals";
import MyAccountDOM from "./my-account-dom";
import MyAccountLayers from "./my-account-styles";
import utils from "../unit-utils";

import { Share } from "@capacitor/share";
import { Toast } from "@capacitor/toast";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import maplibregl from "maplibre-gl";

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

    // récupération des itinéraires enregistrés en local
    if (!localStorage.getItem("savedRoutes")) {
      localStorage.setItem("savedRoutes", "[]");
    } else {
      var localRoutes = JSON.parse(localStorage.getItem("savedRoutes"));
      this.routes = this.routes.concat(localRoutes);
    }

    // récupération des infos et rendu graphique
    this.compute().then(() => {
      // Ajout d'identifiant unique aux routes
      this.routes.forEach((route) => {
        route.id = this.lastRouteId;
        this.lastRouteId++;
      });
      this.render();
      this.#updateSources();
    });

    return this;
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

    var container = this.getContainer(this.accountName, this.routes);
    if (!container) {
      console.warn();
      return;
    }

    // ajout du container
    target.appendChild(container);
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
   * Partage le résumé d'un itinéraire
   * @param {*} route
   */
  shareRoute(route) {
    Share.share({
      title: `${route.name}`,
      text: `${route.name}
Temps : ${utils.convertSecondsToTime(route.data.duration)}, Distance : ${utils.convertDistance(route.data.distance)}
Dénivelé positif : ${route.data.elevationData.dplus} m, Dénivelé négatif : ${route.data.elevationData.dminus} m`,
      dialogTitle: "Partager mon itinéraire",
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
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    }).then((result) => {
      Share.share({
        title: `${route.name}`,
        dialogTitle: "Partager mon itinéraire",
        url: result.uri,
      });
    }).catch( () => {
      Toast.show({
        text: "L'itinéraire n'a pas pu être savegardé. Partage du résumé...",
        duration: "long",
        position: "bottom"
      });
      this.shareRoute(route);
    });
  }

  /**
   * Affiche l'itinéraire s'il est caché, ou le cache s'il est affiché
   * @param {*} routes
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
   * Récupère tous les points des itinéraires sous forme de liste de features à géométrie multipoint
   * @returns list of mutlipoint features, each feature representing one route
   */
  #getRoutePoints() {
    const allMultiPointFeatures = [];
    this.routes.forEach((route) => {
      let visible = false;
      if (route.visible) {
        visible = true;
      }
      const multipointRouteFeature = {
        type: "Feature",
        geometry: {
          type: "MultiPoint",
          coordinates: []
        },
        properties: {
          name: route.name,
          visible: visible,
        }
      };
      route.data.points.forEach((point) => {
        multipointRouteFeature.geometry.coordinates.push(point.geometry.coordinates);
      });
      allMultiPointFeatures.push(multipointRouteFeature);
    });
    return allMultiPointFeatures;
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
