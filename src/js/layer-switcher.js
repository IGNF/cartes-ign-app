import Globals from './globals';

import ImageNotFound from '../html/img/image-not-found.png';

/**
 * Gestionnaire de couches
 * @todo ...
 */
class LayerSwitcher {

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
       *    thumbnail : "",
       *    opacity : 100,
       *    color : 1,
       *    visibility : 1,
       *    index : 0,
       *    position : 0
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
      container.className = "layer-switcher";

      if (!container) {
        console.warn();
        return;
      }
  
      // ajout du container
      this.target.appendChild(container);
    }
  
    /**
     * Ecouteurs
     */
    #addListeners(id, shadow) {
      // INFO
      // les ecouteurs disparaissent en supprimant le DOM
      var index = this.layers[id].index;
      // outils avancés
      shadow.getElementById(`visibility_ID_${index}`).addEventListener("click", (e) => {
        console.log(e);
      });
      shadow.getElementById(`remove_ID_${index}`).addEventListener("click", (e) => {
        console.log(e);
      });
      shadow.getElementById(`info_ID_${index}`).addEventListener("click", (e) => {
        console.log(e);
      });
      shadow.getElementById(`color_ID_${index}`).addEventListener("click", (e) => {
        console.log(e);
      });
      // opacité des couches
      shadow.getElementById(`opacity-value-range_ID_${index}`).addEventListener("change", (e) => {
        console.log(e);
      });
      shadow.getElementById(`opacity-value-range_ID_${index}`).addEventListener("input", (e) => {
        console.log(e);
      });
      // ouverture des options avancées
      shadow.getElementById(`show-advanced-tools_ID_${index}`).addEventListener("click", (e) => {
        console.log(e);
      });
      // drag'n drop des couches
      shadow.getElementById(`cross-picto_ID_${index}`).addEventListener("click", (e) => {
        console.log(e);
      });
    }

    #addLayerContainer(id) {
      var thumbnail = this.layers[id].thumbnail || ImageNotFound;
      var opacity = this.layers[id].opacity || 100;
      var color = this.layers[id].color || 1;
      var visibility = this.layers[id].visibility || 1;
      var title =  this.layers[id].title || id.split("$")[0];
      var index = this.layers[id].index;

      // Template d'une couche
      var tplContainer = `
      <div id="container_ID_${index}">
        <div id="cross-picto_ID_${index}"></div>
        <div id="basic-tools_ID_${index}">
          <div id="thumbnail_ID_${index}">
            <img class="tools-layer-thumbnail" src="${thumbnail}"/>
          </div>
          <div class="wrap-tools-layers">
            <span id="title_ID_${index}">${title}</span>
            <div id="opacity-range-div_ID_${index}" class="tools-layer-opacity">
              <!-- before:: & after:: 0% / 100% -->
              <input id="opacity-value-range_ID_${index}" type="range">
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
          <input type="checkbox" id="color_ID_${index}" checked=${color}/>
          <label id="color-picto_ID_${index}" for="color_ID_${index}" title="Couleur/NB" class="tools-layer-color"></label>
          <input type="checkbox" id="visibility_ID_${index}" checked=${visibility}/>
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

    #removeLayerContainer(id) {
      var index = this.layers[id].index;
      var container = document.getElementById("container_ID_" + index);
      container.remove();
    }

    /**
     * Ajout d'une couche dans le gestionnaire
     * @param {*} id 
     * @param {*} options 
     */
    addLayer(id, options) {
      this.index++;
      this.layers[id] = options || {};
      this.layers[id].index = this.index;
      this.#addLayerContainer(id);
    }

    /**
     * Supprime une couche du gestionnaire
     * @param {*} id 
     */
    removeLayer(id) {
      this.#removeLayerContainer(id);
      delete this.layers[id];
    }

}

export default LayerSwitcher;