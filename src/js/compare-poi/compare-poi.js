/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Globals from "../globals";
import DOM from "../dom";
import comparePoiLayers from "./compare-poi-styles";
import Reverse from "../services/reverse";
import ActionSheet from "../action-sheet";

import { Toast } from "@capacitor/toast";

import ComparePoiData from "../data-layer/poi_rlt.json";
import ComparePoiIcon from "../../css/assets/comparePoi.png";
import ComparePoiIconSvg from "../../css/assets/comparePoi.svg";
import CompareLandmarkBlue from "../../css/assets/compareLandmark/compare-landmark-blue.svg";
import CompareLandmarkPurple from "../../css/assets/compareLandmark/compare-landmark-purple.svg";
import CompareLandmarkOrange from "../../css/assets/compareLandmark/compare-landmark-orange.svg";
import CompareLandmarkGreen from "../../css/assets/compareLandmark/compare-landmark-green.svg";
import CompareLandmarkYellow from "../../css/assets/compareLandmark/compare-landmark-yellow.svg";

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
      customSource: "my-account-compare-landmark",
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

    this.animationIntervalId = null;
    this.#addSourcesAndLayers();

    this.target = this.options.target || document.getElementById("comparePoiWindow");

    this.theme = null;
    this.sousTheme = null;

    this.iconHTML = null;
    this.comparePoiId = null;

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
    this.map.loadImage(ComparePoiIcon).then((image) => {
      this.map.addImage("comparePoiIcon", image.data);
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
      advancedBtn: this.target.querySelector(".tools-layer-advanced"),
      location: this.target.querySelector(".comparePoiLocation"),
      button: this.target.querySelector(".comparePoiButton"),
      text: this.target.querySelector(".comparePoiText"),
    };
  }

  /**
   *  mise à jour des données de la fenêtre
   * @param {Object} comparePoi
   * @returns
   */
  setData(comparePoi) {
    this.dom.advancedBtn.classList.add("d-none");
    this.comparePoiId = -1;
    if (comparePoi.id !== null && comparePoi.id >= 0) {
      this.comparePoiId = comparePoi.id;
    }
    this.compareConfig = {
      // Zoom - 1 car décalage entre niveaux de zoom maplibre et autres libs carto
      zoom: comparePoi.properties.zoom - 1,
      mode: comparePoi.properties.mode,
      layer1: comparePoi.properties.layer1,
      layer2: comparePoi.properties.layer2,
      center: comparePoi.geometry.coordinates,
    };
    this.theme = comparePoi.properties.theme;
    let icon = ComparePoiIconSvg;
    if (comparePoi.properties.color) {
      this.dom.advancedBtn.classList.remove("d-none");
      switch (comparePoi.properties.color) {
      case "blue":
        icon = CompareLandmarkBlue;
        break;
      case "purple":
        icon = CompareLandmarkPurple;
        break;
      case "orange":
        icon = CompareLandmarkOrange;
        break;
      case "green":
        icon = CompareLandmarkGreen;
        break;
      case "yellow":
        icon = CompareLandmarkYellow;
        break;
      default:
        break;
      }
    }
    this.iconHTML = `<img src="${icon}" height="23px"></img>`;
    this.dom.title.innerHTML = `${this.iconHTML}${comparePoi.properties.accroche}`;
    this.dom.location.innerText = "";
    if (comparePoi.properties.commune) {
      this.dom.location.innerText = comparePoi.properties.commune + ", " + comparePoi.properties.departement;
    } else {
      Reverse.compute({
        lon: comparePoi.geometry.coordinates[0],
        lat: comparePoi.geometry.coordinates[1],
      })
        .then(() => {})
        .catch(() => {})
        .finally(() => {
          var coords = {lon : comparePoi.geometry.coordinates[0], lat : comparePoi.geometry.coordinates[1]};
          var address = Reverse.getAddress() || coords.lon.toFixed(6) + ", " + coords.lat.toFixed(6);
          var strAddress = address;
          if (typeof address !== "string") {
            strAddress = address.city;
          }
          this.dom.location.innerText = strAddress;
        });
    }
    this.dom.text.innerHTML = comparePoi.properties.text;
  }

  /**
   * ajout d'ecouteurs
   */
  #listeners() {
    let handleLayerClick = (e) => {
      if (["routeDraw", "routeDrawSave"].includes(Globals.backButtonState)) {
        return;
      }
      if (Globals.backButtonState.split("-")[0] === "position") {
        DOM.$backTopLeftBtn.click();
      }
      const layers = [this.configuration.customSource];
      if (this.map.getLayer(this.configuration.source)) {
        layers.push(this.configuration.source);
      }
      const comparePoi = this.map.queryRenderedFeatures(e.point, {layers: layers})[0];
      comparePoi.properties.opacity = 0.6;
      comparePoi.properties.radiusRatio = 0;
      const source = this.map.getSource("selected-compare-poi");
      source.setData({
        "type": "FeatureCollection",
        "features": [comparePoi]
      });
      this.animationIntervalId = setInterval(() => {
        if (comparePoi.properties.radiusRatio >= 1) {
          clearInterval(this.animationIntervalId);
        }
        comparePoi.properties.radiusRatio += 0.1;
        source.setData({
          "type": "FeatureCollection",
          "features": [comparePoi]
        });
      }, 20);
      this.setData(comparePoi);
      this.showWindow();
    };

    this.map.on("click", this.configuration.source, handleLayerClick);
    this.map.on("click", this.configuration.customSource, handleLayerClick);
    this.dom.button.addEventListener("click", this.handleCompareButton);
    this.dom.advancedBtn.addEventListener("click", () => {
      ActionSheet.show({
        options: [
          {
            class: "tools-layer-share",
            text: "Partager",
            value: "share",
          },
          {
            class: "tools-layer-edit",
            text: "Modifier",
            value: "edit",
          },
          {
            class: "tools-layer-remove confirm-needed",
            text: "Supprimer",
            value: "delete",
            confirmCallback: () => {
              Toast.show({
                text: "Confirmez la suppression du repère Comparer",
                duration: "short",
                position: "bottom"
              });
            }
          },
        ],
        timeToHide: 50,
      }).then( (value) => {
        if (value === "share") {
          Globals.myaccount.shareCompareLandmarkFromID(this.comparePoiId);
        }
        if (value === "edit") {
          this.hideWindow();
          Globals.myaccount.editCompareLandmarkFromID(this.comparePoiId);
        }
        if (value === "delete") {
          this.hideWindow();
          Globals.myaccount.deleteCompareLandmark(this.comparePoiId);
        }
      });
    });
  }

  #onClickCompareButton() {
    this.clearSources();
    Globals.menu.open("compare");
    Globals.backButtonState = "comparePoiActivated";
    this.dom.button.classList.add("d-none");
    this.dom.text.classList.remove("d-none");
    this.dom.title.innerHTML = `${this.iconHTML}${this.theme}`;
    DOM.$comparePoiWindow.classList.remove("d-none");
    DOM.$tabContainer.classList.remove("compare");
    DOM.$bottomButtons.classList.remove("compare");
    DOM.$sideBySideLeftLayer.classList.add("d-none");
    DOM.$sideBySideRightLayer.classList.add("d-none");
    DOM.$createCompareLandmarkBtn.classList.add("d-none");
    Globals.currentScrollIndex = 2;
    Globals.menu.updateScrollAnchors();
    Globals.compare.setParams(this.compareConfig);
  }

  /**
  * ajoute la source et le layer à la carte pour affichage du tracé
  */
  #addSourcesAndLayers() {
    this.map.addSource("selected-compare-poi", {
      "type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": []
      },
    });

    comparePoiLayers["selected-compare-poi"].source = "selected-compare-poi";
    this.map.addLayer(comparePoiLayers["selected-compare-poi"]);
  }

  /**
   * Supprime les donnés dans les sources
   */
  clearSources() {
    clearInterval(this.animationIntervalId);
    this.map.getSource("selected-compare-poi").setData({
      "type": "FeatureCollection",
      "features": []
    });
  }

  /**
   * Cache la couche POI sur la carte
   * @public
   */
  hidePoints() {
    if (this.map.getLayer(this.configuration.source)) {
      this.map.removeLayer(this.configuration.source);
      this.clearSources();
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
    this.clearSources();
    this.dom.advancedBtn.classList.add("d-none");
    this.opened = false;
    if (Globals.backButtonState == "comparePoiActivated") {
      document.getElementById("comparePoiWindow").querySelector(".comparePoiText").classList.add("d-none");
      document.getElementById("comparePoiWindow").querySelector(".comparePoiButton").classList.remove("d-none");
      Globals.currentScrollIndex = 0;
      Globals.menu.open("compare");
    } else {
      Globals.menu.close("comparePoi");
    }
  }
}

export default ComparePoi;
