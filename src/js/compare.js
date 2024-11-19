/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import MapLibreGlCompare from "@maplibre/maplibre-gl-compare";
import syncMaps from "@mapbox/mapbox-gl-sync-move";

import Globals from "./globals";
import DOM from "./dom";
import LayersConfig from "./layer-manager/layer-config";
import LayersAdditional from "./layer-manager/layer-additional";

import { Capacitor } from "@capacitor/core";

import ImageNotFound from "../html/img/image-not-found.png";
import DomUtils from "./utils/dom-utils";

/**
 * Outil de comparaison de carte
 *
 * @todo le rendre plus parametrable avec des options dans le constructeur
 */
class Compare {
  /**
   * constructeur
   * @returns
   */
  constructor() {
    this.sideBySide = null;
    this.prevDataLayerDisplayed = "";
    this.container = "#cartoContainer";
    this.map = Globals.map;
    this.mapRLT1 = Globals.mapRLT1;
    this.mapRLT2 = Globals.mapRLT2;

    this.fadeSliderInput = document.getElementById("sideBySideFadeSlider-range-input");

    // one of "leftright", "updown", "fade"
    this.mode = "leftright";
    this.actived = false;

    this.clearSync = null;

    this.#render();
    this.#listeners();

    return this;
  }

  /**
   * rendu graphique du contrôle
   */
  #render() {
    var targets = [DOM.$compareLayers1Window, DOM.$compareLayers2Window];

