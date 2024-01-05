import MyAccountDOM from "./my-account-dom";
import Globals from "../globals";

import MyAccountLayers from "./my-account-styles";

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

    // récupération des itinéraires enregistrés en local
    if (!localStorage.getItem("savedRoutes")) {
      localStorage.setItem("savedRoutes", "[]");
    } else {
      var localRoutes = JSON.parse(localStorage.getItem("savedRoutes"));
      this.routes = this.routes.concat(localRoutes);
    }

    this.#addSourcesAndLayers();

    // récupération des infos et rendu graphique
    this.compute().then(() => this.render());

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
}

// mixins
Object.assign(MyAccount.prototype, MyAccountDOM);

export default MyAccount;
