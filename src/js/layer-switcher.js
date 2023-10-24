import Globals from './globals';
import LayersConfig from './layer-config';
import LayersAdditional from './layer-additional';

import ImageNotFound from '../html/img/image-not-found.png';

/**
 * Gestionnaire de couches
 * @fires addlayer
 * @fires removelayer
 * @todo fonctionnalités : N&B, Info et drag'n drop
 * @todo menu avancé en popup !?
 * @todo gerer les couches vecteurs !
 */
class LayerSwitcher {

  /**
   * constructeur
   * @param {*} options 
   * @param {*} options.target
   */
    constructor(options) {
      this.options = options || {
        target : null
      };
  
      // TODO
      // options d'ajout de couches 
      // avec un test si la couche est déjà disponible sur la carte

      this.target = this.options.target || document.getElementById("layer-switcher");
      this.map = Globals.map

      this.index = -1;

      /**
       * Options des couches avec position d'ordre
       * {
       *   id : {
       *    title : "",
       *    quickLookUrl : "",
       *    opacity : 100,
       *    color : 1,
       *    visibility : 1,
       *    index : 0,
       *    position : 0
       *   }
       * }
       */
      this.layers = {};
  
      /**
       * Interface pour les evenements
       * @example
       * event.dispatchEvent(new CustomEvent("myEvent", { detail : {} }));
       * event.addEventListener("myEvent", handler);
       */
      this.event = new EventTarget();

      this.#render();
    }
  
    /**
     * Rendu
     */
    #render() {
      var container = document.createElement("div");
      container.className = "layer-switcher";

      if (!container) {
        console.warn();
        return;
      }
  
