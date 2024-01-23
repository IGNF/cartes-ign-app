import MapLibreGlCompare from "@maplibre/maplibre-gl-compare";
import syncMaps from "@mapbox/mapbox-gl-sync-move";

import Globals from './globals';
import DOM from './dom';
import LayersConfig from './layer-manager/layer-config';
import LayersAdditional from './layer-manager/layer-additional';

import ImageNotFound from '../html/img/image-not-found.png';
import DomUtils from "./dom-utils"

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
    this.prevDataLayerDisplayed = '';
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
      }

      var strRLTLayersPhotos = "";
      var strRLTLayersMaps = "";
      var rltLayers = LayersConfig.getRLTLayers();
      for (let j = 0; j < rltLayers.length; j++) {
        var props = LayersConfig.getLayerProps(rltLayers[j]);
        if (rltLayers[j].split(".")[0] == "ORTHOIMAGERY") {
          if (rltLayers[j] == "ORTHOIMAGERY.ORTHOPHOTOS$GEOPORTAIL:OGC:WMTS") {
            props.title = "Aujourd'hui"
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
            <span>Photos</span>
            <label class="toggleSwitch">
                <input id="rltMapToggle${i + 1}" class="toggleInput" type="checkbox">
                <span class="toggleSlider"></span>
            </label>
            <span>Cartes</span>
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
    });;
    document.querySelector("#compareUpDown").addEventListener("click", () => {
      this.mode = "upDown";
      this.#changeMode();
    });
    document.querySelector("#compareFade").addEventListener("click", () => {
      this.mode = "fade";
      this.#changeMode();
    });

    this.fadeSliderInput.addEventListener('input', () => this.fadeSliderInput.style.setProperty('--value', this.fadeSliderInput.value));
    this.fadeSliderInput.addEventListener('input', () => {
      document.getElementById("mapRLT1").style.opacity = 1 - (this.fadeSliderInput.value / 100);
    });

    document.getElementById("rltMapToggle1").addEventListener("change", (e) => {
      if (e.target.checked) {
        document.getElementById("RLTphotoLayers1").classList.add("d-none");
        document.getElementById("RLTmapLayers1").classList.remove("d-none");
      } else {
        document.getElementById("RLTphotoLayers1").classList.remove("d-none");
        document.getElementById("RLTmapLayers1").classList.add("d-none");
      }
    });
    document.getElementById("rltMapToggle2").addEventListener("change", (e) => {
      if (e.target.checked) {
        document.getElementById("RLTphotoLayers2").classList.add("d-none");
        document.getElementById("RLTmapLayers2").classList.remove("d-none");
      } else {
        document.getElementById("RLTphotoLayers2").classList.remove("d-none");
        document.getElementById("RLTmapLayers2").classList.add("d-none");
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
      el.addEventListener('click', (e) => {
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
      this.fadeSliderInput.style.setProperty('--value', 0)
      document.getElementById("mapRLT1").style.removeProperty("opacity");
      if (this.sideBySide) {
        this.sideBySide.remove();
      }
      this.sideBySide = new MapLibreGlCompare(this.mapRLT1, this.mapRLT2, this.container, { orientation: "vertical" });
    } else if (this.mode == "upDown") {
      document.querySelector("#compareUpDown").classList.add("selected");
      document.querySelector("#sideBySideFadeSlider").classList.add("d-none");
      this.fadeSliderInput.value = 0;
      this.fadeSliderInput.style.setProperty('--value', 0)
      document.getElementById("mapRLT1").style.removeProperty("opacity");
      if (this.sideBySide) {
        this.sideBySide.remove();
      }
      this.sideBySide = new MapLibreGlCompare(this.mapRLT1, this.mapRLT2, this.container, { orientation: "horizontal" });
    } else if (this.mode == "fade") {
      document.querySelector("#compareFade").classList.add("selected");
      if (this.sideBySide) {
        this.sideBySide.remove();
      }
      this.clearSync = syncMaps(this.mapRLT1, this.mapRLT2);
      this.fadeSliderInput.value = 50;
      this.fadeSliderInput.style.setProperty('--value', 50)
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
    Globals.mapState = "compare";
    if (this.actived) {
      return;
    }
    this.actived = true;
    this.mode = "leftright";
    document.querySelector("#map").classList.add("d-none");
    document.querySelector("#mapRLT1").classList.remove("d-none");
    document.querySelector("#mapRLT2").classList.remove("d-none");
    document.getElementById(`mapRLT1-${Globals.comparedLayers[0]}`).click();
    document.getElementById(`mapRLT2-${Globals.comparedLayers[1]}`).click();

    this.mapRLT1.setCenter(this.map.getCenter());
    this.mapRLT2.setCenter(this.map.getCenter());
    this.mapRLT1.setZoom(this.map.getZoom());
    this.mapRLT2.setZoom(this.map.getZoom());
    this.#changeMode();
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
    Globals.mapState = "default";
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
