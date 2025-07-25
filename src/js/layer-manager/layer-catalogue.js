/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Globals from "../globals";
import LayersConfig from "./layer-config";
import LayersAdditional from "./layer-additional";

import ImageNotFound from "../../html/img/image-not-found.png";
import ReliefBuildingsImage from "../../html/img/layers/3D.BUILDINGS.jpg";
import ReliefTerrainImage from "../../html/img/layers/3D.TERRAIN.jpg";
import DomUtils from "../utils/dom-utils";

import { Toast } from "@capacitor/toast";

/**
 * Gestion des couches thématiques et fonds de carte
 * @fires addlayer
 * @fires addlayeroptions
 * @fires removelayer
 * @description
 *      → manager
 *      	→ instancie this.catalogue & this.switcher
 *     	→ ecouteurs sur les events
 *	      	* addLayer
 *	      	   → this.catalogue → call this.switcher.addLayer
 *	      	   → this.switcher → call this.updateCounter
 *	      	* removeLayer
 *	      	   → this.catalogue → call this.switcher.removeLayer
 *	      	   → this.switcher → call this.updateCounter
 *      	→ loader de couches par defaut
 *         		→ call this.catalogue.addLayer
 *
 *      → catalogue
 *        	→ this.addLayer → call add interface → fire event addLayer
 *        	→ this.removeLayer → call remove interface → fire event removeLayer
 *      → switcher
 *        	→ this.addLayer → call addContainer & addGroup & map.addLayer → fire event addLayer
 *       	→ this.removeLayer → call removeContainer & removeGroup & map.removeLayer → fire event removeLayer
 *        	→ this.moveLayer → call moveContainer & moveGroup & map.moveLayer
 */
class LayerCatalogue extends EventTarget {

  /**
   * constructeur
   * @param {*} options
   * @param {*} options.target
   */
  constructor(options) {
    super();
    this.options = options || {
      target : null
    };

    // options ?
    this.map = Globals.map;

    this.#render();
    this.#listeners();
  }

  /**
   * Rendu
   */
  #render() {
    var target = this.options.target || document.getElementById("layer-thematics");
    if (!target) {
      console.warn();
      return;
    }

    const tplLayer = (opts) => {
      return `
      <div class="layer ${opts.type}" id="${opts.layerID}">
        <div class="layerImg">
          <img src="${opts.layerQuickLook}" alt="${opts.layerTitle}" onerror="this.onerror=null;this.src='${ImageNotFound}'" />
          <div class="layer-badge"></div>
          <div class="layer-interactive-badge-${opts.interactive}" ></div>
        </div>
        <div class="layer-title-thematic">${opts.layerThematic}</div>
        <div id="${opts.layerName}" class="layer-title">${opts.layerTitle}</div>
      </div>
      `;
    };

    var strBaseLayers = "";
    var baseLayers = LayersConfig.getBaseLayers();
    var props;
    for(let i = 0; i < baseLayers.length; i++) {
      props = LayersConfig.getLayerProps(baseLayers[i]);
      strBaseLayers += tplLayer({
        type : "baseLayer",
        layerID : baseLayers[i],
        layerName : props.layer,
        layerQuickLook : LayersAdditional.getQuickLookUrl(props.layer),
        layerTitle : props.title,
        layerThematic : "",
        interactive: props.interactive,
      });
    }

    var strThematicButtons = "";
    var strThematicLayers = "";
    var thematicButtons = LayersConfig.getThematics();
    var tempLayers = LayersConfig.getTempLayers();
    if (tempLayers.length > 0) {
      for(let k = 0; k < tempLayers.length; k++) {
        var tempLayer = tempLayers[k];
        strThematicLayers += tplLayer({
          type : "thematicLayer tempLayer layer-hidden", // liste cachée par defaut !
          layerID : tempLayer.id,
          layerName : tempLayer.name,
          layerQuickLook : tempLayer.quickLookUrl,
          layerTitle : tempLayer.name,
          layerThematic : "Évènements",
          interactive: true,
        });
      }
    }

    for (let l = 0; l < thematicButtons.length; l++) {
      const name = thematicButtons[l];
      strThematicButtons += `
      <button class="thematicButton" data-name="${name}">
        ${name}
      </button>
      `;
      if (tempLayers.length > 0 && l == 0) {
        strThematicButtons += `
        <button class="thematicButton" data-name="Évènements">
          Événements
        </button>
        `;
      }
    }

    var thematicLayers = LayersConfig.getThematicLayers();
    for(let k = 0; k < thematicLayers.length; k++) {
      props = LayersConfig.getLayerProps(thematicLayers[k]);
      var thematic = LayersConfig.getThematicByLayerID(thematicLayers[k]);
      strThematicLayers += tplLayer({
        type : "thematicLayer layer-hidden", // liste cachée par defaut !
        layerID : thematicLayers[k],
        layerName : props.layer,
        layerQuickLook : LayersAdditional.getQuickLookUrl(props.layer),
        layerTitle : props.title,
        layerThematic : thematic,
        interactive: props.interactive,
      });
    }

