import Globals from "../globals";
import MyAccountDOM from "./my-account-dom";
import MyAccountLayers from "./my-account-styles";

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
    }

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
      let routeId = 0;
      this.routes.forEach((route) => {
        route.id = routeId;
        routeId++;
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
    this.routes.unshift(drawRouteSaveOptions);
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
   * @param {*} routeId
   */
  editRoute(routeId) {
    this.routes.forEach((route) => {
      if (route.id !== routeId) {
        return;
      }
      if (route.visible) {
        route.visible = false;
        this.#updateSources();
        document.getElementById(`route-visibility_ID_${routeId}`).checked = false;
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
      Globals.routeDraw.setData(route.data);
    });
  }

  /**
   * Affiche l'itinéraire à l'ID correspondant s'il est caché, ou le cache s'il est affiché
   * @param {*} routeId
   */
  toggleShowRoute(routeId) {
    this.routes.forEach((route) => {
      if (route.id !== routeId) {
        return;
      }
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
    });
    this.#updateSources();
  }

  /**
   * Récupère toutes les lignes des itinéraires sous forme de liste de features à géométrie multilinestring
   * @returns list of multilinestring features, each feature representing one route
   */
  #getRouteLines() {
    const allMultiLineFeatures = []
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
    const allMultiPointFeatures = []
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
    this.map.addLayer(MyAccountLayers["point-casing"]);
    this.map.addLayer(MyAccountLayers["point"]);
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
