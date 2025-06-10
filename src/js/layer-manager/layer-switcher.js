/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Globals from "../globals";
import LayersConfig from "./layer-config";
import LayersGroup from "./layer-group";
import LayersAdditional from "./layer-additional";
import ActionSheet from "../action-sheet";

import Sortable from "sortablejs";

import ImageNotFound from "../../html/img/image-not-found.png";
import DomUtils from "../utils/dom-utils";

import { Toast } from "@capacitor/toast";
import { Capacitor } from "@capacitor/core";

/**
 * Gestionnaire de couches
 * @fires addlayer
 * @fires removelayer
 * @fires movelayer
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
 *       	  → this.removeLayer → call removeContainer & removeGroup & map.removeLayer → fire event removeLayer
 *        	→ this.moveLayer → call moveContainer & moveGroup & map.moveLayer
 *        	→ this.layervisibility
 */
class LayerSwitcher extends EventTarget {

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

    // TODO
    // options d'ajout de couches
    // avec un test si la couche est déjà disponible sur la carte

    this.target = this.options.target || document.getElementById("layer-switcher");
    this.map = Globals.map;

    // id unique et incremental pour faire la liaison entre le DOM et this.layers
    this.index = -1;

    /**
       * Options des couches avec position
       * {
       *   id : {
       *    title : "",
       *    quickLookUrl : "",
       *    opacity : 100,
       *    gray : true,
       *    visibility : true,
       *    index : 0,
       *    position : 0,
       *    type: "vector",
       *    base: true, // base ou thematic
       *    style: "http://.../style.json" ou [],
       *    error : false
       *   }
       * }
       */
    this.layers = {};

