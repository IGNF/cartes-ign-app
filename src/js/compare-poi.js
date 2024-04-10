import Globals from "./globals";
import DOM from "./dom";

import ComparePoiData from "./data-layer/poi_rlt.json";
import ComparePoiIcon from "../css/assets/comparePoi.png";

/**
 * Contrôle sur les "POI Remonter le temps"
 * @description
 * La couche est active par defaut, et est désactivable via les filtre du contrôle POI
 */
class ComparePoi {
  /**
   * constructeur
   * @param {*} map
   * @param {*} options
   * @returns
   */
  constructor(map, options) {
    this.options = options || {
      target: document.getElementById("poiWindow"),
      congifuration: {},
      style: {},
    };

    // configuration
    this.configuration = this.options.configuration || {
      source: "comparepoi",
    };

    this.compareConfig = {
      zoom: null,
      mode: null,
      layer1: null,
      layer2: null,
      center: null,
    };

    this.opened = false;

    this.map = map;

    this.target = this.options.target || document.getElementById("comparePoiWindow");

    this.theme = null;
    this.sousTheme = null;

    this.handleCompareButton = this.#onClickCompareButton.bind(this);
    this.dom = {
      title: null,
      commune: null,
      departement: null,
      button: null,
      text: null,
    };

    this.#load();
    this.#render();
    this.#listeners();

    if (document.getElementById("displayPOIGoBackTime").checked) this.showPoints();

    return this;
  }

  /**
   * chargement de la couche
   * @private
   */
  #load() {
    this.map.addSource(this.configuration.source, {
      type: "geojson",
      data: ComparePoiData,
    });
    this.map.loadImage(ComparePoiIcon, (_, image) => {
      this.map.addImage("comparePoiIcon", image);
    });
  }

  /**
   * creation de l'interface
   */
  #render() {
    if (!this.target) {
      console.warn();
      return;
    }
    this.dom = {
      title: this.target.querySelector(".comparePoiTitle"),
      commune: this.target.querySelector(".comparePoiCommune"),
      departement: this.target.querySelector(".comparePoiDepartement"),
      button: this.target.querySelector(".comparePoiButton"),
      text: this.target.querySelector(".comparePoiText"),
    };
  }

  /**
   * ajout d'ecouteurs
   */
  #listeners() {
    this.map.on("click", this.configuration.source, (e) => {
      if (["routeDraw", "routeDrawSave"].includes(Globals.backButtonState)) {
        return;
      }
      const comparePoi = this.map.queryRenderedFeatures(e.point, {layers: [this.configuration.source]})[0];
      // Zoom - 1 car décalage entre niveaux de zoom maplibre et autres libs carto
      this.compareConfig = {
        zoom: comparePoi.properties.zoom - 1,
        mode: comparePoi.properties.mode,
        layer1: comparePoi.properties.layer1,
        layer2: comparePoi.properties.layer2,
        center: comparePoi.geometry.coordinates,
      };
      this.theme = comparePoi.properties.theme;
      this.dom.title.innerText = comparePoi.properties.accroche;
      this.dom.commune.innerText = comparePoi.properties.commune;
      this.dom.departement.innerText = comparePoi.properties.departement;
      this.dom.text.innerHTML = comparePoi.properties.text;
      this.showWindow();
    });
    this.dom.button.addEventListener("click", this.handleCompareButton);
  }

  #onClickCompareButton() {
    Globals.menu.open("compare");
    Globals.backButtonState = "comparePoiActivated";
    this.dom.button.classList.add("d-none");
    this.dom.text.classList.remove("d-none");
    this.dom.title.innerText = `${this.theme}`;
    DOM.$comparePoiWindow.classList.remove("d-none");
    DOM.$tabContainer.style.removeProperty("top");
    DOM.$bottomButtons.style.removeProperty("bottom");
    DOM.$sideBySideLeftLayer.classList.add("d-none");
    DOM.$sideBySideRightLayer.classList.add("d-none");
    Globals.currentScrollIndex = 2;
    Globals.menu.updateScrollAnchors();
    Globals.compare.setParams(this.compareConfig);
  }

  /**
   * Cache la couche POI sur la carte
   * @public
   */
  hidePoints() {
    if (this.map.getLayer(this.configuration.source)) {
      this.map.removeLayer(this.configuration.source);
    }
  }

  /**
   * Affiche la couche POI sur la carte
   * @public
   */
  showPoints() {
    if (this.map.getLayer(this.configuration.source)) {
      return;
    }
    this.map.addLayer({
      id: this.configuration.source,
      source: this.configuration.source,
      type: "symbol",
      layout: {
        "icon-anchor": "bottom",
        "icon-image": "comparePoiIcon",
        "icon-size": 0.5,
      }
    });
  }

  /**
   * ouvre l'interface
   * @public
   */
  showWindow() {
    this.opened = true;
    Globals.menu.open("comparePoi");
  }

  /**
   * ferme l'interface
   * @public
   */
  hideWindow() {
    this.opened = false;
    Globals.menu.close("comparePoi");
  }
}

export default ComparePoi;