    for (let i = 0; i < targets.length; i++) {
      let target = targets[i];
      const tplLayer = (opts) => {
        return `
              <div class="layer ${opts.type} layerCompare mapRLT${i + 1}" data-map="${i + 1}" data-layerid="${opts.layerID}" id="mapRLT${i + 1}-${opts.layerID}">
                <div class="layerImg">
                  <img src="${opts.layerQuickLook}" alt="${opts.layerName}" onerror="this.onerror=null;this.src='${ImageNotFound}'" />
                  <div class="layer-badge"></div>
                </div>
                <div class="layer-title-thematic">${opts.layerThematic}</div>
                <div id="${opts.layerName}" class="layer-title">${opts.layerTitle}</div>
              </div>
              `;
      };

      var strRLTLayersPhotos = "";
      var strRLTLayersMaps = "";
      var rltLayers = LayersConfig.getRLTLayers();
      for (let j = 0; j < rltLayers.length; j++) {
        var props = LayersConfig.getLayerProps(rltLayers[j]);
        if (rltLayers[j].split(".")[0] == "ORTHOIMAGERY") {
          if (rltLayers[j] == "ORTHOIMAGERY.ORTHOPHOTOS$GEOPORTAIL:OGC:WMTS") {
            props.title = "Photographies aériennes - aujourd'hui";
          }
          strRLTLayersPhotos += tplLayer({
            type: "rltLayer",
            layerID: rltLayers[j],
            layerName: props.layer,
            layerQuickLook: LayersAdditional.getQuickLookUrl(props.layer),
            layerTitle: props.title,
            layerThematic: ""
          });
        } else {
          strRLTLayersMaps += tplLayer({
            type: "rltLayer",
            layerID: rltLayers[j],
            layerName: props.layer,
            layerQuickLook: LayersAdditional.getQuickLookUrl(props.layer),
            layerTitle: props.title,
            layerThematic: ""
          });
        }
      }

      var templateToggle = `
        <div class="layerSelectorDiv">
          <div class="divCompareLayerType">
            <input id="layerSelectorPhotos${i + 1}" type="radio" name="Type${i + 1}" value="Photos" checked="true">
            <label id="layerSelectorPhotosLabel${i + 1}" class="lblCompareLayerType" for="layerSelectorPhotos${i + 1}" title="Photos">Photos</label>
            <input id="layerSelectorCartes${i + 1}" type="radio" name="Type${i + 1}" value="Cartes">
            <label id="layerSelectorCartesLabel${i + 1}" class="lblCompareLayerType" for="layerSelectorCartes${i + 1}" title="Cartes">Cartes</label>
            <span class="sliderIsochrone"></span>
          </div>
        </div>`;
      var templateLayers = `
        <div class="layersRLT">
            <div class="subCategoryRLTLayer" id="RLTphotoLayers${i + 1}">
                ${strRLTLayersPhotos}
            </div>
            <div class="subCategoryRLTLayer d-none" id="RLTmapLayers${i + 1}">
                ${strRLTLayersMaps}
            </div>
        </div>`;

      // transformation du container : String -> DOM
      var containerToggle = DomUtils.stringToHTML(templateToggle.trim());
      var containerLayers = DomUtils.stringToHTML(templateLayers.trim());

      if (!containerLayers) {
        console.warn();
        return;
      }

      target.appendChild(containerToggle);
      target.appendChild(containerLayers);
    }
  }

  /**
   * Ajoute les écouteurs d'évènements
   */
  #listeners() {
    document.querySelector("#compareLeftRight").addEventListener("click", () => {
      this.mode = "leftright";
      this.#changeMode();
    });
    document.querySelector("#compareUpDown").addEventListener("click", () => {
      this.mode = "upDown";
      this.#changeMode();
    });
    document.querySelector("#compareFade").addEventListener("click", () => {
      this.mode = "fade";
      this.#changeMode();
    });

    this.fadeSliderInput.addEventListener("input", () => this.fadeSliderInput.style.setProperty("--value", this.fadeSliderInput.value));
    this.fadeSliderInput.addEventListener("input", () => {
      document.getElementById("mapRLT1").style.opacity = 1 - (this.fadeSliderInput.value / 100);
    });

    document.getElementById("layerSelectorCartes1").addEventListener("change", (e) => {
      if (e.target.checked) {
        document.getElementById("RLTphotoLayers1").classList.add("d-none");
        document.getElementById("RLTmapLayers1").classList.remove("d-none");
      } else {
        document.getElementById("RLTphotoLayers1").classList.remove("d-none");
        document.getElementById("RLTmapLayers1").classList.add("d-none");
      }
    });
    document.getElementById("layerSelectorCartes2").addEventListener("change", (e) => {
      if (e.target.checked) {
        document.getElementById("RLTphotoLayers2").classList.add("d-none");
        document.getElementById("RLTmapLayers2").classList.remove("d-none");
      } else {
        document.getElementById("RLTphotoLayers2").classList.remove("d-none");
        document.getElementById("RLTmapLayers2").classList.add("d-none");
      }
    });
    document.getElementById("layerSelectorPhotos1").addEventListener("change", (e) => {
      if (e.target.checked) {
        document.getElementById("RLTphotoLayers1").classList.remove("d-none");
        document.getElementById("RLTmapLayers1").classList.add("d-none");
      } else {
        document.getElementById("RLTphotoLayers1").classList.add("d-none");
        document.getElementById("RLTmapLayers1").classList.remove("d-none");
      }
    });
    document.getElementById("layerSelectorPhotos2").addEventListener("change", (e) => {
      if (e.target.checked) {
        document.getElementById("RLTphotoLayers2").classList.remove("d-none");
        document.getElementById("RLTmapLayers2").classList.add("d-none");
      } else {
        document.getElementById("RLTphotoLayers2").classList.add("d-none");
        document.getElementById("RLTmapLayers2").classList.remove("d-none");
      }
    });

    DOM.$sideBySideLeftLayer.addEventListener("click", () => {
      if (Globals.backButtonState == "compareLayers2") {
        Globals.menu.close("compareLayers2");
      }
      Globals.menu.open("compareLayers1");
    });

    DOM.$sideBySideRightLayer.addEventListener("click", () => {
      if (Globals.backButtonState == "compareLayers1") {
        Globals.menu.close("compareLayers1");
      }
      Globals.menu.open("compareLayers2");
    });

    // clic sur une rlt de fonds
    document.querySelectorAll(".rltLayer").forEach((el) => {
      el.addEventListener("click", () => {
        if (el.classList.contains("selectedLayer")) {
          return;
        } else {
          document.querySelectorAll(`.rltLayer.mapRLT${el.dataset.map}`).forEach((elem) => {
            elem.classList.remove("selectedLayer");
          });
          el.classList.add("selectedLayer");
          this.#addLayer(el.dataset.layerid, el.dataset.map);
        }
      });
    });
  }

  /**
   * ajoute un layer à une map
   */
  #addLayer(layerid, mapid) {
    const layer = {
      id: "maplayer",
      source: layerid,
      type: "raster"
    };

    if (mapid === "1") {
      if (this.mapRLT1.getLayer("maplayer")) {
        this.mapRLT1.removeLayer("maplayer");
      }
      Globals.comparedLayers[0] = layerid;
      this.mapRLT1.addLayer(layer);
    } else if (mapid === "2") {
      if (this.mapRLT2.getLayer("maplayer")) {
        this.mapRLT2.removeLayer("maplayer");
      }
      Globals.comparedLayers[1] = layerid;
      this.mapRLT2.addLayer(layer);
    }
  }

  /**
   * change le mode de comparaison
   */
  #changeMode() {
    document.querySelector("#compareLeftRight").classList.remove("selected");
    document.querySelector("#compareUpDown").classList.remove("selected");
    document.querySelector("#compareFade").classList.remove("selected");
    if (this.clearSync !== null) {
      this.clearSync();
      this.clearSync == null;
    }

    if (this.mode == "leftright") {
      document.querySelector("#compareLeftRight").classList.add("selected");
      document.querySelector("#sideBySideFadeSlider").classList.add("d-none");
      this.fadeSliderInput.value = 0;
      this.fadeSliderInput.style.setProperty("--value", 0);
      document.getElementById("mapRLT1").style.removeProperty("opacity");
      if (this.sideBySide) {
        this.sideBySide.remove();
      }
      this.sideBySide = new MapLibreGlCompare(this.mapRLT1, this.mapRLT2, this.container, { orientation: "vertical" });
      document.querySelector(".compare-swiper-vertical").tabIndex = 0;
      document.querySelector(".compare-swiper-vertical").title = "Déplacer la séparation";
      document.querySelector(".compare-swiper-vertical").addEventListener("keydown", (e) => {
        document.getElementById("mapRLT1").style.transition = "clip 0.2s";
        document.getElementById("mapRLT2").style.transition = "clip 0.2s";
        document.querySelector(".maplibregl-compare").style.transition = "transform 0.2s";

        const currentX = e.target.parentElement.style.transform.split("(")[1].split("px")[0];
        if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
          this.sideBySide.setSlider(parseInt(currentX) - 50);
        } else if (e.key === "ArrowUp" || e.key === "ArrowRight") {
          this.sideBySide.setSlider(parseInt(currentX) + 50);
        }
        setTimeout(() => {
          document.getElementById("mapRLT1").style.removeProperty("transition");
          document.getElementById("mapRLT2").style.removeProperty("transition");
          document.querySelector(".maplibregl-compare").style.removeProperty("transition");
        }, 200);
      });
    } else if (this.mode == "upDown") {
      document.querySelector("#compareUpDown").classList.add("selected");
      document.querySelector("#sideBySideFadeSlider").classList.add("d-none");
      this.fadeSliderInput.value = 0;
      this.fadeSliderInput.style.setProperty("--value", 0);
      document.getElementById("mapRLT1").style.removeProperty("opacity");
      if (this.sideBySide) {
        this.sideBySide.remove();
      }
      this.sideBySide = new MapLibreGlCompare(this.mapRLT1, this.mapRLT2, this.container, { orientation: "horizontal" });
      document.querySelector(".compare-swiper-horizontal").tabIndex = 0;
      document.querySelector(".compare-swiper-horizontal").title = "Déplacer la séparation";
      document.querySelector(".compare-swiper-horizontal").addEventListener("keydown", (e) => {
        document.getElementById("mapRLT1").style.transition = "clip 0.2s";
        document.getElementById("mapRLT2").style.transition = "clip 0.2s";
        document.querySelector(".maplibregl-compare").style.transition = "transform 0.2s";

        const currentY = e.target.parentElement.style.transform.split("(")[1].split("px,")[1].split("px")[0].trim();
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          this.sideBySide.setSlider(parseInt(currentY) + 50);
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          this.sideBySide.setSlider(parseInt(currentY) - 50);
        }
        setTimeout(() => {
          document.getElementById("mapRLT1").style.removeProperty("transition");
          document.getElementById("mapRLT2").style.removeProperty("transition");
          document.querySelector(".maplibregl-compare").style.removeProperty("transition");
        }, 200);
      });
    } else if (this.mode == "fade") {
      document.querySelector("#compareFade").classList.add("selected");
      if (this.sideBySide) {
        this.sideBySide.remove();
      }
      this.clearSync = syncMaps(this.mapRLT1, this.mapRLT2);
      this.fadeSliderInput.value = 50;
      this.fadeSliderInput.style.setProperty("--value", 50);
      document.getElementById("mapRLT1").style.opacity = 0.5;
      document.querySelector("#sideBySideFadeSlider").classList.remove("d-none");
    }
  }

  /**
   * Change les paramètres de la comparaison avec des paramètres prédéfinis
   * @param {*} params {zoom: mode: layer1: layer2: center: }
   */
  setParams(params) {
    this.mapRLT1.setCenter(params.center);
    this.mapRLT2.setCenter(params.center);
    this.mapRLT1.setZoom(params.zoom);
    this.mapRLT2.setZoom(params.zoom);
    document.getElementById(`mapRLT1-${params.layer1 + "$GEOPORTAIL:OGC:WMTS"}`).click();
    document.getElementById(`mapRLT2-${params.layer2 + "$GEOPORTAIL:OGC:WMTS"}`).click();
    switch (params.mode) {
    case "vSlider":
      document.querySelector("#compareLeftRight").click();
      break;
    case "hSlider":
      document.querySelector("#compareUpDown").click();
      break;
    default:
      document.querySelector("#compareFade").click();
      break;
    }
    this.map.setCenter(this.mapRLT1.getCenter());
    this.map.setZoom(this.mapRLT1.getZoom());
  }

  /**
   * active la comparaison
   * @public
   */
  show() {
    if (this.actived) {
      return;
    }
    DOM.$compassBtn.click();
    this.actived = true;
    this.mode = "leftright";
    document.querySelector("#map").classList.add("d-none");
    document.querySelector("#mapRLT1").classList.remove("d-none");
    document.querySelector("#mapRLT2").classList.remove("d-none");
    // HACK: Nécessaire pour iOS qui ne met pas à jour la taille de l'écran au lancement...
    if (Capacitor.getPlatform() === "ios") {
      setTimeout(() => this.mapRLT1.resize(), 50);
      setTimeout(() => this.mapRLT2.resize(), 50);
    }
    document.getElementById(`mapRLT1-${Globals.comparedLayers[0]}`).click();
    document.getElementById(`mapRLT2-${Globals.comparedLayers[1]}`).click();

    this.mapRLT1.setCenter(this.map.getCenter());
    this.mapRLT2.setCenter(this.map.getCenter());
    this.mapRLT1.setZoom(this.map.getZoom());
    this.mapRLT2.setZoom(this.map.getZoom());
    this.#changeMode();

    DOM.$createRltlandmarkBtn.style.removeProperty("opacity");
    DOM.$createRltlandmarkBtn.style.removeProperty("color");
    clearTimeout(this.timeoutID1);
    clearTimeout(this.timeoutID2);
    clearTimeout(this.timeoutID3);
    this.timeoutID1 = setTimeout(() => {
      DOM.$createRltlandmarkBtn.style.backgroundColor = "#26A581DD";
      DOM.$createRltlandmarkBtn.style.width = "calc(63px + 14.446rem)";
      this.timeoutID2 = setTimeout(() => {
        DOM.$createRltlandmarkBtn.style.removeProperty("width");
        this.timeoutID3 = setTimeout(() => {
          DOM.$createRltlandmarkBtn.style.removeProperty("background-color");
        }, 450);
      }, 2000);
    }, 50);
  }

  /**
   * ferme la comparaison
   * @public
   */
  hide() {
    this.actived = false;

    Globals.menu.close("layerManager");
    document.querySelector("#sideBySideFadeSlider").classList.add("d-none");

    document.querySelector(".selectedLayer").style.pointerEvents = "";
    if (this.sideBySide) {
      this.sideBySide.remove();
    }
    if (this.clearSync !== null) {
      this.clearSync();
      this.clearSync == null;
    }
    this.map.setCenter(this.mapRLT1.getCenter());
    this.map.setZoom(this.mapRLT1.getZoom());
    document.querySelector("#map").classList.remove("d-none");
    document.querySelector("#mapRLT1").classList.add("d-none");
    document.querySelector("#mapRLT2").classList.add("d-none");
  }

  /**
   * toggle d'affichage de la comparaison de carte
   * @public
   */
  toggle() {
    if (this.actived) {
      this.hide();
    } else {
      this.show();
    }
  }
}

export default Compare;