      // ajout du container
      this.target.appendChild(container);
    }
  
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

    #getIndex(id) {
      return this.layers[id].index;
    }

    #setOpacity(id, value) {
      this.layers[id].opacity = value;
      // mise à jour de la couche (style)
      this.map.setPaintProperty(id, "raster-opacity", value / 100);
    }

    #setVisibility(id, value) {
      this.layers[id].visibility = value;
      // mise à jour de la couche (style)
      this.map.setLayoutProperty(id, "visibility", (value) ? "visible" : "none");
    }

    /**
     * N&B
     * @param {*} id 
     * @param {*} value
     * @fixme non fonctionnel ! 
     */
    #setColor(id, value) {
      this.layers[id].color = value;
      // mise à jour de la couche (style)
      this.map.setPaintProperty(id, "raster-contrast", (value) ? 1 : 0);
    }

    /**
     * Ajout des ecouteurs pour une couche
     * @description les ecouteurs disparaissent en supprimant le DOM
     */
    #addListeners(id, shadow) {
      var index = this.#getIndex(id);

      // outils avancés
      shadow.getElementById(`visibility_ID_${index}`).addEventListener("click", (e) => {
        var id = this.#getId(index);
        this.#setVisibility(id, e.target.checked);
      });
      shadow.getElementById(`remove_ID_${index}`).addEventListener("click", (e) => {
        var id = this.#getId(index);
        this.removeLayer(id);
        this.map.removeLayer(id);
      });
      shadow.getElementById(`info_ID_${index}`).addEventListener("click", (e) => {
        var id = this.#getId(index);
        var text = document.getElementById("informationsText");
        var p = LayersConfig.getLayerProps(id);
        text.innerHTML = p.desc;
        var img = document.getElementById("informationsImg");
        img.src = LayersAdditional.getLegend(id.split("$")[0]);
        Globals.menu.open("informations");
      });
      shadow.getElementById(`color_ID_${index}`).addEventListener("click", (e) => {
        var id = this.#getId(index);
        this.#setColor(id, e.target.checked);
      });

      // opacité des couches
      shadow.getElementById(`opacity-value-range_ID_${index}`).addEventListener("change", (e) => {
        var id = this.#getId(index);
        this.#setOpacity(id, e.target.value);
        // mise à jour du DOM
        var container = document.getElementById("opacity-value-middle_ID_" + index);
        container.innerHTML = e.target.value + "%";
      });
      shadow.getElementById(`opacity-value-range_ID_${index}`).addEventListener("input", (e) => {
        var id = this.#getId(index);
        this.#setOpacity(id, e.target.value);
        // mise à jour du DOM
        var container = document.getElementById("opacity-value-middle_ID_" + index);
        container.innerHTML = e.target.value + "%";
      });

      // ouverture des options avancées
      shadow.getElementById(`show-advanced-tools_ID_${index}`).addEventListener("click", (e) => {});

      // drag'n drop des couches
      shadow.getElementById(`cross-picto_ID_${index}`).addEventListener("click", (e) => {
        console.log("TODO", e);
      });
    }

    /**
     * Ajout d'une entrée pour une couche
     * @param {*} id 
     */
    #addLayerContainer(id) {
      var quickLookUrl = this.layers[id].quickLookUrl || ImageNotFound;
      var opacity = this.layers[id].opacity;
      var color = this.layers[id].color;
      var visibility = this.layers[id].visibility;
      var title =  this.layers[id].title || id.split("$")[0];
      
      var index = this.#getIndex(id);

      // Template d'une couche
      var tplContainer = `
      <div class="tools-layer-panel" id="container_ID_${index}">
        <div id="cross-picto_ID_${index}"></div>
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
            <div id="opacity-middle-div_ID_${index}" class="tools-layer-opacity">
              <span id="opacity-value-middle_ID_${index}">${opacity}%</span>
            </div>
          </div>
        </div>
        <input type="checkbox" id="show-advanced-tools_ID_${index}" />
        <label id="show-advanced-tools-picto_ID_${index}" for="show-advanced-tools_ID_${index}" title="Plus d'outils" class="tools-layer-advanced"></label>
        <div id="advanced-tools_ID_${index}">
          <!-- N&B, visibility, info, remove -->
          <input type="checkbox" id="color_ID_${index}" checked="${color}" />
          <label id="color-picto_ID_${index}" for="color_ID_${index}" title="Couleur/NB" class="tools-layer-color"></label>
          <input type="checkbox" id="visibility_ID_${index}" checked="${visibility}" />
          <label id="visibility-picto_ID_${index}" for="visibility_ID_${index}" title="Afficher/masquer la couche" class="tools-layer-visibility"></label>
          <div id="info_ID_${index}" class="tools-layer-info" title="Informations de la couche"></div>
          <div id="remove_ID_${index}" class="tools-layer-remove" title="Supprimer la couche"></div>
        </div>
      </div>
      `;

      const stringToHTML = (str) => {

        var support = function () {
          if (!window.DOMParser) return false;
          var parser = new DOMParser();
          try {
            parser.parseFromString('x', 'text/html');
          } catch (err) {
            return false;
          }
          return true;
        };
  
        // If DOMParser is supported, use it
        if (support()) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(str, 'text/html');
          return doc.body.firstChild;
        }
  
        // Otherwise, fallback to old-school method
        var dom = document.createElement('div');
        dom.innerHTML = str;
        return dom;
  
      };
  
      // transformation du container : String -> DOM
      var container = stringToHTML(tplContainer.trim());
  
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

      var target = document.querySelector(".layer-switcher");
      target.appendChild(shadow);
    }

    /**
     * Suppression d'une entrée pour une couche
     * @param {*} id 
     */
    #removeLayerContainer(id) {
      var index = this.#getIndex(id);
      var container = document.getElementById("container_ID_" + index);
      container.remove();
    }

    /**
     * Ajout d'une couche dans le gestionnaire
     * @param {*} id 
     * @fires addlayer
     * @public
     * @todo determiner la position dans la liste des styles
     */
    addLayer(id) {
      var props = LayersConfig.getLayerProps(id);
      var options = {
          title : props.title,
          quickLookUrl : LayersAdditional.getQuickLookUrl(id.split("$")[0]),
          opacity : 100,
          color : true,
          visibility : true,
          position : 0 // TODO determiner la position dans la liste des styles
      };
      this.index++;
      this.layers[id] = options;
      this.layers[id].index = this.index;
      this.#addLayerContainer(id);

      /**
       * Evenement "addlayer"
       * @event addlayer
       * @type {*}
       * @property {*} id -
       * @property {*} options -
       */
      this.event.dispatchEvent(
        new CustomEvent("addlayer", {
          bubbles: true,
          detail: {
            id : id,
            options : this.layers[id]
          }
        })
      );
    }

    /**
     * Supprime une couche du gestionnaire
     * @param {*} id 
     * @fires removelayer
     * @public
     */
    removeLayer(id) {
      this.#removeLayerContainer(id);
      delete this.layers[id];

      /**
       * Evenement "removelayer"
       * @event removelayer
       * @type {*}
       * @property {*} id -
       */
      this.event.dispatchEvent(
        new CustomEvent("removelayer", {
          bubbles: true,
          detail: {
            id : id
          }
        })
      );
    }

}

export default LayerSwitcher;