    this.#render();

  }

  /**
     * Rendu
     */
  #render() {
    var container = document.createElement("div");
    container.id = "lst-layer-switcher";
    container.className = "lst-layer-switcher";

    if (!container) {
      console.warn();
      return;
    }

    // ajout du container
    this.target.appendChild(container);

    // dragn'drop !
    Sortable.create(container, {
      handle : ".handle-draggable-layer",
      draggable : ".draggable-layer",
      animation : 200,
      forceFallback : true,
      // Call event function on drag and drop
      onEnd : (evt) => {
        var index = evt.item.id.substring(evt.item.id.lastIndexOf("_") + 1);
        var id = this.#getId(parseInt(index, 10));
        this.#setPosition(id, evt.newDraggableIndex, evt.oldDraggableIndex);
      }
    });
  }

  /**
     * Obtenir le nom de la couche à partir de son numero d'indexe
     * @param {*} index
     * @returns
     */
  #getId(index) {
    var id = null;
    for (const key in this.layers) {
      if (Object.hasOwnProperty.call(this.layers, key)) {
        const i = this.layers[key].index;
        if (i === index) {
          id = key;
          break;
        }
      }
    }
    return id;
  }

  /**
     * Obtenir le numero d'indexe à partir du nom de la couche
     * @param {*} id
     * @returns
     */
  #getIndex(id) {
    return this.layers[id].index;
  }

  /**
     * Position de la couche dans le gestionnaire
     * @param {*} id
     * @param {*} newIndex
     * @param {*} oldIndex
     */
  #setPosition(id, newIndex, oldIndex) {
    // position :
    // * ordre natif à mapbox
    // > cad même position dans le fichier de style !
    // idx pos style
    //  0   0   0 la couche de fonds
    //  1   1   1 la couche intermediaire
    //  2   2   2 la couche la plus au dessus

    // Mais on prévoit un ordre inversé dans le gestionnaire !
    // idx pos style
    //  0   2   2 la couche la plus au dessus
    //  1   1   1 la couche intermediaire
    //  2   0   0 la couche de fonds

    // [
    //   id1 → pos3
    //   id2 → pos2 < newPosition : 2 --> id2 pos-- 1
    //   id3 → pos1 |  id3 pos-- 0
    //   id3 → pos1 |  id3 pos-- 0     oldPosition < newPosition
    //   id3 → pos1 |  id3 pos-- 0
    //   id4 → pos0 ^ oldPosition : 0 --> id4 newPosition 2
    // ]
    // [
    //   id1 → pos3
    //   id2 → pos2 ˇ oldPosition : 2 --> id2 newPosition 0
    //   id3 → pos1 |  id3 pos++ 2
    //   id3 → pos1 |  id3 pos++ 2     oldPosition > newPosition
    //   id3 → pos1 |  id3 pos++ 2
    //   id4 → pos0 < newPosition : 0 --> id4 pos++ 1
    // ]
    if (typeof oldIndex !== "undefined") {
      var maxPosition = Object.keys(this.layers).length - 1;
      var newPosition = maxPosition - newIndex;
      var oldPosition = maxPosition - oldIndex;
      var direction = 1; // sens de deplacement (vers le haut ou bas)
      this.layers[id].position = newPosition;
      for (const e in this.layers) {
        if (Object.hasOwnProperty.call(this.layers, e)) {
          const o = this.layers[e];
          if (oldPosition < newPosition) {
            direction = 1; // deplacement vers le haut
            if (o.position > oldPosition && o.position <= newPosition && e !== id) {
              o.position--; // on decremente de +1 la position des couches situées en dessous + celle que l'on replace
            }
          } else if (oldPosition > newPosition) {
            direction = 0; // deplacement vers le bas
            if (o.position < oldPosition && o.position >= newPosition && e !== id) {
              o.position++; // on incremente de +1 la position des couches situées au dessus + celle que l'on replace
            }
          }
        }
      }
      // INFO
      // les couches raster possedent un seul style,
      // on associe donc position dans le style et position dans le gestionnaire.
      // pour le vecteur tuilé, il faut determiner le nombre de styles pour chaque position.
      var beforeIdx = this.#getIndexLayer(newPosition + direction);
      var beforeId = this.map.getStyle().layers[beforeIdx].id;
      LayersGroup.moveGroup(id, beforeId);
      /**
         * Evenement "movelayer"
         * @event movelayer
         * @type {*}
         * @property {*} id -
         * @property {*} positions -
         */
      this.dispatchEvent(
        new CustomEvent("movelayer", {
          bubbles: true,
          detail: {
            id : id,
            entries : this.getLayersOrder(),
            positions : {
              new : newPosition,
              old : oldPosition,
              max : maxPosition
            }
          }
        })
      );
    }
  }

  /**
   *
   * @param {*} pos position du layer group (style maplibre) ou layer (raster)
   * @returns index réel du groupe ou du layer dans le style de la map
   */
  // INFO
  // les couches raster possedent un seul style,
  // on associe donc position dans le style et position dans le gestionnaire.
  // pour le vecteur tuilé, il faut determiner le nombre de styles pour chaque position.
  #getIndexLayer(pos) {
    var index = 0;
    if (pos === 0) {
      index = 0;
    } else {
      const entries = Object.entries(this.layers);
      for (let i = 0; i < pos; i++) {
        const id = entries.find((e) => { return e[1].position === i; })[0];
        index += LayersGroup.getGroupLayers(id).length;
      }
    }
    return index;
  }

  /**
   * Mise à jour des positions dans le gestionnaire et les styles
   * lors de l'ajout ou suppression d'une couche
   * @param {*} id
   */
  #updatePosition(id) {
    // 1. redefinition des positions dans le gestionnaire
    // - on transforme un obj -> array
    // - puis, on trie ce tableau : [0, 1, 4, 5, 7]
    // - et, on redefinie les positions avec une suite consecutive : [0, 1, 2, 3, 4]
    const entries = Object.entries(this.layers);
    entries.sort((a, b) => {
      return a[1].position - b[1].position;
    });
    for (let pos = 0; pos < entries.length; pos++) {
      const entrie = entries[pos];
      var opts = entrie[1];
      opts.position = pos;
      this.layers[entrie[0]] = opts;
    }
    // 2. redefinition des positions dans les styles
    // on redefinie la position des couches vecteurs tuilés dans les styles
    if (typeof id !== "undefined") {
      if (this.layers[id].type === "vector") {
        var pos = this.layers[id].position;
        var beforeId = 0;
        if (this.map.getStyle().layers.length) {
          beforeId = this.map.getStyle().layers[this.#getIndexLayer(pos)].id;
        }
        var max = (pos === Object.keys(this.layers).length - 1);
        if (!max) {
          // ne jamais déplacer le groupe avant le background tout blanc
          if (beforeId.split("$$$")[0] === "bckgrd") {
            return;
          }
          LayersGroup.moveGroup(id, beforeId);
        }
      }
    }
  }

  /**
   * Opacité de la couche
   * @param {*} id
   * @param {*} value
   */
  #setOpacity(id, value) {
    this.layers[id].opacity = value;
    let index;
    for(let i = 0; i < Globals.layersDisplayed.length; i++) {
      if (Globals.layersDisplayed[i].id === id) {
        index = i;
        break;
      }
    }
    if (Globals.layersDisplayed[index]) {
      Globals.layersDisplayed[index].opacity = value;
    }
    // mise à jour de la couche (style)
    var type = this.layers[id].type;
    if (type === "raster") {
      this.map.setPaintProperty(id, "raster-opacity", value / 100);
    } else if (type === "vector") {
      LayersGroup.addOpacity(id, value / 100);
    } else {
      throw new Error(`Type not yet implemented or unknow : ${type}`);
    }
  }

  /**
     * Visualisation de la couche
     * @param {*} id
     * @param {*} value
     */
  #setVisibility(id, value) {
    this.layers[id].visibility = value;
    let index;
    for(let i = 0; i < Globals.layersDisplayed.length; i++) {
      if (Globals.layersDisplayed[i].id === id) {
        index = i;
        break;
      }
    }
    if (Globals.layersDisplayed[index]) {
      Globals.layersDisplayed[index].visible = value;
    }
    // mise à jour de la couche (style)
    var type = this.layers[id].type;
    if (type === "raster") {
      this.map.setLayoutProperty(id, "visibility", (value) ? "visible" : "none");
    } else if (type === "vector") {
      LayersGroup.addVisibility(id, value);
    } else {
      throw new Error(`Type not yet implemented or unknow : ${type}`);
    }
    this.dispatchEvent(
      new CustomEvent("layervisibility", {
        bubbles: true,
        detail: {
          id: id,
          options: this.layers[id],
          entries: this.getLayersOrder()
        }
      })
    );
  }

  /**
   * Affichage du N&B
   * @param {*} id
   * @param {*} value
   */
  #setColor(id, value) {
    this.layers[id].gray = !value;
    let index;
    for(let i = 0; i < Globals.layersDisplayed.length; i++) {
      if (Globals.layersDisplayed[i].id === id) {
        index = i;
        break;
      }
    }
    if (Globals.layersDisplayed[index]) {
      Globals.layersDisplayed[index].gray = !value;
    }

    var type = this.layers[id].type;
    if (type === "raster") {
      // INFO
      // mise à jour de la couche via une property du style,
      (!value) ? this.map.setPaintProperty(id, "raster-saturation", -1) : this.map.setPaintProperty(id, "raster-saturation", 0);
    } else if (type === "vector") {
      // INFO
      // appliquer un filtre N&B sur les valeurs des couleurs
      (!value) ? LayersGroup.addGray(id) : LayersGroup.addColor(id);
    } else {
      throw new Error(`Type not yet implemented or unknow : ${type}`);
    }
  }

  /**
     * Ajout des ecouteurs pour une couche
     * @description les ecouteurs disparaissent en supprimant le DOM
     */
  #addListeners(id, shadow) {
    var index = this.#getIndex(id);

    // outils avancés
    shadow.getElementById(`show-advanced-tools_ID_${index}`).addEventListener("click", () => {
      const invisibleClass = this.layers[id].visibility ? "" : " invisible";
      ActionSheet.show({
        options: [
          {
            class: "tools-layer-color",
            text: !this.layers[id].gray ? "Afficher en noir et blanc" : "Afficher en couleur",
            value: "greyscale",
          },
          {
            class: `tools-layer-visibility${invisibleClass}`,
            text: this.layers[id].visibility ? "Masquer" : "Afficher",
            value: "visibility",
          },
          {
            class: "tools-layer-info",
            text: "Informations",
            value: "info",
          },
          {
            class: "tools-layer-remove",
            text: "Retirer de ma sélection",
            value: "remove",
          },
        ],
        timeToHide: 50,
      }).then( (value) => {
        if (value === "visibility") {
          if (this.layers[id].visibility) {
            document.getElementById(`container_ID_${index}`).classList.add("invisible");
          } else {
            document.getElementById(`container_ID_${index}`).classList.remove("invisible");
          }
          this.#setVisibility(id, !this.layers[id].visibility);
        }
        if (value === "remove") {
          this.removeLayer(id);
        }
        if (value === "info") {
          var text = document.getElementById("informationsText");
          var p = LayersConfig.getLayerProps(id);
          text.innerHTML = `
          <p>${p.desc}</p>
          <p><span class="layerInfoSource">Source :</span> ${p.source}</p>
          <p><span class="layerInfoMaj">Mise à jour :</span> ${p.maj}</p>
          `;
          var img = document.getElementById("informationsImg");
          img.src = LayersAdditional.getLegend(id.split("$")[0]);
          Globals.menu.open("informations");
        }
        if (value === "greyscale") {
          this.#setColor(id, this.layers[id].gray);
        }
      });
    });

    // opacité des couches
    shadow.getElementById(`opacity-value-range_ID_${index}`).addEventListener("change", (e) => {
      var id = this.#getId(index);
      this.#setOpacity(id, e.target.value);
    });
    shadow.getElementById(`opacity-value-range_ID_${index}`).addEventListener("input", (e) => {
      var id = this.#getId(index);
      this.#setOpacity(id, e.target.value);
    });

    // drag'n drop des couches
    shadow.getElementById(`cross-picto_ID_${index}`).addEventListener("click", () => {});
  }

  /**
     * Ajout d'une entrée pour une couche (DOM)
     * @param {*} id
     */
  #addLayerContainer(id) {
    var quickLookUrl = this.layers[id].quickLookUrl || ImageNotFound;
    var opacity = this.layers[id].opacity;
    var title =  this.layers[id].title || id.split("$")[0];

    var index = this.#getIndex(id);
    const invisibleClass = this.layers[id].visibility ? "" : " invisible";

    // Template d'une couche
    var tplContainer = `
      <div class="tools-layer-panel draggable-layer ${invisibleClass}" id="container_ID_${index}">
        <div class="handle-draggable-layer" id="cross-picto_ID_${index}"></div>
        <div id="basic-tools_ID_${index}">
          <div id="thumbnail_ID_${index}">
            <img class="tools-layer-quickLookUrl" src="${quickLookUrl}"/>
          </div>
          <div class="wrap-tools-layers">
            <span id="title_ID_${index}">${title}</span>
            <div id="opacity-range-div_ID_${index}" class="tools-layer-opacity">
              <!-- before:: & after:: 0% / 100% -->
              <input id="opacity-value-range_ID_${index}" type="range" value=${opacity}>
            </div>
          </div>
        </div>
        <label id="show-advanced-tools_ID_${index}" title="Plus d'outils" class="tools-layer-advanced" role="button" tabindex="0"></label>
      </div>
      `;

    // transformation du container : String -> DOM
    var container = DomUtils.stringToHTML(tplContainer.trim());

    if (!container) {
      console.warn();
      return;
    }

    // ajout du shadow DOM
    const shadow = container.attachShadow({ mode: "open" });
    shadow.innerHTML = tplContainer.trim();

    if (!shadow) {
      console.warn();
      return;
    }

    // ajout des écouteurs
    this.#addListeners(id, shadow);

    // pour l'affichage en couleur de la barre à gauche du selecteur
    var sliderProgress = shadow.getElementById(`opacity-value-range_ID_${index}`);
    sliderProgress.style.setProperty("--value", sliderProgress.value);
    sliderProgress.style.setProperty("--min", sliderProgress.min == "" ? "0" : sliderProgress.min);
    sliderProgress.style.setProperty("--max", sliderProgress.max == "" ? "100" : sliderProgress.max);
    sliderProgress.addEventListener("input", () => sliderProgress.style.setProperty("--value", sliderProgress.value));

    var target = document.getElementById("lst-layer-switcher");
    var theFirstChild = target.firstChild;
    target.insertBefore(shadow, theFirstChild);
  }

  /**
     * Suppression d'une entrée pour une couche (DOM)
     * @param {*} id
     */
  #removeLayerContainer(id) {
    var index = this.#getIndex(id);
    var container = document.getElementById("container_ID_" + index);
    container.remove();
  }

  /**
     * Ajout de la couche
     * @param {*} id
     * @returns
     */
  #addLayerMap(id) {
    var promise = null;

    var type = this.layers[id].type;
    var style = [];
    var fallback = [];
    if (type === "raster") {
      style.push({
        id : id,
        source : id,
        type : "raster"
      });
    } else if (type === "vector") {
      style = this.layers[id].style; // url !
      fallback = this.layers[id].fallbackStyle; // url !;
    } else {
      // ex. geojson
      this.layers[id].error = true;
      throw new Error(`Type not yet implemented or unknown : ${type}`);
    }
    // HACK
    // on positionne toujours le style avant ceux du calcul d'itineraires (directions)
    // afin que le calcul soit toujours la couche visible du dessus !
    var layerIndexBefore = this.map.getStyle().layers.findIndex((l) => l.source === "maplibre-gl-directions");
    var layerIdBefore = (layerIndexBefore !== -1) ? this.map.getStyle().layers[layerIndexBefore].id : null;

    if (Array.isArray(style)) {
      // Raster
      promise = new Promise((resolve) => {
        LayersGroup.addGroup(id, style, layerIdBefore);
        resolve();
      });
    } else {
      // Vecteur
      var fetchStyle = async (style, fallback) => {
        try {
          const response = await fetch(style);
          const data = await response.json();
          // INFO
          // on ajoute les sources !
          // les sources des couches tuiles vectorielles ne sont pas pré chargées
          // car on les connait que maintenant en lisant le fichier de style.
          // l'id des source est different du nom de la couche pour le vecteur !
          for (const key in data.sources) {
            if (Object.hasOwnProperty.call(data.sources, key)) {
              const source = data.sources[key];
              // on ne peut pas ajouter la même source !
              if (!this.map.getStyle().sources[key]) {
                this.map.addSource(key, source);
              }
            }
          }
          const data_1 = data;
          // les sprites et les glyphs sont uniques sinon exceptions !
          // mais, normalement, on ajoute que des couches IGN, on mutualise sur ces informations.
          // FIXME comment gerer les exceptions ?
          if (!data_1.sprite.startsWith("http")) {
            data_1.sprite = document.URL + data_1.sprite;
          }
          this.map.setSprite(data_1.sprite);
          this.map.setGlyphs(data_1.glyphs);
          // Fallback for offline glyphs
          if (!Globals.online && Capacitor.isNativePlatform()) {
            this.map.setGlyphs("data/fallback_glyphs/{fontstack}/{range}.pbf");
          }
          const data_2 = data_1;
          layerIndexBefore = this.map.getStyle().layers.findIndex((l) => l.source === "maplibre-gl-directions");
          layerIdBefore = (layerIndexBefore !== -1) ? this.map.getStyle().layers[layerIndexBefore].id : null;
          LayersGroup.addGroup(id, data_2.layers, layerIdBefore);
          this.layers[id].style = data_2.layers; // sauvegarde !
        } catch (e) {
          if (fallback) {
            return fetchStyle(fallback, null);
          } else {
            this.layers[id].error = true;
            throw new Error(e);
          }
        }
      };
      promise = fetchStyle(style, fallback);
    }

    return promise;
  }

  /**
     * Suppression de la couche
     * @param {*} id
     */
  #removeLayerMap(id) {
    LayersGroup.removeGroup(id);
  }

  /**
   * Ajout d'une couche dans le gestionnaire
   * @param {*} layerOptions
   * @fires addlayer
   * @public
   */
  async addLayer(layerOptions) {
    const id = layerOptions.id;
    var props = LayersConfig.getLayerProps(id);
    this.index++;
    this.layers[id] = {
      title: props.title,
      quickLookUrl: LayersAdditional.getQuickLookUrl(id.split("$")[0]),
      style: props.style,
      fallbackStyle: props.fallbackStyle,
      type: props.type,
      base: props.base,
      opacity: layerOptions.opacity,
      gray: layerOptions.gray,
      visibility: layerOptions.visible,
      index: this.index,
      position: this.index, // cf. #updatePosition()
      error: false,
      maxNativeZoom: props.maxNativeZoom,
      minNativeZoom: props.minNativeZoom,
      interactive: props.interactive,
      format: props.format
    };
    this.#addLayerContainer(id);
    try {
      await this.#addLayerMap(id);
      this.#updatePosition(id);
      this.#setOpacity(id, layerOptions.opacity);
      if (layerOptions.gray) {
        this.#setColor(id, !layerOptions.gray);
      }
      this.#setVisibility(id, layerOptions.visible);
      // Cas particulier : ajout de l'ombrage à plan IGN si la 3D est activée
      if (id === "PLAN.IGN.INTERACTIF$TMS" && Globals.threeD && Globals.threeD.terrainOn) {
        Globals.threeD.addHillShadeToPlanIgn();
      }
      /**
       * Evenement "addlayer"
       * @event addlayer
       * @type {*}
       * @property {*} id -
       * @property {*} options -
       */
      this.dispatchEvent(
        new CustomEvent("addlayer", {
          bubbles: true,
          detail: {
            id: id,
            options: this.layers[id],
            entries: this.getLayersOrder()
          }
        })
      );
    } catch (e) {
      this.layers[id].error = true;
      throw e;
    }
  }

  /**
     * Supprime une couche du gestionnaire
     * @param {*} id
     * @fires removelayer
     * @public
     */
  removeLayer(id) {
    // Comptage du nombre de fonds de plan affichés
    let nbBaseLayers = 0;
    // eslint-disable-next-line no-unused-vars
    for (const [_, layer] of Object.entries(this.layers)) {
      if (layer.base) {
        nbBaseLayers++;
      }
    }
    // Si le layer a enlever est le dernier fond de plan, on ne fait rien
    // On n'affiche le message que si c'est l'utilisateur qui a fait l'action
    // (si on est en mode "myaccount", c'est le téléchargeur de carte qui est à l'origine du clic)
    if (LayersConfig.getLayerProps(id).base && nbBaseLayers === 1 && Globals.backButtonState !== "myaccount") {
      Toast.show({
        text: "Impossible d'enlever le seul fond de carte",
        duration: "short",
        position: "bottom"
      });
      return;
    }
    var berror = this.layers[id].error;
    this.#removeLayerMap(id);
    this.#removeLayerContainer(id);
    delete this.layers[id];
    this.#updatePosition();

    /**
       * Evenement "removelayer"
       * @event removelayer
       * @type {*}
       * @property {*} id -
       * @property {*} error -
       */
    this.dispatchEvent(
      new CustomEvent("removelayer", {
        bubbles: true,
        detail: {
          id : id,
          error : berror,
          entries : this.getLayersOrder()
        }
      })
    );
  }

  /**
     *
     * @returns Liste des couches ordonnées
     */
  getLayersOrder() {
    const entries = Object.entries(this.layers);
    entries.sort((a, b) => {
      return a[1].position - b[1].position;
    });
    return entries;
  }

}

export default LayerSwitcher;