    var template = `
    <div class="layer-thematics">
      <h4 id="baseLayersLabel">Fonds de carte</h4>
      <div class="subCatMenu" id="baseLayers">
        ${strBaseLayers}
        <div id="baseLayersAfter" tabindex="0" title="Faire défiler le menu"><div></div></div>
      </div>
      <hr />
      <h4 id="thematicLayersLabel">Données thématiques</h4>
      <div class="subCatButton" id="thematicButtons">
        ${strThematicButtons}
        <div id="subCatButtonAfter" tabindex="0" title="Faire défiler le menu"><div></div></div>
      </div>
      <div class="subCatMenu" id="thematicLayers">
        ${strThematicLayers}
      </div>
    </div>`;

    // transformation du container : String -> DOM
    var container = DomUtils.stringToHTML(template.trim());

    if (!container) {
      console.warn();
      return;
    }

    target.appendChild(container);
  }

  /**
   * Ajout de 2 faux "Layers" 3D qui n'apparaissent pas dans le Layer Switcher et du bouton 3D pour les filtrer
   * - Bâtiments 3D
   * - Relief
   */
  add3DThematicLayers() {
    var target = this.options.target || document.getElementById("layer-thematics");
    if (!target) {
      console.warn();
      return;
    }
    var container = document.createElement("div");
    container.classList.add("small-layers");

    var buildings3DLayerHtml = `
      <div class="layer smallLayer" id="3D.BUILDINGS">
        <div class="layerImg">
          <img src="${ReliefBuildingsImage}" alt="Bâtiments 3D" onerror="this.onerror=null;this.src='${ImageNotFound}'" />
        </div>
        <div id="3d-buildings" class="layer-title"><span>Bâtiments 3D</span><span class="beta">BÊTA</span></div>
      </div>
      `;
    var buildings3DLayerElement = DomUtils.stringToHTML(buildings3DLayerHtml.trim());
    buildings3DLayerElement.addEventListener("click", () => {
      if (buildings3DLayerElement.classList.contains("selectedLayer")) {
        Globals.threeD.remove3dBuildings();
        buildings3DLayerElement.classList.remove("selectedLayer");
      } else {
        Globals.threeD.add3dBuildings();
        buildings3DLayerElement.classList.add("selectedLayer");
      }
    });
    container.appendChild(buildings3DLayerElement);

    var terrainLayerHtml = `
      <div class="layer smallLayer" id="3D.TERRAIN">
        <div class="layerImg">
          <img src="${ReliefTerrainImage}" alt="Relief 3D" onerror="this.onerror=null;this.src='${ImageNotFound}'" />
        </div>
        <div id="3d-terrain" class="layer-title"><span>Relief 3D</span><span class="beta">BÊTA</span></div>
      </div>
      `;
    var terrainLayerElement = DomUtils.stringToHTML(terrainLayerHtml.trim());
    terrainLayerElement.addEventListener("click", () => {
      if (terrainLayerElement.classList.contains("selectedLayer")) {
        Globals.threeD.remove3dTerrain();
        terrainLayerElement.classList.remove("selectedLayer");
      } else {
        Globals.threeD.add3dTerrain();
        terrainLayerElement.classList.add("selectedLayer");
      }
    });
    container.appendChild(terrainLayerElement);
    target.querySelector(".layer-thematics").insertBefore(container, target.querySelector("#baseLayers").nextSibling);
  }

  /**
   * Ecouteurs
   */
  #listeners() {
    // clic sur une couche de fonds
    document.querySelectorAll(".baseLayer").forEach((el) => {
      el.addEventListener("click", () => {
        if (el.classList.contains("selectedLayer")) {
          this.removeLayer(el.id);
        } else {
          this.addLayer(el.id);
        }
      });
    });
    // clic sur une couche thematique
    document.querySelectorAll(".thematicLayer").forEach((el) => {
      el.addEventListener("click", () => {
        let isTempLayer = false;
        if (el.classList.contains("tempLayer")) {
          isTempLayer = true;
        }
        if (el.classList.contains("selectedLayer")) {
          this.removeLayer(el.id, isTempLayer);
        } else {
          this.addLayer(el.id, isTempLayer);
        }
      });
    });
    // clic sur un bouton thematique
    document.querySelectorAll(".thematicButton").forEach((el) => {
      // INFO
      // Execution de l'ecouteur sur un clic bouton thématique :
      // - modifie le style des boutons
      // - recherche toutes les couches afin de les rendre 'hidden'
      // - recherche des couches du theme demandé
      // - supprime la classe 'hidden' des ID des couches demandées
      el.addEventListener("click", (e) => {
        var buttons = document.querySelectorAll(".thematicButton");
        for (let h = 0; h < buttons.length; h++) {
          const element = buttons[h];
          element.classList.remove("thematic-button-active");
        }
        var layers = document.querySelectorAll(".thematicLayer");
        for (let i = 0; i < layers.length; i++) {
          const element = layers[i];
          element.classList.add("layer-hidden");
        }
        var layersId = LayersConfig.getLayersByThematic(e.target.dataset.name);
        for (let j = 0; j < layersId.length; j++) {
          const id = layersId[j];
          var element = document.getElementById(id);
          element.classList.remove("layer-hidden");
        }
        e.target.classList.add("thematic-button-active");
      });
      if (el.getAttribute("data-name") == "Tous") {
        el.click();
      }
    });

    document.getElementById("baseLayersAfter").addEventListener("click", DomUtils.horizontalParentScroll);
    document.getElementById("baseLayersAfter").parentElement.addEventListener("scroll", DomUtils.horizontalParentScrollend);
    document.getElementById("subCatButtonAfter").addEventListener("click", DomUtils.horizontalParentScroll);
    document.getElementById("subCatButtonAfter").parentElement.addEventListener("scroll", DomUtils.horizontalParentScrollend);

  }

  /**
   * Ajout de la couche de fonds ou de données sur la carte
   * @param {*} layerName
   * @param {boolean} isTempLayer - true si la couche est temporaire
   * @fires addlayer
   * @public
   */
  addLayer(layerName, isTempLayer = false) {
    if (!layerName) {
      return;
    }

    var element = document.getElementById(layerName);
    element.classList.add("selectedLayer");

    /**
     * Evenement "addlayer"
     * @event addlayer
     * @type {*}
     * @property {*} id -
     */
    this.dispatchEvent(
      new CustomEvent("addlayer", {
        bubbles: true,
        detail: {
          id : layerName,
          isTempLayer : isTempLayer,
        }
      })
    );
  }

  /**
   * Ajout de la couche de fonds ou de données sur la carte avec paramètres d'opacité, visibilité et n&b
   * @param {*} layerOptions
   * @fires addlayeroptions
   * @public
   */
  addLayerOptions(layerOptions) {
    if (!layerOptions.id) {
      return;
    }
    var element = document.getElementById(layerOptions.id);
    element.classList.add("selectedLayer");

    layerOptions.isLayerOptions = true; // pour différencier de l'event addLayer
    /**
     * Evenement "addlayer"
     * @event addlayeroptions
     * @type {*}
     * @property {*} id -
     */
    this.dispatchEvent(
      new CustomEvent("addlayeroptions", {
        bubbles: true,
        detail: layerOptions,
      })
    );
  }

  /**
   * Suppression d'une couche
   * @param {*} layerName
   * @fires removelayer
   * @public
   */
  removeLayer(layerName, isTempLayer = false) {
    if (!layerName) {
      return;
    }
    // Comptage du nombre de fonds de plan affichés
    let nbBaseLayers = 0;
    document.querySelectorAll(".baseLayer").forEach((el) => {
      if (el.classList.contains("selectedLayer")) {
        nbBaseLayers++;
      }
    });
    // Si le layer a enlever est le dernier fond de plan, on ne fait rien
    // On n'affiche le message que si c'est l'utilisateur qui a fait l'action
    // (si on est en mode "myaccount", c'est le téléchargeur de carte qui est à l'origine du clic)
    if (!isTempLayer && LayersConfig.getLayerProps(layerName).base && nbBaseLayers === 1 && Globals.backButtonState !== "myaccount") {
      Toast.show({
        text: "Impossible d'enlever le seul fond de carte",
        duration: "short",
        position: "bottom"
      });
      return;
    }
    // Si on est hors ligne : impossible d'enlever Plan IGN
    // (si on est en mode "myaccount", c'est le téléchargeur de carte qui est à l'origine du clic)
    if (!Globals.online && layerName === "PLAN.IGN.INTERACTIF$TMS" && Globals.backButtonState !== "myaccount") {
      Toast.show({
        text: "Impossible d'enlever le Plan IGN en mode hors-ligne",
        duration: "short",
        position: "bottom"
      });
      return;
    }
    var element = document.getElementById(layerName);
    element.classList.remove("selectedLayer");

    /**
     * Evenement "removelayer"
     * @event removelayer
     * @type {*}
     * @property {*} id -
     */
    this.dispatchEvent(
      new CustomEvent("removelayer", {
        bubbles: true,
        detail: {
          id : layerName,
          isTempLayer : isTempLayer,
        }
      })
    );
  }

}

export default LayerCatalogue;
